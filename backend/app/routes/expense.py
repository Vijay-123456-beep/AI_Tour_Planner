from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from ..services.expense_service_firestore import ExpenseService

expense_bp = Blueprint('expense', __name__)
expense_service = ExpenseService()

@expense_bp.route('/itinerary/<itinerary_id>', methods=['GET'])
@jwt_required()
def get_itinerary_expenses(itinerary_id):
    """Get all expenses for a specific itinerary"""
    try:
        user_id = get_jwt_identity()
        expenses = expense_service.get_itinerary_expenses(user_id, itinerary_id)
        
        return jsonify({
            'success': True,
            'data': expenses,
            'total_amount': sum(exp.get('amount', 0) for exp in expenses)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/add', methods=['POST'])
@jwt_required()
def add_expense():
    """Add a new expense to an itinerary"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['itinerary_id', 'description', 'amount', 'category', 'paid_by']
        if not all(field in data for field in required_fields):
            return jsonify({
                'error': 'Missing required fields: itinerary_id, description, amount, category, paid_by'
            }), 400
        
        # Validate amount
        try:
            amount = float(data['amount'])
            if amount < 0:
                return jsonify({'error': 'Amount must be positive'}), 400
        except (ValueError, TypeError):
            return jsonify({'error': 'Invalid amount format'}), 400
        
        expense = expense_service.add_expense(user_id, data['itinerary_id'], data)
        
        return jsonify({
            'success': True,
            'message': 'Expense added successfully',
            'data': expense
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/<expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    """Delete an expense"""
    try:
        user_id = get_jwt_identity()
        deleted = expense_service.delete_expense(user_id, expense_id)
        
        return jsonify({
            'success': True,
            'message': 'Expense deleted successfully',
            'data': deleted
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/<expense_id>', methods=['PUT'])
@jwt_required()
def update_expense(expense_id):
    """Update an expense"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate amount if provided
        if 'amount' in data:
            try:
                amount = float(data['amount'])
                if amount < 0:
                    return jsonify({'error': 'Amount must be positive'}), 400
            except (ValueError, TypeError):
                return jsonify({'error': 'Invalid amount format'}), 400
        
        updated = expense_service.update_expense(user_id, expense_id, data)
        
        return jsonify({
            'success': True,
            'message': 'Expense updated successfully',
            'data': updated
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/split-calculation/<itinerary_id>', methods=['GET'])
@jwt_required()
def calculate_splits(itinerary_id):
    """Calculate expense splits for travelers in an itinerary"""
    try:
        user_id = get_jwt_identity()
        travelers_count = request.args.get('travelers_count', type=int, default=2)
        
        splits_data = expense_service.calculate_splits(user_id, itinerary_id, travelers_count)
        
        return jsonify({
            'success': True,
            'data': splits_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@expense_bp.route('/category-summary/<itinerary_id>', methods=['GET'])
@jwt_required()
def get_category_summary(itinerary_id):
    """Get expense summary by category"""
    try:
        user_id = get_jwt_identity()
        category_summary = expense_service.get_category_summary(user_id, itinerary_id)
        
        return jsonify({
            'success': True,
            'data': category_summary
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
