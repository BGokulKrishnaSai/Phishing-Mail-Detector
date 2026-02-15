# 🚀 Quick Reference Card

## ⚡ Quick Start Commands

### Windows (PowerShell)
```powershell
# Option 1: Use the script
.\start.bat

# Option 2: Manual
cd backend
pip install -r requirements.txt
python train_models.py
python -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### macOS/Linux
```bash
chmod +x start.sh
./start.sh

# Or manual:
cd backend
pip3 install -r requirements.txt
python3 train_models.py
python3 -m uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

---

## 📋 Checklist

### Backend Setup
- [ ] Python 3.8+ installed (`python --version`)
- [ ] Navigate to backend folder (`cd backend`)
- [ ] Install dependencies (`pip install -r requirements.txt`)
- [ ] Train models (`python train_models.py`)
- [ ] Verify models folder created with 4 .pkl files
- [ ] Start server (`python -m uvicorn app:app --reload`)
- [ ] Test API (`curl http://localhost:8000/health`)

### Extension Setup
- [ ] Open Chrome extensions page (`chrome://extensions/`)
- [ ] Enable Developer Mode (top-right toggle)
- [ ] Click "Load unpacked"
- [ ] Navigate to `extension` folder and select it
- [ ] Verify extension appears in toolbar
- [ ] Click extension icon and verify API status
- [ ] Test connection in settings popup

### Testing
- [ ] Open Gmail (`https://mail.google.com`)
- [ ] Open any email
- [ ] Wait 2-3 seconds for analysis
- [ ] Verify trust score banner appears
- [ ] Check link badges on URLs
- [ ] Try different emails (trusted sender vs suspicious)

---

## 🛠️ Key Files & Locations

| File | Purpose | Lines |
|------|---------|-------|
| `backend/app.py` | FastAPI server | 320 |
| `backend/train_models.py` | ML training | 280 |
| `extension/manifest.json` | Extension config | 58 |
| `extension/scripts/content.js` | Gmail integration | 450 |
| `extension/popup/popup.html` | Settings UI | 150 |
| `extension/styles/overlay.css` | Styling | 80 |

---

## 🌐 Important URLs

| Service | URL |
|---------|-----|
| Local API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |
| Gmail | https://mail.google.com |
| Chrome Extensions | chrome://extensions/ |

---

## 📊 API Test Examples

### Test Email Analysis
```powershell
# Simple test
$body = @{
    sender = "test@example.com"
    subject = "Verify account"
    bodyText = "Click to verify immediately"
    links = @(@{href = "https://fake.ru"; text = "verify"})
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8000/analyze_email" `
  -Method POST `
  -Body $body `
  -ContentType "application/json"
```

### Test Health
```powershell
Invoke-WebRequest -Uri "http://localhost:8000/health"
```

---

## 🎨 Trust Score Color Guide

| Score | Color | Icon | Meaning |
|-------|-------|------|---------|
| 80-100% | 🟢 Green | ✓ | Safe email |
| 50-79% | 🟡 Yellow | ⚠ | Suspicious |
| 20-49% | 🟠 Orange | ⚠ | Risky |
| 0-19% | 🔴 Red | ✕ | Dangerous |

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Backend offline" | Start server: `uvicorn app:app --reload` |
| "Models not found" | Run: `python train_models.py` |
| Port 8000 in use | Kill process: `taskkill /PID <PID> /F` |
| Extension not loading | Reload: F5 on `chrome://extensions/` |
| No analysis appearing | Wait 3 seconds after opening email |
| API timeout errors | Increase CONFIG.TIMEOUT in content.js |

---

## 📚 Documentation Map

```
jarvis/
├── README.md ..................... Main features & architecture
├── SETUP.md ...................... Step-by-step setup guide
├── DEPLOYMENT_GUIDE.md ........... Production deployment
├── PROJECT_SUMMARY.md ........... Complete overview
└── QUICK_REFERENCE.md ........... This file
```

---

## 🔧 Common Customizations

### Change Detection Threshold
Edit `backend/app.py`, function `get_risk_level()`:
```python
if trust_percent >= 85:  # was 80
    return "safe"
```

### Change API Port
```bash
python -m uvicorn app:app --port 8001
```

### Change API Endpoint in Extension
1. Click extension icon
2. Update "API Endpoint" field
3. Click "Test Connection"
4. Click "Save Settings"

### Add Training Data
Edit `backend/train_models.py`, update:
```python
PHISHING_EMAILS = [ ... ]
LEGITIMATE_EMAILS = [ ... ]
```
Then run: `python train_models.py`

---

## 💻 System Requirements

| Component | Requirement |
|-----------|-------------|
| OS | Windows/macOS/Linux |
| Python | 3.8+ |
| Chrome | Latest version |
| RAM | 500MB minimum |
| Disk | 100MB for models |
| Network | Local only (default) |

---

## 🎯 Testing Scenarios

### Scenario 1: Legitimate Email
```
From: support@amazon.com
Subject: Your package has shipped
Body: Track it here
Expected: 90%+ trust ✓
```

### Scenario 2: Phishing Email
```
From: noreply@amaz0n.ru
Subject: URGENT - Verify account NOW
Body: Click to verify or suspended
Expected: <20% trust ✓
```

### Scenario 3: Suspicious URL
```
Email with link to: https://verify-account.tk
Expected: Red badge on link ✓
```

---

## 📈 Performance Notes

- Email analysis: ~5ms
- URL analysis: ~2ms per URL
- Total response: usually <100ms
- Memory usage: ~100MB
- Model size: ~5MB total

---

## 🔐 Security Checklist

**Local Development (Current):**
- ✓ HTTP endpoint (localhost only)
- ✓ CORS allows all origins
- ✓ No authentication required
- ✓ Debug logs enabled

**For Production:**
- Do HTTPS/TLS setup
- Add API key authentication
- Restrict CORS origins
- Remove debug logging
- Rate limit requests
- See DEPLOYMENT_GUIDE.md

---

## 📞 Support Resources

- **API Documentation:** `http://localhost:8000/docs`
- **Chrome DevTools:** Press F12
- **Backend Logs:** Terminal running uvicorn
- **Extension Logs:** F12 → Console tab on Gmail page

---

## ✅ Final Checklist

Before declaring completion:

### Backend
- [ ] Models trained (models/ folder has 4 files)
- [ ] Server starts without errors
- [ ] API responds to requests
- [ ] /docs endpoint works

### Extension
- [ ] Loads in Chrome without errors
- [ ] Can be toggled on/off
- [ ] Settings page works
- [ ] Connection test passes

### Integration
- [ ] Analyzes Gmail emails
- [ ] Shows trust score banner
- [ ] Highlights links with badges
- [ ] Colors match risk levels

### Documentation
- [ ] README.md read and understood
- [ ] SETUP.md completed
- [ ] All files found in correct locations
- [ ] Commands tested and working

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✓ `python train_models.py` creates models/ folder
2. ✓ API starts and shows "Models loaded"
3. ✓ Extension popup shows "Connected" status
4. ✓ Opening Gmail email shows analysis within 2-3 seconds
5. ✓ Trust score banner appears with color and percentage
6. ✓ Links get colored risk badges
7. ✓ Different emails show different trust scores

---

## 🚀 Next Phase Options

After setup works:

1. **Improve Models**
   - Collect real phishing emails
   - Add to training data
   - Retrain models

2. **Deploy to Production**
   - Push to GitHub
   - Deploy on Render/Railway/AWS
   - Update extension endpoint
   - Publish to Chrome Web Store

3. **Add Features**
   - Email header analysis
   - VirusTotal integration
   - Historical tracking
   - User feedback loop

4. **Advanced ML**
   - BERT embeddings
   - Deep learning models
   - Transformer networks
   - Ensemble methods

---

## 📝 Version Info

| Component | Version |
|-----------|---------|
| FastAPI | 0.104.1 |
| Python | 3.8+ |
| Chrome | Latest |
| Manifest | V3 |
| scikit-learn | 1.3.2 |

---

## 🤝 Contributing

To improve the project:

1. Test with more email types
2. Collect phishing examples
3. Suggest feature improvements
4. Test on different systems
5. Optimize performance
6. Improve documentation

---

**You're all set! Happy detecting! 🛡️**

For detailed info, see README.md and SETUP.md.
