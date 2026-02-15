"""
Create mock/simplified models without scikit-learn dependencies
This allows the API to run without heavy ML requirements
"""

import joblib
import os

# Create models directory
os.makedirs('models', exist_ok=True)

# ===== Mock Email Model =====
class MockEmailModel:
    def predict_proba(self, text_vector):
        """Return mock prediction"""
        # Always return [legitimate_prob, phishing_prob]
        if isinstance(text_vector, list) and len(text_vector) > 0:
            return [[0.6, 0.4]]  # 60% legitimate, 40% phishing
        return [[0.7, 0.3]]

email_model = MockEmailModel()
joblib.dump(email_model, 'models/email_model.pkl')
print("[OK] email_model.pkl created")

# ===== Mock TF-IDF Vectorizer =====
class MockVectorizer:
    def transform(self, texts):
        """Return mock vector"""
        if isinstance(texts, list) and len(texts) > 0:
            return [[0.1] * 500]  # 500-dim vector
        return [[0.1] * 500]

vectorizer = MockVectorizer()
joblib.dump(vectorizer, 'models/tfidf_vectorizer.pkl')
print("[OK] tfidf_vectorizer.pkl created")

# ===== Mock URL Model =====
class MockURLModel:
    def predict_proba(self, url_features):
        """Return mock prediction"""
        if url_features is not None and len(url_features) > 0:
            return [[0.7, 0.3]]  # 70% safe, 30% phishing
        return [[0.7, 0.3]]

url_model = MockURLModel()
joblib.dump(url_model, 'models/url_model.pkl')
print("[OK] url_model.pkl created")

# ===== URL Feature Names =====
url_feature_names = ['length', 'dot_count', 'hyphen_count', 'digit_count',
                     'has_ip', 'suspicious_tld', 'subdomain_count', 'is_https']
joblib.dump(url_feature_names, 'models/url_feature_names.pkl')
print("[OK] url_feature_names.pkl created")

print("\n[SUCCESS] Mock models created!")
print("The app will now work but with simplified ML predictions.")
