from flask import Flask
from flask_pymongo import PyMongo
from flask_cors import CORS
import os

# Initialize PyMongo globally
mongo = PyMongo()

def create_app():
    app = Flask(__name__)

    # Load environment variables (use a .env file or system variables)
    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb+srv://user:16820@cluster0.4emtz3f.mongodb.net/ecogo?retryWrites=true&w=majority")

    # Initialize MongoDB
    try:
        mongo.init_app(app)
        print(" Connected to MongoDB successfully!")
    except Exception as e:
        print(f" Error connecting to MongoDB: {e}")

    # Enable CORS with specific origins
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000", "supports_credentials": True}})

    # Register Blueprints
    from app.routes.vehicleRoute import vehicle_bp
    from app.routes.userRoutes import user_bp 
    from app.routes.co2ModelRoutes import co2_bp
    from app.routes.recommendationRoutes import recommend_bp
    #from app.routes.treeRoutes import tree_bp

    app.register_blueprint(vehicle_bp, url_prefix="/api/vehicles")
    app.register_blueprint(user_bp, url_prefix="/api/users")  
    app.register_blueprint(co2_bp, url_prefix="/api/co2")
    app.register_blueprint(recommend_bp, url_prefix="/api/recommend")
    #app.register_blueprint(tree_bp, url_prefix="/api/tree")

    return app