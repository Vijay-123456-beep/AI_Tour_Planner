"""
AI-Powered Itinerary Generation Service
Provides intelligent itinerary suggestions based on user preferences, budget, and travel style
"""

import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import numpy as np
from sklearn.preprocessing import MinMaxScaler
import re


class AIItineraryService:
    """Service for AI-powered itinerary generation and recommendations"""
    
    # Destination database with attractions, climate, budget info
    DESTINATION_DATABASE = {
        "maredumilli_forest": {
            "name": "Maredumilli Forest",
            "region": "Andhra Pradesh, India",
            "attractions": [
                {"name": "Waterfalls", "type": "nature", "difficulty": "moderate", "duration": 3, "cost": 500},
                {"name": "Trekking", "type": "adventure", "difficulty": "hard", "duration": 5, "cost": 1000},
                {"name": "Bird Watching", "type": "nature", "difficulty": "easy", "duration": 2, "cost": 300},
                {"name": "Camping", "type": "adventure", "difficulty": "moderate", "duration": 1, "cost": 1500},
                {"name": "Photography Tour", "type": "culture", "difficulty": "easy", "duration": 4, "cost": 800},
            ],
            "best_season": ["June", "July", "August", "December", "January"],
            "base_budget_per_day": 2000,
            "climate": "tropical",
            "difficulty_level": "moderate",
        },
        "taj_mahal": {
            "name": "Taj Mahal, Agra",
            "region": "Uttar Pradesh, India",
            "attractions": [
                {"name": "Taj Mahal Visit", "type": "culture", "difficulty": "easy", "duration": 2, "cost": 750},
                {"name": "Mehtab Bagh", "type": "nature", "difficulty": "easy", "duration": 2, "cost": 500},
                {"name": "Agra Fort", "type": "history", "difficulty": "easy", "duration": 2, "cost": 500},
                {"name": "Hot Air Balloon Ride", "type": "adventure", "difficulty": "easy", "duration": 1, "cost": 5000},
                {"name": "Mughal Culinary Tour", "type": "culture", "difficulty": "easy", "duration": 3, "cost": 2000},
            ],
            "best_season": ["October", "November", "February", "March"],
            "base_budget_per_day": 3000,
            "climate": "subtropical",
            "difficulty_level": "easy",
        },
        "goa": {
            "name": "Goa",
            "region": "Goa, India",
            "attractions": [
                {"name": "Beach Relax", "type": "leisure", "difficulty": "easy", "duration": 4, "cost": 1000},
                {"name": "Water Sports", "type": "adventure", "difficulty": "moderate", "duration": 3, "cost": 2000},
                {"name": "Church Visit", "type": "culture", "difficulty": "easy", "duration": 2, "cost": 300},
                {"name": "Spice Plantation Tour", "type": "culture", "difficulty": "easy", "duration": 3, "cost": 1500},
                {"name": "Nightlife", "type": "leisure", "difficulty": "easy", "duration": 3, "cost": 2000},
            ],
            "best_season": ["October", "November", "December", "January", "February"],
            "base_budget_per_day": 2500,
            "climate": "tropical",
            "difficulty_level": "easy",
        },
        "manali": {
            "name": "Manali",
            "region": "Himachal Pradesh, India",
            "attractions": [
                {"name": "Trekking", "type": "adventure", "difficulty": "hard", "duration": 6, "cost": 2000},
                {"name": "Snow Activities", "type": "adventure", "difficulty": "moderate", "duration": 3, "cost": 1500},
                {"name": "Adventure Sports", "type": "adventure", "difficulty": "hard", "duration": 4, "cost": 3000},
                {"name": "Paragliding", "type": "adventure", "difficulty": "moderate", "duration": 2, "cost": 2500},
                {"name": "Camping", "type": "adventure", "difficulty": "moderate", "duration": 2, "cost": 1000},
            ],
            "best_season": ["May", "June", "September", "October"],
            "base_budget_per_day": 3500,
            "climate": "alpine",
            "difficulty_level": "hard",
        },
    }
    
    # Activity recommendations based on interests
    INTEREST_ACTIVITY_MAP = {
        "trekking": ["Trekking", "Camping", "Adventure Sports"],
        "culture": ["Mughal Culinary Tour", "Photography Tour", "Church Visit", "Spice Plantation Tour"],
        "nature": ["Waterfalls", "Bird Watching", "Beach Relax", "Mehtab Bagh"],
        "adventure": ["Trekking", "Water Sports", "Hot Air Balloon Ride", "Paragliding", "Adventure Sports"],
        "leisure": ["Beach Relax", "Nightlife", "Photography Tour"],
        "history": ["Agra Fort", "Church Visit"],
        "wildlife": ["Bird Watching", "Spice Plantation Tour"],
    }
    
    @staticmethod
    def generate_itinerary(
        destination: str,
        start_date: str,
        end_date: str,
        budget: float,
        interests: List[str],
        travelers: int,
        style: str = "balanced"
    ) -> Dict[str, Any]:
        """
        Generate an AI-powered itinerary based on user preferences
        
        Args:
            destination: Destination name
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            budget: Total budget in rupees
            interests: List of interests (trekking, culture, nature, adventure, leisure, history, wildlife)
            travelers: Number of travelers
            style: Travel style (relaxed, balanced, adventurous)
        
        Returns:
            Dict with generated itinerary and recommendations
        """
        try:
            # Parse dates
            start = datetime.strptime(start_date, "%Y-%m-%d")
            end = datetime.strptime(end_date, "%Y-%m-%d")
            num_days = (end - start).days + 1
            
            # Validate inputs
            if num_days < 1:
                raise ValueError("End date must be after start date")
            if budget < 5000:
                raise ValueError("Budget must be at least 5000 rupees")
            
            # Get destination info
            dest_key = destination.lower().replace(" ", "_").replace(",", "")
            if dest_key not in AIItineraryService.DESTINATION_DATABASE:
                return AIItineraryService._generate_generic_itinerary(
                    destination, num_days, budget, interests, travelers, style
                )
            
            dest_info = AIItineraryService.DESTINATION_DATABASE[dest_key]
            
            # Calculate daily budget
            daily_budget = budget / num_days
            
            # Get recommended activities
            recommended_activities = AIItineraryService._get_recommended_activities(
                interests, dest_info, num_days, daily_budget, style
            )
            
            # Calculate costs and optimize
            optimized_plan = AIItineraryService._optimize_itinerary(
                recommended_activities, num_days, daily_budget, travelers, style
            )
            
            # Build day-by-day itinerary
            day_itinerary = AIItineraryService._build_daily_schedule(
                optimized_plan, start, num_days
            )
            
            # Generate statistics
            stats = AIItineraryService._calculate_stats(
                day_itinerary, budget, travelers
            )
            
            return {
                "success": True,
                "destination": dest_info["name"],
                "duration_days": num_days,
                "total_budget": budget,
                "daily_budget": round(daily_budget, 2),
                "travelers": travelers,
                "travel_style": style,
                "itinerary": day_itinerary,
                "statistics": stats,
                "recommendations": {
                    "best_season": dest_info["best_season"],
                    "climate": dest_info["climate"],
                    "difficulty_level": dest_info["difficulty_level"],
                    "packing_suggestions": AIItineraryService._get_packing_suggestions(dest_info, start),
                    "tips": AIItineraryService._get_travel_tips(dest_info, style),
                },
                "ai_score": round(AIItineraryService._calculate_ai_score(stats), 2),
            }
        
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }
    
    @staticmethod
    def _get_recommended_activities(
        interests: List[str],
        dest_info: Dict,
        num_days: int,
        daily_budget: float,
        style: str
    ) -> List[Dict]:
        """Get activities based on interests and destination"""
        recommended = []
        
        # Get all attractions for the destination
        all_attractions = dest_info["attractions"]
        
        # Filter by interests
        for attraction in all_attractions:
            for interest in interests:
                if interest.lower() in AIItineraryService.INTEREST_ACTIVITY_MAP:
                    if attraction["name"] in AIItineraryService.INTEREST_ACTIVITY_MAP[interest.lower()]:
                        if attraction not in recommended:
                            recommended.append(attraction)
        
        # If no matches, add popular attractions
        if not recommended:
            recommended = all_attractions[:num_days]
        
        return recommended
    
    @staticmethod
    def _optimize_itinerary(
        activities: List[Dict],
        num_days: int,
        daily_budget: float,
        travelers: int,
        style: str
    ) -> List[Dict]:
        """Optimize activities based on time, budget, and travel style"""
        optimized = []
        total_cost = 0
        
        # Sort activities by cost-to-duration ratio
        activities_with_ratio = [
            {**a, "ratio": a["cost"] / a["duration"]} for a in activities
        ]
        
        if style == "relaxed":
            # Fewer, longer activities
            activities_with_ratio.sort(key=lambda x: x["duration"], reverse=True)
        elif style == "adventurous":
            # More activities, prioritize adventure
            activities_with_ratio.sort(key=lambda x: (x["type"] != "adventure", x["cost"]))
        else:  # balanced
            # Mix of activities
            activities_with_ratio.sort(key=lambda x: x["ratio"])
        
        # Select activities that fit budget and time
        for activity in activities_with_ratio:
            if len(optimized) < num_days and total_cost + activity["cost"] <= daily_budget * num_days * 0.6:
                optimized.append(activity)
                total_cost += activity["cost"]
        
        return optimized
    
    @staticmethod
    def _build_daily_schedule(
        activities: List[Dict],
        start_date: datetime,
        num_days: int
    ) -> List[Dict]:
        """Build a day-by-day schedule"""
        schedule = []
        activity_idx = 0
        
        for day in range(1, num_days + 1):
            current_date = start_date + timedelta(days=day - 1)
            
            # Assign activity(s) to this day
            day_activities = []
            remaining_hours = 8  # 8 hours of activity per day
            
            while remaining_hours > 0 and activity_idx < len(activities):
                activity = activities[activity_idx]
                if activity["duration"] <= remaining_hours:
                    day_activities.append(activity)
                    remaining_hours -= activity["duration"]
                    if activity_idx < len(activities) - 1:
                        activity_idx += 1
                    else:
                        break
                else:
                    break
            
            # Add rest/leisure time
            if remaining_hours > 0:
                day_activities.append({
                    "name": "Rest & Leisure",
                    "type": "leisure",
                    "duration": remaining_hours,
                    "cost": 0,
                })
            
            schedule.append({
                "day": day,
                "date": current_date.strftime("%Y-%m-%d"),
                "activities": day_activities,
                "estimated_cost": sum(a.get("cost", 0) for a in day_activities),
            })
        
        return schedule
    
    @staticmethod
    def _calculate_stats(day_itinerary: List[Dict], budget: float, travelers: int) -> Dict:
        """Calculate itinerary statistics"""
        total_planned_cost = sum(day["estimated_cost"] for day in day_itinerary)
        adventure_count = sum(
            1 for day in day_itinerary
            for activity in day["activities"]
            if activity.get("type") == "adventure"
        )
        culture_count = sum(
            1 for day in day_itinerary
            for activity in day["activities"]
            if activity.get("type") == "culture"
        )
        leisure_count = sum(
            1 for day in day_itinerary
            for activity in day["activities"]
            if activity.get("type") == "leisure"
        )
        
        return {
            "total_activities": sum(len(day["activities"]) for day in day_itinerary),
            "adventure_activities": adventure_count,
            "cultural_activities": culture_count,
            "leisure_activities": leisure_count,
            "estimated_total_cost": round(total_planned_cost, 2),
            "remaining_budget": round(budget - total_planned_cost, 2),
            "budget_utilization": round((total_planned_cost / budget) * 100, 2),
            "cost_per_traveler": round(total_planned_cost / travelers, 2),
        }
    
    @staticmethod
    def _calculate_ai_score(stats: Dict) -> float:
        """Calculate overall quality score (0-100) for the itinerary"""
        score = 50  # Base score
        
        # Bonus for balanced activities
        if stats["adventure_activities"] > 0:
            score += 15
        if stats["cultural_activities"] > 0:
            score += 15
        if stats["leisure_activities"] > 0:
            score += 10
        
        # Bonus for good budget utilization (60-80% is optimal)
        utilization = stats["budget_utilization"]
        if 60 <= utilization <= 80:
            score += 10
        
        return min(score, 100)
    
    @staticmethod
    def _get_packing_suggestions(dest_info: Dict, travel_date: datetime) -> List[str]:
        """Get packing suggestions based on climate and season"""
        climate = dest_info["climate"]
        month = travel_date.month
        
        base_items = [
            "Sunscreen (SPF 50+)",
            "Water bottle",
            "Comfortable shoes",
            "Phone charger",
        ]
        
        if climate == "tropical":
            base_items.extend([
                "Light cotton clothes",
                "Swimwear",
                "Umbrella (monsoon seasons)",
                "Insect repellent",
            ])
        elif climate == "alpine":
            base_items.extend([
                "Warm jacket",
                "Thermal wear",
                "Hiking boots",
                "Woolly hat",
            ])
        elif climate == "subtropical":
            base_items.extend([
                "Light to medium weight clothing",
                "Sweater (for cool evenings)",
                "Comfortable walking shoes",
            ])
        
        return base_items
    
    @staticmethod
    def _get_travel_tips(dest_info: Dict, style: str) -> List[str]:
        """Get travel tips based on destination and style"""
        tips = []
        
        if dest_info["difficulty_level"] == "hard":
            tips.append("Get proper fitness training before the trip")
            tips.append("Carry high-energy snacks")
        
        if style == "adventurous":
            tips.append("Book activities in advance")
            tips.append("Carry basic medical supplies")
        elif style == "relaxed":
            tips.append("Take your time to explore")
            tips.append("Book accommodations with good reviews")
        
        tips.append("Hire a local guide for better experience")
        tips.append("Try local cuisine")
        
        return tips
    
    @staticmethod
    def _generate_generic_itinerary(
        destination: str,
        num_days: int,
        budget: float,
        interests: List[str],
        travelers: int,
        style: str
    ) -> Dict:
        """Generate generic itinerary for unknown destinations"""
        daily_budget = budget / num_days
        
        # Generic activities
        generic_activities = [
            {"name": "Explore local markets", "type": "culture", "duration": 2, "cost": 500},
            {"name": "Visit main attractions", "type": "culture", "duration": 3, "cost": 1000},
            {"name": "Local restaurant tour", "type": "culture", "duration": 2, "cost": 1500},
            {"name": "Relax & rest", "type": "leisure", "duration": 4, "cost": 0},
        ]
        
        schedule = []
        for day in range(1, num_days + 1):
            activities = generic_activities[day % len(generic_activities):day % len(generic_activities) + 1]
            schedule.append({
                "day": day,
                "activities": activities,
                "estimated_cost": sum(a["cost"] for a in activities),
            })
        
        total_cost = sum(day["estimated_cost"] for day in schedule)
        
        return {
            "success": True,
            "destination": destination,
            "duration_days": num_days,
            "total_budget": budget,
            "daily_budget": round(daily_budget, 2),
            "travelers": travelers,
            "travel_style": style,
            "itinerary": schedule,
            "statistics": {
                "total_activities": sum(len(day["activities"]) for day in schedule),
                "estimated_total_cost": round(total_cost, 2),
                "remaining_budget": round(budget - total_cost, 2),
                "budget_utilization": round((total_cost / budget) * 100, 2),
                "cost_per_traveler": round(total_cost / travelers, 2),
            },
            "recommendations": {
                "packing_suggestions": ["Comfortable clothes", "Sunscreen", "Water bottle"],
                "tips": ["Hire a local guide", "Try local cuisine", "Book in advance"],
            },
            "ai_score": 70,
        }

    @staticmethod
    def get_destination_recommendations(
        interests: List[str],
        budget: float,
        travelers: int,
        trip_duration: int
    ) -> Dict[str, Any]:
        """
        Recommend destinations based on user preferences
        
        Args:
            interests: User interests
            budget: Total budget
            travelers: Number of travelers
            trip_duration: Trip duration in days
        
        Returns:
            List of recommended destinations with scores
        """
        daily_budget = budget / trip_duration
        recommendations = []
        
        for dest_key, dest_info in AIItineraryService.DESTINATION_DATABASE.items():
            # Calculate recommendation score
            score = 50  # Base score
            
            # Check interest match
            dest_attractions = {a["type"] for a in dest_info["attractions"]}
            interest_match = len(set(interests) & dest_attractions)
            score += interest_match * 10
            
            # Check budget fit
            required_budget = dest_info["base_budget_per_day"] * trip_duration
            if daily_budget >= dest_info["base_budget_per_day"]:
                score += 15
            else:
                score -= 10
            
            # Check difficulty level
            if dest_info["difficulty_level"] in ["easy", "moderate"]:
                score += 5
            
            recommendations.append({
                "destination": dest_info["name"],
                "key": dest_key,
                "score": min(score, 100),
                "estimated_cost": round(required_budget, 2),
                "best_season": dest_info["best_season"],
                "difficulty": dest_info["difficulty_level"],
                "attractions": len(dest_info["attractions"]),
            })
        
        # Sort by score
        recommendations.sort(key=lambda x: x["score"], reverse=True)
        
        return {
            "success": True,
            "recommendations": recommendations,
            "top_recommendation": recommendations[0] if recommendations else None,
        }
