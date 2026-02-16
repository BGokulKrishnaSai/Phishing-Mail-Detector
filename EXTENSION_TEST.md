# Extension Connection Testing Guide

## Overview
The **extension works independently** even when the backend is not running. It gracefully handles disconnection.

---

## Extension Independence Verification

### 1. Extension ID & Manifest
- **Extension Name**: "Phishing Email Detector"
- **Manifest Version**: 3
- **Current Version**: 1.0.0
- **Status**: ✅ Valid Chrome Extension V3

### 2. What Works WITHOUT Backend
- ✅ Extension loads and initializes
- ✅ Popup UI displays and responds to clicks
- ✅ Settings can be saved/loaded
- ✅ Status page shows connection attempt
- ✅ Test button attempts connection
- ✅ Service worker runs and listens for messages
- ✅ Content script injects into Gmail

### 3. Graceful Degradation When Backend is Offline

**Popup Behavior**:
```
✓ Status indicator shows: "Backend offline"
✓ Shows warning: "⚠️ Make sure the backend service is running"
✓ Test button attempts connection and shows error
✓ Settings can still be changed locally
```

**Gmail Content Script Behavior**:
```
✓ Script loads and initializes on mail.google.com
✓ Shows loading banner: "🔍 Analyzing email for phishing threats..."
✓ When API fails (backend offline), shows error:
  "❌ Unable to analyze email. Please check the backend service."
✓ Does NOT crash the extension
✓ Does NOT prevent Gmail from functioning
```

---

## Test Procedures

### Test 1: Extension Loads Without Backend Running
**Steps:**
1. Ensure backend is STOPPED (don't run `python backend/app.py`)
2. Load extension in Chrome
3. Navigate to `chrome://extensions/`

**Expected Result:**
- Extension appears in list with icon ✅
- No errors in console
- Extension ID is visible (e.g., `kgidnjklanclimhbbbkdaafjnlihklbj`)

---

### Test 2: Popup Works Without Backend
**Steps:**
1. Backend is STOPPED
2. Click extension icon in Chrome toolbar
3. Popup opens

**Expected Result:**
- Popup displays status indicator (RED/offline)
- Shows: "Backend offline"
- Settings section loads properly
- "Test Connection" button works (shows error after attempt)
- Settings can be saved without errors

---

### Test 3: Content Script Works Without Backend
**Steps:**
1. Backend is STOPPED
2. Open any email in Gmail
3. Check browser console for extension logs

**Expected Result:**
- Console shows: `[PhishingDetector] Content script initialization in progress...`
- Shows: `[PhishingDetector] Page fully loaded`
- Attempts to extract email data
- Shows loading banner briefly
- Shows error banner: `❌ Unable to analyze email...`
- Gmail continues to work normally

---

### Test 4: Extension Works WITH Backend Running
**Steps:**
1. Start backend: `cd backend && python app.py`
2. Open Gmail email
3. Watch for analysis results

**Expected Result:**
- Popup shows: "Connected" with green indicator
- Email shows black banner with analysis results
- Trust score and risk level displayed
- Link badges show security ratings
- No errors

---

## Key Features Verified

### File: `manifest.json`
```json
{
  "manifest_version": 3,
  "permissions": ["scripting", "activeTab", "storage"],
  "host_permissions": [
    "https://mail.google.com/*",
    "http://localhost:8000/*"
  ]
}
```
✅ Permissions allow extension to run independently

### File: `popup/popup.js` - Fallback Handling
```javascript
// Line 70-80: Shows error gracefully
function setStatusOffline(message) {
  statusIndicator.classList.add('offline');
  statusText.textContent = message;
  statusFooter.innerHTML = 
    '⚠️ Make sure the backend service is running on the configured endpoint';
}
```
✅ Clear user feedback when backend unavailable

### File: `scripts/content.js` - Error Handling
```javascript
// Line 510-520: Shows error to user instead of crashing
if (analysis) {
  createAnalysisBanner(analysis);
  addLinkBadges(analysis);
} else {
  const errorBanner = document.createElement('div');
  errorBanner.textContent = 
    '❌ Unable to analyze email. Please check the backend service.';
}
```
✅ Fails gracefully without crashing Gmail

---

## Current Configuration

### API Endpoint (Default)
```
http://localhost:8000/analyze_email
```
Configured in: `scripts/background.js` (line 12)

### Timeout
```
10 seconds (CONFIG.TIMEOUT)
```
Set in: `scripts/content.js` (line 11)

### Storage
- Uses Chrome Storage API for settings persistence
- Settings survive backend disconnection
- Cache stores previous analysis results

---

## Conclusion

✅ **Extension is fully functional without backend**
- Loads independently
- Provides user feedback
- Gracefully handles disconnection
- Does not interfere with Gmail
- Ready to use when backend comes online

❌ **Email analysis requires backend**
- Analysis depends on API
- Shows helpful error when API unavailable

---

## Testing Commands

### Start Backend
```powershell
cd backend
python -m pip install -r requirements.txt  # If needed
python app.py
```

### Stop Backend
Press `Ctrl+C` in terminal

### View Extension Logs
1. Open `chrome://extensions/`
2. Click "Details" for Phishing Email Detector
3. Click "Errors" link

### View Content Script Logs
1. Open any Gmail email
2. Right-click → "Inspect"
3. Go to "Console" tab
4. Look for `[PhishingDetector]` messages

---
