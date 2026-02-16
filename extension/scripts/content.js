/**
 * Gmail Phishing Detector - Content Script
 * Injects analysis overlay into Gmail emails
 * REQUIRED: Backend must be connected for analysis
 */

console.log('[PhishingDetector] ========== CONTENT SCRIPT LOADED ==========');

// Configuration
const CONFIG = {
  API_ENDPOINT: 'http://localhost:8000/analyze_email',
  TIMEOUT: 10000,
  CACHE_KEY: 'phishing_analysis_cache'
};

// Backend connectivity state
let backendConnected = false;
let backendCheckDone = false;

// Cache for analyzed emails
let analysisCache = {};

// Initialize
chrome.storage.local.get([CONFIG.CACHE_KEY], (result) => {
  if (result[CONFIG.CACHE_KEY]) {
    analysisCache = result[CONFIG.CACHE_KEY];
  }
});

// Check backend connection on startup
(async () => {
  console.log('[PhishingDetector] Checking backend connection on startup...');
  backendConnected = await checkBackendAvailable();
  backendCheckDone = true;
  console.log('[PhishingDetector] Backend connection result:', backendConnected ? 'CONNECTED' : 'NOT CONNECTED');
})();

// Function to check if backend is available
async function checkBackendAvailable() {
  try {
    const response = await fetch('http://localhost:8000/health', {
      method: 'GET',
      timeout: 3000
    });
    return response.ok;
  } catch (error) {
    console.error('[PhishingDetector] Backend health check failed:', error.message);
    return false;
  }
}

// Add test banner to verify script is loaded - BLOCKED IF NO BACKEND
window.addEventListener('load', () => {
  console.log('[PhishingDetector] Page fully loaded');
  
  if (window.__phishingDetectorLoaded) {
    return;
  }
  
  window.__phishingDetectorLoaded = true;
  console.log('[PhishingDetector] Test: Script is active and running on this page');
  
  // Wait for backend check to complete
  const checkInterval = setInterval(() => {
    if (backendCheckDone) {
      clearInterval(checkInterval);
      if (!backendConnected) {
        console.error('[PhishingDetector] ⛔ BACKEND NOT CONNECTED - Extension disabled');
        showBlockingMessage();
      } else {
        console.log('[PhishingDetector] ✅ Backend is connected - Extension active');
      }
    }
  }, 100);
});

console.log('[PhishingDetector] Content script initialization in progress...');

/**
 * Show blocking message if backend is not connected
 */
function showBlockingMessage() {
  const blocker = document.createElement('div');
  blocker.id = 'phishing-detector-blocker';
  blocker.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #fff;
  `;
  
  const message = document.createElement('div');
  message.style.cssText = `
    background: #1a1a1a;
    border: 2px solid #ff4444;
    padding: 30px;
    border-radius: 8px;
    max-width: 500px;
    text-align: center;
  `;
  
  message.innerHTML = `
    <div style="font-size: 48px; margin-bottom: 16px;">⛔</div>
    <h2 style="color: #ff4444; margin: 16px 0; font-size: 24px;">Phishing Detector - Backend Required</h2>
    <p style="margin: 16px 0; color: #ccc; font-size: 14px;">
      The extension requires the backend service to be running.
    </p>
    <div style="background: #2a2a2a; padding: 16px; border-radius: 4px; margin: 20px 0; text-align: left; font-family: monospace;">
      <p style="margin: 8px 0; color: #4CAF50;">To start the backend:</p>
      <code style="color: #fff;">cd backend</code><br>
      <code style="color: #fff;">python app.py</code>
    </div>
    <p style="margin: 16px 0; color: #888; font-size: 12px;">
      Extension is disabled until backend is running.
    </p>
  `;
  
  blocker.appendChild(message);
  
  // Show in a way that doesn't break Gmail completely
  // Instead of blocking entire page, show warning banner
  blocker.remove();
  showWarningBanner();
}

/**
 * Show warning banner instead of blocking
 */
function showWarningBanner() {
  const banner = document.createElement('div');
  banner.id = 'phishing-detector-warning';
  banner.style.cssText = `
    background-color: #ff4444;
    color: #fff;
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    z-index: 10000;
    border: 2px solid #fff;
  `;
  
  banner.innerHTML = `
    <strong>⛔ PHISHING DETECTOR DISABLED</strong><br>
    Backend service is not running. 
    Start it with: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 3px;">python backend/app.py</code>
  `;
  
  // Try to insert at top
  const insertPoints = [
    document.querySelector('[data-message-id]'),
    document.querySelector('[role="main"]'),
    document.querySelector('.bAp'),
    document.body.firstChild
  ];

  for (const point of insertPoints) {
    if (point && point.parentNode) {
      point.parentNode.insertBefore(banner, point);
      return;
    }
  }
}

/**
 * Extract email data from Gmail's DOM structure
 * Returns { sender, subject, bodyText, bodyHtml, links }
 */
function extractEmailData() {
  try {
    console.log('[PhishingDetector] ===== EMAIL EXTRACTION START =====');
    
    let subject = '';
    let sender = '';
    let bodyHtml = '';
    let bodyText = '';
    const links = [];

    // Try multiple selectors for subject (Gmail updates frequently)
    const subjectSelectors = [
      'h2[data-thread-subject]',
      'h2[role="heading"]',
      'span[data-thread-subject]',
      '.hP'
    ];
    
    console.log('[PhishingDetector] Searching for subject with selectors:', subjectSelectors);
    for (const selector of subjectSelectors) {
      const el = document.querySelector(selector);
      console.log(`[PhishingDetector] "${selector}":`, el ? 'FOUND' : 'not found');
      if (el) {
        subject = el.textContent?.trim() || '';
        console.log(`[PhishingDetector] Subject text: "${subject.substring(0, 80)}..."`);
        if (subject) break;
      }
    }

    // Extract sender from email header
    const senderSelectors = [
      'span[email]',
      'a[href^="mailto:"]',
      '.gD'
    ];
    
    console.log('[PhishingDetector] Searching for sender with selectors:', senderSelectors);
    for (const selector of senderSelectors) {
      const el = document.querySelector(selector);
      console.log(`[PhishingDetector] "${selector}":`, el ? 'FOUND' : 'not found');
      if (el) {
        sender = el.getAttribute('email') || el.href?.replace('mailto:', '') || el.textContent?.trim() || '';
        console.log(`[PhishingDetector] Sender: "${sender}"`);
        if (sender) break;
      }
    }

    // Extract body content - try multiple approaches
    const bodySelectors = [
      '[data-message-id] .a3s',
      '[data-message-id] .ii.gt',
      '[data-body-id]',
      '.gs',
      '.a3s',
      '.ii.gt'
    ];

    console.log('[PhishingDetector] Searching for body with selectors:', bodySelectors);
    let bodyElement = null;
    for (const selector of bodySelectors) {
      bodyElement = document.querySelector(selector);
      console.log(`[PhishingDetector] "${selector}":`, bodyElement ? 'FOUND' : 'not found');
      if (bodyElement) {
        console.log(`[PhishingDetector] Body element found, content length:`, bodyElement.innerText?.length || 0);
        break;
      }
    }

    if (bodyElement) {
      bodyHtml = bodyElement.innerHTML || '';
      bodyText = bodyElement.innerText || bodyElement.textContent || '';
      console.log('[PhishingDetector] Body extracted: length=' + bodyText.length);
    }

    // If no body found, try to get from the main content area
    if (!bodyText) {
      console.log('[PhishingDetector] Body not found via standard selectors, trying main content');
      const mainContent = document.querySelector('[role="main"]') || document.querySelector('.bAp');
      if (mainContent) {
        bodyText = mainContent.innerText || '';
        console.log('[PhishingDetector] Body from main content: length=' + bodyText.length);
      }
    }

    // Extract all links from the email
    console.log('[PhishingDetector] Searching for links in email...');
    const allLinks = document.querySelectorAll('a[href]');
    console.log('[PhishingDetector] Total a[href] elements found:', allLinks.length);
    
    const foundUrls = new Set();
    
    allLinks.forEach((linkEl) => {
      try {
        let href = linkEl.getAttribute('href') || '';
        const text = linkEl.textContent?.trim() || '';
        
        // Skip Gmail UI links
        if (!href || href.startsWith('?') || href.startsWith('#') || href.startsWith('javascript:')) {
          return;
        }

        // Decode Gmail's URL wrapping
        if (href.includes('url?q=')) {
          href = decodeURIComponent(href.replace(/.*url\?q=/, '').split('&')[0]);
        }

        // Only include http(s) URLs
        if ((href.startsWith('http://') || href.startsWith('https://')) && !foundUrls.has(href)) {
          foundUrls.add(href);
          links.push({ href, text: text.substring(0, 100) });
          console.log('[PhishingDetector] Link added:', href.substring(0, 60));
        }
      } catch (e) {
        console.log('[PhishingDetector] Error processing link:', e);
      }
    });

    console.log('[PhishingDetector] ===== EMAIL EXTRACTION COMPLETE =====');
    console.log('[PhishingDetector] Results:', {
      hasSubject: !!subject && subject.length > 0,
      hasSender: !!sender && sender.length > 0,
      bodyLength: bodyText.length,
      linkCount: links.length,
      subjectPreview: subject.substring(0, 40),
      senderPreview: sender.substring(0, 40)
    });

    return {
      sender: sender,
      subject: subject,
      bodyText: bodyText,
      bodyHtml: bodyHtml,
      links: links
    };
  } catch (error) {
    console.error('[PhishingDetector] Error extracting email:', error);
    return null;
  }
}

// ==================== API COMMUNICATION ====================

/**
 * Send email to backend for analysis
 */
async function analyzeEmail(emailData) {
  try {
    console.log('[PhishingDetector] ===== API CALL START =====');
    console.log('[PhishingDetector] Endpoint:', CONFIG.API_ENDPOINT);
    console.log('[PhishingDetector] Request body:', {
      sender: emailData.sender.substring(0, 30),
      subject: emailData.subject.substring(0, 30),
      bodyLength: emailData.bodyText.length,
      linkCount: emailData.links.length
    });
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('[PhishingDetector] API request timeout (10s exceeded)');
      controller.abort();
    }, CONFIG.TIMEOUT);

    console.log('[PhishingDetector] Sending fetch request...');
    const response = await fetch(CONFIG.API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    console.log('[PhishingDetector] Response received. Status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[PhishingDetector] API error response:', response.status, response.statusText);
      throw new Error(`API error: ${response.statusText}`);
    }

    const analysis = await response.json();
    console.log('[PhishingDetector] ===== API RESPONSE PARSED =====');
    console.log('[PhishingDetector] Analysis object keys:', Object.keys(analysis));
    console.log('[PhishingDetector] Email score:', analysis?.email?.trust_percent);
    console.log('[PhishingDetector] Links analyzed:', analysis?.links?.length);
    console.log('[PhishingDetector] Full response:', JSON.stringify(analysis).substring(0, 200));
    
    return analysis;
  } catch (error) {
    console.error('[PhishingDetector] API request failed:', error.message);
    console.error('[PhishingDetector] Error type:', error.name);
    console.error('[PhishingDetector] Full error:', error);
    return null;
  }
}

// ==================== UI RENDERING ====================

/**
 * Create and inject the analysis overlay banner
 */
function createAnalysisBanner(analysis) {
  // Remove existing banner
  const existing = document.getElementById('phishing-detector-banner');
  if (existing) existing.remove();

  const email = analysis.email;
  
  // Black and white skull theme
  const bgColor = '#000000';
  const borderColor = '#ffffff';
  const textColor = '#ffffff';

  const icon = '💀';

  // Build flags HTML if available
  let flagsHTML = '';
  if (email.flags && email.flags.length > 0) {
    flagsHTML = '<div style="margin-top: 8px; font-size: 12px; padding-top: 8px; border-top: 1px solid #444;">';
    email.flags.forEach(flag => {
      flagsHTML += `<div style="margin: 4px 0; opacity: 0.9;">• ${flag}</div>`;
    });
    flagsHTML += '</div>';
  }

  // Build explanation HTML
  let explanationHTML = '';
  if (email.explanation) {
    explanationHTML = `<div style="margin-top: 8px; font-size: 13px; opacity: 0.95; font-weight: 500;">
      ${email.explanation}
    </div>`;
  }

  const banner = document.createElement('div');
  banner.id = 'phishing-detector-banner';
  banner.style.cssText = `
    background-color: ${bgColor};
    border: 2px solid ${borderColor};
    color: ${textColor};
    padding: 12px 16px;
    margin-bottom: 16px;
    border-radius: 4px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    z-index: 10000;
  `;

  const titleDiv = document.createElement('div');
  titleDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';
  titleDiv.innerHTML = `
    <div>
      <strong style="font-size: 16px; margin-right: 8px;">${icon}</strong>
      <span style="font-weight: 600;">PHISHING ANALYSIS</span>
    </div>
    <div style="text-align: right;">
      <span style="font-weight: 600; font-size: 16px;">${email.trust_percent}%</span>
      <span style="margin-left: 8px; font-size: 12px;">${email.risk_level.toUpperCase()}</span>
    </div>
  `;

  const contentDiv = document.createElement('div');
  contentDiv.style.cssText = 'margin-top: 8px;';
  contentDiv.innerHTML = explanationHTML + flagsHTML;

  const linksDiv = document.createElement('div');
  linksDiv.style.cssText = 'margin-top: 8px; font-size: 12px; opacity: 0.7; padding-top: 8px; border-top: 1px solid #444;';
  linksDiv.innerHTML = `Links analyzed: <strong>${analysis.links.length}</strong>`;

  banner.appendChild(titleDiv);
  if (explanationHTML || flagsHTML) {
    banner.appendChild(contentDiv);
  }
  banner.appendChild(linksDiv);

  // Try multiple insertion points
  const insertPoints = [
    document.querySelector('[data-message-id]'),
    document.querySelector('[role="main"]'),
    document.querySelector('.bAp'),
    document.body
  ];

  for (const point of insertPoints) {
    if (point) {
      console.log('[PhishingDetector] Inserting banner at:', point);
      if (point.parentNode) {
        point.parentNode.insertBefore(banner, point);
      } else {
        point.insertBefore(banner, point.firstChild);
      }
      return;
    }
  }

  console.warn('[PhishingDetector] Could not find insertion point for banner');
}

/**
 * Add risk badges next to links in the email
 */
function addLinkBadges(analysis) {
  if (!analysis.links || analysis.links.length === 0) return;

  // Create a map of href to analysis for quick lookup
  const linkAnalysisMap = {};
  analysis.links.forEach(link => {
    linkAnalysisMap[link.href] = link;
  });

  // Find all links in the email body and add badges
  const linkElements = document.querySelectorAll('a[href]');
  
  linkElements.forEach((linkEl) => {
    const href = linkEl.getAttribute('href');
    const actualUrl = decodeURIComponent(href.replace(/.*url\?q=/, '').split('&')[0]);
    const linkAnalysis = linkAnalysisMap[actualUrl];

    if (linkAnalysis && !linkEl.querySelector('.phishing-badge')) {
      const badge = document.createElement('span');
      badge.className = 'phishing-badge';
      
      const riskColor = linkAnalysis.risk_level === 'safe' 
        ? '#28a745' 
        : linkAnalysis.risk_level === 'suspicious' 
        ? '#ffc107' 
        : '#dc3545';

      badge.style.cssText = `
        display: inline-block;
        background-color: ${riskColor};
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 11px;
        font-weight: 600;
        margin-left: 6px;
        cursor: pointer;
        white-space: nowrap;
      `;

      badge.textContent = `${linkAnalysis.trust_percent}% safe`;
      
      // Build tooltip with explanation and flags
      let tooltipText = `Risk Level: ${linkAnalysis.risk_level}\nURL: ${linkAnalysis.href}`;
      if (linkAnalysis.explanation) {
        tooltipText += `\n\nAnalysis: ${linkAnalysis.explanation}`;
      }
      if (linkAnalysis.flags && linkAnalysis.flags.length > 0) {
        tooltipText += `\n\nIndicators:\n${linkAnalysis.flags.join('\n')}`;
      }
      badge.title = tooltipText;
      
      // Insert after the link
      linkEl.parentNode.insertBefore(badge, linkEl.nextSibling);
    }
  });
}

// ==================== MAIN DETECTION LOOP ====================

/**
 * Generate unique ID for current email
 */
function getCurrentEmailId() {
  // Gmail stores message ID in URL and data attributes
  const urlParams = new URLSearchParams(window.location.search);
  const messageId = urlParams.get('messageId') || 
                    document.querySelector('[data-message-id]')?.getAttribute('data-message-id') ||
                    document.querySelector('[data-thread-id]')?.getAttribute('data-thread-id');
  return messageId;
}

/**
 * Main analysis function - runs when email is opened
 */
async function analyzeCurrentEmail() {
  try {
    console.log('[PhishingDetector] ===== analyzeCurrentEmail CALLED =====');
    
    // REQUIRED: Check if backend is connected
    if (!backendConnected) {
      console.error('[PhishingDetector] ⛔ BACKEND NOT CONNECTED - Analysis disabled');
      console.log('[PhishingDetector] Waiting for user to start backend...');
      return;
    }
    
    const emailId = getCurrentEmailId();
    console.log('[PhishingDetector] Current email ID:', emailId);
    
    // Check cache first
    if (emailId && analysisCache[emailId]) {
      console.log('[PhishingDetector] Using cached analysis for this email');
      const analysis = analysisCache[emailId];
      createAnalysisBanner(analysis);
      addLinkBadges(analysis);
      return;
    }

    console.log('[PhishingDetector] No cache found, extracting email data...');
    const emailData = extractEmailData();
    
    // Require at least a subject or sender
    if (!emailData || (!emailData.subject && !emailData.sender)) {
      console.log('[PhishingDetector] Cannot proceed - no email data extracted');
      console.log('[PhishingDetector] emailData=', emailData);
      return;
    }

    console.log('[PhishingDetector] Email data valid, showing loading banner...');

    // Show loading state
    const loadingBanner = document.createElement('div');
    loadingBanner.id = 'phishing-detector-loading';
    loadingBanner.style.cssText = `
      background-color: #e7f3ff;
      border: 1px solid #b3d9ff;
      color: #004085;
      padding: 12px 16px;
      margin-bottom: 16px;
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      z-index: 10000;
    `;
    loadingBanner.textContent = '🔍 Analyzing email for phishing threats...';
    
    // Try multiple insertion points
    const insertPoints = [
      document.querySelector('[data-message-id]'),
      document.querySelector('[role="main"]'),
      document.querySelector('.bAp'),
      document.body
    ];

    let inserted = false;
    for (const point of insertPoints) {
      if (point) {
        if (point.parentNode) {
          point.parentNode.insertBefore(loadingBanner, point);
        } else {
          point.insertBefore(loadingBanner, point.firstChild);
        }
        inserted = true;
        console.log('[PhishingDetector] Loading banner inserted');
        break;
      }
    }

    if (!inserted) {
      console.log('[PhishingDetector] WARNING: Could not find any insertion point for loading banner');
    }

    console.log('[PhishingDetector] Calling API with email data...');
    // Send to API
    const analysis = await analyzeEmail(emailData);
    console.log('[PhishingDetector] API response:', {
      hasAnalysis: !!analysis,
      email: analysis?.email ? 'present' : 'missing',
      trustPercent: analysis?.email?.trust_percent,
      riskLevel: analysis?.email?.risk_level,
      linkCount: analysis?.links?.length
    });

    // Remove loading state
    const loaderEl = document.getElementById('phishing-detector-loading');
    if (loaderEl) loaderEl.remove();

    if (analysis) {
      console.log('[PhishingDetector] Analysis received, displaying results...');
      // Cache result
      if (emailId) {
        analysisCache[emailId] = analysis;
        chrome.storage.local.set({ [CONFIG.CACHE_KEY]: analysisCache });
      }

      createAnalysisBanner(analysis);
      addLinkBadges(analysis);
      console.log('[PhishingDetector] Analysis displayed successfully');
    } else {
      console.error('[PhishingDetector] No analysis received from API');
      const errorBanner = document.createElement('div');
      errorBanner.style.cssText = `
        background-color: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;
        padding: 12px 16px;
        margin-bottom: 16px;
        border-radius: 4px;
      `;
      errorBanner.textContent = '❌ Unable to analyze email. Please check the backend service.';
      
      for (const point of insertPoints) {
        if (point) {
          if (point.parentNode) {
            point.parentNode.insertBefore(errorBanner, point);
          } else {
            point.insertBefore(errorBanner, point.firstChild);
          }
          break;
        }
      }
    }
  } catch (error) {
    console.error('[PhishingDetector] FATAL ERROR in analyzeCurrentEmail:', error);
    console.error('[PhishingDetector] Stack trace:', error.stack);
  }
}

// ==================== EVENT LISTENERS ====================

// Watch for email open/change
let lastAnalyzedEmailId = null;

function watchEmailChanges() {
  // Use MutationObserver to detect when email content changes
  const observer = new MutationObserver((mutations) => {
    const emailId = getCurrentEmailId();
    
    // Only analyze if email ID changed
    if (emailId && emailId !== lastAnalyzedEmailId) {
      lastAnalyzedEmailId = emailId;
      
      // Small delay to ensure DOM is fully loaded
      setTimeout(analyzeCurrentEmail, 500);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-message-id', 'data-thread-id']
  });
}

// ==================== INITIALIZATION ====================

// Start watching for email changes immediately
console.log('[PhishingDetector] Setting up email watchers...');
watchEmailChanges();

// Periodic check in case MutationObserver misses something
setInterval(() => {
  const emailId = getCurrentEmailId();
  if (emailId && emailId !== lastAnalyzedEmailId) {
    console.log('[PhishingDetector] Periodic check: New email detected, analyzing...');
    lastAnalyzedEmailId = emailId;
    analyzeCurrentEmail();
  }
}, 1000);

// Try initial analysis immediately
setTimeout(() => {
  console.log('[PhishingDetector] Attempting initial email analysis...');
  analyzeCurrentEmail();
}, 500);

// Handle navigation within Gmail (hash changes)
window.addEventListener('hashchange', () => {
  console.log('[PhishingDetector] URL changed, re-analyzing...');
  lastAnalyzedEmailId = null; // Reset to force re-analysis
  setTimeout(analyzeCurrentEmail, 800);
});

// Listen for any GM_XHR or fetch intercepted emails
document.addEventListener('gmail-loaded', () => {
  console.log('[PhishingDetector] Gmail update detected');
  lastAnalyzedEmailId = null;
  setTimeout(analyzeCurrentEmail, 300);
});

// Manual trigger when user clicks in the email area
document.addEventListener('click', (e) => {
  const emailContainer = e.target.closest('[data-message-id]');
  if (emailContainer) {
    console.log('[PhishingDetector] Click in email area detected');
    setTimeout(analyzeCurrentEmail, 300);
  }
}, true);

// Also re-analyze on any DOM mutations in the main area
const mainObserver = new MutationObserver((mutations) => {
  // If a data-message-id was added, trigger analysis
  const hasNewMessage = mutations.some(m => 
    Array.from(m.addedNodes).some(n => n.getAttribute && n.getAttribute('data-message-id'))
  );
  if (hasNewMessage) {
    console.log('[PhishingDetector] New message DOM detected');
    lastAnalyzedEmailId = null;
    setTimeout(analyzeCurrentEmail, 500);
  }
});

// Start main observer
mainObserver.observe(document.body, {
  childList: true,
  subtree: true
});

console.log('[PhishingDetector] ========== INITIALIZATION COMPLETE ==========');
