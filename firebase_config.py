import os
import json
import firebase_admin
from firebase_admin import credentials, firestore, storage

firebase_creds = json.loads(os.environ["FIREBASE_CONFIG"])

if not firebase_admin._apps:
    firebase_admin.initialize_app(
        credentials.Certificate(firebase_creds),
        {'storageBucket': 'college-staff-manager.firebasestorage.app'}
    )

db = firestore.client()
bucket = storage.bucket()
