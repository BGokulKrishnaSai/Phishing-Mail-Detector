# Extension Backend Requirement Changes

## Summary
The extension has been updated to **REQUIRE** backend connectivity. It will no longer work gracefully without the backend - all functionality is now blocked until the backend service is running.

---

## What Changed

### 1️⃣ Background Service Worker (`scripts/background.js`)

**Added:**
- Backend health check on startup and every 10 seconds
- `backendConnected` state variable to track connectivity
- Check in message handler - rejects ALL requests if backend not connected
- `checkBackendHealth()` function for periodic health checks
- New message action: `checkBackend`

**Behavior:**
```javascript
if (!backendConnected) {
  sendResponse({ 
    success: false, 
    error: 'Backend service is not connected.',
    backendConnected: false
  });
  return;  // Reject request
}
```

✅ **No analysis or settings changes allowed without backend**

---

### 2️⃣ Content Script (`scripts/content.js`)

**Added:**
- Backend connection check on page load
- `backendConnected` and `backendCheckDone` state variables
- `checkBackendAvailable()` async function
- Early return in `analyzeCurrentEmail()` if backend not connected
- `showWarningBanner()` function to display red warning when disabled

**Behavior:**
```javascript
// At start of analyzeCurrentEmail()
if (!backendConnected) {
  console.error('[PhishingDetector] BACKEND NOT CONNECTED - Analysis disabled');
  return;  // Exit early, don't analyze
}
```

✅ **Gmail emails show red warning banner if backend not running**
✅ **No email analysis happens without backend**

---

### 3️⃣ Popup UI (`popup/popup.js`)

**Added:**
- `backendConnected` state variable in popup
- `checkBackendConnection()` async function
- `enableUI()` function - enables all controls
- `disableUI()` function - disables and grays out all controls
- `setStatusOfflineBlocking()` function - shows error message with instructions
- Updated event listeners to check `backendConnected` before allowing toggles

**New Behavior:**
```
If Backend IS Running:
✅ Status shows: "Connected" (green)
✅ All controls are enabled
✅ Settings can be viewed/changed
✅ Test button works

If Backend is NOT Running:
❌ Status shows: "Backend offline / Connection failed" (red)
❌ All controls are disabled and grayed out
❌ Settings cannot be changed
❌ Shows instructions: "python backend/app.py"
```

---

### 4️⃣ Popup HTML Styling (`popup/popup.html`)

**Added CSS:**
```css
.api-config input:disabled {
  background: #0a0a0a;
  color: #666;
  cursor: not-allowed;
}

.btn:disabled {
  background: #333;
  color: #666;
  cursor: not-allowed;
  opacity: 0.5;
}

.status-footer.error {
  color: #ff4444;
  background: rgba(255, 68, 68, 0.1);
  padding: 8px;
}
```

✅ **Visual feedback for disabled state**
✅ **Clear error styling**

---

## User Experience Changes

### Before (Graceful Degradation)
```
Backend Offline:
- Extension loads normally
- Popup shows "Backend offline" warning
- User can change settings and test
- Email shows loading, then error
- Gmail continues to work
```

### After (Strict Requirement)
```
Backend Offline:
- Extension loads normally
- Popup shows ⛔ "BACKEND REQUIRED" (RED)
- All settings are disabled
- Shows instructions to start backend
- User must refresh to enable
- Email shows red warning banner, no analysis
```

---

## Testing the New Behavior

### Test 1: Popup Without Backend
```
1. Do NOT run: python backend/app.py
2. Click extension icon
3. Expected: Red status with "⛔ BACKEND REQUIRED"
4. Expected: All input fields and buttons are DISABLED
5. Expected: Shows command to start backend
```

### Test 2: Popup With Backend
```
1. Run: python backend/app.py
2. Click extension icon
3. Expected: Green status with "Connected"
4. Expected: All controls are enabled
5. Expected: Settings are accessible
```

### Test 3: Email Analysis Without Backend
```
1. Do NOT run backend
2. Open Gmail email
3. Expected: Red warning banner appears
4. Expected: Shows "PHISHING DETECTOR DISABLED"
5. Expected: No analysis happens
```

### Test 4: Email Analysis With Backend
```
1. Run: python backend/app.py
2. Open Gmail email  
3. Expected: Analyzes email normally
4. Expected: Shows trust score and analysis
```

---

## Code Files Modified

```
✏️ extension/scripts/background.js
   - Added backend health checks
   - Added message filtering

✏️ extension/scripts/content.js
   - Added startup backend check
   - Added early returns for disabled state
   - Added warning banner function

✏️ extension/popup/popup.js
   - Added backend connection check
   - Added UI enable/disable functions
   - Updated event listeners
   - New blocking message display

✏️ extension/popup/popup.html
   - Added CSS for disabled state
   - Added CSS for error messages
```

---

## Key Functions

### Background Worker
```javascript
async function checkBackendHealth()
// Checks if backend is responding
// Sets backendConnected state

chrome.runtime.onMessage listener
// Now checks: if (!backendConnected) { return error }
```

### Content Script
```javascript
async function checkBackendAvailable()
// Returns true/false based on health check

async function analyzeCurrentEmail()
// Now starts with:
// if (!backendConnected) { return; }

function showWarningBanner()
// Displays red warning in Gmail
```

### Popup
```javascript
async function checkBackendConnection()
// Checks backend and updates UI

function enableUI() / disableUI()
// Control availability of all controls

function setStatusOfflineBlocking()
// Shows blocking error message with instructions
```

---

## Configuration

### Health Check Endpoint
```
GET http://localhost:8000/health
```

### Check Frequency
- **Background**: Every 10 seconds
- **Popup**: Every 5 seconds (on refresh)
- **Content Script**: On page load

### Timeout
- 3000ms (3 seconds) for each health check

---

## Important Notes

⚠️ **The extension cannot be used without the backend running.**

This is now **enforced at multiple levels:**
1. **Service Worker** - Blocks all API requests if backend offline
2. **Popup UI** - Disables all controls if backend offline
3. **Content Script** - Stops analysis if backend not available
4. **User Feedback** - Clear messages explain requirements

✅ **Benefits:**
- No confusing error messages mid-analysis
- User knows immediately if backend is required
- Clear instructions on how to fix the issue
- Extension won't attempt operations that will fail

---

## Comparison Table

| Feature | Before | After |
|---------|--------|-------|
| **Load without backend** | ✅ Works | ✅ Works |
| **Use popup without backend** | ⚠️ Limited | ❌ Blocked |
| **Change settings without backend** | ✅ Works | ❌ Blocked |
| **Analyze email without backend** | ⚠️ Shows error | ❌ Blocked |
| **User knows why** | ⚠️ After trying | ✅ Before trying |
| **Clear instructions** | ❌ Generic message | ✅ Command to run |
| **Disabled UI feedback** | ❌ Still clickable | ✅ Grayed out |

---

## Migration Path

To re-enable graceful degradation in the future, you would need to:

1. Remove `if (!backendConnected)` checks from background.js
2. Remove `if (!backendConnected)` check from content.js analyzeCurrentEmail()
3. Remove `disableUI()` calls from popup.js
4. Uncomment/restore graceful error handling code
5. Restore "Unable to analyze" error banners for emails

---

**Updated**: February 16, 2026  
**Status**: ✅ Complete - Extension now requires backend  
**Testing**: Ready for verification
