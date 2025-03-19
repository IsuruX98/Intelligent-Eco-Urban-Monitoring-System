from app import mongo
from bson import ObjectId
from werkzeug.security import generate_password_hash, check_password_hash

class User:
    collection = mongo.db.users

    @staticmethod
    def create_user(data):
        user_data = {
            "name": data.get("name"),
            "email": data.get("email"),
            "password": generate_password_hash(data.get("password")),
            "userType": data.get("userType", "driver")
        }
        result = User.collection.insert_one(user_data)
        return str(result.inserted_id)

    @staticmethod
    def get_user_by_id(user_id):
        try:
            user = User.collection.find_one({"_id": ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
                return user
            return None
        except Exception as e:
            print(f"Error fetching user: {e}")
            return None

    @staticmethod
    def verify_password(email, password):
        user = User.collection.find_one({"email": email})
        if user and check_password_hash(user["password"], password):
            return str(user["_id"])
        return None

    @staticmethod
    def update_user(user_id, data):
        try:
            update_data = {k: v for k, v in data.items() if v is not None}
            if not update_data:
                return False
            result = User.collection.update_one(
                {"_id": ObjectId(user_id)},
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            print(f"Error updating user: {e}")
            return False