/**
 * Background Service Worker - Manifest V3
 * Handles extension events and API communication
 */

console.log('[PhishingDetector] Service Worker initialized');

// ==================== EVENT LISTENERS ====================

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[PhishingDetector] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      apiEndpoint: 'http://localhost:8000/analyze_email',
      autoAnalyze: true,
      showNotifications: true
    });
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[PhishingDetector] Message received:', request.action);

  // Async handler that returns true
  (async () => {
    try {
      if (request.action === 'analyzeEmail') {
        const result = await analyzeEmailBackend(request.data);
        sendResponse({ success: true, data: result });
      } else if (request.action === 'getSettings') {
        const settings = await getSettings();
        sendResponse({ success: true, data: settings });
      } else if (request.action === 'testAPI') {
        const result = await fetch('http://localhost:8000/health').then(r => r.json());
        sendResponse({ success: true, data: result });
      }
    } catch (error) {
      console.error('[PhishingDetector] Error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // Return true to indicate async response
  return true;
});

// ==================== HELPER FUNCTIONS ====================

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['apiEndpoint', 'autoAnalyze', 'showNotifications'], (items) => {
      resolve({
        apiEndpoint: items.apiEndpoint || 'http://localhost:8000/analyze_email',
        autoAnalyze: items.autoAnalyze !== false,
        showNotifications: items.showNotifications !== false
      });
    });
  });
}

async function analyzeEmailBackend(emailData) {
  const settings = await getSettings();

  const response = await fetch(settings.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(emailData)
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return await response.json();
}

console.log('[PhishingDetector] Service Worker ready');
