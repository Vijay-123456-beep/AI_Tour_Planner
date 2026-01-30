from flask import Blueprint

# Create a Blueprint instance for the main application
main_bp = Blueprint('main', __name__)

# Import routes to register them with the blueprint
from . import routes  # noqa: E402

# Import blueprints from other modules
from .routes import auth_bp, itinerary_bp, collaboration_bp, transport_bp

# Register blueprints
def register_blueprints(app):
    """Register all blueprints with the Flask application."""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(itinerary_bp, url_prefix='/api/itinerary')
    app.register_blueprint(collaboration_bp, url_prefix='/api/collaboration')
    app.register_blueprint(transport_bp, url_prefix='/api/transport')
    
    # Register the main blueprint last to handle any remaining routes
    app.register_blueprint(main_bp)

# This allows the application to be run directly with `python -m app`
if __name__ == '__main__':
    from flask import Flask
    app = Flask(__name__)
    register_blueprints(app)
    app.run(debug=True)