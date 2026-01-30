from firebase_admin import firestore
from datetime import datetime
from typing import Dict, List, Optional


class ItineraryService:
    """Service for managing itinerary data in Firestore"""
    
    def __init__(self):
        """Initialize Firestore database connection"""
        self.db = firestore.client()
        self.collection = 'itineraries'
    
    def create_itinerary(self, user_id: str, itinerary_data: Dict) -> Dict:
        """
        Create a new itinerary
        
        Args:
            user_id: The ID of the user creating the itinerary
            itinerary_data: Dictionary containing itinerary details
        
        Returns:
            Dictionary with the created itinerary including its ID
        
        Raises:
            ValueError: If required fields are missing or validation fails
        """
        try:
            # Validate required fields
            required_fields = ['destination', 'start_date', 'end_date', 'budget']
            for field in required_fields:
                if field not in itinerary_data:
                    raise ValueError(f'Missing required field: {field}')
            
            # Create document
            itinerary_doc = {
                'user_id': user_id,
                'destination': itinerary_data['destination'],
                'start_date': itinerary_data['start_date'],
                'end_date': itinerary_data['end_date'],
                'budget': float(itinerary_data['budget']),
                'interests': itinerary_data.get('interests', []),
                'travelers': itinerary_data.get('travelers', 1),
                'description': itinerary_data.get('description', ''),
                'status': 'active',
                'created_at': datetime.utcnow(),
                'updated_at': datetime.utcnow()
            }
            
            # Add to Firestore
            doc_ref = self.db.collection(self.collection).add(itinerary_doc)
            itinerary_doc['id'] = doc_ref[1].id
            
            return itinerary_doc
            
        except Exception as e:
            raise ValueError(f'Failed to create itinerary: {str(e)}')
    
    def get_user_itineraries(self, user_id: str) -> List[Dict]:
        """
        Get all itineraries for a user
        
        Args:
            user_id: The ID of the user
        
        Returns:
            List of itinerary dictionaries
        """
        try:
            docs = self.db.collection(self.collection)\
                .where('user_id', '==', user_id)\
                .order_by('created_at', direction=firestore.Query.DESCENDING)\
                .stream()
            
            itineraries = []
            for doc in docs:
                itinerary = doc.to_dict()
                itinerary['id'] = doc.id
                itineraries.append(itinerary)
            
            return itineraries
            
        except Exception as e:
            raise ValueError(f'Failed to retrieve itineraries: {str(e)}')
    
    def get_itinerary(self, user_id: str, itinerary_id: str) -> Dict:
        """
        Get a specific itinerary
        
        Args:
            user_id: The ID of the user
            itinerary_id: The ID of the itinerary
        
        Returns:
            Dictionary with itinerary details
        
        Raises:
            ValueError: If itinerary not found or unauthorized
        """
        try:
            doc = self.db.collection(self.collection).document(itinerary_id).get()
            
            if not doc.exists:
                raise ValueError('Itinerary not found')
            
            itinerary = doc.to_dict()
            
            # Verify ownership
            if itinerary.get('user_id') != user_id:
                raise ValueError('Unauthorized: You do not have access to this itinerary')
            
            itinerary['id'] = doc.id
            return itinerary
            
        except Exception as e:
            raise ValueError(str(e))
    
    def update_itinerary(self, user_id: str, itinerary_id: str, updates: Dict) -> Dict:
        """
        Update an itinerary
        
        Args:
            user_id: The ID of the user
            itinerary_id: The ID of the itinerary
            updates: Dictionary of fields to update
        
        Returns:
            Updated itinerary dictionary
        
        Raises:
            ValueError: If itinerary not found or unauthorized
        """
        try:
            # First, verify ownership
            doc = self.db.collection(self.collection).document(itinerary_id).get()
            
            if not doc.exists:
                raise ValueError('Itinerary not found')
            
            itinerary = doc.to_dict()
            if itinerary.get('user_id') != user_id:
                raise ValueError('Unauthorized: You do not have access to this itinerary')
            
            # Update allowed fields
            updatable_fields = ['destination', 'start_date', 'end_date', 'budget', 
                              'interests', 'travelers', 'description', 'status']
            
            update_data = {'updated_at': datetime.utcnow()}
            for field in updatable_fields:
                if field in updates:
                    if field == 'budget':
                        update_data[field] = float(updates[field])
                    else:
                        update_data[field] = updates[field]
            
            # Update document
            self.db.collection(self.collection).document(itinerary_id).update(update_data)
            
            # Return updated document
            updated_doc = self.db.collection(self.collection).document(itinerary_id).get()
            updated_itinerary = updated_doc.to_dict()
            updated_itinerary['id'] = updated_doc.id
            
            return updated_itinerary
            
        except Exception as e:
            raise ValueError(str(e))
    
    def delete_itinerary(self, user_id: str, itinerary_id: str) -> Dict:
        """
        Delete an itinerary
        
        Args:
            user_id: The ID of the user
            itinerary_id: The ID of the itinerary
        
        Returns:
            The deleted itinerary dictionary
        
        Raises:
            ValueError: If itinerary not found or unauthorized
        """
        try:
            # First, verify ownership
            doc = self.db.collection(self.collection).document(itinerary_id).get()
            
            if not doc.exists:
                raise ValueError('Itinerary not found')
            
            itinerary = doc.to_dict()
            if itinerary.get('user_id') != user_id:
                raise ValueError('Unauthorized: You do not have access to this itinerary')
            
            # Delete document
            self.db.collection(self.collection).document(itinerary_id).delete()
            
            itinerary['id'] = itinerary_id
            return itinerary
            
        except Exception as e:
            raise ValueError(str(e))
    
    def get_itinerary_stats(self, user_id: str, itinerary_id: str) -> Dict:
        """
        Get statistics for an itinerary (total expenses, transport bookings, etc.)
        
        Args:
            user_id: The ID of the user
            itinerary_id: The ID of the itinerary
        
        Returns:
            Dictionary with statistics
        
        Raises:
            ValueError: If itinerary not found or unauthorized
        """
        try:
            # Verify itinerary exists and belongs to user
            doc = self.db.collection(self.collection).document(itinerary_id).get()
            
            if not doc.exists:
                raise ValueError('Itinerary not found')
            
            itinerary = doc.to_dict()
            if itinerary.get('user_id') != user_id:
                raise ValueError('Unauthorized')
            
            # Get expense count and total
            expenses = self.db.collection('expenses')\
                .where('user_id', '==', user_id)\
                .where('itinerary_id', '==', itinerary_id)\
                .stream()
            
            total_expenses = 0
            expense_count = 0
            for expense_doc in expenses:
                expense = expense_doc.to_dict()
                total_expenses += expense.get('amount', 0)
                expense_count += 1
            
            # Get transport booking count and total
            bookings = self.db.collection('transport_bookings')\
                .where('user_id', '==', user_id)\
                .where('itinerary_id', '==', itinerary_id)\
                .stream()
            
            total_transport = 0
            booking_count = 0
            for booking_doc in bookings:
                booking = booking_doc.to_dict()
                total_transport += booking.get('price', 0)
                booking_count += 1
            
            return {
                'itinerary_id': itinerary_id,
                'destination': itinerary.get('destination'),
                'budget': itinerary.get('budget'),
                'expenses': {
                    'total': round(total_expenses, 2),
                    'count': expense_count
                },
                'transport': {
                    'total': round(total_transport, 2),
                    'count': booking_count
                },
                'total_spending': round(total_expenses + total_transport, 2),
                'budget_remaining': round(itinerary.get('budget', 0) - total_expenses - total_transport, 2)
            }
            
        except Exception as e:
            raise ValueError(str(e))
