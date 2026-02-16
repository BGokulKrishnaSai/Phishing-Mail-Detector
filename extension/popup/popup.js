/**
 * Popup Script
 * Handles UI interactions and settings
 * REQUIRED: Backend must be connected for extension to work
 */

console.log('[PhishingDetector] Popup script loaded');

// Backend connection state
let backendConnected = false;

// DOM Elements
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const statusFooter = document.getElementById('status-footer');
const apiEndpointInput = document.getElementById('api-endpoint');
const saveBtn = document.getElementById('save-btn');
const testBtn = document.getElementById('test-btn');
const autoAnalyzeToggle = document.getElementById('auto-analyze-toggle');
const notificationsToggle = document.getElementById('notifications-toggle');
const settingsSection = document.querySelector('.settings-section');
const apiConfig = document.querySelector('.api-config');

// Load settings on popup open
document.addEventListener('DOMContentLoaded', () => {
  checkBackendConnection();
});

/**
 * Check if backend is connected
 */
async function checkBackendConnection() {
  try {
    const response = await fetch('http://localhost:8000/health', {
      method: 'GET',
      timeout: 3000
    });

    if (response.ok) {
      backendConnected = true;
      setStatusOnline('Connected');
      enableUI();
      loadSettings();
      return true;
    } else {
      backendConnected = false;
      setStatusOfflineBlocking('Connection failed');
      disableUI();
      return false;
    }
  } catch (error) {
    backendConnected = false;
    console.error('[PhishingDetector] Backend not available:', error);
    setStatusOfflineBlocking('Backend offline');
    disableUI();
    return false;
  }
}

/**
 * Load settings from storage (only shown if backend is connected)
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
 * Enable UI when backend is connected
 */
function enableUI() {
  apiEndpointInput.disabled = false;
  saveBtn.disabled = false;
  testBtn.disabled = false;
  autoAnalyzeToggle.style.pointerEvents = 'auto';
  autoAnalyzeToggle.style.opacity = '1';
  notificationsToggle.style.pointerEvents = 'auto';
  notificationsToggle.style.opacity = '1';
  settingsSection.style.opacity = '1';
  apiConfig.style.opacity = '1';
}

/**
 * Disable UI when backend is not connected
 */
function disableUI() {
  apiEndpointInput.disabled = true;
  saveBtn.disabled = true;
  testBtn.disabled = true;
  autoAnalyzeToggle.style.pointerEvents = 'none';
  autoAnalyzeToggle.style.opacity = '0.5';
  notificationsToggle.style.pointerEvents = 'none';
  notificationsToggle.style.opacity = '0.5';
  settingsSection.style.opacity = '0.5';
  apiConfig.style.opacity = '0.5';
}

/**
 * Save settings to storage (only if backend connected)
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

/**
 * Update UI to show online status
 */
function setStatusOnline(message) {
  statusIndicator.classList.remove('offline');
  statusIndicator.classList.add('online');
  statusText.textContent = message;
  statusFooter.classList.remove('error');
  statusFooter.textContent = 'Backend service is running and ready';
}

/**
 * Update UI to show offline status - BLOCKING
 * Extension cannot be used without backend
 */
function setStatusOfflineBlocking(message) {
  statusIndicator.classList.remove('online');
  statusIndicator.classList.add('offline');
  statusText.textContent = message;
  statusFooter.classList.add('error');
  statusFooter.innerHTML = `
    <strong>⛔ BACKEND REQUIRED</strong><br>
    This extension requires the backend service to be running.<br>
    <br>
    <strong>To use:</strong> Start the backend<br>
    <code>python backend/app.py</code><br>
    <br>
    Refresh this popup when backend is ready.
  `;
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
  // Only allow toggle if backend is connected
  if (backendConnected) {
    autoAnalyzeToggle.classList.toggle('active');
  }
});

notificationsToggle.addEventListener('click', () => {
  // Only allow toggle if backend is connected
  if (backendConnected) {
    notificationsToggle.classList.toggle('active');
  }
});

// Refresh backend connection status every 5 seconds
setInterval(checkBackendConnection, 5000);
