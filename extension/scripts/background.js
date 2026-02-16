/**
 * Background Service Worker - Manifest V3
 * Handles extension events and API communication
 * REQUIRED: Backend must be connected for extension to work
 */

console.log('[PhishingDetector] Service Worker initialized');

// Backend connectivity state
let backendConnected = false;
let lastHealthCheck = 0;

// ==================== BACKEND HEALTH CHECK ====================

async function checkBackendHealth() {
  try {
    console.log('[PhishingDetector] Checking backend health...');
    const response = await fetch('http://localhost:8000/health', {
      method: 'GET',
      timeout: 3000
    });
    
    if (response.ok) {
      backendConnected = true;
      console.log('[PhishingDetector] ✅ Backend CONNECTED');
      return true;
    } else {
      backendConnected = false;
      console.log('[PhishingDetector] ❌ Backend health check failed:', response.status);
      return false;
    }
  } catch (error) {
    backendConnected = false;
    console.error('[PhishingDetector] ❌ Backend health check error:', error.message);
    return false;
  }
}

// Initial health check and periodic checks
(async () => {
  await checkBackendHealth();
  // Check backend every 10 seconds
  setInterval(checkBackendHealth, 10000);
})();

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
      // REQUIRE BACKEND CONNECTION FOR ALL OPERATIONS
      if (!backendConnected) {
        console.warn('[PhishingDetector] ⚠️ Backend not connected - rejecting request');
        sendResponse({ 
          success: false, 
          error: 'Backend service is not connected. Please ensure the backend is running.',
          backendConnected: false
        });
        return;
      }

      if (request.action === 'analyzeEmail') {
        const result = await analyzeEmailBackend(request.data);
        sendResponse({ success: true, data: result, backendConnected: true });
      } else if (request.action === 'getSettings') {
        const settings = await getSettings();
        sendResponse({ success: true, data: settings, backendConnected: true });
      } else if (request.action === 'testAPI') {
        const result = await fetch('http://localhost:8000/health').then(r => r.json());
        sendResponse({ success: true, data: result, backendConnected: true });
      } else if (request.action === 'checkBackend') {
        sendResponse({ 
          success: true, 
          backendConnected: backendConnected,
          message: backendConnected ? 'Backend is connected' : 'Backend is not connected'
        });
      }
    } catch (error) {
      console.error('[PhishingDetector] Error:', error);
      sendResponse({ 
        success: false, 
        error: error.message,
        backendConnected: backendConnected
      });
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
