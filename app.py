# app.py
import os
from flask import Flask, request, jsonify, render_template, send_from_directory, session
from werkzeug.utils import secure_filename
from firebase_admin import credentials, initialize_app, auth, firestore, storage
import firebase_admin
import pandas as pd
from auth_utils import admin_required, login_required, web_login_required
from flask_cors import CORS
from processing.file_processors import process_uploaded_file  # placeholder
from firebase_config import db, bucket


UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = set(['xlsx','xls','csv','png','jpg','jpeg','pdf','txt','mp4','mp3'])

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-this')  # Add this for sessions
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('login.html')


# Endpoint used by admin UI to upload Excel and create staff users
@app.route('/api/upload_excel', methods=['POST'])
@admin_required
def upload_excel():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    filename = secure_filename(f.filename)
    path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    f.save(path)

    # Parse Excel; adapt column names to your Excel format
    try:
        df = pd.read_excel(path)
    except Exception as e:
        return jsonify({'error': 'Failed to read Excel', 'detail': str(e)}), 400

    created = []
    errors = []
    for idx, row in df.iterrows():
        try:
            email = str(row.get('Mail') or row.get('email') or '').strip()
            phone = str(row.get('Phone') or row.get('mobileNo') or row.get('mobile') or '').strip()
            slno = str(row.get('Sl No') or row.get('SlNo') or row.get('slno') or '')
            name = str(row.get('Name') or row.get('name') or '')
            if not email or not phone:
                errors.append({'row': int(idx), 'reason': 'missing email or phone'})
                continue
            # create auth user if not exists
            try:
                user = auth.create_user(email=email, password=phone)
                # create users doc
                db.collection('users').document(user.uid).set({
                    'email': email,
                    'isAdmin': False,
                    'staffId': slno or '',
                    'createdAt': firestore.SERVER_TIMESTAMP
                })
                created.append({'email': email, 'uid': user.uid})
            except Exception as create_err:
                # user likely exists; try to find by email and just ensure staff doc exists
                errors.append({'row': int(idx), 'email': email, 'error': str(create_err)})
            # create staff document
            staff_doc_id = slno if slno else email
            db.collection('staff').document(staff_doc_id).set({
                'name': name,
                'email': email,
                'mobileNo': phone,
                'Sl No': slno
            }, merge=True)
        except Exception as e:
            errors.append({'row': int(idx), 'error': str(e)})

    return jsonify({'created': created, 'errors': errors})

# Endpoint used by web client to create firebase auth user if login fails (mirrors Flutter fallback)
@app.route('/api/create_if_staff', methods=['POST'])
def create_if_staff():
    data = request.json or {}
    email = (data.get('email') or '').strip()
    password = (data.get('password') or '').strip()
    if not email or not password:
        return jsonify({'error': 'email and password required'}), 400

    # Find staff doc with this email
    try:
        q = db.collection('staff').where('email', '==', email).limit(1).get()
        if not q:
            return jsonify({'found': False, 'message': 'No staff record found'}), 404
        staff_doc = q[0]
        staff = staff_doc.to_dict()
        # Accept phone or mobileNo or Phone
        stored_phone = str(staff.get('mobileNo') or staff.get('Phone') or staff.get('phone') or '')
        if stored_phone == password:
            # create Firebase Auth user
            try:
                new_user = auth.create_user(email=email, password=password)
                db.collection('users').document(new_user.uid).set({
                    'email': email,
                    'isAdmin': False,
                    'staffId': staff.get('Sl No') or staff.get('SlNo') or '',
                    'createdAt': firestore.SERVER_TIMESTAMP
                })
                return jsonify({'created': True, 'uid': new_user.uid}), 201
            except Exception as e:
                return jsonify({'error': 'Could not create user', 'detail': str(e)}), 500
        else:
            return jsonify({'found': True, 'match': False, 'message': 'Password did not match staff phone'}), 403
    except Exception as e:
        return jsonify({'error': 'Server error', 'detail': str(e)}), 500

# Protected endpoint to list staff entries (for web UI)
@app.route('/api/staffs', methods=['GET'])
@login_required
def list_staffs():
    try:
        # Debug: print the Authorization header to see if token is sent
        from flask import request
        print("Authorization header received:", request.headers.get("Authorization"))

        docs = db.collection('staff').stream()
        staff_list = []
        for d in docs:
            data = d.to_dict()
            data['id'] = d.id
            staff_list.append(data)

        return jsonify({'staffs': staff_list})
    except Exception as e:
        return jsonify({'error': 'Failed to fetch staffs', 'detail': str(e)}), 500


# Use web_login_required instead of login_required for HTML pages
@app.route('/staff_list.html')
@web_login_required
def staff_list_page_html():
    return render_template('staff_list.html')

@app.route('/admin.html')
@web_login_required
def admin_page_html():
    return render_template('admin.html')


# Browser file upload endpoint — processes files server-side
@app.route('/api/upload_file', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    f = request.files['file']
    if f.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    if not allowed_file(f.filename):
        return jsonify({'error': 'File type not allowed'}), 400

    filename = secure_filename(f.filename)
    local_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    f.save(local_path)

    # Optional: run ported processing logic
    try:
        result = process_uploaded_file(local_path)  # implement in processing/file_processors.py
    except Exception as e:
        result = {'error': 'processing_failed', 'detail': str(e)}

    # upload to firebase storage
    blob = bucket.blob(f'uploads/{filename}')
    blob.upload_from_filename(local_path)
    # optionally set public or generate signed url — be cautious with privacy
    try:
        blob.make_public()
        storage_url = blob.public_url
    except Exception:
        storage_url = None

    return jsonify({'filename': filename, 'storage_url': storage_url, 'process_result': result})

# Serve static files (if needed)
@app.route('/static/<path:filename>')
def static_files(filename):
    return send_from_directory('static', filename)


# Add this new endpoint to your existing app.py after the other API routes

@app.route('/api/staff/<staff_id>', methods=['DELETE'])
@admin_required
def delete_staff(staff_id):
    """
    Delete a staff member (admin only)
    Also optionally delete the associated Firebase Auth user
    """
    try:
        # First, get the staff document to get email for user deletion
        staff_doc = db.collection('staff').document(staff_id).get()
        if not staff_doc.exists:
            return jsonify({'error': 'Staff member not found'}), 404
            
        staff_data = staff_doc.to_dict()
        staff_email = staff_data.get('email')
        
        # Delete the staff document
        db.collection('staff').document(staff_id).delete()
        
        # Optionally delete the associated Firebase Auth user and users collection document
        deleted_auth_user = False
        if staff_email:
            try:
                # Find user by email
                user_record = auth.get_user_by_email(staff_email)
                
                # Delete from users collection
                db.collection('users').document(user_record.uid).delete()
                
                # Delete Firebase Auth user
                auth.delete_user(user_record.uid)
                deleted_auth_user = True
                
            except auth.UserNotFoundError:
                # User doesn't exist in Firebase Auth, that's okay
                pass
            except Exception as user_delete_error:
                # Log error but don't fail the staff deletion
                print(f"Failed to delete auth user for {staff_email}: {user_delete_error}")
        
        return jsonify({
            'success': True, 
            'message': 'Staff member deleted successfully',
            'deleted_auth_user': deleted_auth_user,
            'staff_id': staff_id
        })
        
    except Exception as e:
        return jsonify({'error': 'Failed to delete staff member', 'detail': str(e)}), 500


@app.route('/api/staff/bulk_delete', methods=['POST'])
@admin_required
def bulk_delete_staff():
    """
    Delete multiple staff members (admin only)
    Expects JSON: {"staff_ids": ["id1", "id2", "id3"]}
    """
    try:
        data = request.json or {}
        staff_ids = data.get('staff_ids', [])
        
        if not staff_ids or not isinstance(staff_ids, list):
            return jsonify({'error': 'staff_ids array required'}), 400
            
        deleted_count = 0
        deleted_auth_users = 0
        errors = []
        
        for staff_id in staff_ids:
            try:
                # Get staff document
                staff_doc = db.collection('staff').document(staff_id).get()
                if not staff_doc.exists:
                    errors.append({'staff_id': staff_id, 'error': 'Staff not found'})
                    continue
                    
                staff_data = staff_doc.to_dict()
                staff_email = staff_data.get('email')
                
                # Delete staff document
                db.collection('staff').document(staff_id).delete()
                deleted_count += 1
                
                # Try to delete associated auth user
                if staff_email:
                    try:
                        user_record = auth.get_user_by_email(staff_email)
                        db.collection('users').document(user_record.uid).delete()
                        auth.delete_user(user_record.uid)
                        deleted_auth_users += 1
                    except auth.UserNotFoundError:
                        pass
                    except Exception as user_error:
                        errors.append({'staff_id': staff_id, 'error': f'Auth deletion failed: {user_error}'})
                        
            except Exception as e:
                errors.append({'staff_id': staff_id, 'error': str(e)})
        
        return jsonify({
            'success': True,
            'deleted_staff': deleted_count,
            'deleted_auth_users': deleted_auth_users,
            'errors': errors
        })
        
    except Exception as e:
        return jsonify({'error': 'Bulk delete failed', 'detail': str(e)}), 500

@app.route('/api/staff/test_admin_check', methods=['GET'])
@admin_required
def test_admin_check():
    """
    Simple endpoint to test if user has admin privileges
    Used by frontend to determine if admin features should be shown
    """
    return jsonify({'isAdmin': True})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))