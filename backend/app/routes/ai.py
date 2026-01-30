"""
AI Itinerary Generation Routes
Endpoints for AI-powered itinerary generation and recommendations
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.ai_itinerary_service import AIItineraryService

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')


@ai_bp.route('/generate-itinerary', methods=['POST'])
@jwt_required()
def generate_itinerary():
    """
    Generate an AI-powered itinerary
    
    Request body:
    {
        "destination": "Maredumilli Forest",
        "start_date": "2024-12-15",
        "end_date": "2024-12-18",
        "budget": 50000,
        "interests": ["trekking", "nature"],
        "travelers": 4,
        "travel_style": "balanced"  # relaxed, balanced, adventurous
    }
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['destination', 'start_date', 'end_date', 'budget', 'interests', 'travelers']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Validate budget
        if data['budget'] < 5000:
            return jsonify({"error": "Minimum budget is 5000 rupees"}), 400
        
        # Validate travelers
        if data['travelers'] < 1:
            return jsonify({"error": "At least 1 traveler required"}), 400
        
        # Generate itinerary
        itinerary = AIItineraryService.generate_itinerary(
            destination=data['destination'],
            start_date=data['start_date'],
            end_date=data['end_date'],
            budget=data['budget'],
            interests=data.get('interests', []),
            travelers=data['travelers'],
            style=data.get('travel_style', 'balanced')
        )
        
        if not itinerary.get('success'):
            return jsonify({"error": itinerary.get('error', 'Failed to generate itinerary')}), 400
        
        # Add metadata
        itinerary['user_id'] = user_id
        itinerary['generated_at'] = __import__('datetime').datetime.utcnow().isoformat()
        
        return jsonify(itinerary), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route('/recommend-destinations', methods=['POST'])
@jwt_required()
def recommend_destinations():
    """
    Get destination recommendations based on preferences
    
    Request body:
    {
        "interests": ["trekking", "nature"],
        "budget": 50000,
        "travelers": 4,
        "trip_duration": 3
    }
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        # Validate required fields
        required_fields = ['interests', 'budget', 'travelers', 'trip_duration']
        if not all(field in data for field in required_fields):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Validate inputs
        if data['budget'] < 5000:
            return jsonify({"error": "Minimum budget is 5000 rupees"}), 400
        if data['travelers'] < 1:
            return jsonify({"error": "At least 1 traveler required"}), 400
        if data['trip_duration'] < 1:
            return jsonify({"error": "Trip duration must be at least 1 day"}), 400
        
        # Get recommendations
        recommendations = AIItineraryService.get_destination_recommendations(
            interests=data.get('interests', []),
            budget=data['budget'],
            travelers=data['travelers'],
            trip_duration=data['trip_duration']
        )
        
        recommendations['user_id'] = user_id
        recommendations['requested_at'] = __import__('datetime').datetime.utcnow().isoformat()
        
        return jsonify(recommendations), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route('/optimize-budget', methods=['POST'])
@jwt_required()
def optimize_budget():
    """
    Get budget optimization recommendations
    
    Request body:
    {
        "destination": "Maredumilli Forest",
        "travelers": 4,
        "trip_duration": 3,
        "current_budget": 50000,
        "constraints": ["minimize_cost", "maximize_activities"]
    }
    """
    try:
        data = request.get_json()
        user_id = get_jwt_identity()
        
        destination = data.get('destination')
        travelers = data.get('travelers', 1)
        trip_duration = data.get('trip_duration', 1)
        current_budget = data.get('current_budget', 10000)
        
        # Get destination info
        ai_service = AIItineraryService()
        dest_key = destination.lower().replace(" ", "_").replace(",", "")
        
        if dest_key not in ai_service.DESTINATION_DATABASE:
            return jsonify({"error": "Destination not found"}), 404
        
        dest_info = ai_service.DESTINATION_DATABASE[dest_key]
        min_budget = dest_info["base_budget_per_day"] * trip_duration
        
        # Calculate optimization
        total_activities = len(dest_info["attractions"])
        avg_activity_cost = sum(a["cost"] for a in dest_info["attractions"]) / total_activities
        
        # Estimate activities that can be done
        activities_possible = int(current_budget / avg_activity_cost)
        savings_if_extended = (min_budget - current_budget) if current_budget < min_budget else 0
        
        return jsonify({
            "success": True,
            "destination": dest_info["name"],
            "current_budget": current_budget,
            "minimum_recommended_budget": round(min_budget, 2),
            "travelers": travelers,
            "trip_duration": trip_duration,
            "budget_analysis": {
                "total_activities_available": total_activities,
                "activities_possible_with_current_budget": activities_possible,
                "average_activity_cost": round(avg_activity_cost, 2),
                "budget_status": "sufficient" if current_budget >= min_budget else "insufficient",
                "additional_budget_needed": round(savings_if_extended, 2) if savings_if_extended > 0 else 0,
            },
            "recommendations": [
                "Focus on budget-friendly activities like nature walks and local markets" if current_budget < min_budget else "You have enough budget for all activities",
                f"Book accommodations in advance to get 10-15% discounts",
                f"Average cost per traveler: {round(current_budget / travelers, 2)} rupees",
                "Use group discounts for activities",
            ],
            "cost_breakdown": {
                "accommodation": round(current_budget * 0.4, 2),
                "activities": round(current_budget * 0.35, 2),
                "food": round(current_budget * 0.15, 2),
                "transport": round(current_budget * 0.1, 2),
            },
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@ai_bp.route('/activity-suggestions', methods=['GET'])
@jwt_required()
def get_activity_suggestions():
    """
    Get activity suggestions for a destination
    
    Query params:
    - destination: Destination name
    - interests: Comma-separated interests
    - budget: Available budget
    """
    try:
        destination = request.args.get('destination')
        interests_str = request.args.get('interests', '')
        budget = request.args.get('budget', '10000')
        
        if not destination:
            return jsonify({"error": "Destination parameter required"}), 400
        
        interests = [i.strip() for i in interests_str.split(',') if i.strip()]
        
        # Get destination info
        dest_key = destination.lower().replace(" ", "_").replace(",", "")
        ai_service = AIItineraryService()
        
        if dest_key not in ai_service.DESTINATION_DATABASE:
            return jsonify({"error": "Destination not found"}), 404
        
        dest_info = ai_service.DESTINATION_DATABASE[dest_key]
        budget = float(budget)
        
        # Filter activities by budget and interests
        available_activities = []
        for activity in dest_info["attractions"]:
            if activity["cost"] <= budget:
                matches_interest = not interests or any(
                    interest.lower() in ai_service.INTEREST_ACTIVITY_MAP and
                    activity["name"] in ai_service.INTEREST_ACTIVITY_MAP[interest.lower()]
                    for interest in interests
                )
                if matches_interest or not interests:
                    available_activities.append(activity)
        
        # Sort by difficulty
        available_activities.sort(key=lambda x: (
            {"easy": 0, "moderate": 1, "hard": 2}.get(x.get("difficulty", "moderate"), 1)
        ))
        
        return jsonify({
            "success": True,
            "destination": dest_info["name"],
            "budget": budget,
            "interests": interests,
            "activities": available_activities,
            "total_activities": len(available_activities),
            "best_season": dest_info["best_season"],
            "climate": dest_info["climate"],
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
