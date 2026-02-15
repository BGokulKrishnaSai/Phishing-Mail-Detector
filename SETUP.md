# 🛡️ Phishing Email Detector - Complete Setup Guide

Step-by-step instructions to set up and run the system locally.

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Windows 10/11, macOS, or Linux
- [ ] Python 3.8 or higher ([Download](https://www.python.org/downloads/))
- [ ] Google Chrome browser ([Download](https://www.google.com/chrome/))
- [ ] Gmail account
- [ ] Text editor or VS Code

**Verify Python installation:**
```powershell
python --version
pip --version
```

Should show Python 3.8+ and pip version

---

## Part 1️⃣: Backend Setup (5-10 minutes)

### Step 1.1: Open Terminal/PowerShell

**Windows:**
- Right-click on folder `c:\Users\praha\jarvis`
- Select "Open in Terminal" or "Open PowerShell here"

**macOS/Linux:**
```bash
cd ~/jarvis
```

### Step 1.2: Navigate to Backend

```powershell
cd backend
```

Verify you see files: `app.py`, `train_models.py`, `requirements.txt`

### Step 1.3: Install Dependencies

```powershell
pip install -r requirements.txt
```

**What this does:**
- Installs FastAPI (web framework)
- Installs scikit-learn (ML library)
- Installs additional required packages

**Expected output:**
```
Successfully installed fastapi-0.104.1 uvicorn-0.24.0 scikit-learn-1.3.2 ...
```

### Step 1.4: Train Machine Learning Models

```powershell
python train_models.py
```

⏱️ **This takes 30-60 seconds on first run**

**Expected output:**
```
[*] Phishing Detection Model Training Pipeline
[*] Preparing Email Dataset...
[*] Training Email Text Classifier (TF-IDF + Logistic Regression)...
  Email Model Accuracy: 100.00%
[*] Training URL Risk Classifier (Random Forest)...
  URL Model Accuracy: 100.00%
[✓] All models trained and saved to 'models/' directory

Model Files Created:
  - models/email_model.pkl
  - models/tfidf_vectorizer.pkl
  - models/url_model.pkl
  - models/url_feature_names.pkl
```

**Verify:** You should now see a `models/` folder with 4 .pkl files

### Step 1.5: Start the FastAPI Server

```powershell
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

⏱️ **Wait 5-10 seconds for startup**

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started server process [12345]
INFO:     Application startup complete

==================================================
🔒 Phishing Email Detector API
==================================================
✓ Models loaded
✓ API ready on http://localhost:8000
✓ Docs available at http://localhost:8000/docs
==================================================
```

### Step 1.6: Test the Backend

**Open a new terminal** (keep the server running in the first one)

```powershell
# Test health endpoint
curl http://localhost:8000/health
```

Should return:
```json
{"status":"healthy","service":"Phishing Email Detector"}
```

**Or open in browser:** `http://localhost:8000/health`

### Step 1.7: View API Documentation

Open browser to: **http://localhost:8000/docs**

You'll see an interactive API explorer where you can test endpoints

---

## Part 2️⃣: Chrome Extension Setup (10 minutes)

### Step 2.1: Open Chrome Extensions Page

1. Click the menu (⋮) in top-right corner of Chrome
2. Go to **Settings** → **Extensions** → **Manage extensions**

Or go directly to: `chrome://extensions/`

### Step 2.2: Enable Developer Mode

In the top-right corner, toggle **"Developer mode"** to ON

### Step 2.3: Load the Extension

1. Click **"Load unpacked"** button
2. Navigate to: `c:\Users\praha\jarvis\extension`
3. Select the `extension` folder
4. Click **Select folder**

**What you should see:**
- Extension card appears with "Phishing Email Detector"
- It shows ID, version, and status

### Step 2.4: Verify Extension is Working

1. Click the extension icon in Chrome toolbar (top-right)
2. A popup should appear with:
   - Title: "Phishing Detector"
   - API Connection Status
   - Settings panel

### Step 2.5: Configure Extension Settings

In the popup:

1. **Check API Endpoint:**
   - Should be: `http://localhost:8000/analyze_email`
   - If not, update it manually

2. **Test Connection:**
   - Click **"Test Connection"** button
   - Should see: ✓ Connection successful!
   - Status indicator turns green

3. **Enable Auto-analyze:**
   - Toggle is already ON (blue)
   - This automatically analyzes emails when opened

4. **Save Settings:**
   - Settings are auto-saved
   - Should see confirmation message

---

## Part 3️⃣: Test with Gmail (5 minutes)

### Step 3.1: Open Gmail

1. Go to: `https://mail.google.com`
2. Log in if needed
3. Open your inbox

### Step 3.2: Select Any Email

Click on any email to open it (read a full conversation view)

### Step 3.3: Watch Extension Analyze

**You should see:**

1. **Loading banner:** "🔍 Analyzing email for phishing threats..."
2. **Analysis banner appears** with:
   - Trust score percentage
   - Risk level (Safe/Suspicious/Risky/Dangerous)
   - Number of links analyzed

3. **Link badges:** Each link gets a colored badge
   - 🟢 Green = Safe
   - 🟡 Yellow = Suspicious
   - 🟠 Orange = Risky
   - 🔴 Red = Dangerous

### Step 3.4: Try Different Emails

- **Trusted company email:** Should show high trust (80%+)
- **With links:** Link badges appear next to each link
- **Multiple links:** All links are analyzed

---

## Troubleshooting Guide

### ❌ "Backend offline" in extension popup

**Problem:** Extension can't connect to API

**Solutions:**
1. Check if backend terminal is still running
2. Verify no errors in backend terminal
3. Test in browser: `http://localhost:8000/health`
4. Try restarting the server

```powershell
# In backend terminal, press Ctrl+C to stop
# Then start again:
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### ❌ Models not found error

**Problem:** Backend says models are missing

**Solutions:**
```powershell
# Make sure you're in backend directory
cd backend

# Ran train_models.py
python train_models.py

# Verify models folder exists
dir models
```

### ❌ Extension not showing overlay on Gmail

**Problem:** No trust score banner appears

**Solutions:**
1. Check if email is fully loaded (not still loading)
2. Open F12 developer console
3. Check for errors in console
4. Reload extension: Go to `chrome://extensions/`, click reload icon

```javascript
# In console, type to manually test:
chrome.runtime.sendMessage({action: 'getSettings'}, console.log)
```

### ❌ Extension icon showing error state

**Problem:** Extension icon has red indicator

**Solutions:**
1. Click extension icon to open popup
2. Click "Test Connection" button
3. Ensure API endpoint is correct
4. Check backend is running and listening on port 8000

---

## Quick Reference

### Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open DevTools | F12 or Ctrl+Shift+I |
| Reload Chrome | Ctrl+R |
| Reload Extension | F5 in `chrome://extensions/` |
| Stop Backend | Ctrl+C in terminal |

### Important URLs

| Purpose | URL |
|---------|-----|
| Gmail | https://mail.google.com |
| API Health | http://localhost:8000/health |
| API Docs | http://localhost:8000/docs |
| Extensions Page | chrome://extensions/ |

### Default Settings

| Setting | Default Value |
|---------|--------|
| API Endpoint | http://localhost:8000/analyze_email |
| Auto-analyze | ON |
| Show Notifications | ON |
| Backend Port | 8000 |

---

## Next Steps

Once everything is working:

### 1. **Test with Real Emails**
   - Try with different email types
   - Note which are detected as phishing
   - Compare with your own judgment

### 2. **Improve the Model**
   - Collect more phishing emails
   - Add them to training data
   - Retrain: `python train_models.py`

### 3. **Deploy to Production**
   - See `DEPLOYMENT_GUIDE.md`
   - Deploy backend to Render/AWS/Heroku
   - Update extension endpoint
   - Publish to Chrome Web Store

### 4. **Advanced Customization**
   - Integrate with VirusTotal API
   - Add custom phishing indicators
   - Modify risk thresholds
   - Add database for tracking

---

## Performance Optimizations

### If Backend Feels Slow:

1. **Reduce model complexity:**
   - Edit `train_models.py`
   - Use smaller TF-IDF max_features
   - Reduce RandomForest n_estimators

2. **Enable caching:**
   - Extension caches results locally
   - Same email won't re-analyze

3. **Increase timeout:**
   - Edit `extension/scripts/content.js`
   - Increase CONFIG.TIMEOUT value

### If Extension Feels Slow:

1. Disable auto-analyze in settings
2. Only click "Test Connection" when needed
3. Check Chrome Task Manager (Shift+Esc) for memory usage

---

## Security Notes

⚠️ **Local Development Only:**
- Uses HTTP instead of HTTPS
- No API authentication
- Suitable only for local testing

✅ **For Production:**
- See `DEPLOYMENT_GUIDE.md`
- Must use HTTPS with valid certificate
- Must implement API key authentication
- Must secure with proper CORS policies

---

## Support & Debugging

### Enable Debug Logging

**In extension console (F12):**
```javascript
localStorage.setItem('phishing_detector_debug', 'true')
```

### Check Logs

1. Open Gmail
2. Press F12 (DevTools)
3. Click Console tab
4. Open email to see [PhishingDetector] logs

### Export Analysis Results

```javascript
// In Gmail page console
let data = {
  sender: 'test@example.com',
  subject: 'Test',
  bodyText: 'Test email'
};
fetch('http://localhost:8000/analyze_email', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(data)
}).then(r => r.json()).then(console.log)
```

---

## Useful Commands Reference

```powershell
# Check Python version
python --version

# List installed packages
pip list

# Start backend (from backend folder)
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Test API with curl (from any folder)
curl http://localhost:8000/health

# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process on port 8000 (Windows)
taskkill /PID <PID> /F

# Stop running backend
# Press Ctrl+C in the terminal running the server
```

---

## FAQ

**Q: Can I use this with other email providers?**
A: Currently optimized for Gmail. Other providers require code changes to extractors.

**Q: Will my emails be sent to any server?**
A: No, everything runs locally. Emails never leave your computer.

**Q: Can multiple users use the same backend?**
A: Yes, deploy on a server and update the API endpoint in each extension.

**Q: How do I update the models?**
A: Edit `train_models.py`, add more training data, and run it again to retrain.

**Q: Is this legal?**
A: Yes, for personal security purposes. Always get proper licenses for enterprise use.

---

## Congratulations! 🎉

You now have a working phishing email detector!

**Next time you start:**
1. Run `python -m uvicorn app:app --reload` in backend folder
2. Extension automatically loads in Chrome
3. Open Gmail and emails are analyzed in real-time

Happy detecting! 🛡️
