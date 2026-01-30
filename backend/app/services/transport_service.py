from firebase_admin import firestore
from datetime import datetime
import uuid

class TransportService:
    def __init__(self):
        self.db = firestore.client()
        
    def get_available_transport_options(self, destination, start_date, end_date, travelers):
        """
        Get available transport options for a destination
        
        Args:
            destination (str): Destination location
            start_date (datetime): Start date of the trip
            end_date (datetime): End date of the trip
            travelers (int): Number of travelers
            
        Returns:
            list: List of available transport options
        """
        # Check if the destination is a remote area with limited transport
        is_remote = self._check_remote_destination(destination)
        
        if not is_remote:
            return []
            
        # Get available transport providers for this area
        transport_providers = self._get_transport_providers(destination)
        
        # Filter providers based on availability and capacity
        available_options = []
        for provider in transport_providers:
            if (provider['max_capacity'] >= travelers and 
                self._check_availability(provider['id'], start_date, end_date)):
                available_options.append(provider)
                
        return available_options
    
    def _check_remote_destination(self, destination):
        """Check if the destination is a remote area with limited transport"""
        # This is a simplified check - in a real application, you would use a geocoding service
        # and a database of remote areas
        remote_areas = [
            'maredumilli', 'araku', 'papi hills', 'lambasingi', 'gandikota',
            'belum caves', 'gandipet', 'nagalapuram', 'talakona', 'mallela theertham'
        ]
        
        return any(area in destination.lower() for area in remote_areas)
    
    def _get_transport_providers(self, destination):
        """Get transport providers for a specific destination"""
        # In a real application, this would query a database of transport providers
        # For now, we'll return some sample data
        providers = [
            {
                'id': 'tp_' + str(uuid.uuid4())[:8],
                'name': 'Local Jeep Service',
                'type': 'jeep',
                'max_capacity': 8,
                'price_per_day': 3500,
                'contact': '+91 98765 43210',
                'description': 'Local jeep service with experienced drivers familiar with the area',
                'features': ['AC', 'Local Guide', 'Flexible Timings']
            },
            {
                'id': 'tp_' + str(uuid.uuid4())[:8],
                'name': 'Tourist Cab Service',
                'type': 'car',
                'max_capacity': 4,
                'price_per_day': 2500,
                'contact': '+91 98765 12345',
                'description': 'Comfortable cabs with experienced drivers',
                'features': ['AC', 'GPS', '24/7 Support']
            },
            {
                'id': 'tp_' + str(uuid.uuid4())[:8],
                'name': 'Bike Rentals',
                'type': 'bike',
                'max_capacity': 2,
                'price_per_day': 800,
                'contact': '+91 98765 67890',
                'description': 'Self-ride bikes for exploring remote areas',
                'features': ['Helmet Included', 'Roadside Assistance', 'Flexible Pickup']
            }
        ]
        
        return providers
    
    def _check_availability(self, provider_id, start_date, end_date):
        """Check if a transport provider is available for the given dates"""
        # In a real application, this would check the provider's bookings in the database
        # For now, we'll assume all providers are available
        return True
    
    def book_transport(self, user_id, provider_id, start_date, end_date, travelers):
        """Book a transport provider"""
        # Get provider details
        providers = self._get_transport_providers('')
        provider = next((p for p in providers if p['id'] == provider_id), None)
        
        if not provider:
            raise ValueError('Transport provider not found')
            
        if provider['max_capacity'] < travelers:
            raise ValueError(f'This provider can only accommodate {provider["max_capacity"]} travelers')
            
        if not self._check_availability(provider_id, start_date, end_date):
            raise ValueError('Selected transport is not available for the selected dates')
            
        # Create booking
        booking_id = 'book_' + str(uuid.uuid4())[:8]
        booking_data = {
            'id': booking_id,
            'user_id': user_id,
            'provider_id': provider_id,
            'provider_name': provider['name'],
            'start_date': start_date,
            'end_date': end_date,
            'travelers': travelers,
            'total_price': provider['price_per_day'] * ((end_date - start_date).days + 1),
            'status': 'confirmed',
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # In a real application, you would save this to the database
        # self.db.collection('transport_bookings').document(booking_id).set(booking_data)
        
        return booking_data
    
    def get_booking_details(self, booking_id):
        """Get details of a specific booking"""
        # In a real application, this would query the database
        # For now, we'll return a sample response
        return {
            'id': booking_id,
            'provider_name': 'Local Jeep Service',
            'start_date': '2023-12-15',
            'end_date': '2023-12-18',
            'travelers': 4,
            'total_price': 10500,
            'status': 'confirmed',
            'contact': '+91 98765 43210',
            'pickup_location': 'Nearest accessible point',
            'notes': 'Please arrive 15 minutes before departure time.'
        }
