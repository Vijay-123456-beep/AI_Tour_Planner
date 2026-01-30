import json
import random
from datetime import datetime, timedelta
from firebase_admin import firestore
import requests
from geopy.distance import geodesic
import uuid

class ItineraryService:
    def __init__(self):
        self.db = firestore.client()
        self.weather_api_key = 'YOUR_WEATHER_API_KEY'  # Replace with actual API key
        self.places_api_key = 'YOUR_GOOGLE_PLACES_API_KEY'  # Replace with actual API key
        
    def create_itinerary(self, user_id, destination, start_date, end_date, travelers, budget, interests, preferences=None):
        """Create a new travel itinerary"""
        if not preferences:
            preferences = {}
            
        # Basic validation
        try:
            start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            if start_date >= end_date:
                raise ValueError('End date must be after start date')
        except (ValueError, AttributeError):
            raise ValueError('Invalid date format. Use ISO 8601 format (e.g., 2023-12-01T00:00:00Z)')
            
        # Create itinerary document
        itinerary_id = str(uuid.uuid4())
        itinerary_ref = self.db.collection('itineraries').document(itinerary_id)
        
        # Get user details
        user_ref = self.db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise Exception('User not found')
            
        user_data = user_doc.to_dict()
        
        # Create itinerary data
        itinerary_data = {
            'id': itinerary_id,
            'user_id': user_id,
            'destination': destination,
            'start_date': start_date,
            'end_date': end_date,
            'travelers': travelers,
            'budget': float(budget),
            'interests': interests,
            'preferences': preferences,
            'status': 'draft',  # draft, planned, in_progress, completed, cancelled
            'created_at': firestore.SERVER_TIMESTAMP,
            'updated_at': firestore.SERVER_TIMESTAMP,
            'members': [{
                'user_id': user_id,
                'name': user_data.get('name', 'Traveler'),
                'email': user_data.get('email'),
                'role': 'owner',
                'joined_at': firestore.SERVER_TIMESTAMP
            }],
            'days': {},
            'total_estimated_cost': 0,
            'currency': preferences.get('currency', 'USD')
        }
        
        # Save to Firestore
        itinerary_ref.set(itinerary_data)
        
        # Add reference to user's trips
        user_ref.update({
            'trips': firestore.ArrayUnion([itinerary_id])
        })
        
        return itinerary_data
    
    def get_itinerary(self, user_id, itinerary_id):
        """Get a specific itinerary with authorization check"""
        itinerary_ref = self.db.collection('itineraries').document(itinerary_id)
        itinerary_doc = itinerary_ref.get()
        
        if not itinerary_doc.exists:
            raise Exception('Itinerary not found')
            
        itinerary_data = itinerary_doc.to_dict()
        
        # Check if user has access to this itinerary
        if user_id not in [m['user_id'] for m in itinerary_data.get('members', [])]:
            raise Exception('You do not have permission to view this itinerary')
            
        return itinerary_data
    
    def get_user_itineraries(self, user_id):
        """Get all itineraries for a user"""
        # Get user document to get list of trip IDs
        user_ref = self.db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if not user_doc.exists:
            raise Exception('User not found')
            
        user_data = user_doc.to_dict()
        trip_ids = user_data.get('trips', [])
        
        # Get all itineraries for these IDs
        itineraries = []
        for trip_id in trip_ids:
            try:
                itinerary_ref = self.db.collection('itineraries').document(trip_id)
                itinerary_doc = itinerary_ref.get()
                
                if itinerary_doc.exists:
                    itinerary_data = itinerary_doc.to_dict()
                    # Convert Firestore timestamps to ISO format
                    for field in ['start_date', 'end_date', 'created_at', 'updated_at']:
                        if field in itinerary_data and hasattr(itinerary_data[field], 'isoformat'):
                            itinerary_data[field] = itinerary_data[field].isoformat()
                    itineraries.append(itinerary_data)
            except Exception as e:
                print(f"Error fetching itinerary {trip_id}: {str(e)}")
                continue
                
        return itineraries
    
    def update_itinerary(self, user_id, itinerary_id, updates):
        """Update an existing itinerary"""
        itinerary_ref = self.db.collection('itineraries').document(itinerary_id)
        itinerary_doc = itinerary_ref.get()
        
        if not itinerary_doc.exists:
            raise Exception('Itinerary not found')
            
        itinerary_data = itinerary_doc.to_dict()
        
        # Check if user has permission to update
        if user_id not in [m['user_id'] for m in itinerary_data.get('members', [])]:
            raise Exception('You do not have permission to update this itinerary')
            
        # Prepare updates
        valid_fields = ['destination', 'start_date', 'end_date', 'travelers', 'budget', 'interests', 'preferences', 'status']
        update_data = {}
        
        for field, value in updates.items():
            if field in valid_fields:
                update_data[field] = value
                
        # Add updated_at timestamp
        update_data['updated_at'] = firestore.SERVER_TIMESTAMP
        
        # Update the document
        itinerary_ref.update(update_data)
        
        # Return the updated itinerary
        updated_doc = itinerary_ref.get()
        return updated_doc.to_dict()
    
    def generate_itinerary(self, user_id, itinerary_id, generation_params=None):
        """Generate a travel itinerary using AI and optimization"""
        if generation_params is None:
            generation_params = {}
            
        # Get the itinerary
        itinerary_ref = self.db.collection('itineraries').document(itinerary_id)
        itinerary_doc = itinerary_ref.get()
        
        if not itinerary_doc.exists:
            raise Exception('Itinerary not found')
            
        itinerary_data = itinerary_doc.to_dict()
        
        # Check if user has permission
        if user_id not in [m['user_id'] for m in itinerary_data.get('members', [])]:
            raise Exception('You do not have permission to generate this itinerary')
            
        # Get destination details
        destination = itinerary_data['destination']
        start_date = itinerary_data['start_date']
        end_date = itinerary_data['end_date']
        days = (end_date - start_date).days + 1
        
        # Get points of interest based on interests
        interests = itinerary_data.get('interests', [])
        places = self._get_points_of_interest(destination, interests)
        
        # Group places by categories (attractions, restaurants, etc.)
        places_by_category = {}
        for place in places:
            category = place.get('category', 'other')
            if category not in places_by_category:
                places_by_category[category] = []
            places_by_category[category].append(place)
        
        # Generate daily itinerary
        daily_itinerary = {}
        current_date = start_date
        
        for day in range(1, days + 1):
            daily_activities = []
            
            # Morning activity (usually an attraction)
            if 'attractions' in places_by_category and places_by_category['attractions']:
                morning_activity = random.choice(places_by_category['attractions'])
                daily_activities.append({
                    'time': '09:00',
                    'activity': f"Visit {morning_activity['name']}",
                    'location': morning_activity['location'],
                    'duration': '2 hours',
                    'cost': morning_activity.get('price', 0),
                    'category': 'attraction',
                    'place_id': morning_activity['id']
                })
            
            # Lunch
            if 'restaurants' in places_by_category and places_by_category['restaurants']:
                lunch_place = random.choice(places_by_category['restaurants'])
                daily_activities.append({
                    'time': '12:00',
                    'activity': f"Lunch at {lunch_place['name']}",
                    'location': lunch_place['location'],
                    'duration': '1 hour',
                    'cost': lunch_place.get('price', 0) * 1.2,  # Add 20% for drinks, etc.
                    'category': 'food',
                    'place_id': lunch_place['id']
                })
            
            # Afternoon activity
            if 'attractions' in places_by_category and len(places_by_category['attractions']) > 1:
                # Try to find an attraction different from the morning one
                afternoon_options = [p for p in places_by_category['attractions'] 
                                   if p['id'] != morning_activity['id']]
                if afternoon_options:
                    afternoon_activity = random.choice(afternoon_options)
                    daily_activities.append({
                        'time': '14:00',
                        'activity': f"Visit {afternoon_activity['name']}",
                        'location': afternoon_activity['location'],
                        'duration': '2 hours',
                        'cost': afternoon_activity.get('price', 0),
                        'category': 'attraction',
                        'place_id': afternoon_activity['id']
                    })
            
            # Dinner
            if 'restaurants' in places_by_category and len(places_by_category['restaurants']) > 1:
                # Choose a different restaurant for dinner
                dinner_options = [p for p in places_by_category['restaurants'] 
                                if p['id'] != lunch_place['id']]
                if dinner_options:
                    dinner_place = random.choice(dinner_options)
                    daily_activities.append({
                        'time': '19:00',
                        'activity': f"Dinner at {dinner_place['name']}",
                        'location': dinner_place['location'],
                        'duration': '1.5 hours',
                        'cost': dinner_place.get('price', 0) * 1.3,  # Add 30% for drinks, etc.
                        'category': 'food',
                        'place_id': dinner_place['id']
                    })
            
            # Add to daily itinerary
            date_str = current_date.strftime('%Y-%m-%d')
            daily_itinerary[date_str] = {
                'day': day,
                'date': date_str,
                'activities': daily_activities,
                'total_estimated_cost': sum(a.get('cost', 0) for a in daily_activities)
            }
            
            current_date += timedelta(days=1)
        
        # Calculate total estimated cost
        total_estimated_cost = sum(day['total_estimated_cost'] for day in daily_itinerary.values())
        
        # Update itinerary with generated data
        update_data = {
            'days': daily_itinerary,
            'total_estimated_cost': total_estimated_cost,
            'status': 'planned',
            'updated_at': firestore.SERVER_TIMESTAMP
        }
        
        itinerary_ref.update(update_data)
        
        # Return the updated itinerary
        updated_doc = itinerary_ref.get()
        return updated_doc.to_dict()
    
    def generate_packing_list(self, user_id, itinerary_id):
        """Generate a packing list based on the itinerary"""
        # Get the itinerary
        itinerary_ref = self.db.collection('itineraries').document(itinerary_id)
        itinerary_doc = itinerary_ref.get()
        
        if not itinerary_doc.exists:
            raise Exception('Itinerary not found')
            
        itinerary_data = itinerary_doc.to_dict()
        
        # Check if user has permission
        if user_id not in [m['user_id'] for m in itinerary_data.get('members', [])]:
            raise Exception('You do not have permission to view this itinerary')
        
        # Get destination and travel dates
        destination = itinerary_data['destination']
        start_date = itinerary_data['start_date']
        end_date = itinerary_data['end_date']
        days = (end_date - start_date).days + 1
        
        # Get weather forecast for the destination
        weather_data = self._get_weather_forecast(destination, start_date, end_date)
        
        # Get activities from the itinerary to determine needed items
        activities = []
        for day in itinerary_data.get('days', {}).values():
            for activity in day.get('activities', []):
                activities.append(activity.get('category', '').lower())
        
        # Base packing list
        packing_list = {
            'destination': destination,
            'start_date': start_date.isoformat() if hasattr(start_date, 'isoformat') else start_date,
            'end_date': end_date.isoformat() if hasattr(end_date, 'isoformat') else end_date,
            'weather_forecast': weather_data,
            'categories': {}
        }
        
        # Clothing based on weather
        avg_temp = weather_data.get('avg_temp', 20)  # Default to 20°C if no forecast
        
        clothing = []
        if avg_temp > 25:  # Hot weather
            clothing.extend([
                {'item': 'T-shirts', 'quantity': days + 2, 'essential': True},
                {'item': 'Shorts', 'quantity': days // 2, 'essential': True},
                {'item': 'Sunglasses', 'quantity': 1, 'essential': True},
                {'item': 'Sun hat', 'quantity': 1, 'essential': True},
                {'item': 'Swimsuit', 'quantity': 1, 'essential': 'beach' in activities},
            ])
        elif avg_temp < 10:  # Cold weather
            clothing.extend([
                {'item': 'Warm jacket', 'quantity': 1, 'essential': True},
                {'item': 'Sweaters', 'quantity': days // 2 + 1, 'essential': True},
                {'item': 'Thermal underwear', 'quantity': 2, 'essential': True},
                {'item': 'Gloves', 'quantity': 1, 'essential': True},
                {'item': 'Winter hat', 'quantity': 1, 'essential': True},
                {'item': 'Scarf', 'quantity': 1, 'essential': True},
            ])
        else:  # Moderate weather
            clothing.extend([
                {'item': 'T-shirts', 'quantity': days, 'essential': True},
                {'item': 'Long-sleeve shirts', 'quantity': 2, 'essential': True},
                {'item': 'Light jacket', 'quantity': 1, 'essential': True},
                {'item': 'Jeans/Pants', 'quantity': days // 2, 'essential': True},
            ])
        
        # Add weather-specific items
        if weather_data.get('rain_days', 0) > 0:
            clothing.extend([
                {'item': 'Rain jacket', 'quantity': 1, 'essential': True},
                {'item': 'Umbrella', 'quantity': 1, 'essential': True},
                {'item': 'Waterproof shoes', 'quantity': 1, 'essential': True},
            ])
        
        packing_list['categories']['Clothing'] = clothing
        
        # Footwear
        footwear = [
            {'item': 'Comfortable walking shoes', 'quantity': 1, 'essential': True},
        ]
        
        if 'beach' in activities:
            footwear.append({'item': 'Sandals/Flip flops', 'quantity': 1, 'essential': True})
            
        if 'hiking' in activities or 'outdoor' in activities:
            footwear.append({'item': 'Hiking boots', 'quantity': 1, 'essential': 'hiking' in activities})
            
        packing_list['categories']['Footwear'] = footwear
        
        # Toiletries
        toiletries = [
            {'item': 'Toothbrush', 'quantity': 1, 'essential': True},
            {'item': 'Toothpaste', 'quantity': 1, 'essential': True},
            {'item': 'Deodorant', 'quantity': 1, 'essential': True},
            {'item': 'Shampoo/Conditioner', 'quantity': 1, 'essential': True},
            {'item': 'Body wash/Soap', 'quantity': 1, 'essential': True},
            {'item': 'Razor/Shaving cream', 'quantity': 1, 'essential': False},
            {'item': 'Sunscreen', 'quantity': 1, 'essential': avg_temp > 15},
            {'item': 'Lip balm', 'quantity': 1, 'essential': avg_temp < 10 or 'sunny' in weather_data.get('conditions', [])},
            {'item': 'First aid kit', 'quantity': 1, 'essential': True},
            {'item': 'Prescription medications', 'quantity': 'As needed', 'essential': True},
        ]
        
        packing_list['categories']['Toiletries'] = toiletries
        
        # Electronics
        electronics = [
            {'item': 'Phone', 'quantity': 1, 'essential': True},
            {'item': 'Phone charger', 'quantity': 1, 'essential': True},
            {'item': 'Power bank', 'quantity': 1, 'essential': True},
            {'item': 'Universal travel adapter', 'quantity': 1, 'essential': 'international' in itinerary_data.get('trip_type', '')},
            {'item': 'Headphones', 'quantity': 1, 'essential': False},
            {'item': 'Camera', 'quantity': 1, 'essential': False},
            {'item': 'Laptop/Tablet', 'quantity': 1, 'essential': False},
        ]
        
        packing_list['categories']['Electronics'] = electronics
        
        # Travel documents
        documents = [
            {'item': 'Passport/ID', 'quantity': 1, 'essential': True},
            {'item': 'Travel insurance', 'quantity': 1, 'essential': 'international' in itinerary_data.get('trip_type', '')},
            {'item': 'Boarding passes/Itinerary', 'quantity': 1, 'essential': True},
            {'item': 'Hotel/Airbnb reservations', 'quantity': 1, 'essential': True},
            {'item': 'Credit/Debit cards', 'quantity': 2, 'essential': True},
            {'item': 'Emergency contacts', 'quantity': 1, 'essential': True},
        ]
        
        packing_list['categories']['Documents'] = documents
        
        # Activity-specific items
        activity_items = []
        
        if 'beach' in activities:
            activity_items.extend([
                {'item': 'Beach towel', 'quantity': 1, 'essential': True},
                {'item': 'Beach bag', 'quantity': 1, 'essential': True},
                {'item': 'Snorkel gear', 'quantity': 1, 'essential': False},
            ])
            
        if 'hiking' in activities:
            activity_items.extend([
                {'item': 'Backpack', 'quantity': 1, 'essential': True},
                {'item': 'Water bottle', 'quantity': 1, 'essential': True},
                {'item': 'Hiking poles', 'quantity': 2, 'essential': False},
                {'item': 'Compass', 'quantity': 1, 'essential': False},
            ])
            
        if 'business' in activities:
            activity_items.extend([
                {'item': 'Business cards', 'quantity': 10, 'essential': True},
                {'item': 'Notebook/Pen', 'quantity': 1, 'essential': True},
                {'item': 'Laptop', 'quantity': 1, 'essential': True},
            ])
            
        if activity_items:
            packing_list['categories']['Activity-Specific'] = activity_items
        
        # Miscellaneous
        misc = [
            {'item': 'Reusable water bottle', 'quantity': 1, 'essential': True},
            {'item': 'Snacks', 'quantity': 'As needed', 'essential': True},
            {'item': 'Books/E-reader', 'quantity': 1, 'essential': False},
            {'item': 'Travel pillow', 'quantity': 1, 'essential': False},
            {'item': 'Earplugs', 'quantity': 1, 'essential': False},
            {'item': 'Eye mask', 'quantity': 1, 'essential': False},
        ]
        
        packing_list['categories']['Miscellaneous'] = misc
        
        # Update itinerary with packing list
        itinerary_ref.update({
            'packing_list': packing_list,
            'updated_at': firestore.SERVER_TIMESTAMP
        })
        
        return packing_list
    
    def _get_points_of_interest(self, destination, interests, max_results=20):
        """Get points of interest for a destination using Google Places API"""
        # In a real implementation, this would call the Google Places API
        # For demo purposes, we'll return mock data
        
        # Mock data for different destinations
        mock_places = {
            'paris': [
                {'id': 'eiffel_tower', 'name': 'Eiffel Tower', 'category': 'attraction', 'location': 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France', 'price': 25.00, 'rating': 4.7, 'description': 'Iconic 324m tall wrought-iron lattice tower with a top level observation deck & restaurants.'},
                {'id': 'louvre', 'name': 'Louvre Museum', 'category': 'museum', 'location': 'Rue de Rivoli, 75001 Paris, France', 'price': 17.00, 'rating': 4.7, 'description': 'Landmark art museum with vast collection from all over the world, including the Mona Lisa.'},
                {'id': 'notre_dame', 'name': 'Notre-Dame Cathedral', 'category': 'attraction', 'location': '6 Parvis Notre-Dame - Pl. Jean-Paul II, 75004 Paris, France', 'price': 0.00, 'rating': 4.8, 'description': 'Towering, 13th-century cathedral with flying buttresses & gargoyles, setting for Hugo\'s novel.'},
                {'id': 'le_cinq', 'name': 'Le Cinq', 'category': 'restaurant', 'location': '31 Av. George V, 75008 Paris, France', 'price': 200.00, 'rating': 4.8, 'cuisine': 'French', 'dietary': ['vegetarian', 'vegan_options', 'gluten_free']},
                {'id': 'le_jules_verne', 'name': 'Le Jules Verne', 'category': 'restaurant', 'location': 'Eiffel Tower, 75007 Paris, France', 'price': 150.00, 'rating': 4.6, 'cuisine': 'French', 'dietary': ['vegetarian', 'vegan_options', 'gluten_free']},
            ],
            'new york': [
                {'id': 'statue_of_liberty', 'name': 'Statue of Liberty', 'category': 'attraction', 'location': 'New York, NY 10004, USA', 'price': 24.00, 'rating': 4.7, 'description': 'Iconic National Monument opened in 1886, offering guided tours & a museum.'},
                {'id': 'central_park', 'name': 'Central Park', 'category': 'park', 'location': 'New York, NY, USA', 'price': 0.00, 'rating': 4.8, 'description': 'Sprawling urban park with walking paths, a zoo, carousel, boat rentals & food stands.'},
                {'id': 'metropolitan_museum', 'name': 'The Metropolitan Museum of Art', 'category': 'museum', 'location': '1000 5th Ave, New York, NY 10028, USA', 'price': 25.00, 'rating': 4.8, 'description': 'A grand setting for one of the world\'s greatest collections of art, from ancient to contemporary.'},
                {'id': 'eleven_madison_park', 'name': 'Eleven Madison Park', 'category': 'restaurant', 'location': '11 Madison Ave, New York, NY 10010, USA', 'price': 335.00, 'rating': 4.8, 'cuisine': 'American', 'dietary': ['vegetarian', 'vegan', 'gluten_free']},
                {'id': 'peter_luger', 'name': 'Peter Luger Steak House', 'category': 'restaurant', 'location': '255 Northern Blvd, Great Neck, NY 11021, USA', 'price': 100.00, 'rating': 4.6, 'cuisine': 'Steakhouse', 'dietary': []},
            ],
            'tokyo': [
                {'id': 'sensoji', 'name': 'Sensō-ji', 'category': 'temple', 'location': '2 Chome-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan', 'price': 0.00, 'rating': 4.6, 'description': 'Completed in 645, this temple, Tokyo\'s oldest, was built after the discovery of a statuette of the Buddhist deity Kannon.'},
                {'id': 'shibuya_crossing', 'name': 'Shibuya Crossing', 'category': 'attraction', 'location': 'Shibuya City, Tokyo 150-8010, Japan', 'price': 0.00, 'rating': 4.5, 'description': 'Busy intersection in front of Shibuya Station, known for its large video screens & throngs of pedestrians.'},
                {'id': 'tsukiji_outer_market', 'name': 'Tsukiji Outer Market', 'category': 'market', 'location': '4 Chome-16-2 Tsukiji, Chuo City, Tokyo 104-0045, Japan', 'price': 0.00, 'rating': 4.5, 'description': 'Bustling market with vendors selling fresh seafood, produce & more, plus small restaurants.'},
                {'id': 'sukiyabashi_jiro', 'name': 'Sukiyabashi Jiro', 'category': 'restaurant', 'location': '4 Chome-2-15 Ginza, Chuo City, Tokyo 104-0061, Japan', 'price': 300.00, 'rating': 4.8, 'cuisine': 'Sushi', 'dietary': ['seafood']},
                {'id': 'narisawa', 'name': 'Narisawa', 'category': 'restaurant', 'location': '2 Chome-6-15 Minamiaoyama, Minato City, Tokyo 107-0062, Japan', 'price': 250.00, 'rating': 4.7, 'cuisine': 'Japanese', 'dietary': ['vegetarian', 'seafood']},
            ]
        }
        
        # Normalize destination name for lookup
        dest_key = destination.lower().strip()
        
        # If we have mock data for this destination, use it; otherwise return generic places
        if dest_key in mock_places:
            places = mock_places[dest_key]
        else:
            # Generic places if destination not in our mock data
            places = [
                {'id': 'attraction1', 'name': f'Main Attraction in {destination}', 'category': 'attraction', 'location': 'Main Street', 'price': 15.00, 'rating': 4.5, 'description': 'A popular attraction in the area.'},
                {'id': 'museum1', 'name': f'{destination} Museum', 'category': 'museum', 'location': 'Museum District', 'price': 12.00, 'rating': 4.3, 'description': 'Explore the history and culture of the region.'},
                {'id': 'restaurant1', 'name': f'Local {destination} Cuisine', 'category': 'restaurant', 'location': 'Downtown', 'price': 30.00, 'rating': 4.4, 'cuisine': 'Local', 'dietary': ['vegetarian']},
                {'id': 'park1', 'name': f'{destination} Central Park', 'category': 'park', 'location': 'City Center', 'price': 0.00, 'rating': 4.6, 'description': 'A beautiful park in the heart of the city.'},
                {'id': 'shopping1', 'name': f'{destination} Market', 'category': 'shopping', 'location': 'Market Street', 'price': 0.00, 'rating': 4.2, 'description': 'Local market with various goods and souvenirs.'},
            ]
        
        # Filter by interests if provided
        if interests and len(interests) > 0:
            filtered_places = []
            for place in places:
                # Simple keyword matching for demo purposes
                place_categories = [place.get('category', '').lower()]
                place_categories.extend(place.get('cuisine', '').lower().split())
                place_categories.extend(place.get('dietary', []))
                
                # Check if any interest matches place categories
                if any(interest.lower() in ' '.join(place_categories) for interest in interests):
                    filtered_places.append(place)
            
            # If filtering removed all places, use the original list
            if filtered_places:
                places = filtered_places
        
        return places[:max_results]
    
    def _get_weather_forecast(self, destination, start_date, end_date):
        """Get weather forecast for a destination and date range"""
        # In a real implementation, this would call a weather API
        # For demo purposes, we'll return mock data
        
        # Mock weather data
        weather_conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rainy', 'thunderstorm', 'snowy']
        
        # Calculate number of days
        days = (end_date - start_date).days + 1
        
        # Generate forecast for each day
        forecast = []
        total_temp = 0
        rain_days = 0
        
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
