"""
Routes package initialization
"""
from .auth import auth_bp
from .itinerary import itinerary_bp
from .collaboration import collaboration_bp

__all__ = ['auth_bp', 'itinerary_bp', 'collaboration_bp']
