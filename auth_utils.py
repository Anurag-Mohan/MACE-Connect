# auth_utils.py
import firebase_admin
from firebase_admin import auth, firestore
from functools import wraps
from flask import request, jsonify, g, redirect, url_for
from firebase_config import db, bucket


def get_bearer_token():
    auth_header = request.headers.get("Authorization", None)
    if not auth_header:
        return None
    parts = auth_header.split()
    if parts[0].lower() != "bearer" or len(parts) != 2:
        return None
    return parts[1]

def verify_firebase_token(id_token):
    """
    Verifies an ID token using firebase_admin and returns decoded token dict or raises.
    """
    decoded = auth.verify_id_token(id_token)
    return decoded

def login_required(f):
    """For API endpoints that expect Authorization header with Bearer token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        from flask import request
        print("Decorator sees Authorization header:", request.headers.get("Authorization"))

        auth_header = request.headers.get("Authorization")
        if not auth_header:
            return jsonify({'error': 'Authorization token required'}), 401
        token = get_bearer_token()
        if not token:
            return jsonify({'error': 'Authorization token required'}), 401
        try:
            decoded = verify_firebase_token(token)
            g.firebase_uid = decoded.get('uid')
            g.firebase_token = decoded
        except Exception as e:
            return jsonify({'error': 'Invalid token', 'detail': str(e)}), 401
        return f(*args, **kwargs)
    return decorated_function

def web_login_required(f):
    """For HTML page routes - redirects to login if not authenticated"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # For HTML pages, we can't check authentication server-side easily
        # Let the page load and handle authentication on the client-side
        # If you want server-side session management, you'd need to implement that
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    @login_required
    def wrapper(*args, **kwargs):
        uid = g.firebase_uid
        try:
            user_doc = db.collection('users').document(uid).get()
            if not user_doc.exists:
                return jsonify({'error': 'User doc not found'}), 403
            user_data = user_doc.to_dict()
            if not user_data.get('isAdmin', False):
                return jsonify({'error': 'Admin privileges required'}), 403
            # pass user_data if needed
            g.user_doc = user_data
        except Exception as e:
            return jsonify({'error': 'Admin check failed', 'detail': str(e)}), 500
        return f(*args, **kwargs)
    return wrapper