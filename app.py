import xml.etree.ElementTree as ET
import urllib.request
import re
import time
import os
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

# In-memory cache for feed data
feed_cache = {
    "data": None,
    "last_fetched": 0
}
CACHE_DURATION = 600  # Cache for 10 minutes (in seconds)

def clean_html_to_text(html_str):
    if not html_str:
        return ""
    # Replace common HTML entities
    text = html_str
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = text.replace('&quot;', '"')
    text = text.replace('&#39;', "'")
    
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', '', text)
    
    # Normalize whitespaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def parse_xml_feed(xml_data):
    root = ET.fromstring(xml_data)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    entries = []
    for entry in root.findall('atom:entry', ns):
        title_elem = entry.find('atom:title', ns)
        date_str = title_elem.text.strip() if title_elem is not None else "Unknown Date"
        
        updated_elem = entry.find('atom:updated', ns)
        updated_str = updated_elem.text.strip() if updated_elem is not None else ""
        
        id_elem = entry.find('atom:id', ns)
        entry_id = id_elem.text.strip() if id_elem is not None else ""
        
        link_elem = entry.find('atom:link', ns)
        link = link_elem.attrib.get('href', '').strip() if link_elem is not None else ''
        
        content_elem = entry.find('atom:content', ns)
        content_html = content_elem.text if content_elem is not None else ''
        
        # Split GCP release notes by <h3> headings
        parts = re.split(r'<h3>(.*?)</h3>', content_html)
        sub_updates = []
        
        if len(parts) > 1:
            # The split returns: [text_before_h3, h3_1, text_after_h3_1, h3_2, text_after_h3_2, ...]
            # We loop over headers (index 1, 3, 5...)
            for i in range(1, len(parts), 2):
                update_type = parts[i].strip()
                update_content = parts[i+1].strip() if i+1 < len(parts) else ''
                
                # Check if this sub-update has content
                if update_content:
                    sub_updates.append({
                        "type": update_type,
                        "content_html": update_content,
                        "content_text": clean_html_to_text(update_content)
                    })
        else:
            # Fallback if there are no <h3> headings
            sub_updates.append({
                "type": "Update",
                "content_html": content_html,
                "content_text": clean_html_to_text(content_html)
            })
            
        entries.append({
            "date": date_str,
            "updated": updated_str,
            "id": entry_id,
            "link": link,
            "updates": sub_updates
        })
        
    return entries

def fetch_release_notes(force_refresh=False):
    now = time.time()
    # Check if cache is still valid
    if not force_refresh and feed_cache["data"] is not None and (now - feed_cache["last_fetched"]) < CACHE_DURATION:
        return feed_cache["data"], False
    
    # Otherwise, fetch new data
    try:
        req = urllib.request.Request(
            FEED_URL,
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        )
        with urllib.request.urlopen(req, timeout=15) as response:
            xml_data = response.read()
            
        entries = parse_xml_feed(xml_data)
        
        # Update cache
        feed_cache["data"] = entries
        feed_cache["last_fetched"] = now
        return entries, True
    except Exception as e:
        print(f"Error fetching BigQuery release notes: {e}")
        # Return cache as fallback if it exists
        if feed_cache["data"] is not None:
            return feed_cache["data"], False
        raise e

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    force = request.args.get('refresh', 'false').lower() == 'true'
    try:
        entries, fetched_live = fetch_release_notes(force_refresh=force)
        return jsonify({
            "success": True,
            "fetched_live": fetched_live,
            "last_updated": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(feed_cache["last_fetched"])),
            "data": entries
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

if __name__ == '__main__':
    # Default port is 5001 to avoid AirPlay conflict on macOS
    app.run(host='0.0.0.0', port=5001, debug=True)
