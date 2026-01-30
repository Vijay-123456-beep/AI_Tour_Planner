import firebase_admin
from firebase_admin import auth, firestore
import jwt
from datetime import datetime, timedelta
import os

class AuthService:
    def __init__(self):
        self.db = firestore.client()
        self.jwt_secret = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
    
    def register_user(self, email, password, name):
        """Register a new user with email and password"""
        try:
            # Create Firebase auth user
            user = auth.create_user(
                email=email,
                password=password,
                display_name=name
            )
            
            # Create user document in Firestore
            user_ref = self.db.collection('users').document(user.uid)
            user_ref.set({
                'uid': user.uid,
                'email': email,
                'name': name,
                'created_at': firestore.SERVER_TIMESTAMP,
                'preferences': {},
                'trips': []
            })
            
            return {
                'uid': user.uid,
                'email': user.email,
                'name': name
            }
            
        except Exception as e:
            raise Exception(f"Registration failed: {str(e)}")
    
    def authenticate_user(self, email, password):
        """Authenticate user and return JWT token"""
        try:
            # In a real app, verify email/password with Firebase Auth
            # For demo, we'll skip actual Firebase Auth and just verify user exists
            users_ref = self.db.collection('users')
            query = users_ref.where('email', '==', email).limit(1)
            docs = query.stream()
            
            user_data = None
            for doc in docs:
                user_data = doc.to_dict()
                break
                
            if not user_data:
                raise Exception("Invalid email or password")
            
            # In a real app, verify password with Firebase Auth
            # For now, we'll just generate a token for the demo
            
            # Generate JWT token
            token = jwt.encode({
                'user_id': user_data['uid'],
                'email': user_data['email'],
                'exp': datetime.utcnow() + timedelta(days=1)
            }, self.jwt_secret, algorithm='HS256')
            
            return token
            
        except Exception as e:
            raise Exception(f"Authentication failed: {str(e)}")
    
    def get_user_profile(self, user_id):
        """Get user profile by user ID"""
        try:
            user_ref = self.db.collection('users').document(user_id)
            doc = user_ref.get()
            
            if not doc.exists:
                raise Exception("User not found")
                
            user_data = doc.to_dict()
            # Remove sensitive data
            user_data.pop('password', None)
            return user_data
            
        except Exception as e:
            raise Exception(f"Failed to get user profile: {str(e)}")
