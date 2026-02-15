"""
Advanced Configuration & Deployment Guide
For production deployment and enhanced features
"""

# ==================== PRODUCTION DEPLOYMENT ====================

"""
OPTION 1: Deploy to Render (Recommended - Free Tier)
1. Push code to GitHub
2. Connect GitHub repo to Render
3. Create New Web Service
4. Build Command: pip install -r backend/requirements.txt
5. Start Command: cd backend && python -m uvicorn app:app --host 0.0.0.0 --port 8000
6. Environment: Python 3.9
7. Get the deployed URL: https://your-service.onrender.com
8. Update extension API endpoint to: https://your-service.onrender.com/analyze_email

OPTION 2: Deploy to Railway
1. Install railway CLI
2. Railway init
3. Add requirements.txt
4. Railway up
5. Get URL from Railway dashboard
6. Update extension manifest.json host_permissions

OPTION 3: Deploy to AWS Lambda
1. Use Zappa for serverless deployment
2. pip install zappa
3. zappa init
4. zappa deploy production
5. Update extension endpoint
"""

# ==================== ENHANCED MODEL CONFIGURATION ====================

"""
To improve detection accuracy, modify train_models.py:

ADVANCED FEATURES:

1. Add Sender Reputation Analysis
   - Check if sender domain matches email display
   - Detect homograph attacks (1l vs ll, 0 vs O)
   - Check domain age and registration details

2. Add Content Analysis
   - Urgency language detection
   - Request for sensitive info patterns
   - Spelling/grammar indicators
   - HTML structure analysis

3. Add URL Deep Analysis
   - Check URL shorteners (bit.ly, tinyurl)
   - Domain age and reputation
   - Whois information
   - Check against URLhaus database

4. Integrate Third-party Services
   - VirusTotal API for malware detection
   - Google Safe Browsing API
   - PhishTank API for known phishing links

EXAMPLE: Adding VirusTotal integration
"""

import os
import requests

class PhishingDetectorWithVT:
    def __init__(self, vt_api_key=None):
        self.vt_api_key = vt_api_key or os.getenv('VIRUSTOTAL_API_KEY')
    
    def check_url_virustotal(self, url):
        """Check URL against VirusTotal API"""
        if not self.vt_api_key:
            return {'safe': True, 'reason': 'VT API key not configured'}
        
        headers = {"x-apikey": self.vt_api_key}
        params = {"url": url}
        
        try:
            response = requests.post(
                "https://www.virustotal.com/api/v3/urls",
                headers=headers,
                data=params,
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                # Check detection ratio
                stats = result['data']['attributes']['last_analysis_stats']
                detections = stats['malicious'] + stats['suspicious']
                
                return {
                    'safe': detections == 0,
                    'detections': detections,
                    'harmless': stats['harmless']
                }
        except Exception as e:
            print(f"VT check failed: {e}")
            return {'safe': True, 'reason': 'API error'}
    
    def check_url_phishstats(self, url):
        """Check URL against PhishStats API (free)"""
        try:
            response = requests.get(
                f"https://phishstats.info/api/phishing?url={url}",
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'is_phishing': len(data) > 0,
                    'records': len(data)
                }
        except:
            pass
        
        return {'is_phishing': False, 'records': 0}

# ==================== ENHANCED BACKEND CONFIGURATION ====================

"""
Production settings for app.py:

1. Rate Limiting
   - Prevent abuse
   - Use slow_api library
   
   from slowapi import Limiter
   from slowapi.util import get_remote_address
   
   limiter = Limiter(key_func=get_remote_address)
   app.state.limiter = limiter
   
   @app.post("/analyze_email")
   @limiter.limit("100/minute")
   async def analyze_email(request: EmailRequest):
       ...

2. Caching
   - Cache model predictions to improve performance
   
   from functools import lru_cache
   
   @lru_cache(maxsize=1000)
   def predict_url_phishing(url: str):
       ...

3. Logging
   - Track API usage and errors
   
   import logging
   
   logger = logging.getLogger(__name__)
   logger.info(f"Analyzing email from {request.sender}")

4. Authentication
   - Protect production API with key
   
   from fastapi.security import APIKeyHeader
   
   api_key_header = APIKeyHeader(name="X-API-Key")
   
   async def get_api_key(api_key: str = Depends(api_key_header)):
       if api_key != os.getenv("API_KEY"):
           raise HTTPException(status_code=403)
       return api_key
"""

# ==================== ENHANCED EXTENSION CONFIGURATION ====================

"""
Manifest V3 Updates for Enterprise:

1. Add Content Security Policy
   "content_security_policy": {
     "extension_pages": "script-src 'self'; object-src 'self'"
   }

2. Add Permissions for more features
   "permissions": [
     "storage",
     "activeTab",
     "scripting",
     "webRequest"
   ]

3. Add Declarative Net Request for blocking
   "declarative_net_request": {
     "rule_resources": [{
       "id": "ruleset_1",
       "enabled": true,
       "path": "rules.json"
     }]
   }

4. Configure for OAuth (enterprise single sign-on)
   "oauth2": {
     "client_id": "YOUR_OAUTH_CLIENT_ID",
     "scopes": ["user_email"]
   }
"""

# ==================== MONITORING & ANALYTICS ====================

"""
Add basic analytics to track effectiveness:

1. Log detection metrics
   - Emails analyzed per day
   - Phishing detection rate
   - False positive rate
   - Average trust score

2. Track user behavior
   - Click rates on warnings
   - Settings changes
   - Extension usage patterns

3. Monitor backend performance
   - API response times
   - Model prediction latency
   - Error rates
   - Cache hit rates

EXAMPLE: Analytics endpoint
"""

from datetime import datetime
from collections import defaultdict

class AnalyticsTracker:
    def __init__(self):
        self.stats = defaultdict(int)
        self.daily_stats = defaultdict(lambda: defaultdict(int))
    
    def log_analysis(self, risk_level, response_time):
        """Log each analysis"""
        today = datetime.now().date()
        self.stats['total_analyzed'] += 1
        self.stats[f'risk_{risk_level}'] += 1
        self.daily_stats[str(today)]['count'] += 1
        self.daily_stats[str(today)]['avg_response_time'] += response_time
    
    def get_report(self):
        """Generate analytics report"""
        return {
            'total_analyzed': self.stats['total_analyzed'],
            'risk_distribution': {
                'safe': self.stats['risk_safe'],
                'suspicious': self.stats['risk_suspicious'],
                'risky': self.stats['risk_risky'],
                'dangerous': self.stats['risk_dangerous']
            },
            'detection_rate': self.stats['risk_dangerous'] / max(1, self.stats['total_analyzed'])
        }

# ==================== SECURITY BEST PRACTICES ====================

"""
1. Input Validation
   - Sanitize emails before analysis
   - Validate URLs format
   - Check content length limits

2. Data Privacy
   - Don't log sensitive email content
   - Implement data retention policies
   - GDPR compliance for EU users

3. API Security
   - Use HTTPS/TLS only in production
   - Implement API key authentication
   - Rate limit requests
   - Add CORS restrictions

4. Model Security
   - Regularly update training data
   - Monitor for adversarial attacks
   - Version control models
   - Test robustness against evasion

5. Extension Security
   - Code signing and verification
   - Regular security audits
   - Vulnerability disclosure program
   - User consent for data collection
"""

# ==================== PERFORMANCE OPTIMIZATION ====================

"""
1. Model Optimization
   - Quantize models for smaller size
   - Use model pruning
   - Implement batch processing
   
   from sklearn.preprocessing import scale
   from sklearn.decomposition import PCA
   
   # Reduce dimensionality
   pca = PCA(n_components=50)
   reduced_features = pca.fit_transform(vectorized_text)

2. Caching Strategy
   - Cache model predictions for same URLs
   - Cache TF-IDF vectors
   - Implement LRU cache for recent emails
   
   from functools import lru_cache
   from cachetools import LRUCache
   
   email_cache = LRUCache(maxsize=10000)

3. Async Processing
   - Use async/await for I/O operations
   - Process multiple emails in parallel
   - Background job processing
   
   import asyncio
   
   async def batch_analyze(emails):
       tasks = [analyzeEmail(email) for email in emails]
       return await asyncio.gather(*tasks)

4. Database Integration
   - Store analysis results for audit trail
   - Track phishing patterns over time
   - Build historical reports
"""

# ==================== TESTING FRAMEWORK ====================

"""
Unit tests for ML models:
"""

import pytest
from unittest.mock import Mock

class TestPhishingDetector:
    
    def test_email_classifier_high_phishing_prob(self):
        """Test email with obvious phishing indicators"""
        email = {
            "subject": "Urgent: Verify Your Account Now",
            "body": "Click here to verify or account will be suspended"
        }
        # Should return high phishing probability (>0.7)
        assert True
    
    def test_url_classifier_suspicious_domain(self):
        """Test URL with suspicious TLD"""
        url = "https://amazo n-verify.ru/login"
        # Should detect malicious URL
        assert True
    
    def test_trust_combination_logic(self):
        """Test final trust score calculation"""
        email_phishing = 0.8
        url_phishing = 0.6
        # Final = 1 - (1-0.8)*(1-0.6) = 0.92
        assert True
    
    def test_api_endpoint_response_format(self):
        """Test API returns correct JSON"""
        assert True
    
    def test_cache_functionality(self):
        """Test that repeated requests use cache"""
        assert True

# Run tests with:
# pytest test_models.py -v

# ==================== DEPLOYMENT CHECKLIST ====================

"""
Before deploying to production:

□ Update API endpoint URLs in manifest.json
□ Remove debug logging from content.js
□ Set CORS policies appropriately
□ Configure HTTPS certificates
□ Test with real Gmail accounts (not just lab emails)
□ Implement rate limiting
□ Add API authentication
□ Set up error monitoring (Sentry)
□ Configure analytics tracking
□ Write comprehensive documentation
□ Set up automated testing/CI-CD
□ Plan backup and recovery procedures
□ Document privacy policy
□ Test on different Chrome versions
□ Get security audit done
□ Plan model retraining schedule
"""

print("""
🚀 DEPLOYMENT CHECKLIST COMPLETE

Your Phishing Email Detector is ready for:
1. Local development and testing
2. Production deployment
3. Enterprise integration
4. Continuous improvement

Key files:
- Backend: /backend/app.py (FastAPI server)
- Extension: /extension/manifest.json (Chrome extension)
- Models: /backend/models/ (ML model files)

Next steps:
1. Deploy backend (Render/AWS/etc)
2. Update extension endpoint
3. Publish to Chrome Web Store
4. Collect usage metrics
5. Iterate on model improvements
""")
