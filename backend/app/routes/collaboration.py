from flask import Blueprint, request, jsonify
from ..services.collaboration_service import CollaborationService
from .auth import token_required

collaboration_bp = Blueprint('collaboration', __name__)
collaboration_service = CollaborationService()

@collaboration_bp.route('/trip/<trip_id>/invite', methods=['POST'])
@token_required
def invite_traveler(current_user, trip_id):
    data = request.get_json()
    if 'email' not in data:
        return jsonify({'error': 'Email is required'}), 400
    
    try:
        result = collaboration_service.invite_traveler(
            inviter_id=current_user,
            trip_id=trip_id,
            email=data['email'],
            role=data.get('role', 'traveler')
        )
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@collaboration_bp.route('/trip/<trip_id>/members', methods=['GET'])
@token_required
def get_trip_members(current_user, trip_id):
    try:
        members = collaboration_service.get_trip_members(current_user, trip_id)
        return jsonify(members)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@collaboration_bp.route('/trip/<trip_id>/expenses', methods=['POST'])
@token_required
def add_expense(current_user, trip_id):
    data = request.get_json()
    required_fields = ['amount', 'description', 'category', 'paid_by']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        expense = collaboration_service.add_expense(
            trip_id=trip_id,
            user_id=current_user,
            amount=data['amount'],
            description=data['description'],
            category=data['category'],
            paid_by=data['paid_by'],
            split_between=data.get('split_between', []),
            date=data.get('date')
        )
        return jsonify(expense), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@collaboration_bp.route('/trip/<trip_id>/expenses', methods=['GET'])
@token_required
def get_expenses(current_user, trip_id):
    try:
        expenses = collaboration_service.get_expenses(current_user, trip_id)
        return jsonify(expenses)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@collaboration_bp.route('/trip/<trip_id>/settle-up', methods=['GET'])
@token_required
def calculate_settlements(current_user, trip_id):
    try:
        settlements = collaboration_service.calculate_settlements(current_user, trip_id)
        return jsonify(settlements)
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@collaboration_bp.route('/trip/<trip_id>/chat', methods=['POST'])
@token_required
def send_message(current_user, trip_id):
    data = request.get_json()
    if 'message' not in data:
        return jsonify({'error': 'Message is required'}), 400
    
    try:
        chat_message = collaboration_service.add_chat_message(
            trip_id=trip_id,
            user_id=current_user,
            message=data['message']
        )
        return jsonify(chat_message), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@collaboration_bp.route('/trip/<trip_id>/chat', methods=['GET'])
@token_required
def get_chat_messages(current_user, trip_id):
    try:
        messages = collaboration_service.get_chat_messages(current_user, trip_id)
        return jsonify(messages)
    except Exception as e:
        return jsonify({'error': str(e)}), 400
