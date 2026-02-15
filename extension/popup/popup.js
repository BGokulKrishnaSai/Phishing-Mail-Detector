/**
 * Popup Script
 * Handles UI interactions and settings
 */

console.log('[PhishingDetector] Popup script loaded');

// DOM Elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const statusFooter = document.getElementById('status-footer');
const apiEndpointInput = document.getElementById('api-endpoint');
const saveBtn = document.getElementById('save-btn');
const testBtn = document.getElementById('test-btn');
const autoAnalyzeToggle = document.getElementById('auto-analyze-toggle');
const notificationsToggle = document.getElementById('notifications-toggle');

// Load settings on popup open
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  checkAPIStatus();
});

/**
 * Load settings from storage
 */
function loadSettings() {
  chrome.storage.sync.get(
    ['apiEndpoint', 'autoAnalyze', 'showNotifications'],
    (items) => {
      apiEndpointInput.value = items.apiEndpoint || 'http://localhost:8000/analyze_email';
      
      if (items.autoAnalyze === false) {
        autoAnalyzeToggle.classList.remove('active');
      }
      
      if (items.showNotifications === false) {
        notificationsToggle.classList.remove('active');
      }
    }
  );
}

/**
 * Save settings to storage
 */
function saveSettings() {
  chrome.storage.sync.set({
    apiEndpoint: apiEndpointInput.value,
    autoAnalyze: autoAnalyzeToggle.classList.contains('active'),
    showNotifications: notificationsToggle.classList.contains('active')
  }, () => {
    saveBtn.textContent = '✓ Saved!';
    setTimeout(() => {
      saveBtn.textContent = 'Save Settings';
    }, 2000);
  });
}

/**
 * Check API connection status
 */
async function checkAPIStatus() {
  try {
    const response = await fetch('http://localhost:8000/health', {
      method: 'GET',
      timeout: 3000
    });

    if (response.ok) {
      setStatusOnline('Connected');
    } else {
      setStatusOffline('Connection error');
    }
  } catch (error) {
    console.error('[PhishingDetector] API check failed:', error);
    setStatusOffline('Backend offline');
  }
}

/**
 * Update UI to show online status
 */
function setStatusOnline(message) {
  statusIndicator.classList.remove('offline');
  statusIndicator.classList.add('online');
  statusText.textContent = message;
  statusFooter.textContent = 'Backend service is running and ready';
}

/**
 * Update UI to show offline status
 */
function setStatusOffline(message) {
  statusIndicator.classList.remove('online');
  statusIndicator.classList.add('offline');
  statusText.textContent = message;
  statusFooter.innerHTML = '⚠️ Make sure the backend service is running on the configured endpoint';
}

/**
 * Test API connection
 */
async function testConnection() {
  testBtn.textContent = 'Testing...';
  testBtn.disabled = true;

  try {
    const response = await fetch(apiEndpointInput.value, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sender: 'test@example.com',
        subject: 'Test Email',
        bodyText: 'This is a test email to check the API connection.',
        bodyHtml: '<p>This is a test email to check the API connection.</p>',
        links: [
          { href: 'https://example.com', text: 'Example' }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      testBtn.textContent = '✓ Connection successful!';
      statusFooter.textContent = `API responded with trust score: ${data.email.trust_percent}%`;
      setStatusOnline('Connected');
    } else {
      testBtn.textContent = '✗ Connection failed';
      statusFooter.textContent = `API error: ${response.statusText}`;
    }
  } catch (error) {
    console.error('[PhishingDetector] Test failed:', error);
    testBtn.textContent = '✗ Connection failed';
    statusFooter.textContent = `Error: ${error.message}. Check if backend is running.`;
  }

  setTimeout(() => {
    testBtn.textContent = 'Test Connection';
    testBtn.disabled = false;
  }, 3000);
}

// Event Listeners
saveBtn.addEventListener('click', saveSettings);
testBtn.addEventListener('click', testConnection);

autoAnalyzeToggle.addEventListener('click', () => {
  autoAnalyzeToggle.classList.toggle('active');
});

notificationsToggle.addEventListener('click', () => {
  notificationsToggle.classList.toggle('active');
});

// Refresh status every 10 seconds
setInterval(checkAPIStatus, 10000);
