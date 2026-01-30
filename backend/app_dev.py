"""
Development version of app.py with MongoDB integration
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager
import os
from dotenv import load_dotenv
from pymongo import MongoClient
from datetime import datetime
from bson.objectid import ObjectId

# Load environment variables
load_dotenv()

# MongoDB Connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/ai_tour_planner')
mongo_client = None
db = None

def init_mongodb():
    global mongo_client, db
    try:
        mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
        # Test connection
        mongo_client.admin.command('ping')
        db = mongo_client.get_database()
        print("✅ MongoDB Connected Successfully!")
        print(f"📊 Database: {db.name}")
        
        # Create collections if they don't exist
        if 'itineraries' not in db.list_collection_names():
            db.create_collection('itineraries')
        if 'expenses' not in db.list_collection_names():
            db.create_collection('expenses')
        if 'bookings' not in db.list_collection_names():
            db.create_collection('bookings')
        
        return True
    except Exception as e:
        print(f"❌ MongoDB Connection Error: {str(e)}")
        print("⚠️  Falling back to in-memory storage")
        return False

# Fallback in-memory storage
in_memory_db = {
    'itineraries': {},
    'expenses': {},
    'bookings': {}
}

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = 86400  # 24 hours
    app.config['OPENROUTER_API_KEY'] = os.getenv('OPENROUTER_API_KEY')
    app.config['OPENROUTER_BASE_URL'] = 'https://openrouter.ai/api/v1'
    
    # Initialize MongoDB
    mongodb_connected = init_mongodb()
    app.config['MONGODB_CONNECTED'] = mongodb_connected
    
    # Initialize extensions with proper CORS configuration
    CORS(app, resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
        }
    })
    jwt = JWTManager(app)
    
    print("⚠️  Running in DEVELOPMENT mode - Firebase disabled for testing")
    print("📝 Note: Routes that require Firebase are disabled")
    print("🔑 OpenRouter API configured for AI features")
    if mongodb_connected:
        print("💾 Using MongoDB for persistent storage")
    else:
        print("💾 Using in-memory storage (fallback)")
    
    # API endpoint for OpenRouter AI integration
    @app.route('/api/ai/test', methods=['POST'])
    def test_openrouter():
        """Test OpenRouter API integration"""
        import requests
        try:
            api_key = app.config.get('OPENROUTER_API_KEY')
            if not api_key:
                return jsonify({"error": "OpenRouter API key not configured"}), 400
            
            data = request.get_json()
            prompt = data.get('prompt', 'Hello, provide a travel recommendation')
            
            response = requests.post(
                f"{app.config['OPENROUTER_BASE_URL']}/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "HTTP-Referer": "http://localhost:3001",
                    "X-Title": "AI Tour Planner"
                },
                json={
                    "model": "openai/gpt-3.5-turbo",
                    "messages": [{"role": "user", "content": prompt}]
                },
                timeout=30
            )
            
            if response.status_code == 200:
                return jsonify(response.json()), 200
            else:
                return jsonify({"error": response.text}), response.status_code
        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    # Basic route
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy", 
            "message": "AI Tour Planner API is running",
            "mode": "development"
        }), 200
    
    # Mock Itinerary Endpoints
    @app.route('/api/itinerary/create', methods=['POST', 'OPTIONS'])
    def create_itinerary():
        """Create and store itinerary"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            itinerary_id = "itinerary-" + str(hash(str(data)) % 1000000)
            itinerary = {
                "id": itinerary_id,
                "destination": data.get('destination', ''),
                "start_date": data.get('start_date', ''),
                "end_date": data.get('end_date', ''),
                "startDate": data.get('startDate', data.get('start_date', '')),
                "endDate": data.get('endDate', data.get('end_date', '')),
                "budget": data.get('budget', 0),
                "travelers": data.get('travelers', 1),
                "interests": data.get('interests', []),
                "status": "created",
                "createdAt": datetime.now().isoformat()
            }
            
            # Store in MongoDB if connected, fallback to in-memory
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.itineraries.insert_one(itinerary)
                    itinerary.pop('_id', None)  # Remove MongoDB's _id field for JSON serialization
                    print(f"✓ Itinerary saved to MongoDB: {itinerary_id}")
                except Exception as e:
                    print(f"⚠️  MongoDB save failed: {e}, using in-memory storage")
                    in_memory_db['itineraries'][itinerary_id] = itinerary
            else:
                in_memory_db['itineraries'][itinerary_id] = itinerary
                print(f"✓ Itinerary saved to in-memory storage: {itinerary_id}")
            
            return jsonify({"success": True, "data": itinerary}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/itinerary/<itinerary_id>', methods=['GET', 'OPTIONS'])
    def get_itinerary(itinerary_id):
        """Get specific itinerary from storage"""
        if request.method == 'OPTIONS':
            return '', 204
        
        # Try MongoDB first, fallback to in-memory
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                itinerary = db.itineraries.find_one({"id": itinerary_id})
                if itinerary:
                    itinerary.pop('_id', None)  # Remove MongoDB's _id field
                    return jsonify({"success": True, "data": itinerary}), 200
            except Exception as e:
                print(f"⚠️  MongoDB query failed: {e}")
        
        # Fallback to in-memory
        itinerary = in_memory_db['itineraries'].get(itinerary_id)
        if itinerary:
            return jsonify({"success": True, "data": itinerary}), 200
        
        return jsonify({"error": "Itinerary not found"}), 404
    
    @app.route('/api/itinerary/', methods=['GET', 'OPTIONS'])
    def get_all_itineraries():
        """Get all itineraries"""
        if request.method == 'OPTIONS':
            return '', 204
        
        data = []
        
        # Try MongoDB first
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                itineraries = db.itineraries.find({})
                for itinerary in itineraries:
                    itinerary.pop('_id', None)  # Remove MongoDB's _id field
                    data.append(itinerary)
                print(f"✓ Retrieved {len(data)} itineraries from MongoDB")
            except Exception as e:
                print(f"⚠️  MongoDB query failed: {e}, using in-memory storage")
                data = list(in_memory_db['itineraries'].values())
        else:
            data = list(in_memory_db['itineraries'].values())
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
    
    @app.route('/api/itinerary/<itinerary_id>/update', methods=['PUT', 'OPTIONS'])
    def update_itinerary(itinerary_id):
        """Mock update itinerary"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            return jsonify({"success": True, "data": data, "message": "Itinerary updated"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    # Expense Endpoints with MongoDB persistence
    @app.route('/api/expenses/add', methods=['POST', 'OPTIONS'])
    def add_expense():
        """Add expense and store in MongoDB"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            expense_id = "expense-" + str(hash(str(data)) % 1000000)
            expense = {
                "id": expense_id,
                "itineraryId": data.get('itineraryId', ''),
                "category": data.get('category', 'other'),
                "amount": data.get('amount', 0),
                "description": data.get('description', ''),
                "paidBy": data.get('paidBy', ''),
                "splitAmong": data.get('splitAmong', []),
                "currency": data.get('currency', 'USD'),
                "createdAt": datetime.now().isoformat()
            }
            
            # Store in MongoDB if connected
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.expenses.insert_one(expense)
                    expense.pop('_id', None)
                    print(f"✓ Expense saved to MongoDB: {expense_id}")
                except Exception as e:
                    print(f"⚠️  MongoDB save failed: {e}")
                    in_memory_db['expenses'][expense_id] = expense
            else:
                in_memory_db['expenses'][expense_id] = expense
            
            return jsonify({"success": True, "data": expense}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/expenses/', methods=['GET', 'OPTIONS'])
    def get_expenses():
        """Get all expenses"""
        if request.method == 'OPTIONS':
            return '', 204
        
        data = []
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                expenses = db.expenses.find({})
                for expense in expenses:
                    expense.pop('_id', None)
                    data.append(expense)
            except Exception as e:
                print(f"⚠️  MongoDB query failed: {e}")
                data = list(in_memory_db['expenses'].values())
        else:
            data = list(in_memory_db['expenses'].values())
        
        return jsonify({"success": True, "data": data}), 200
    
    @app.route('/api/expenses/<expense_id>', methods=['GET', 'OPTIONS'])
    def get_expense(expense_id):
        """Get specific expense"""
        if request.method == 'OPTIONS':
            return '', 204
        
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                expense = db.expenses.find_one({"id": expense_id})
                if expense:
                    expense.pop('_id', None)
                    return jsonify({"success": True, "data": expense}), 200
            except Exception as e:
                print(f"⚠️  MongoDB query failed: {e}")
        
        expense = in_memory_db['expenses'].get(expense_id)
        if expense:
            return jsonify({"success": True, "data": expense}), 200
        
        return jsonify({"error": "Expense not found"}), 404
    
    @app.route('/api/expenses/<expense_id>/delete', methods=['DELETE', 'OPTIONS'])
    def delete_expense(expense_id):
        """Delete expense from MongoDB"""
        if request.method == 'OPTIONS':
            return '', 204
        
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                db.expenses.delete_one({"id": expense_id})
                print(f"✓ Expense deleted from MongoDB: {expense_id}")
            except Exception as e:
                print(f"⚠️  MongoDB delete failed: {e}")
        
        in_memory_db['expenses'].pop(expense_id, None)
        return jsonify({"success": True, "message": f"Expense {expense_id} deleted"}), 200
    
    # Transport/Booking Endpoints
    @app.route('/api/transport/book', methods=['POST', 'OPTIONS'])
    def book_transport():
        """Book transport and store in MongoDB"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            booking_id = "booking-" + str(hash(str(data)) % 1000000)
            booking = {
                "id": booking_id,
                "itineraryId": data.get('itineraryId', ''),
                "type": data.get('type', 'car'),
                "transportType": data.get('transportType', 'car'),
                "date": data.get('date', ''),
                "pickupLocation": data.get('pickupLocation', ''),
                "dropLocation": data.get('dropLocation', ''),
                "pickupTime": data.get('pickupTime', ''),
                "cost": data.get('cost', 0),
                "price": data.get('price', data.get('cost', 0)),
                "status": "confirmed",
                "createdAt": datetime.now().isoformat()
            }
            
            # Store in MongoDB if connected
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.bookings.insert_one(booking)
                    booking.pop('_id', None)
                    print(f"✓ Booking saved to MongoDB: {booking_id}")
                except Exception as e:
                    print(f"⚠️  MongoDB save failed: {e}")
                    in_memory_db['bookings'][booking_id] = booking
            else:
                in_memory_db['bookings'][booking_id] = booking
            
            return jsonify({"success": True, "data": booking}), 201
        except Exception as e:
            return jsonify({"error": str(e)}), 400
    
    @app.route('/api/transport/bookings', methods=['GET', 'OPTIONS'])
    def get_bookings():
        """Get all bookings"""
        if request.method == 'OPTIONS':
            return '', 204
        
        data = []
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                bookings = db.bookings.find({})
                for booking in bookings:
                    booking.pop('_id', None)
                    data.append(booking)
            except Exception as e:
                print(f"⚠️  MongoDB query failed: {e}")
                data = list(in_memory_db['bookings'].values())
        else:
            data = list(in_memory_db['bookings'].values())
        
        return jsonify({"success": True, "data": data}), 200
    
    @app.route('/api/transport/bookings/<booking_id>', methods=['GET', 'OPTIONS'])
    def get_booking(booking_id):
        """Get specific booking"""
        if request.method == 'OPTIONS':
            return '', 204
        
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                booking = db.bookings.find_one({"id": booking_id})
                if booking:
                    booking.pop('_id', None)
                    return jsonify({"success": True, "data": booking}), 200
            except Exception as e:
                print(f"⚠️  MongoDB query failed: {e}")
        
        booking = in_memory_db['bookings'].get(booking_id)
        if booking:
            return jsonify({"success": True, "data": booking}), 200
        
        return jsonify({"error": "Booking not found"}), 404
    
    @app.route('/api/transport/bookings/<booking_id>/delete', methods=['DELETE', 'OPTIONS'])
    def delete_booking(booking_id):
        """Delete booking from MongoDB"""
        if request.method == 'OPTIONS':
            return '', 204
        
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                db.bookings.delete_one({"id": booking_id})
                print(f"✓ Booking deleted from MongoDB: {booking_id}")
            except Exception as e:
                print(f"⚠️  MongoDB delete failed: {e}")
        
        in_memory_db['bookings'].pop(booking_id, None)
        return jsonify({"success": True, "message": f"Booking {booking_id} deleted"}), 200
    
    # Mock Weather Endpoint
    @app.route('/api/weather/<location>', methods=['GET', 'OPTIONS'])
    def get_weather(location):
        """Mock weather endpoint"""
        if request.method == 'OPTIONS':
            return '', 204
        
        return jsonify({
            "success": True,
            "data": {
                "destination": location,
                "location": location,
                "temperature": 25,
                "condition": "Sunny",
                "humidity": 60,
                "windSpeed": 10,
                "summary": {
                    "avg_temperature": 24,
                    "most_common_condition": "Sunny",
                    "rainy_days": 1,
                    "sunny_days": 5
                },
                "forecast": [
                    {"date": "2026-02-01", "temp": 25, "condition": "Sunny", "humidity": 60, "windSpeed": 10},
                    {"date": "2026-02-02", "temp": 23, "condition": "Sunny", "humidity": 65, "windSpeed": 12},
                    {"date": "2026-02-03", "temp": 22, "condition": "Cloudy", "humidity": 70, "windSpeed": 15},
                    {"date": "2026-02-04", "temp": 20, "condition": "Rainy", "humidity": 85, "windSpeed": 20},
                    {"date": "2026-02-05", "temp": 21, "condition": "Cloudy", "humidity": 75, "windSpeed": 18},
                    {"date": "2026-02-06", "temp": 24, "condition": "Sunny", "humidity": 55, "windSpeed": 8}
                ],
                "packingRecommendations": ["sunscreen", "light clothing", "sunglasses", "umbrella", "comfortable shoes"]
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not Found"}), 404
    
    @app.errorhandler(500)
    def server_error(error):
        return jsonify({"error": "Internal Server Error"}), 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    print("🚀 Starting AI Tour Planner Backend")
    print("📍 Backend URL: http://localhost:5000")
    print("📊 Health Check: http://localhost:5000/api/health")
    app.run(debug=True, host='0.0.0.0', port=5000)
