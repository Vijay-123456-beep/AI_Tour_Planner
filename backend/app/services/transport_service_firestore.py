"""
Firestore service module for transport booking management
Replaces in-memory storage with persistent Firestore database
"""
from firebase_admin import firestore
from datetime import datetime
from typing import List, Dict, Optional

class TransportService:
    def __init__(self):
        self.db = firestore.client()
        self.collection = 'transport_bookings'
    
    def add_booking(self, user_id: str, itinerary_id: str, booking_data: Dict) -> Dict:
        """Add a new transport booking"""
        try:
            booking_doc = {
                'user_id': user_id,
                'itinerary_id': itinerary_id,
                'type': booking_data.get('type', 'cab'),
                'pickup_location': booking_data.get('pickup_location'),
                'dropoff_location': booking_data.get('dropoff_location'),
                'date': booking_data.get('date'),
                'passengers': int(booking_data.get('passengers', 1)),
                'price': float(booking_data.get('price', 0)),
                'status': 'confirmed',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Add to Firestore
            doc_ref = self.db.collection(self.collection).add(booking_doc)
            doc_id = doc_ref[1].id
            booking_doc['id'] = doc_id
            
            return booking_doc
        except Exception as e:
            raise Exception(f"Error adding booking: {str(e)}")
    
    def get_itinerary_bookings(self, user_id: str, itinerary_id: str) -> List[Dict]:
        """Get all transport bookings for an itinerary"""
        try:
            bookings = []
            docs = self.db.collection(self.collection)\
                .where('user_id', '==', user_id)\
                .where('itinerary_id', '==', itinerary_id)\
                .order_by('date', direction=firestore.Query.ASCENDING)\
                .stream()
            
            for doc in docs:
                booking = doc.to_dict()
                booking['id'] = doc.id
                bookings.append(booking)
            
            return bookings
        except Exception as e:
            raise Exception(f"Error fetching bookings: {str(e)}")
    
    def get_user_bookings(self, user_id: str) -> List[Dict]:
        """Get all transport bookings for a user"""
        try:
            bookings = []
            docs = self.db.collection(self.collection)\
                .where('user_id', '==', user_id)\
                .order_by('date', direction=firestore.Query.DESCENDING)\
                .stream()
            
            for doc in docs:
                booking = doc.to_dict()
                booking['id'] = doc.id
                bookings.append(booking)
            
            return bookings
        except Exception as e:
            raise Exception(f"Error fetching user bookings: {str(e)}")
    
    def delete_booking(self, user_id: str, booking_id: str) -> bool:
        """Delete a booking"""
        try:
            # Get the booking to verify ownership
            doc = self.db.collection(self.collection).document(booking_id).get()
            
            if not doc.exists:
                raise Exception("Booking not found")
            
            booking = doc.to_dict()
            if booking.get('user_id') != user_id:
                raise Exception("Unauthorized - cannot delete this booking")
            
            # Delete the document
            self.db.collection(self.collection).document(booking_id).delete()
            return True
        except Exception as e:
            raise Exception(f"Error deleting booking: {str(e)}")
    
    def update_booking(self, user_id: str, booking_id: str, updates: Dict) -> Dict:
        """Update a booking"""
        try:
            # Get the booking to verify ownership
            doc = self.db.collection(self.collection).document(booking_id).get()
            
            if not doc.exists:
                raise Exception("Booking not found")
            
            booking = doc.to_dict()
            if booking.get('user_id') != user_id:
                raise Exception("Unauthorized - cannot update this booking")
            
            # Prepare update data
            update_data = {}
            allowed_fields = ['pickup_location', 'dropoff_location', 'date', 'passengers', 'price', 'status']
            
            for field in allowed_fields:
                if field in updates:
                    if field == 'passengers':
                        update_data[field] = int(updates[field])
                    elif field == 'price':
                        update_data[field] = float(updates[field])
                    else:
                        update_data[field] = updates[field]
            
            update_data['updated_at'] = datetime.utcnow()
            
            # Update in Firestore
            self.db.collection(self.collection).document(booking_id).update(update_data)
            
            # Return updated booking
            updated_doc = self.db.collection(self.collection).document(booking_id).get()
            updated_booking = updated_doc.to_dict()
            updated_booking['id'] = booking_id
            
            return updated_booking
        except Exception as e:
            raise Exception(f"Error updating booking: {str(e)}")
    
    def get_booking_details(self, user_id: str, booking_id: str) -> Dict:
        """Get details of a specific booking"""
        try:
            doc = self.db.collection(self.collection).document(booking_id).get()
            
            if not doc.exists:
                raise Exception("Booking not found")
            
            booking = doc.to_dict()
            if booking.get('user_id') != user_id:
                raise Exception("Unauthorized - cannot access this booking")
            
            booking['id'] = booking_id
            return booking
        except Exception as e:
            raise Exception(f"Error fetching booking details: {str(e)}")
    
    def get_available_transport_options(self, destination: str, start_date: str, end_date: str, travelers: int) -> List[Dict]:
        """Get available transport options for a destination (mock data)"""
        try:
            # Mock data for demo - in production, this would query a real transport provider API
            options = [
                {
                    'id': 'jeep_001',
                    'type': 'jeep',
                    'name': 'Toyota Fortuner',
                    'capacity': 7,
                    'price_per_day': 150,
                    'rating': 4.8,
                    'reviews': 245,
                    'availability': 'Available',
                    'features': ['AC', 'GPS', 'Insurance', 'Fuel'],
                    'destination': destination
                },
                {
                    'id': 'jeep_002',
                    'type': 'jeep',
                    'name': 'Mahindra Bolero',
                    'capacity': 8,
                    'price_per_day': 130,
                    'rating': 4.6,
                    'reviews': 189,
                    'availability': 'Available',
                    'features': ['AC', 'Power Steering', 'Insurance'],
                    'destination': destination
                },
                {
                    'id': 'bike_001',
                    'type': 'bike',
                    'name': 'Royal Enfield Classic',
                    'capacity': 2,
                    'price_per_day': 50,
                    'rating': 4.9,
                    'reviews': 512,
                    'availability': 'Available',
                    'features': ['Helmet Included', 'Insurance', 'Navigation'],
                    'destination': destination
                },
                {
                    'id': 'bike_002',
                    'type': 'bike',
                    'name': 'Hero Honda Activa',
                    'capacity': 2,
                    'price_per_day': 40,
                    'rating': 4.7,
                    'reviews': 324,
                    'availability': 'Available',
                    'features': ['Helmet Included', 'Insurance'],
                    'destination': destination
                },
                {
                    'id': 'cab_001',
                    'type': 'cab',
                    'name': 'Premium Sedan',
                    'capacity': 5,
                    'price_per_day': 80,
                    'rating': 4.7,
                    'reviews': 678,
                    'availability': 'Available',
                    'features': ['AC', 'GPS', 'Wifi', 'Insurance'],
                    'destination': destination
                },
                {
                    'id': 'cab_002',
                    'type': 'cab',
                    'name': 'Budget Hatchback',
                    'capacity': 4,
                    'price_per_day': 60,
                    'rating': 4.5,
                    'reviews': 421,
                    'availability': 'Available',
                    'features': ['AC', 'Insurance'],
                    'destination': destination
                }
            ]
            
            # Filter by capacity if needed
            return [opt for opt in options if opt['capacity'] >= travelers]
        except Exception as e:
            raise Exception(f"Error fetching transport options: {str(e)}")
