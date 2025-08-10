import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage

# 1. Load and parse the config with error handling
firebase_config = json.loads(os.environ["FIREBASE_CONFIG"])

# 2. Fix newlines in private key if they were escaped (for Render env vars)
if '\\n' in firebase_config['private_key']:
    firebase_config['private_key'] = firebase_config['private_key'].replace('\\n', '\n')

# 3. Initialize Firebase (only once)
if not firebase_admin._apps:
    cred = credentials.Certificate(firebase_config)
    firebase_admin.initialize_app(cred, {
        'storageBucket': 'college-staff-manager.firebasestorage.app'  # ← Must match your bucket
    })

# 4. Create clients
db = firestore.client()
bucket = storage.bucket()