from app import mongo
from bson import ObjectId

class Vehicle:
    collection = mongo.db.vehicles

    @staticmethod
    def to_dict(vehicle):
        if vehicle:
            vehicle['_id'] = str(vehicle['_id'])
            vehicle['userId'] = str(vehicle['userId'])
            return vehicle
        return None

    @staticmethod
    def create_vehicle(data):
        vehicle_data = {
            "name": data.get("name"),
            "brand": data.get("brand"),
            "fuelType": data.get("fuelType"),
            "engineCapacity": data.get("engineCapacity"),
            "enginePower": data.get("enginePower"),
            "userId": ObjectId(data.get("userId"))
        }
        result = Vehicle.collection.insert_one(vehicle_data)
        return str(result.inserted_id)

    @staticmethod
    def get_vehicle_by_id(vehicle_id):
        try:
            vehicle = Vehicle.collection.find_one({"_id": ObjectId(vehicle_id)})
            return Vehicle.to_dict(vehicle) if vehicle else None
        except Exception as e:
            print(f"Error fetching vehicle: {e}")
            return None

    @staticmethod
    def get_vehicles_by_user(user_id):
        vehicles = Vehicle.collection.find({"user_id": user_id})
        return [vehicle for vehicle in vehicles]  