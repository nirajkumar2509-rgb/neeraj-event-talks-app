// State Management
let allEntries = [];
let filteredEntries = [];
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const updatesList = document.getElementById('updates-list');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const totalCountEl = document.getElementById('total-count');
const lastUpdatedTimeEl = document.getElementById('last-updated-time');

// Action Buttons & Inputs
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = refreshBtn.querySelector('.refresh-spinner');
const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search');
const filterBtns = document.querySelectorAll('.filter-btn');
const retryBtn = document.getElementById('retry-btn');

// Tweet Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const progressRingCircle = document.getElementById('progress-ring-circle');
const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
const postTweetBtn = document.getElementById('post-tweet-btn');
const closeModalBtn = document.getElementById('close-modal');

// Toast Notification
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Modal Progress Ring Settings
const circleRadius = 9;
const circumference = 2 * Math.PI * circleRadius;

// Initialize Progress Ring
if (progressRingCircle) {
    progressRingCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressRingCircle.style.strokeDashoffset = circumference;
}

// Map update types to styling and icons
function getUpdateTypeMeta(type) {
    const t = type.toLowerCase();
    if (t.includes('feature') || t.includes('new')) {
        return {
            className: 'badge-feature',
            icon: 'fa-solid fa-star',
            displayName: 'Feature'
        };
    } else if (t.includes('change') || t.includes('update')) {
        return {
            className: 'badge-change',
            icon: 'fa-solid fa-arrows-rotate',
            displayName: 'Change'
        };
    } else if (t.includes('deprecated') || t.includes('deprecation') || t.includes('remove')) {
        return {
            className: 'badge-deprecated',
            icon: 'fa-solid fa-triangle-exclamation',
            displayName: 'Deprecation'
        };
    } else if (t.includes('beta') || t.includes('preview')) {
        return {
            className: 'badge-beta',
            icon: 'fa-solid fa-flask',
            displayName: 'Preview'
        };
    } else {
        return {
            className: 'badge-general',
            icon: 'fa-solid fa-circle-info',
            displayName: type || 'General'
        };
    }
}

// Fetch Release Notes Data
async function fetchReleaseNotes(forceRefresh = false) {
    showState('loading');
    refreshIcon.classList.add('spinning');
    refreshBtn.disabled = true;

    try {
        const response = await fetch(`/api/release-notes?refresh=${forceRefresh}`);
        const result = await response.json();

        if (result.success) {
            allEntries = result.data;
            lastUpdatedTimeEl.textContent = result.last_updated;
            filterAndRender();
            if (forceRefresh) {
                showToast('Feed refreshed successfully with live updates!');
            }
        } else {
            throw new Error(result.error || 'Failed to fetch release notes.');
        }
    } catch (err) {
        console.error(err);
        errorMessage.textContent = err.message || 'Check your network connection and try again.';
        showState('error');
    } finally {
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

// Show/Hide page states
function showState(state) {
    loadingState.style.display = 'none';
    errorState.style.display = 'none';
    emptyState.style.display = 'none';
    updatesList.style.display = 'none';

    if (state === 'loading') {
        loadingState.style.display = 'flex';
    } else if (state === 'error') {
        errorState.style.display = 'flex';
    } else if (state === 'empty') {
        emptyState.style.display = 'flex';
    } else if (state === 'content') {
        updatesList.style.display = 'flex';
    }
}

// Handle filters and search query matching
function filterAndRender() {
    filteredEntries = [];
    let totalUpdatesCount = 0;

    allEntries.forEach(entry => {
        // Filter sub-updates
        const matchingUpdates = entry.updates.filter(update => {
            // Check type filter
            const meta = getUpdateTypeMeta(update.type);
            const matchesType = (currentFilter === 'all') || 
                                (currentFilter === 'Feature' && meta.displayName === 'Feature') ||
                                (currentFilter === 'Change' && meta.displayName === 'Change') ||
                                (currentFilter === 'Deprecated' && meta.displayName === 'Deprecation') ||
                                (currentFilter === 'Beta' && meta.displayName === 'Preview');
            
            // Check search query
            const matchesSearch = !searchQuery || 
                                 entry.date.toLowerCase().includes(searchQuery) ||
                                 update.type.toLowerCase().includes(searchQuery) ||
                                 update.content_text.toLowerCase().includes(searchQuery);

            return matchesType && matchesSearch;
        });

        if (matchingUpdates.length > 0) {
            filteredEntries.push({
                ...entry,
                updates: matchingUpdates
            });
            totalUpdatesCount += matchingUpdates.length;
        }
    });

    totalCountEl.textContent = totalUpdatesCount;

    if (filteredEntries.length === 0) {
        showState('empty');
    } else {
        renderTimeline();
        showState('content');
    }
}

// Render release updates inside the timeline container
function renderTimeline() {
    updatesList.innerHTML = '';

    filteredEntries.forEach(entry => {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';

        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        dateHeader.innerHTML = `
            <span class="date-badge">${entry.date}</span>
            <div class="date-line"></div>
        `;
        dateGroup.appendChild(dateHeader);

        entry.updates.forEach(update => {
            const meta = getUpdateTypeMeta(update.type);
            const updateCard = document.createElement('div');
            updateCard.className = 'update-card';
            
            // Card Header
            const cardHeader = document.createElement('div');
            cardHeader.className = 'update-card-header';
            
            const badge = document.createElement('span');
            badge.className = `update-type-badge ${meta.className}`;
            badge.innerHTML = `<i class="${meta.icon}"></i> ${meta.displayName}`;
            cardHeader.appendChild(badge);
            
            // Actions panel (Tweet and link buttons)
            const actions = document.createElement('div');
            actions.className = 'update-actions';
            
            // Tweet Share Button
            const tweetBtn = document.createElement('button');
            tweetBtn.className = 'card-action-btn tweet-action';
            tweetBtn.title = 'Tweet about this update';
            tweetBtn.innerHTML = '<i class="fa-brands fa-x-twitter"></i>';
            tweetBtn.addEventListener('click', () => {
                openTweetComposer(entry, update);
            });
            actions.appendChild(tweetBtn);

            // Feed original link button
            if (entry.link) {
                const linkBtn = document.createElement('a');
                linkBtn.className = 'card-action-btn';
                linkBtn.href = entry.link;
                linkBtn.target = '_blank';
                linkBtn.title = 'View Official Documentation';
                linkBtn.innerHTML = '<i class="fa-solid fa-arrow-up-right-from-square"></i>';
                actions.appendChild(linkBtn);
            }

            cardHeader.appendChild(actions);
            updateCard.appendChild(cardHeader);

            // Card Body content
            const cardBody = document.createElement('div');
            cardBody.className = 'update-body';
            cardBody.innerHTML = update.content_html;
            updateCard.appendChild(cardBody);

            dateGroup.appendChild(updateCard);
        });

        updatesList.appendChild(dateGroup);
    });
}

// Open tweet composer with populated text
function openTweetComposer(entry, update) {
    const limit = 280;
    const hashtags = ' #BigQuery #GoogleCloud';
    const link = entry.link || '';
    
    // Shorten the content description if needed to fit the tweet
    let contentText = update.content_text;
    
    // Standard template: "BigQuery Release (Date): Description - Link #BigQuery #GoogleCloud"
    const prefix = `BigQuery Update [${entry.date}]: `;
    const suffix = ` ${link}${hashtags}`;
    
    // Calculate allowed character length for the description itself
    const remainingSpace = limit - prefix.length - suffix.length;
    
    if (contentText.length > remainingSpace) {
        contentText = contentText.substring(0, remainingSpace - 3) + '...';
    }
    
    const tweetText = `${prefix}${contentText}${suffix}`;
    
    tweetTextarea.value = tweetText;
    updateTweetCharCounter();
    
    tweetModal.classList.add('active');
    tweetTextarea.focus();
}

// Close tweet composer modal
function closeTweetComposer() {
    tweetModal.classList.remove('active');
}

// Update Tweet characters remaining count
function updateTweetCharCounter() {
    const textLength = tweetTextarea.value.length;
    charCounter.textContent = `${textLength} / 280`;

    // Calculate percentage for progress ring
    const percent = Math.min((textLength / 280) * 100, 100);
    const offset = circumference - (percent / 100) * circumference;
    progressRingCircle.style.strokeDashoffset = offset;

    // Apply color flags depending on characters limits
    if (textLength > 280) {
        charCounter.className = 'char-counter error';
        progressRingCircle.style.stroke = 'var(--accent-red)';
        postTweetBtn.disabled = true;
    } else if (textLength > 240) {
        charCounter.className = 'char-counter warning';
        progressRingCircle.style.stroke = 'var(--accent-amber)';
        postTweetBtn.disabled = false;
    } else {
        charCounter.className = 'char-counter';
        progressRingCircle.style.stroke = 'var(--twitter-blue)';
        postTweetBtn.disabled = false;
    }
}

// Post tweet via official web intent
function postTweet() {
    const text = tweetTextarea.value;
    if (text.length > 280) return;

    const encodedText = encodeURIComponent(text);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}`;
    
    // Open Twitter intent in new window
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    
    closeTweetComposer();
    showToast('Tweet intent opened successfully!');
}

// Show temporary toast message
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('active');
    setTimeout(() => {
        toast.classList.remove('active');
    }, 4000);
}

// Setup Page Event Listeners
function setupEventListeners() {
    // Refresh button
    refreshBtn.addEventListener('click', () => fetchReleaseNotes(true));
    retryBtn.addEventListener('click', () => fetchReleaseNotes(true));

    // Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-type');
            filterAndRender();
        });
    });

    // Search bar functionality
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (searchQuery) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }
        filterAndRender();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        filterAndRender();
        searchInput.focus();
    });

    // Modal Events
    closeModalBtn.addEventListener('click', closeTweetComposer);
    cancelTweetBtn.addEventListener('click', closeTweetComposer);
    postTweetBtn.addEventListener('click', postTweet);
    tweetTextarea.addEventListener('input', updateTweetCharCounter);

    // Close modal when clicking on backdrop
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetComposer();
        }
    });

    // Keyboard ESC to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && tweetModal.classList.contains('active')) {
            closeTweetComposer();
        }
    });
}

// Initial Page Load
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    fetchReleaseNotes(false);
});
