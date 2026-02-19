from flask import Blueprint, request, jsonify
from firebase_admin import auth
from functools import wraps
import jwt
from ..services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)
auth_service = AuthService()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, current_app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            current_user = data['user_id']
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    
    if not email or not password or not name:
        return jsonify({'error': 'Missing required fields'}), 400
        
    try:
        user = auth_service.register_user(email, password, name)
        return jsonify({
            'message': 'User registered successfully',
            'user': user
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400
    
    try:
        token = auth_service.authenticate_user(email, password)
        return jsonify({
            'message': 'Login successful',
            'token': token
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 401

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    try:
        user_data = auth_service.get_user_profile(current_user)
        return jsonify(user_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    try:
        result = auth_service.update_user_profile(current_user, data)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
