from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import random

weather_bp = Blueprint('weather', __name__)

# Mock weather data cache
weather_cache = {}

def generate_mock_forecast(destination, start_date_str, end_date_str):
    """Generate mock weather forecast data"""
    try:
        start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d')
    except:
        return None
    
    forecast = []
    current_date = start_date
    
    conditions = ['Sunny', 'Cloudy', 'Rainy', 'Partly Cloudy', 'Overcast', 'Clear']
    
    while current_date <= end_date:
        day_forecast = {
            'date': current_date.strftime('%Y-%m-%d'),
            'day_of_week': current_date.strftime('%A'),
            'temp': random.randint(15, 35),
            'temp_min': random.randint(10, 20),
            'temp_max': random.randint(25, 40),
            'condition': random.choice(conditions),
            'humidity': random.randint(30, 90),
            'wind_speed': random.randint(5, 30),
            'precipitation': random.randint(0, 100),
            'uv_index': random.randint(1, 11)
        }
        forecast.append(day_forecast)
        current_date += timedelta(days=1)
    
    return forecast


def get_packing_recommendations(forecast, interests):
    """Generate packing recommendations based on weather and interests"""
    recommendations = {
        'essentials': [
            'Passport and travel documents',
            'Phone charger',
            'Travel insurance documents',
            'Medications'
        ],
        'weather_based': [],
        'interest_based': [],
        'warnings': []
    }
    
    # Analyze weather patterns
    avg_temp = sum(day['temp'] for day in forecast) / len(forecast)
    max_temp = max(day['temp_max'] for day in forecast)
    rainy_days = sum(1 for day in forecast if day['precipitation'] > 60 or 'Rainy' in day['condition'])
    
    # Weather-based recommendations
    if max_temp > 30:
        recommendations['weather_based'].extend([
            'Sunscreen (SPF 50+)',
            'Sunglasses',
            'Hat or cap',
            'Light, breathable clothing'
        ])
    
    if avg_temp < 15:
        recommendations['weather_based'].extend([
            'Warm jacket or sweater',
            'Long pants',
            'Thermals or warm underlayers'
        ])
    
    if rainy_days > len(forecast) / 2:
        recommendations['weather_based'].extend([
            'Umbrella',
            'Waterproof jacket',
            'Waterproof bag for electronics',
            'Quick-dry clothing'
        ])
    
    if max(day['wind_speed'] for day in forecast) > 25:
        recommendations['warnings'].append('Strong winds expected - secure loose items')
    
    # Interest-based recommendations
    interest_items = {
        'Adventure': ['Hiking boots', 'Sports watch', 'Action camera', 'Rope/carabiners'],
        'Culture': ['Comfortable walking shoes', 'Camera', 'Notebook for notes', 'Respectful attire'],
        'Food': ['Antacids', 'Wet wipes', 'Food storage containers', 'Cooking utensils'],
        'Nature': ['Binoculars', 'Field guide', 'Bug spray', 'Naturalist notebook'],
        'Beach': ['Swimsuit', 'Flip flops', 'Beach towel', 'Water shoes'],
        'Mountains': ['Hiking boots', 'Backpack', 'Rope', 'Altitude medication'],
        'Shopping': ['Extra luggage bags', 'Credit cards', 'Comfortable walking shoes'],
        'History': ['Camera', 'Portable charger', 'Comfortable walking clothes', 'Guidebook'],
        'Relaxation': ['Yoga mat', 'Meditation app', 'Comfortable lounge clothes', 'Lavender oil'],
        'Cities': ['Comfortable walking shoes', 'City map/app', 'Daypack', 'Portable charger']
    }
    
    for interest in interests:
        if interest in interest_items:
            recommendations['interest_based'].extend(interest_items[interest])
    
    # Remove duplicates
    recommendations['essentials'] = list(set(recommendations['essentials']))
    recommendations['weather_based'] = list(set(recommendations['weather_based']))
    recommendations['interest_based'] = list(set(recommendations['interest_based']))
    
    return recommendations


@weather_bp.route('/forecast', methods=['GET'])
@jwt_required()
def get_weather_forecast():
    """
    Get weather forecast for a destination and date range
    Query params:
    - destination: Destination name (required)
    - start_date: Start date in YYYY-MM-DD format (required)
    - end_date: End date in YYYY-MM-DD format (required)
    - interests: Comma-separated list of interests (optional)
    """
    try:
        destination = request.args.get('destination')
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        interests_str = request.args.get('interests', '')
        
        # Validate required parameters
        if not all([destination, start_date, end_date]):
            return jsonify({
                'error': 'Missing required parameters: destination, start_date, end_date'
            }), 400
        
        # Parse interests
        interests = [i.strip() for i in interests_str.split(',') if i.strip()] if interests_str else []
        
        # Check cache
        cache_key = f"{destination}_{start_date}_{end_date}"
        if cache_key in weather_cache:
            cached_data = weather_cache[cache_key]
            cached_data['source'] = 'cache'
            return jsonify({
                'success': True,
                'data': cached_data
            }), 200
        
        # Generate forecast
        forecast = generate_mock_forecast(destination, start_date, end_date)
        
        if not forecast:
            return jsonify({'error': 'Invalid date format'}), 400
        
        # Calculate summary
        avg_temp = sum(day['temp'] for day in forecast) / len(forecast)
        avg_humidity = sum(day['humidity'] for day in forecast) / len(forecast)
        most_common_condition = max(set(day['condition'] for day in forecast), 
                                   key=lambda x: sum(1 for day in forecast if day['condition'] == x))
        
        # Get packing recommendations
        recommendations = get_packing_recommendations(forecast, interests)
        
        weather_data = {
            'destination': destination,
            'start_date': start_date,
            'end_date': end_date,
            'forecast': forecast,
            'summary': {
                'avg_temperature': round(avg_temp, 1),
                'avg_humidity': round(avg_humidity, 1),
                'most_common_condition': most_common_condition,
                'rainy_days': sum(1 for day in forecast if day['precipitation'] > 60),
                'sunny_days': sum(1 for day in forecast if day['condition'] in ['Sunny', 'Clear'])
            },
            'packing_recommendations': recommendations,
            'source': 'generated'
        }
        
        # Cache the result
        weather_cache[cache_key] = weather_data.copy()
        weather_data['source'] = 'generated'
        
        return jsonify({
            'success': True,
            'data': weather_data
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@weather_bp.route('/alerts/<destination>', methods=['GET'])
@jwt_required()
def get_weather_alerts(destination):
    """Get weather alerts for a destination"""
    try:
        # In a real application, this would fetch from a weather API
        # For demo, return empty list
        alerts = []
        
        return jsonify({
            'success': True,
            'data': {
                'destination': destination,
                'alerts': alerts
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@weather_bp.route('/health-tips', methods=['POST'])
@jwt_required()
def get_health_tips():
    """Get health and travel tips based on weather"""
    try:
        data = request.get_json()
        destination = data.get('destination')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if not all([destination, start_date, end_date]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        forecast = generate_mock_forecast(destination, start_date, end_date)
        if not forecast:
            return jsonify({'error': 'Invalid dates'}), 400
        
        health_tips = {
            'hydration': 'Drink plenty of water, especially if temperatures are high',
            'sun_protection': 'Use sunscreen regularly, even on cloudy days',
            'altitude': 'Take time to acclimatize if destination is at high altitude',
            'food_safety': 'Eat at reputable places and avoid street food if unsure',
            'mosquito_protection': 'Use insect repellent and wear light-colored clothing',
            'travel_insurance': 'Consider travel insurance that covers medical emergencies'
        }
        
        # Add weather-specific tips
        if any(day['precipitation'] > 60 for day in forecast):
            health_tips['monsoon_precautions'] = 'Avoid flooded areas and landslide-prone zones'
        
        if any(day['temp'] < 10 for day in forecast):
            health_tips['cold_weather'] = 'Bundle up and watch for hypothermia symptoms'
        
        return jsonify({
            'success': True,
            'data': health_tips
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
