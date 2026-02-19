from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..services.itinerary_service_firestore import ItineraryService
from ..services.collaboration_service_firestore import CollaborationService

itinerary_bp = Blueprint('itinerary', __name__)
itinerary_service = ItineraryService()
collab_service = CollaborationService()

@itinerary_bp.route('/create', methods=['POST'])
@jwt_required()
def create_itinerary():
    """Create a new itinerary"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    required_fields = ['destination', 'start_date', 'end_date', 'budget']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: destination, start_date, end_date, budget'}), 400
    
    try:
        itinerary = itinerary_service.create_itinerary(user_id, data)
        return jsonify({
            'success': True,
            'message': 'Itinerary created successfully',
            'data': itinerary
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@itinerary_bp.route('/<itinerary_id>', methods=['GET'])
@jwt_required()
def get_itinerary(itinerary_id):
    """Get a specific itinerary"""
    user_id = get_jwt_identity()
    try:
        itinerary = itinerary_service.get_itinerary(user_id, itinerary_id)
        return jsonify({
            'success': True,
            'data': itinerary
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 404

@itinerary_bp.route('/', methods=['GET'])
@jwt_required()
def get_user_itineraries():
    """Get all itineraries for the current user"""
    user_id = get_jwt_identity()
    try:
        itineraries = itinerary_service.get_user_itineraries(user_id)
        return jsonify({
            'success': True,
            'data': itineraries
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@itinerary_bp.route('/<itinerary_id>/update', methods=['PUT'])
@jwt_required()
def update_itinerary(itinerary_id):
    """Update an itinerary"""
    user_id = get_jwt_identity()
    data = request.get_json()
    try:
        updated = itinerary_service.update_itinerary(user_id, itinerary_id, data)
        return jsonify({
            'success': True,
            'message': 'Itinerary updated successfully',
            'data': updated
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@itinerary_bp.route('/<itinerary_id>', methods=['DELETE'])
@jwt_required()
def delete_itinerary(itinerary_id):
    """Delete an itinerary"""
    user_id = get_jwt_identity()
    try:
        deleted = itinerary_service.delete_itinerary(user_id, itinerary_id)
        return jsonify({
            'success': True,
            'message': 'Itinerary deleted successfully',
            'data': deleted
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@itinerary_bp.route('/<itinerary_id>/stats', methods=['GET'])
@jwt_required()
def get_itinerary_stats(itinerary_id):
    """Get statistics for an itinerary"""
    user_id = get_jwt_identity()
    try:
        stats = itinerary_service.get_itinerary_stats(user_id, itinerary_id)
        return jsonify({
            'success': True,
            'data': stats
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@itinerary_bp.route('/<itinerary_id>/chat', methods=['POST'])
@jwt_required()
def add_chat_message(itinerary_id):
    """Add a chat message to an itinerary"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if 'text' not in data:
        return jsonify({'error': 'Message text is required'}), 400
        
    try:
        message = collab_service.add_chat_message(itinerary_id, user_id, data['text'])
        return jsonify({
            'success': True,
            'data': message
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@itinerary_bp.route('/<itinerary_id>/chat', methods=['GET'])
@jwt_required()
def get_chat_messages(itinerary_id):
    """Get chat messages for an itinerary"""
    user_id = get_jwt_identity()
    try:
        messages = collab_service.get_chat_messages(user_id, itinerary_id)
        return jsonify({
            'success': True,
            'data': messages
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400
