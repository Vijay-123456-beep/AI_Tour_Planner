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
import uuid

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
        print("[SUCCESS] MongoDB Connected Successfully!")
        print(f"[INFO] Database: {db.name}")
        
        # Create collections if they don't exist
        if 'itineraries' not in db.list_collection_names():
            db.create_collection('itineraries')
        if 'expenses' not in db.list_collection_names():
            db.create_collection('expenses')
        if 'bookings' not in db.list_collection_names():
            db.create_collection('bookings')
        
        return True
    except Exception as e:
        print(f"[ERROR] MongoDB Connection Error: {str(e)}")
        print("[WARN] Falling back to in-memory storage")
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
            "origins": ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000", "http://127.0.0.1:3001", "http://192.168.1.24:3000", "*"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Title", "HTTP-Referer"],
            "supports_credentials": True
        }
    })
    jwt = JWTManager(app)
    
    print("[WARN] Running in DEVELOPMENT mode - Firebase disabled for testing")
    print("[NOTE] Note: Routes that require Firebase are disabled")
    print("[INFO] OpenRouter API configured for AI features")
    if app.config['MONGODB_CONNECTED'] and db is not None:
        print("[INFO] Using MongoDB for persistent storage")
    else:
        print("[INFO] Using in-memory storage (fallback)")
    
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
                "creator_email": data.get('creator_email', ''),
                "status": "created",
                "createdAt": datetime.now().isoformat()
            }
            
            # Store in MongoDB if connected, fallback to in-memory
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.itineraries.insert_one(itinerary)
                    itinerary.pop('_id', None)  # Remove MongoDB's _id field for JSON serialization
                    print(f"[SUCCESS] Itinerary saved to MongoDB: {itinerary_id}")
                except Exception as e:
                    print(f"[WARN] MongoDB save failed: {e}, using in-memory storage")
                    in_memory_db['itineraries'][itinerary_id] = itinerary
            else:
                in_memory_db['itineraries'][itinerary_id] = itinerary
                print(f"[SUCCESS] Itinerary saved to in-memory storage: {itinerary_id}")
            
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
                print(f"[WARN] MongoDB query failed: {e}")
        
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
                print(f"[SUCCESS] Retrieved {len(data)} itineraries from MongoDB")
            except Exception as e:
                print(f"[WARN] MongoDB query failed: {e}, using in-memory storage")
                data = list(in_memory_db['itineraries'].values())
        else:
            data = list(in_memory_db['itineraries'].values())
        
        
        return jsonify({
            "success": True,
            "data": data
        }), 200
    
    # --- AI GENERATION & PACKING LIST (Ported from ItineraryService) ---
    
    def _get_points_of_interest(destination, interests, max_results=20):
        """Get points of interest for a destination (Mock Implementation)"""
        # Mock data for different destinations (Simplified for dev)
        mock_places = {
            'paris': [
                {'id': 'eiffel_tower', 'name': 'Eiffel Tower', 'category': 'attraction', 'location': 'Champ de Mars', 'price': 25.00, 'rating': 4.7},
                {'id': 'louvre', 'name': 'Louvre Museum', 'category': 'museum', 'location': 'Rue de Rivoli', 'price': 17.00, 'rating': 4.7},
            ],
            'london': [
                {'id': 'big_ben', 'name': 'Big Ben', 'category': 'attraction', 'location': 'London SW1A 0AA', 'price': 0.00, 'rating': 4.6},
                {'id': 'london_eye', 'name': 'London Eye', 'category': 'attraction', 'location': 'Riverside Building', 'price': 30.00, 'rating': 4.5},
            ]
        }
        
        dest_key = destination.lower().strip()
        places = mock_places.get(dest_key, [])
        
        # Generic fallback
        if not places:
            places = [
                {'id': 'attraction1', 'name': f'Main Attraction in {destination}', 'category': 'attraction', 'location': 'Center', 'price': 15.00},
                {'id': 'restaurant1', 'name': f'Local Food in {destination}', 'category': 'restaurant', 'location': 'Downtown', 'price': 30.00},
            ]
            
        return places

    @app.route('/api/itinerary/<itinerary_id>/generate', methods=['POST', 'OPTIONS'])
    def generate_itinerary(itinerary_id):
        """Generate itinerary details using AI/Mock logic"""
        if request.method == 'OPTIONS':
            return '', 204
            
        try:
            # 1. Fetch Itinerary
            itinerary = None
            if app.config['MONGODB_CONNECTED'] and db is not None:
                itinerary = db.itineraries.find_one({"id": itinerary_id})
                if itinerary: itinerary.pop('_id', None)
            else:
                itinerary = in_memory_db['itineraries'].get(itinerary_id)
                
            if not itinerary:
                return jsonify({"error": "Itinerary not found"}), 404
                
            # 2. Extract params
            destination = itinerary.get('destination', '')
            try:
                start_date = datetime.fromisoformat(itinerary.get('start_date', '').replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(itinerary.get('end_date', '').replace('Z', '+00:00'))
            except:
                return jsonify({"error": "Invalid date format in itinerary"}), 400
                
            days_count = (end_date - start_date).days + 1
            interests = itinerary.get('interests', [])
            
            # 3. Generate Daily Plan
            places = _get_points_of_interest(destination, interests)
            daily_itinerary = {}
            current_date = start_date
            
            import random
            from datetime import timedelta
            
            for day in range(1, days_count + 1):
                daily_activities = []
                # Mock activity generation
                if places:
                    place = random.choice(places)
                    daily_activities.append({
                        'time': '10:00',
                        'activity': f"Visit {place['name']}",
                        'location': place['location'],
                        'cost': place.get('price', 0),
                        'category': place.get('category', 'attraction')
                    })
                
                date_str = current_date.strftime('%Y-%m-%d')
                daily_itinerary[date_str] = {
                    'day': day,
                    'date': date_str,
                    'activities': daily_activities,
                    'total_estimated_cost': sum(a.get('cost', 0) for a in daily_activities)
                }
                current_date += timedelta(days=1)

            # 4. Update Itinerary
            updates = {
                'days': daily_itinerary,
                'status': 'planned',
                'updated_at': datetime.now().isoformat()
            }
            
            if app.config['MONGODB_CONNECTED'] and db is not None:
                db.itineraries.update_one({"id": itinerary_id}, {"$set": updates})
                # Re-fetch
                itinerary = db.itineraries.find_one({"id": itinerary_id})
                itinerary.pop('_id', None)
                
                # Convert dates for JSON
                if isinstance(itinerary.get('created_at'), datetime):
                    itinerary['created_at'] = itinerary['created_at'].isoformat()
            else:
                in_memory_db['itineraries'][itinerary_id].update(updates)
                itinerary = in_memory_db['itineraries'][itinerary_id]

            return jsonify({"success": True, "data": itinerary, "message": "Itinerary generated"}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    def _get_weather_forecast(destination, start_date, end_date):
        """Get weather forecast for a destination and date range"""
        # Mock weather data
        weather_conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'thunderstorm', 'snowy']
        
        # Calculate number of days
        days = (end_date - start_date).days + 1
        
        # Generate forecast for each day
        forecast = []
        total_temp = 0
        rain_days = 0
        
        import random
        from datetime import timedelta
        
        for i in range(days):
            # Generate random weather for each day
            condition = random.choice(weather_conditions)
            temp = random.randint(-5, 35)  # Temperature in Celsius
            total_temp += temp
            
            if condition in ['rainy', 'thunderstorm']:
                rain_days += 1
                
            forecast.append({
                'date': (start_date + timedelta(days=i)).strftime('%Y-%m-%d'),
                'condition': condition,
                'temp_min': temp - random.randint(2, 5),
                'temp_max': temp + random.randint(2, 5),
                'precipitation_chance': 80 if condition in ['rainy', 'thunderstorm'] else random.randint(0, 30)
            })
        
        # Calculate average temperature
        avg_temp = total_temp / days if days > 0 else 20
        
        return {
            'destination': destination,
            'start_date': start_date.strftime('%Y-%m-%d') if hasattr(start_date, 'strftime') else start_date,
            'end_date': end_date.strftime('%Y-%m-%d') if hasattr(end_date, 'strftime') else end_date,
            'avg_temp': round(avg_temp, 1),
            'rain_days': rain_days,
            'conditions': list(set([f['condition'] for f in forecast])),
            'forecast': forecast
        }

    @app.route('/api/itinerary/<itinerary_id>/packing-list', methods=['POST', 'OPTIONS'])
    def generate_packing_list(itinerary_id):
        """Generate packing list"""
        if request.method == 'OPTIONS':
            return '', 204
            
        try:
            # 1. Fetch Itinerary
            itinerary = None
            if app.config['MONGODB_CONNECTED'] and db is not None:
                itinerary = db.itineraries.find_one({"id": itinerary_id})
                if itinerary: itinerary.pop('_id', None)
            else:
                itinerary = in_memory_db['itineraries'].get(itinerary_id)
                
            if not itinerary:
                return jsonify({"error": "Itinerary not found"}), 404
            
            # 2. Extract params
            destination = itinerary.get('destination', '')
            try:
                start_date = datetime.fromisoformat(itinerary.get('start_date', '').replace('Z', '+00:00'))
                end_date = datetime.fromisoformat(itinerary.get('end_date', '').replace('Z', '+00:00'))
            except:
                # Fallback if dates are strings
                 return jsonify({"error": "Invalid date format, please update itinerary"}), 400

            # 3. Get Weather & Activities
            weather_data = _get_weather_forecast(destination, start_date, end_date)
            
            activities = []
            for day in itinerary.get('days', {}).values():
                for activity in day.get('activities', []):
                     activities.append(activity.get('category', '').lower())

            # 4. Generate List
            # Base packing list
            packing_list = {
                'destination': destination,
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat(),
                'weather_forecast': weather_data,
                'categories': {}
            }
            
            # (Simplified generation logic from ported service)
            clothing = [{'item': 'T-shirts', 'quantity': 5, 'essential': True}]
            if weather_data['avg_temp'] < 15:
                clothing.append({'item': 'Jacket', 'quantity': 1, 'essential': True})
            
            packing_list['categories']['Clothing'] = clothing
            
            # 5. Update Itinerary
            updates = {
                'packing_list': packing_list,
                'updated_at': datetime.now().isoformat()
            }
            
            if app.config['MONGODB_CONNECTED'] and db is not None:
                db.itineraries.update_one({"id": itinerary_id}, {"$set": updates})
                # Re-fetch for response
                itinerary = db.itineraries.find_one({"id": itinerary_id})
                itinerary.pop('_id', None)
                if isinstance(itinerary.get('created_at'), datetime):
                   itinerary['created_at'] = itinerary['created_at'].isoformat()
            else:
                in_memory_db['itineraries'][itinerary_id].update(updates)
                itinerary = in_memory_db['itineraries'][itinerary_id]

            return jsonify({"success": True, "data": packing_list, "message": "Packing list generated"}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500
    
    @app.route('/api/itinerary/<itinerary_id>/stats', methods=['GET', 'OPTIONS'])
    def get_itinerary_stats(itinerary_id):
        """Get itinerary statistics"""
        if request.method == 'OPTIONS':
            return '', 204
            
        try:
            # 1. Fetch Itinerary
            itinerary = None
            if app.config['MONGODB_CONNECTED'] and db is not None:
                itinerary = db.itineraries.find_one({"id": itinerary_id})
                if itinerary: itinerary.pop('_id', None)
            else:
                itinerary = in_memory_db['itineraries'].get(itinerary_id)
                
            if not itinerary:
                return jsonify({"error": "Itinerary not found"}), 404
            
            # 2. Calculate Expenses
            total_expenses = 0
            expense_count = 0
            
            if app.config['MONGODB_CONNECTED'] and db is not None:
                expenses = db.expenses.find({"itineraryId": itinerary_id})
                for exp in expenses:
                    total_expenses += float(exp.get('amount', 0))
                    expense_count += 1
            else:
                for exp in in_memory_db['expenses'].values():
                    if str(exp.get('itineraryId')) == str(itinerary_id):
                        total_expenses += float(exp.get('amount', 0))
                        expense_count += 1
            
            # 3. Calculate Bookings
            total_transport = 0
            booking_count = 0
            
            if app.config['MONGODB_CONNECTED'] and db is not None:
                bookings = db.bookings.find({"itineraryId": itinerary_id})
                for b in bookings:
                    # bookings store 'cost' or 'price'
                    cost = float(b.get('cost', 0)) or float(b.get('price', 0))
                    total_transport += cost
                    booking_count += 1
            else:
                for b in in_memory_db['bookings'].values():
                    if str(b.get('itineraryId')) == str(itinerary_id):
                        cost = float(b.get('cost', 0)) or float(b.get('price', 0))
                        total_transport += cost
                        booking_count += 1

            stats = {
                'itinerary_id': itinerary_id,
                'destination': itinerary.get('destination'),
                'budget': itinerary.get('budget', 0),
                'expenses': {
                    'total': total_expenses,
                    'count': expense_count
                },
                'transport': {
                    'total': total_transport,
                    'count': booking_count
                },
                'total_cost': total_expenses + total_transport
            }
            
            return jsonify({"success": True, "data": stats}), 200

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/itinerary/<itinerary_id>/update', methods=['PUT', 'OPTIONS'])
    def update_itinerary(itinerary_id):
        """Mock update itinerary"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            
            # Update in MongoDB if connected
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.itineraries.update_one(
                        {"id": itinerary_id},
                        {"$set": data}
                    )
                    print(f"[SUCCESS] Itinerary updated in MongoDB: {itinerary_id}")
                except Exception as e:
                    print(f"[WARN] MongoDB update failed: {e}")
            
            # Update in-memory
            if itinerary_id in in_memory_db['itineraries']:
                in_memory_db['itineraries'][itinerary_id].update(data)
                
            return jsonify({"success": True, "data": data, "message": "Itinerary updated"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @app.route('/api/itinerary/<itinerary_id>/delete', methods=['DELETE', 'OPTIONS'])
    def delete_itinerary(itinerary_id):
        """Delete itinerary"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            # Delete from MongoDB if connected
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.itineraries.delete_one({"id": itinerary_id})
                    print(f"[SUCCESS] Itinerary deleted from MongoDB: {itinerary_id}")
                except Exception as e:
                    print(f"[WARN] MongoDB delete failed: {e}")
            
            # Delete from in-memory
            in_memory_db['itineraries'].pop(itinerary_id, None)
            
            return jsonify({"success": True, "message": "Itinerary deleted"}), 200
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
                    print(f"[SUCCESS] Expense saved to MongoDB: {expense_id}")
                except Exception as e:
                    print(f"[WARN] MongoDB save failed: {e}")
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
                print(f"[WARN] MongoDB query failed: {e}")
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
                print(f"[WARN] MongoDB query failed: {e}")
        
        expense = in_memory_db['expenses'].get(expense_id)
        if expense:
            return jsonify({"success": True, "data": expense}), 200
        
        return jsonify({"error": "Expense not found"}), 404
    
    @app.route('/api/expenses/<expense_id>/update', methods=['PUT', 'OPTIONS'])
    def update_expense(expense_id):
        """Update expense"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            
            # Update in MongoDB if connected
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.expenses.update_one(
                        {"id": expense_id},
                        {"$set": data}
                    )
                    print(f"[SUCCESS] Expense updated in MongoDB: {expense_id}")
                except Exception as e:
                    print(f"[WARN] MongoDB update failed: {e}")
            
            # Update in-memory
            if expense_id in in_memory_db['expenses']:
                in_memory_db['expenses'][expense_id].update(data)
                
            return jsonify({"success": True, "data": data, "message": "Expense updated"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    @app.route('/api/expenses/split-calculation/<itinerary_id>', methods=['GET', 'OPTIONS'])
    def calculate_expense_splits(itinerary_id):
        """Calculate expense splits"""
        if request.method == 'OPTIONS':
            return '', 204
            
        try:
            travelers_count = int(request.args.get('travelers_count', 2))
            
            expenses = []
            if app.config['MONGODB_CONNECTED'] and db is not None:
                cursor = db.expenses.find({"itineraryId": itinerary_id})
                for doc in cursor:
                    doc.pop('_id', None)
                    expenses.append(doc)
            else:
                for exp in in_memory_db['expenses'].values():
                    if str(exp.get('itineraryId')) == str(itinerary_id):
                        expenses.append(exp)
                        
            total_amount = sum(float(exp.get('amount', 0)) for exp in expenses)
            per_person = total_amount / travelers_count if travelers_count > 0 else 0
            
            splits = {}
            for exp in expenses:
                paid_by = exp.get('paid_by', 'Unknown')
                if paid_by not in splits:
                    splits[paid_by] = {'paid': 0, 'owes': 0}
                
                splits[paid_by]['paid'] += float(exp.get('amount', 0))
                
                split_among = exp.get('split_among', [])
                if split_among:
                    amount_per_person = float(exp.get('amount', 0)) / len(split_among)
                    for person in split_among:
                        if person not in splits:
                            splits[person] = {'paid': 0, 'owes': 0}
                        splits[person]['owes'] += amount_per_person

            settlements = []
            for person, totals in splits.items():
                balance = totals['paid'] - totals['owes']
                if balance > 0.01:
                    settlements.append({'person': person, 'amount': round(balance, 2), 'type': 'receives'})
                elif balance < -0.01:
                    settlements.append({'person': person, 'amount': round(abs(balance), 2), 'type': 'pays'})
            
            return jsonify({
                "success": True,
                "data": {
                    'total_amount': round(total_amount, 2),
                    'per_person': round(per_person, 2),
                    'travelers_count': travelers_count,
                    'splits': splits,
                    'settlements': settlements,
                    'expense_count': len(expenses)
                }
            }), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/expenses/category-summary/<itinerary_id>', methods=['GET', 'OPTIONS'])
    def get_expense_category_summary(itinerary_id):
        """Get expense summary by category"""
        if request.method == 'OPTIONS':
            return '', 204
            
        try:
            expenses = []
            if app.config['MONGODB_CONNECTED'] and db is not None:
                cursor = db.expenses.find({"itineraryId": itinerary_id})
                for doc in cursor:
                    doc.pop('_id', None)
                    expenses.append(doc)
            else:
                for exp in in_memory_db['expenses'].values():
                    if str(exp.get('itineraryId')) == str(itinerary_id):
                        expenses.append(exp)
            
            category_summary = {}
            for exp in expenses:
                category = exp.get('category', 'misc')
                if category not in category_summary:
                    category_summary[category] = {'total': 0, 'count': 0, 'items': []}
                
                category_summary[category]['total'] += float(exp.get('amount', 0))
                category_summary[category]['count'] += 1
                category_summary[category]['items'].append({
                    'id': exp.get('id'),
                    'description': exp.get('description'),
                    'amount': exp.get('amount'),
                    'paid_by': exp.get('paid_by')
                })
                
            return jsonify({"success": True, "data": category_summary}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/expenses/<expense_id>/delete', methods=['DELETE', 'OPTIONS'])
    def delete_expense(expense_id):
        """Delete expense from MongoDB"""
        if request.method == 'OPTIONS':
            return '', 204
        
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                db.expenses.delete_one({"id": expense_id})
                print(f"[SUCCESS] Expense deleted from MongoDB: {expense_id}")
            except Exception as e:
                print(f"[WARN] MongoDB delete failed: {e}")
        
        in_memory_db['expenses'].pop(expense_id, None)
        return jsonify({"success": True, "message": f"Expense {expense_id} deleted"}), 200
    
    # Transport/Booking Endpoints
    @app.route('/api/transport/options', methods=['GET', 'OPTIONS'])
    def get_transport_options():
        """Get available transport options"""
        if request.method == 'OPTIONS':
            return '', 204
            
        destination = request.args.get('destination', '')
        travelers = int(request.args.get('travelers', 1))
        
        # Mock data (Ported from TransportService)
        options = [
            {
                'id': 'jeep_001', 'type': 'jeep', 'name': 'Toyota Fortuner', 'capacity': 7, 
                'price_per_day': 150, 'rating': 4.8, 'reviews': 245, 
                'availability': 'Available', 'features': ['AC', 'GPS', 'Insurance', 'Fuel'],
                'destination': destination
            },
            {
                'id': 'jeep_002', 'type': 'jeep', 'name': 'Mahindra Bolero', 'capacity': 8, 
                'price_per_day': 130, 'rating': 4.6, 'reviews': 189, 
                'availability': 'Available', 'features': ['AC', 'Power Steering', 'Insurance'],
                'destination': destination
            },
            {
                'id': 'bike_001', 'type': 'bike', 'name': 'Royal Enfield Classic', 'capacity': 2, 
                'price_per_day': 50, 'rating': 4.9, 'reviews': 512, 
                'availability': 'Available', 'features': ['Helmet Included', 'Insurance', 'Navigation'],
                'destination': destination
            },
            {
                'id': 'cab_001', 'type': 'cab', 'name': 'Premium Sedan', 'capacity': 5, 
                'price_per_day': 80, 'rating': 4.7, 'reviews': 678, 
                'availability': 'Available', 'features': ['AC', 'GPS', 'Wifi', 'Insurance'],
                'destination': destination
            },
            {
                'id': 'cab_002', 'type': 'cab', 'name': 'Budget Hatchback', 'capacity': 4, 
                'price_per_day': 60, 'rating': 4.5, 'reviews': 421, 
                'availability': 'Available', 'features': ['AC', 'Insurance'],
                'destination': destination
            }
        ]
        
        # Filter by capacity
        filtered_options = [opt for opt in options if opt['capacity'] >= travelers]
        
        return jsonify({"success": True, "data": filtered_options}), 200

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
                    print(f"[SUCCESS] Booking saved to MongoDB: {booking_id}")
                except Exception as e:
                    print(f"[WARN] MongoDB save failed: {e}")
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
                print(f"[WARN] MongoDB query failed: {e}")
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
                print(f"[WARN] MongoDB query failed: {e}")
        
        booking = in_memory_db['bookings'].get(booking_id)
        if booking:
            return jsonify({"success": True, "data": booking}), 200
        
        return jsonify({"error": "Booking not found"}), 404
    
    @app.route('/api/transport/bookings/<booking_id>/update', methods=['PUT', 'OPTIONS'])
    def update_booking(booking_id):
        """Update booking"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            
            # Update in MongoDB if connected
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.bookings.update_one(
                        {"id": booking_id},
                        {"$set": data}
                    )
                    print(f"[SUCCESS] Booking updated in MongoDB: {booking_id}")
                except Exception as e:
                    print(f"[WARN] MongoDB update failed: {e}")
            
            # Update in-memory
            if booking_id in in_memory_db['bookings']:
                in_memory_db['bookings'][booking_id].update(data)
                
            return jsonify({"success": True, "data": data, "message": "Booking updated"}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 400

    # Initialize chat storage
    if 'chat_messages' not in in_memory_db:
        in_memory_db['chat_messages'] = []

    class NotificationService:
        @staticmethod
        def send_email(to_email, subject, body):
            print(f"📧 [EMAIL SIMULATION] To: {to_email}")
            print(f"   Subject: {subject}")
            print(f"   Body: {body}")
            # Placeholder for SMTP/SendGrid implementation
            return True

        @staticmethod
        def send_sms(to_phone, body):
            print(f"📱 [SMS SIMULATION] To: {to_phone}")
            print(f"   Message: {body}")
            # Placeholder for Twilio implementation
            return True

    @app.route('/api/itinerary/<itinerary_id>/chat', methods=['GET', 'OPTIONS'])
    def get_chat_messages(itinerary_id):
        """Get chat messages for an itinerary"""
        if request.method == 'OPTIONS':
            return '', 204
        
        messages = []
        
        # Fetch from MongoDB if connected
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                cursor = db.chat_messages.find({"itinerary_id": itinerary_id}).sort("timestamp", 1)
                for msg in cursor:
                    msg.pop('_id', None)
                    messages.append(msg)
            except Exception as e:
                print(f"[WARN] MongoDB chat fetch failed: {e}")
                # Fallback to in-memory
                messages = [m for m in in_memory_db.get('chat_messages', []) if str(m.get('itinerary_id')) == str(itinerary_id)]
        else:
            # In-memory storage
            messages = [m for m in in_memory_db.get('chat_messages', []) if str(m.get('itinerary_id')) == str(itinerary_id)]
            
        return jsonify({"success": True, "data": messages}), 200

    @app.route('/api/itinerary/<itinerary_id>/chat', methods=['POST', 'OPTIONS'])
    def post_chat_message(itinerary_id):
        """Post a new chat message"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            if not data or 'text' not in data or 'user' not in data:
                return jsonify({"error": "Missing text or user"}), 400

            new_message = {
                "id": str(uuid.uuid4()),
                "itinerary_id": itinerary_id,
                "user": data['user'],
                "text": data['text'],
                "timestamp": datetime.now().isoformat()
            }

            # Save to MongoDB
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.chat_messages.insert_one(new_message.copy())
                except Exception as e:
                    print(f"[WARN] MongoDB chat save failed: {e}")

            # Save to in-memory
            in_memory_db['chat_messages'].append(new_message)
            
            # --- START NOTIFICATION LOGIC ---
            # 1. Find the itinerary creator (Simulated logic)
            # In a real app, we'd fetch the itinerary and check its 'creator_id' or 'owner_email'
            creator_email = "creator@example.com" 
            creator_phone = "+1234567890"
            
            # 2. Check if the sender is NOT the creator
            if data['user'] != "Creator": 
                # Notify via Email
                NotificationService.send_email(
                    creator_email,
                    f"New Message on Itinerary {itinerary_id}",
                    f"{data['user']} says: {data['text']}"
                )
                
                # Notify via SMS
                NotificationService.send_sms(
                    creator_phone,
                    f"AI Tour Planner: New message from {data['user']}: {data['text'][:50]}..."
                )
            # --- END NOTIFICATION LOGIC ---

            return jsonify({"success": True, "data": new_message}), 201

        except Exception as e:
            return jsonify({"error": str(e)}), 500

    # --- AUTHENTICATION ENDPOINTS ---
    
    # Initialize users storage
    if 'users' not in in_memory_db:
        in_memory_db['users'] = {} # Key: email, Value: user_obj

    @app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
    def register_user():
        """Register a new user"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            required_fields = ['email', 'password', 'fullName']
            if not all(field in data for field in required_fields):
                return jsonify({"error": "Missing required fields"}), 400
            
            email = data['email'].lower().strip()
            
            # Check if user exists (In-Memory)
            if email in in_memory_db['users']:
                return jsonify({"error": "User already exists"}), 400
                
            # Check if user exists (MongoDB)
            if app.config['MONGODB_CONNECTED'] and db is not None:
                existing_user = db.users.find_one({"email": email})
                if existing_user:
                    return jsonify({"error": "User already exists"}), 400
            
            new_user = {
                "id": str(uuid.uuid4()),
                "email": email,
                "password": data['password'], # In production, HASH this!
                "fullName": data['fullName'],
                "mobile": data.get('mobile', ''),
                "createdAt": datetime.now().isoformat()
            }
            
            # Save to MongoDB
            if app.config['MONGODB_CONNECTED'] and db is not None:
                try:
                    db.users.insert_one(new_user.copy())
                    print(f"[SUCCESS] User registered in MongoDB: {email}")
                except Exception as e:
                    print(f"[WARN] MongoDB user save failed: {e}")
            
            # Save to In-Memory
            in_memory_db['users'][email] = new_user
            
            # Return user info (no password)
            user_response = {k: v for k, v in new_user.items() if k != 'password'}
            return jsonify({"success": True, "data": user_response, "message": "Registration successful"}), 201
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
    def login_user():
        """Login user"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            if not data or 'email' not in data or 'password' not in data:
                return jsonify({"error": "Missing email or password"}), 400
            
            email = data['email'].lower().strip()
            password = data['password']
            
            user = None
            
            # Check MongoDB first
            if app.config['MONGODB_CONNECTED'] and db is not None:
                user = db.users.find_one({"email": email})
                if user:
                    user['id'] = str(user.pop('_id')) # Convert ObjectId to string
            
            # Fallback to In-Memory if not found or DB not connected
            if not user:
                user = in_memory_db['users'].get(email)
            
            if not user or user['password'] != password:
                return jsonify({"error": "Invalid email or password"}), 401
            
            # Return user info (no password)
            user_response = {k: v for k, v in user.items() if k != 'password'}
            token = f"mock-jwt-token-{user['id']}" # Mock token
            
            return jsonify({
                "success": True, 
                "data": { "user": user_response, "token": token }, 
                "message": "Login successful"
            }), 200
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/auth/profile', methods=['PUT', 'OPTIONS'])
    def update_profile():
        """Update user profile"""
        if request.method == 'OPTIONS':
            return '', 204
        
        try:
            data = request.get_json()
            email = data.get('email')
            
            if not email:
                return jsonify({"error": "Email is required to identify user"}), 400

            # Update in MongoDB if connected
            if app.config['MONGODB_CONNECTED'] and db is not None:
                db.users.update_one(
                    {"email": email},
                    {"$set": {
                        "fullName": data.get('fullName'),
                        "mobile": data.get('mobile')
                    }}
                )
            
            # Update in-memory
            if email in in_memory_db['users']:
                user = in_memory_db['users'][email]
                if 'fullName' in data: user['fullName'] = data['fullName']
                if 'mobile' in data: user['mobile'] = data['mobile']
                
                # Return updated user
                user_response = {k: v for k, v in user.items() if k != 'password'}
                return jsonify({"success": True, "data": user_response, "message": "Profile updated"}), 200
            
            return jsonify({"error": "User not found"}), 404
            
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route('/api/transport/bookings/<booking_id>/delete', methods=['DELETE', 'OPTIONS'])
    def delete_booking(booking_id):
        """Delete booking from MongoDB"""
        if request.method == 'OPTIONS':
            return '', 204
        
        if app.config['MONGODB_CONNECTED'] and db is not None:
            try:
                db.bookings.delete_one({"id": booking_id})
                print(f"[SUCCESS] Booking deleted from MongoDB: {booking_id}")
            except Exception as e:
                print(f"[WARN] MongoDB delete failed: {e}")
                
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
    print("[INFO] Starting AI Tour Planner Backend")
    print(f"[INFO] Server running primarily on http://localhost:5000")
    print("---------------------------------------------------")
    app.run(debug=True, host='0.0.0.0', port=5000)
