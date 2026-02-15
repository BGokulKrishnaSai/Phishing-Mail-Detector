"""
Phishing Email Detection - Model Training Pipeline
Trains TF-IDF + Logistic Regression for emails
Trains Random Forest for URLs
"""

import json
import os
import joblib
import re
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from urllib.parse import urlparse
import warnings
warnings.filterwarnings('ignore')

# Create models directory
os.makedirs('models', exist_ok=True)

print("[*] Phishing Detection Model Training Pipeline")

# ==================== DATASET GENERATION ====================
# Using synthetic/labeled phishing emails dataset

PHISHING_EMAILS = [
    {
        "subject": "Verify your account immediately",
        "body": "Your account has been compromised. Click here to verify: https://fake-amazon.ru/verify",
        "sender": "support@amaz0n.com",
        "label": 1  # phishing
    },
    {
        "subject": "Urgent: Confirm your payment method",
        "body": "Your credit card needs verification. Please update it now at http://paypa1.com",
        "sender": "noreply@paypa1.com",
        "label": 1
    },
    {
        "subject": "Your Apple ID has been locked",
        "body": "For security reasons, your Apple ID was locked. Verify your identity: https://apple.id-verify.xyz",
        "sender": "security@apple-alert.com",
        "label": 1
    },
    {
        "subject": "Bank security alert",
        "body": "Suspicious activity detected. Log in immediately: https://bankng-security.ru/login",
        "sender": "alert@bank-secure.tk",
        "label": 1
    },
    {
        "subject": "Confirm your Steam account",
        "body": "Click to confirm your account before it gets suspended: http://st3am-confirm.online",
        "sender": "noreply@st3am.com",
        "label": 1
    },
    {
        "subject": "Your package delivery failed",
        "body": "DHL delivery attempt failed. Click to reschedule: https://dhl-delivery-fake.xyz",
        "sender": "delivery@dhL.tk",
        "label": 1
    },
]

LEGIT_EMAILS = [
    {
        "subject": "Project Update - Week 5",
        "body": "Hi team, Here's the update on our current project. Everything is on track. See details at https://company.com/projects/week5",
        "sender": "manager@company.com",
        "label": 0  # legitimate
    },
    {
        "subject": "Meeting Scheduled for Tomorrow",
        "body": "The weekly sync is scheduled for tomorrow at 10 AM. Join here: https://zoom.us/j/123456789",
        "sender": "hr@company.com",
        "label": 0
    },
    {
        "subject": "Quarterly Report Available",
        "body": "The Q4 report is now available on our portal. You can download it at https://secure.company.com/reports",
        "sender": "finance@company.com",
        "label": 0
    },
    {
        "subject": "Payroll Information",
        "body": "Your payroll has been processed. Check the company portal for details: https://portal.company.com/payroll",
        "sender": "payroll@company.com",
        "label": 0
    },
    {
        "subject": "Thank you for your purchase",
        "body": "Order #12345 has been shipped. Track it here: https://amazon.com/orders/12345",
        "sender": "order-confirmation@amazon.com",
        "label": 0
    },
    {
        "subject": "Newsletter - Latest News",
        "body": "Check out this week's newsletter with industry updates: https://newsletter.techsite.com/latest",
        "sender": "newsletter@techsite.com",
        "label": 0
    },
]

# ==================== EMAIL FEATURE EXTRACTION ====================

def extract_email_features(subject, body):
    """Extract features from email text"""
    text = (subject + " " + body).lower()
    
    phishing_keywords = [
        'verify', 'confirm', 'urgent', 'suspended', 'locked', 'click',
        'update', 'alert', 'validate', 'authenticate', 'immediately',
        'act now', 'action required', 'unusual activity', 'compromised',
        'security', 'account', 'paypal', 'amazon', 'apple', 'bank'
    ]
    
    features = {
        'text': text,
        'urgent_keywords': sum(1 for kw in phishing_keywords if kw in text),
        'url_count': len(re.findall(r'http[s]?://\S+', text)),
        'exclamation_count': text.count('!'),
    }
    
    return features

# ==================== URL FEATURE EXTRACTION ====================

def extract_url_features(url):
    """Extract features from individual URL"""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc
        
        features = {
            'url': url,
            'length': len(url),
            'dot_count': domain.count('.'),
            'hyphen_count': domain.count('-'),
            'digit_count': sum(1 for c in url if c.isdigit()),
            'has_ip': bool(re.search(r'(\d{1,3}\.){3}\d{1,3}', url)),
            'suspicious_tld': any(tld in domain for tld in ['.ru', '.tk', '.xyz', '.online', '.top']),
            'subdomain_count': domain.count('.') if domain.count('.') > 1 else 0,
            'is_https': parsed.scheme == 'https',
        }
        return features
    except:
        return None

# ==================== PREPARE DATASETS ====================

print("\n[*] Preparing Email Dataset...")

# Combine emails
all_emails = PHISHING_EMAILS + LEGIT_EMAILS
email_texts = []
email_labels = []

for email in all_emails:
    features = extract_email_features(email['subject'], email['body'])
    email_texts.append(features['text'])
    email_labels.append(email['label'])

# ==================== TRAIN EMAIL CLASSIFIER ====================

print("[*] Training Email Text Classifier (TF-IDF + Logistic Regression)...")

tfidf = TfidfVectorizer(max_features=500, stop_words='english', ngram_range=(1, 2))
email_vectors = tfidf.fit_transform(email_texts)

email_model = LogisticRegression(max_iter=1000, random_state=42)
email_model.fit(email_vectors, email_labels)

# Evaluate
email_preds = email_model.predict(email_vectors)
print(f"  Email Model Accuracy: {(email_preds == email_labels).mean():.2%}")

# Save email model and vectorizer
joblib.dump(email_model, 'models/email_model.pkl')
joblib.dump(tfidf, 'models/tfidf_vectorizer.pkl')
print("  ✓ Email model saved")

# ==================== PREPARE URL DATASET ====================

print("\n[*] Preparing URL Dataset...")

# Generate synthetic URLs for training
phishing_urls = [
    "https://fake-amazon.ru/verify",
    "http://paypa1.com/login",
    "https://apple.id-verify.xyz",
    "https://bankng-security.ru/login",
    "http://st3am-confirm.online",
    "https://dhl-delivery-fake.xyz",
    "http://192.168.1.1/verify",
    "https://amazon-secur1ty.ru/confirm",
    "http://bit.ly/amaz0nverify",
]

legitimate_urls = [
    "https://amazon.com/orders/12345",
    "https://zoom.us/j/123456789",
    "https://secure.company.com/reports",
    "https://portal.company.com/payroll",
    "https://newsletter.techsite.com/latest",
    "https://www.google.com",
    "https://github.com/user/repo",
    "https://stackoverflow.com/questions",
]

all_urls = phishing_urls + legitimate_urls
url_features_list = []
url_labels = [1]*len(phishing_urls) + [0]*len(legitimate_urls)

for url in all_urls:
    features = extract_url_features(url)
    if features:
        url_features_list.append(features)

# Extract feature vectors
url_feature_names = ['length', 'dot_count', 'hyphen_count', 'digit_count', 
                     'has_ip', 'suspicious_tld', 'subdomain_count', 'is_https']
url_vectors = np.array([
    [f[fname] for fname in url_feature_names] for f in url_features_list
])

# ==================== TRAIN URL CLASSIFIER ====================

print("[*] Training URL Risk Classifier (Random Forest)...")

url_model = RandomForestClassifier(n_estimators=100, random_state=42, depth=10)
url_model.fit(url_vectors, url_labels)

url_preds = url_model.predict(url_vectors)
print(f"  URL Model Accuracy: {(url_preds == url_labels).mean():.2%}")

# Save URL model
joblib.dump(url_model, 'models/url_model.pkl')
joblib.dump(url_feature_names, 'models/url_feature_names.pkl')
print("  ✓ URL model saved")

print("\n[✓] All models trained and saved to 'models/' directory")
print("\nModel Files Created:")
print("  - models/email_model.pkl")
print("  - models/tfidf_vectorizer.pkl")
print("  - models/url_model.pkl")
print("  - models/url_feature_names.pkl")
