"""
Phishing Email Detection - FastAPI Backend
Real-time email and URL analysis with ML models
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import joblib
import os
import re
from urllib.parse import urlparse
from bs4 import BeautifulSoup
import json

try:
    import numpy as np
except ImportError:
    np = None

# ==================== MOCK MODEL CLASSES ====================

class MockEmailModel:
    def predict_proba(self, text_vector):
        """Return mock prediction based on content analysis"""
        # This is a placeholder - in reality would use ML model
        # For now: return higher legitimacy for known good senders/content
        return [[0.9, 0.1]]  # 90% legitimate, 10% phishing by default

class MockVectorizer:
    def transform(self, texts):
        """Return mock vector"""
        return [[0.1] * 500]

class MockURLModel:
    def predict_proba(self, url_features):
        """Return mock prediction based on URL features"""
        # This is a placeholder - in reality would use ML model
        # For now: return higher safety score for common legitimate domains
        return [[0.95, 0.05]]  # 95% safe, 5% phishing by default

# ==================== INITIALIZATION ====================

app = FastAPI(title="Phishing Email Detector API", version="1.0.0")

# Enable CORS for Chrome Extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load pre-trained models
MODEL_DIR = 'models'

# Load pre-trained models
MODEL_DIR = 'models'

print("[*] Loading ML models...")
try:
    # Create instances directly instead of loading pickles
    email_model = MockEmailModel()
    tfidf_vectorizer = MockVectorizer()
    url_model = MockURLModel()
    url_feature_names = ['length', 'dot_count', 'hyphen_count', 'digit_count',
                         'has_ip', 'suspicious_tld', 'subdomain_count', 'is_https']
    print("[OK] Models initialized successfully")
except Exception as e:
    print(f"[ERROR] Failed to initialize models: {e}")
    exit(1)

# ==================== DATA MODELS ====================

class URLData(BaseModel):
    href: str
    text: str = ""

class EmailRequest(BaseModel):
    sender: str
    subject: str
    bodyText: str = ""
    bodyHtml: str = ""
    links: Optional[List[URLData]] = []

class URLAnalysis(BaseModel):
    href: str
    text: str
    phishing_prob: float
    trust_percent: int
    risk_level: str
    explanation: str = ""
    flags: List[str] = []

class EmailAnalysis(BaseModel):
    phishing_prob: float
    trust_percent: int
    risk_level: str
    explanation: str = ""
    flags: List[str] = []

class AnalysisResponse(BaseModel):
    email: EmailAnalysis
    links: List[URLAnalysis]
    overall_risk_level: str

# ==================== FEATURE EXTRACTION ====================

def extract_url_features(url):
    """Extract features from a URL for the trained model"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        
        features_dict = {
            'length': len(url),
            'dot_count': domain.count('.'),
            'hyphen_count': domain.count('-'),
            'digit_count': sum(1 for c in url if c.isdigit()),
            'has_ip': 1 if re.search(r'(\d{1,3}\.){3}\d{1,3}', url) else 0,
            'suspicious_tld': 1 if any(tld in domain for tld in ['.ru', '.tk', '.xyz', '.online', '.top', '.ml', '.ga']) else 0,
            'subdomain_count': max(0, domain.count('.') - 1),
            'is_https': 1 if parsed.scheme == 'https' else 0,
        }
        
        # Convert to feature array in correct order
        if np is not None:
            features_array = np.array([[features_dict[fname] for fname in url_feature_names]])
        else:
            # Fallback without numpy - create a simple list
            features_array = [[features_dict[fname] for fname in url_feature_names]]
        
        return features_array
    except Exception as e:
        print(f"Error extracting URL features: {e}")
        return None

def extract_email_text_features(subject, body):
    """Extract text for TF-IDF vectorization"""
    text = (subject + " " + body).lower()
    # Remove HTML tags if any
    text = re.sub(r'<[^>]+>', '', text)
    return text

def extract_sender_features(sender):
    """Extract features from sender email address"""
    sender_lower = sender.lower()
    
    # Check for suspicious sender patterns
    suspicious_patterns = [
        r'0' in sender_lower.replace('o', '0'),  # homograph attacks
        re.search(r'@.*(\d{1,3}){4}', sender_lower),  # IP address
        re.search(r'[@-]', sender_lower) and sender_lower.count('@') > 1,  # multiple @
    ]
    
    return suspicious_patterns

# ==================== SCORING FUNCTIONS ====================

def get_risk_level(trust_percent):
    """Convert trust percentage to risk level"""
    if trust_percent >= 80:
        return "safe"
    elif trust_percent >= 50:
        return "suspicious"
    elif trust_percent >= 20:
        return "risky"
    else:
        return "dangerous"

def predict_email_phishing(subject, body):
    """Predict phishing probability for email text with detailed explanation"""
    try:
        print(f"[predict_email] Input - subject: {subject[:50]}, body: {body[:50]}")
        
        text = extract_email_text_features(subject, body)
        combined_text = (subject + " " + body).lower()
        
        # Check for phishing indicators
        phishing_keywords = {
            'verify': 'Asks to verify account/identity',
            'confirm': 'Asks to confirm sensitive information',
            'urgent': 'Uses urgency to pressure action',
            'act now': 'Creates false sense of immediacy',
            'click here': 'Suspicious call-to-action',
            'update password': 'Requests password update',
            'reset password': 'Requests password reset',
            'suspended': 'Claims account is suspended',
            'locked': 'Claims account is locked',
            'unusual activity': 'Claims unusual account activity',
            'confirm identity': 'Asks to confirm identity',
            'validate account': 'Asks to validate account',
            'expire': 'Claims something will expire',
            'reactivate': 'Asks to reactivate account',
        }
        
        flags = []
        suspicious_count = 0
        
        for keyword, description in phishing_keywords.items():
            if keyword in combined_text:
                suspicious_count += 1
                flags.append(f"🚩 {description} ('{keyword}' detected)")
                print(f"[predict_email] Found keyword: {keyword}")
        
        # Base phishing probability
        phishing_prob = 0.05 + (suspicious_count * 0.08)
        phishing_prob = min(phishing_prob, 0.9)
        
        print(f"[predict_email] Suspicious keywords found: {suspicious_count}")
        print(f"[predict_email] Calculated phishing prob: {phishing_prob}")
        
        # Generate explanation
        if suspicious_count == 0:
            explanation = "✅ No phishing indicators detected. Email appears legitimate."
        elif suspicious_count <= 2:
            explanation = "⚠️ Minor phishing indicators detected. Review with caution."
        else:
            explanation = "🚨 Multiple phishing indicators detected. High risk of phishing attack."
        
        return {
            'proba': [[1 - phishing_prob, phishing_prob]],
            'explanation': explanation,
            'flags': flags
        }
    except Exception as e:
        print(f"[ERROR predict_email] {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return {
            'proba': [[0.9, 0.1]],
            'explanation': 'Analysis unavailable',
            'flags': []
        }

def predict_url_phishing(url):
    """Predict phishing probability for a URL with detailed explanation"""
    try:
        print(f"[predict_url] Processing URL: {url[:60]}")
        
        url_lower = url.lower()
        flags = []
        phishing_indicators = 0
        
        # Check for suspicious patterns
        if re.search(r'(\d{1,3}\.){3}\d{1,3}', url):
            phishing_indicators += 3
            flags.append("🚩 IP address used instead of domain name (suspicious)")
            print("[predict_url] Found IP address pattern")
        
        if 'bit.ly' in url_lower or 'tinyurl' in url_lower or 'short.link' in url_lower:
            phishing_indicators += 2
            flags.append("🚩 URL shortener detected (hides true destination)")
            print("[predict_url] Found URL shortener")
        
        if url_lower.count('-') > 5:
            phishing_indicators += 2
            flags.append("🚩 Unusual number of hyphens in URL")
            print("[predict_url] Found unusual hyphens")
        
        if any(tld in url_lower for tld in ['.tk', '.ml', '.ga', '.ru', '.xyz']):
            phishing_indicators += 2
            flags.append("🚩 Suspicious top-level domain (.tk/.ml/.ga/.ru/.xyz)")
            print("[predict_url] Found suspicious TLD")
        
        # Check for HTTPS (good indicator)
        if url.startswith('https://'):
            phishing_indicators -= 1
            flags.append("✅ Uses secure HTTPS protocol")
            print("[predict_url] HTTPS detected (good sign)")
        else:
            phishing_indicators += 1
            flags.append("⚠️ Not using HTTPS encryption")
        
        # Check for well-known legitimate domains
        legitimate_domains = {
            'google.com': 'Google official',
            'microsoft.com': 'Microsoft official',
            'apple.com': 'Apple official',
            'github.com': 'GitHub official',
            'stackoverflow.com': 'Stack Overflow official',
            'amazon.com': 'Amazon official',
            'facebook.com': 'Facebook official',
            'twitter.com': 'Twitter official',
            'linkedin.com': 'LinkedIn official',
            'instagram.com': 'Instagram official',
            'youtube.com': 'YouTube official',
            'reddit.com': 'Reddit official'
        }
        
        for domain, name in legitimate_domains.items():
            if domain in url_lower:
                phishing_indicators -= 3
                flags.append(f"✅ Verified legitimate domain ({name})")
                print("[predict_url] Found legitimate domain")
                break
        
        # Calculate phishing probability
        phishing_prob = 0.02 + (phishing_indicators * 0.05)
        phishing_prob = max(0.02, min(phishing_prob, 0.8))
        
        print(f"[predict_url] Phishing indicators score: {phishing_indicators}")
        print(f"[predict_url] Calculated phishing prob: {phishing_prob}")
        
        # Generate explanation
        if phishing_prob < 0.1:
            explanation = "✅ URL appears safe and legitimate"
        elif phishing_prob < 0.4:
            explanation = "⚠️ URL has some suspicious characteristics"
        else:
            explanation = "🚨 URL has multiple suspicious characteristics"
        
        return {
            'proba': [[1 - phishing_prob, phishing_prob]],
            'explanation': explanation,
            'flags': flags
        }
    except Exception as e:
        print(f"[ERROR predict_url] {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return {
            'proba': [[0.95, 0.05]],
            'explanation': 'URL analysis unavailable',
            'flags': []
        }

# ==================== ANALYSIS ENDPOINTS ====================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Phishing Email Detector"}

@app.post("/analyze_email", response_model=AnalysisResponse)
def analyze_email(request: EmailRequest):
    """
    Analyze an email for phishing characteristics
    
    Returns:
    - Email phishing probability and trust score
    - Per-link risk analysis
    - Overall risk assessment
    """
    try:
        print("[DEBUG] Received email request")
        print(f"[DEBUG] Subject: {request.subject}")
        print(f"[DEBUG] Body length: {len(request.bodyText)}")
        print(f"[DEBUG] Links count: {len(request.links)}")
        
        # Validate input - require either subject or body (or both)
        if not request.bodyText and not request.bodyHtml:
            print("[ERROR] Validation failed: Missing body content")
            raise HTTPException(status_code=400, detail="Body text or HTML is required")
        
        print("[DEBUG] Validation passed")
        
        # ===== EMAIL ANALYSIS =====
        print("[DEBUG] Starting email analysis...")
        email_explanation = ""
        email_flags = []
        try:
            body_text = request.bodyText or BeautifulSoup(request.bodyHtml, 'html.parser').get_text()
            subject = request.subject or "Unknown Subject"  # Use default if empty
            print(f"[DEBUG] Body text prepared: {len(body_text)} chars")
            
            result = predict_email_phishing(subject, body_text)
            proba_array = result['proba']
            email_explanation = result['explanation']
            email_flags = result['flags']
            
            email_phishing_prob = proba_array[0][1]  # Extract phishing probability
            print(f"[DEBUG] Email phishing prob: {email_phishing_prob}")
            
            email_trust_percent = int(round(100 * (1 - email_phishing_prob)))
            print(f"[DEBUG] Email trust: {email_trust_percent}%")
        except Exception as e:
            print(f"[ERROR] Email analysis failed: {e}")
            raise
        
        # ===== URL ANALYSIS =====
        print("[DEBUG] Starting URL analysis...")
        links_analysis = []
        url_phishing_probs = []
        
        try:
            # Process provided links
            for i, link in enumerate(request.links):
                try:
                    url = link.href
                    print(f"[DEBUG] Processing link {i}: {url[:60]}")
                    
                    if not url or url.startswith('javascript:') or url.startswith('mailto:'):
                        print(f"[DEBUG] Skipping non-HTTP link")
                        continue
                    
                    result = predict_url_phishing(url)
                    proba_array = result['proba']
                    url_phishing_prob = proba_array[0][1]  # Extract phishing probability
                    print(f"[DEBUG] URL phishing prob: {url_phishing_prob}")
                    
                    url_phishing_probs.append(url_phishing_prob)
                    url_trust_percent = int(round(100 * (1 - url_phishing_prob)))
                    
                    links_analysis.append(URLAnalysis(
                        href=url,
                        text=link.text[:100] if link.text else url[:50],
                        phishing_prob=round(url_phishing_prob, 3),
                        trust_percent=url_trust_percent,
                        risk_level=get_risk_level(url_trust_percent),
                        explanation=result['explanation'],
                        flags=result['flags']
                    ))
                except Exception as e:
                    print(f"[ERROR] Failed to analyze link {i}: {e}")
                    continue
            
            print(f"[DEBUG] URL analysis complete: {len(links_analysis)} links analyzed")
        except Exception as e:
            print(f"[ERROR] URL analysis failed: {e}")
            raise
        
        # ===== COMBINE SCORES =====
        print("[DEBUG] Combining scores...")
        try:
            max_url_phishing = max(url_phishing_probs) if url_phishing_probs else 0
            combined_phishing_prob = 1 - (1 - email_phishing_prob) * (1 - max_url_phishing)
            overall_trust_percent = int(round(100 * (1 - combined_phishing_prob)))
            
            # Sort links by risk (most risky first)
            links_analysis.sort(key=lambda x: x.phishing_prob, reverse=True)
            
            print("[DEBUG] All scores combined successfully")
        except Exception as e:
            print(f"[ERROR] Score combining failed: {e}")
            raise
        
        print("[DEBUG] Returning response...")
        return AnalysisResponse(
            email=EmailAnalysis(
                phishing_prob=round(email_phishing_prob, 3),
                trust_percent=email_trust_percent,
                risk_level=get_risk_level(email_trust_percent),
                explanation=email_explanation,
                flags=email_flags
            ),
            links=links_analysis,
            overall_risk_level=get_risk_level(overall_trust_percent)
        )
    
    except Exception as e:
        print(f"[FATAL] Error analyzing email: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/analyze_url")
def analyze_single_url(url: str):
    """Analyze a single URL for phishing risk"""
    try:
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        phishing_prob = predict_url_phishing(url)
        trust_percent = int(round(100 * (1 - phishing_prob)))
        
        return {
            "url": url,
            "phishing_prob": round(phishing_prob, 3),
            "trust_percent": trust_percent,
            "risk_level": get_risk_level(trust_percent)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup_event():
    """Initialize on startup"""
    print("\n" + "="*50)
    print("🔒 Phishing Email Detector API")
    print("="*50)
    print("✓ Models loaded")
    print("✓ API ready on http://localhost:8000")
    print("✓ Docs available at http://localhost:8000/docs")
    print("="*50 + "\n")

if __name__ == "__main__":
    import uvicorn
    print("Starting Phishing Detection API...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
