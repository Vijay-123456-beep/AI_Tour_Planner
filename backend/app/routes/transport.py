from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..services.transport_service_firestore import TransportService

transport_bp = Blueprint('transport', __name__)
transport_service = TransportService()

@transport_bp.route('/options', methods=['GET'])
@jwt_required()
def get_transport_options():
    """
    Get available transport options for a destination
    Query params:
    - destination: The destination location (required)
    - start_date: Start date in YYYY-MM-DD format (required)
    - end_date: End date in YYYY-MM-DD format (required)
    - travelers: Number of travelers (required)
    """
    try:
        # Get query parameters
        destination = request.args.get('destination')
        start_date_str = request.args.get('start_date')
        end_date_str = request.args.get('end_date')
        travelers = request.args.get('travelers', type=int)
        
        # Validate required parameters
        if not all([destination, start_date_str, end_date_str, travelers]):
            return jsonify({
                'error': 'Missing required parameters: destination, start_date, end_date, and travelers are required'
            }), 400
            
        # Parse dates
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
        except ValueError:
            return jsonify({
                'error': 'Invalid date format. Please use YYYY-MM-DD format.'
            }), 400
            
        # Validate travelers count
        if travelers < 1:
            return jsonify({
                'error': 'Number of travelers must be at least 1'
            }), 400
            
        # Get available transport options
        options = transport_service.get_available_transport_options(
            destination=destination,
            start_date=start_date,
            end_date=end_date,
            travelers=travelers
        )
        
        return jsonify({
            'success': True,
            'data': options
        })
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@transport_bp.route('/book', methods=['POST'])
@jwt_required()
def book_transport():
    """
    Book a transport option
    Request body:
    {
        "itinerary_id": "itinerary_id",
        "provider_id": "transport_provider_id",
        "start_date": "2023-12-15",
        "end_date": "2023-12-18",
        "travelers": 4,
        "price": 10500
    }
    """
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['itinerary_id', 'provider_id', 'start_date', 'end_date', 'travelers', 'price']
        if not all(field in data for field in required_fields):
            return jsonify({
                'error': 'Missing required fields: itinerary_id, provider_id, start_date, end_date, travelers, and price are required'
            }), 400
            
        # Parse dates
        try:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d')
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({
                'error': 'Invalid date format. Please use YYYY-MM-DD format.'
            }), 400
        
        # Create booking data
        booking_data = {
            'itinerary_id': data['itinerary_id'],
            'provider_id': data['provider_id'],
            'start_date': data['start_date'],
            'end_date': data['end_date'],
            'travelers': data['travelers'],
            'price': float(data['price']),
            'status': 'confirmed',
            'description': data.get('description', '')
        }
        
        # Book transport
        booking = transport_service.add_booking(user_id, data['itinerary_id'], booking_data)
        
        return jsonify({
            'success': True,
            'data': booking
        }), 201
        
    except ValueError as e:
        return jsonify({
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'error': f'Failed to book transport: {str(e)}'
        }), 500

@transport_bp.route('/bookings/<booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    """Get details of a specific transport booking"""
    try:
        user_id = get_jwt_identity()
        booking = transport_service.get_booking_details(user_id, booking_id)
        
        return jsonify({
            'success': True,
            'data': booking
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to get booking details: {str(e)}'
        }), 500

@transport_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings():
    """Get all transport bookings for the current user"""
    try:
        user_id = get_jwt_identity()
        bookings = transport_service.get_user_bookings(user_id)
        
        return jsonify({
            'success': True,
            'data': bookings
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to get bookings: {str(e)}'
        }), 500

@transport_bp.route('/itinerary/<itinerary_id>/bookings', methods=['GET'])
@jwt_required()
def get_itinerary_bookings(itinerary_id):
    """Get all transport bookings for a specific itinerary"""
    try:
        user_id = get_jwt_identity()
        bookings = transport_service.get_itinerary_bookings(user_id, itinerary_id)
        
        return jsonify({
            'success': True,
            'data': bookings
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to get bookings: {str(e)}'
        }), 500

@transport_bp.route('/<booking_id>', methods=['DELETE'])
@jwt_required()
def delete_booking(booking_id):
    """Delete a transport booking"""
    try:
        user_id = get_jwt_identity()
        deleted = transport_service.delete_booking(user_id, booking_id)
        
        return jsonify({
            'success': True,
            'message': 'Booking deleted successfully',
            'data': deleted
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@transport_bp.route('/<booking_id>', methods=['PUT'])
@jwt_required()
def update_booking(booking_id):
    """Update a transport booking"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        updated = transport_service.update_booking(user_id, booking_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Booking updated successfully',
            'data': updated
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500
