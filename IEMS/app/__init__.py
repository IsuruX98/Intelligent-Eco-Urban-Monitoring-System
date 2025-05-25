from flask import Flask
from flask_pymongo import PyMongo
from flask_cors import CORS
import os

# Initialize PyMongo globally
mongo = PyMongo()

def create_app():
    app = Flask(__name__)

    # Load environment variables (use a .env file or system variables)
    app.config["MONGO_URI"] = os.getenv("MONGO_URI", "mongodb+srv://admin:1234@cluster0.4emtz3f.mongodb.net/iems?retryWrites=true&w=majority&appName=Cluster0")

    # Initialize MongoDB
    try:
        mongo.init_app(app)
        print(" Connected to MongoDB successfully!")
    except Exception as e:
        print(f" Error connecting to MongoDB: {e}")
        raise e  # Re-raise the exception to prevent app from starting with failed DB connection

    # Enable CORS with specific origins
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000", "supports_credentials": True}})  ## https://huggingface.co/datasets/milind27/CO2_Vehicle_Emmisions

    # Import and register blueprints after MongoDB is initialized
    with app.app_context():
        from app.routes.vehicleRoute import vehicle_bp
        from app.routes.userRoutes import user_bp 
        from app.routes.co2ModelRoutes import co2_bp
        from app.routes.recommendationRoutes import recommend_bp
        from app.routes.tripRoutes import trip_bp
        #from app.routes.treeRoutes import tree_bp

        app.register_blueprint(vehicle_bp, url_prefix="/api/vehicles")
        app.register_blueprint(user_bp, url_prefix="/api/users")  
        app.register_blueprint(co2_bp, url_prefix="/api/co2")
        app.register_blueprint(recommend_bp, url_prefix="/api/recommend")
        app.register_blueprint(trip_bp, url_prefix="/api/trip")
        #app.register_blueprint(tree_bp, url_prefix="/api/tree")

    return app