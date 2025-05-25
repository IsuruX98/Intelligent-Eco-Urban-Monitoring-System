from app import mongo
from bson import ObjectId

class Trip:
    collection = mongo.db.trips

    @staticmethod
    def create_trip(data):
        trip_data = {
            "user_id": data.get("user_id"),
            "vehicle_id": data.get("vehicle_id"),
            "startLocation": data.get("startLocation"),
            "destination": data.get("destination"),
            "distance": data.get("distance"),
            "time": data.get("time"),
            "co2": data.get("co2")
        }
        result = Trip.collection.insert_one(trip_data)
        return str(result.inserted_id)

    @staticmethod
    def get_all_trips():
        trips = Trip.collection.find()
        return [Trip._to_dict(trip) for trip in trips]

    @staticmethod
    def _to_dict(trip):
        trip['_id'] = str(trip['_id'])
        return trip 