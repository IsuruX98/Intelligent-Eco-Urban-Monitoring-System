from bson import ObjectId
from app.models.vehicle import Vehicle

class VehicleService:
    @staticmethod
    def create_vehicle(data):
        """Insert a new vehicle into MongoDB."""
        vehicle_id = Vehicle.collection.insert_one(data).inserted_id
        return str(vehicle_id)

    @staticmethod
    def get_vehicles_by_user(user_id):
        # Retrieve vehicles from the database for a specific user
        vehicles = Vehicle.collection.find({"user_id": user_id})
        return list(vehicles)  # Convert the result to a list
    @staticmethod
    def get_vehicle_by_id(vehicle_id):
        # Convert the vehicle_id to ObjectId
        try:
            vehicle_id = ObjectId(vehicle_id)  # This ensures that the ID is an ObjectId
        except Exception as e:
            print(f"Error converting to ObjectId: {e}")
            return None  # Return None if the conversion fails

        # Fetch the vehicle from the database
        vehicle = Vehicle.collection.find_one({"_id": vehicle_id})
        
        # Use the to_dict method to convert the vehicle document to a dictionary
        return Vehicle.to_dict(vehicle) if vehicle else None

    @staticmethod
    def update_vehicle(vehicle_id, data):
        """Update vehicle details."""
        Vehicle.collection.update_one({"_id": ObjectId(vehicle_id)}, {"$set": data})
        return True

    @staticmethod
    def delete_vehicle(vehicle_id):
        """Delete a vehicle."""
        Vehicle.collection.delete_one({"_id": ObjectId(vehicle_id)})
        return True
