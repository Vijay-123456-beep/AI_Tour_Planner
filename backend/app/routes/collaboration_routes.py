"""
Collaboration Routes for Group Travel Planning
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.collaboration_service_firestore import CollaborationService

collab_bp = Blueprint('collaboration', __name__, url_prefix='/api/collaboration')
collab_service = CollaborationService()


@collab_bp.route('/groups/create', methods=['POST'])
@jwt_required()
def create_group():
    """
    Create a collaborative group for shared travel planning
    
    Request body:
    {
        "itinerary_name": "Summer Trip 2024",
        "itinerary_id": "itinerary_doc_id",
        "members": ["user_id1", "user_id2"],
        "description": "Group description"
    }
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['itinerary_name', 'itinerary_id']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        group = collab_service.create_group_itinerary(
            created_by=user_id,
            itinerary_name=data['itinerary_name'],
            itinerary_id=data['itinerary_id'],
            members=data.get('members', []),
            description=data.get('description', '')
        )
        
        return jsonify(group), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@collab_bp.route('/groups/<group_id>', methods=['GET'])
@jwt_required()
def get_group(group_id):
    """Get collaborative group details"""
    try:
        user_id = get_jwt_identity()
        
        group = collab_service.get_group_details(group_id)
        
        # Check if user is member
        if user_id not in group['members']:
            return jsonify({"error": "Unauthorized"}), 403
        
        return jsonify(group), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@collab_bp.route('/groups/my-groups', methods=['GET'])
@jwt_required()
def get_my_groups():
    """Get all groups user is member of"""
    try:
        user_id = get_jwt_identity()
        
        groups = collab_service.get_user_groups(user_id)
        
        return jsonify({"groups": groups}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@collab_bp.route('/groups/<group_id>/members/add', methods=['POST'])
@jwt_required()
def add_member(group_id):
    """
    Add a member to collaborative group
    
    Request body:
    {
        "user_id": "user_to_add_id",
        "role": "member"
    }
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        if 'user_id' not in data:
            return jsonify({"error": "user_id required"}), 400
        
        group = collab_service.add_member_to_group(
            group_id=group_id,
            user_id=data['user_id'],
            added_by=user_id,
            role=data.get('role', 'member')
        )
        
        return jsonify(group), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@collab_bp.route('/groups/<group_id>/members/<member_id>/remove', methods=['DELETE'])
@jwt_required()
def remove_member(group_id, member_id):
    """Remove a member from collaborative group"""
    try:
        user_id = get_jwt_identity()
        
        group = collab_service.remove_member_from_group(
            group_id=group_id,
            user_id=member_id,
            removed_by=user_id
        )
        
        return jsonify(group), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@collab_bp.route('/groups/<group_id>/expenses/add', methods=['POST'])
@jwt_required()
def add_shared_expense(group_id):
    """
    Add a shared expense to group
    
    Request body:
    {
        "description": "Hotel booking",
        "amount": 12000,
        "split_among": ["user1", "user2"],
        "category": "accommodation"
    }
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['description', 'amount', 'split_among']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        expense = collab_service.add_shared_expense(
            group_id=group_id,
            paid_by=user_id,
            description=data['description'],
            amount=float(data['amount']),
            split_among=data['split_among'],
            category=data.get('category', 'general')
        )
        
        return jsonify(expense), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@collab_bp.route('/groups/<group_id>/settlements', methods=['GET'])
@jwt_required()
def get_settlements(group_id):
    """Get settlement calculations for group"""
    try:
        user_id = get_jwt_identity()
        
        # Verify user is member (get group first)
        group = collab_service.get_group_details(group_id)
        if user_id not in group['members']:
            return jsonify({"error": "Unauthorized"}), 403
        
        settlements = collab_service.calculate_group_settlements(group_id)
        
        return jsonify(settlements), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
