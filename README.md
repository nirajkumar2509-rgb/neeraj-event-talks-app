# BigQuery Release Hub 🚀

A modern, responsive Flask web application that fetches, parses, and displays Google Cloud BigQuery release notes in a clean, interactive timeline. 

## Features

- **Live Release Feed**: Fetches the official Google Cloud BigQuery release notes Atom feed in real-time.
- **Smart Parsing**: Automatically breaks down large GCP updates into individual sub-updates by category (Features, Changes, Deprecations, Preview/Beta) for better readability.
- **Filtering & Search**: Filter updates by their type (Feature, Change, Deprecation, Preview) or search through content instantly.
- **In-Memory Caching**: Caches parsed feed data for 10 minutes to minimize network requests and optimize load speeds.
- **Twitter/X Integration**: Share release updates directly to Twitter with a custom-built composer that respects character limits and formats the link and hashtags automatically.
- **Premium Aesthetics**: Features a modern dark theme with smooth gradients, micro-animations, loading shimmers, and responsive layouts.

## Tech Stack

- **Backend**: Python, Flask
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6)
- **Icons & Fonts**: Google Fonts (Inter, Outfit), FontAwesome (Premium Icons)

## Getting Started

### Prerequisites

- Python 3.8+
- `pip` (Python package manager)

### Installation

1. Navigate to the project directory:
   ```bash
   cd agy-cli-projects/bigquery-release-notes-app
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install flask
   ```

### Running the Application

Start the Flask development server:
```bash
python app.py
```

By default, the server runs on **port 5001** to avoid conflicts with AirPlay Receiver on macOS. Access the application in your browser at:
`http://localhost:5001`

## API Endpoints

### `GET /api/release-notes`

Fetches and returns the parsed release notes in JSON format.

**Query Parameters:**
- `refresh` (optional): Set to `true` to bypass cache and force-fetch the latest updates from the live Google Cloud RSS feed.

**Example Response:**
```json
{
  "success": true,
  "fetched_live": true,
  "last_updated": "2026-06-26 23:00:00",
  "data": [
    {
      "date": "June 25, 2026",
      "updated": "2026-06-25T00:00:00Z",
      "id": "tag:google.com,2026:bigquery-release-notes/123",
      "link": "https://cloud.google.com/bigquery/docs/release-notes",
      "updates": [
        {
          "type": "Feature",
          "content_html": "<p>BigQuery support for XYZ is now generally available...</p>",
          "content_text": "BigQuery support for XYZ is now generally available..."
        }
      ]
    }
  ]
}
```

## Project Structure

- [app.py](file:///Users/nee13971/agy-cli-projects/bigquery-release-notes-app/app.py): Core Flask server, caching, and Atom XML feed parser.
- [templates/index.html](file:///Users/nee13971/agy-cli-projects/bigquery-release-notes-app/templates/index.html): Premium dashboard UI layout and Twitter modal.
- [static/css/style.css](file:///Users/nee13971/agy-cli-projects/bigquery-release-notes-app/static/css/style.css): Main design system, dark mode styling, and animations.
- [static/js/app.js](file:///Users/nee13971/agy-cli-projects/bigquery-release-notes-app/static/js/app.js): Timeline rendering, filtering, search logic, and Twitter integration.
- [.gitignore](file:///Users/nee13971/agy-cli-projects/bigquery-release-notes-app/.gitignore): Git ignore rules for virtual environments, caches, and system files.
