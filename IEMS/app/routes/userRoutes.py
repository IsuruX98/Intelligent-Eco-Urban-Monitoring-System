from flask import Blueprint, request, jsonify
from app.services.userService import UserService

user_bp = Blueprint("user", __name__)

@user_bp.route("/register", methods=["POST"])
def register_user():
    try:
        data = request.json
        user_id = UserService.register_user(data)
        return jsonify({"message": "User registered successfully", "user_id": user_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/<user_id>", methods=["GET"])
def get_user(user_id):
    user = UserService.get_user(user_id)
    if user:
        return jsonify(user), 200
    return jsonify({"message": "User not found"}), 404

@user_bp.route("/login", methods=["POST"])
def login_user():
    try:
        data = request.json
        user_id = UserService.authenticate_user(data["email"], data["password"])
        if user_id:
            return jsonify({"message": "Login successful", "user_id": user_id}), 200
        return jsonify({"error": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@user_bp.route("/<user_id>", methods=["PUT"])
def update_user(user_id):
    try:
        data = request.json
        if UserService.update_user(user_id, data):
            return jsonify({"message": "User updated successfully"}), 200
        return jsonify({"message": "No changes made or user not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@user_bp.route("/ecodata/<user_id>", methods=["GET"])
def get_user_eco_data(user_id):
    try:
        eco_data = UserService.get_user_eco_data(user_id)
        if eco_data:
            return jsonify(eco_data), 200
        return jsonify({"message": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500