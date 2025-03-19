from flask import Blueprint, request, jsonify
from app.services.vehicleService import VehicleService

vehicle_bp = Blueprint("vehicle", __name__)

@vehicle_bp.route("/", methods=["POST"])
def create_vehicle():
    data = request.json
    vehicle_id = VehicleService.create_vehicle(data)
    return jsonify({"message": "Vehicle added", "vehicle_id": vehicle_id}), 201

@vehicle_bp.route("/driver/<driver_id>", methods=["GET"])
def get_vehicles_by_driver(driver_id):
    vehicles = VehicleService.get_vehicles_by_driver(driver_id)
    return jsonify(vehicles), 200

@vehicle_bp.route("/<vehicle_id>", methods=["GET"])
def get_vehicle(vehicle_id):
    vehicle = VehicleService.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        return jsonify({"message": "Vehicle not found"}), 404
    return jsonify(vehicle), 200

@vehicle_bp.route("/<vehicle_id>", methods=["PUT"])
def update_vehicle(vehicle_id):
    data = request.json
    VehicleService.update_vehicle(vehicle_id, data)
    return jsonify({"message": "Vehicle updated"}), 200

@vehicle_bp.route("/<vehicle_id>", methods=["DELETE"])
def delete_vehicle(vehicle_id):
    VehicleService.delete_vehicle(vehicle_id)
    return jsonify({"message": "Vehicle deleted"}), 200

@vehicle_bp.route("/vehicles/user/<user_id>", methods=["GET"])
def get_vehicles_by_user(user_id):
    vehicles = VehicleService.get_vehicles_by_user(user_id)
    
    if vehicles:
        return jsonify(vehicles), 200
    else:
        return jsonify({"message": "No vehicles found for this user"}), 404