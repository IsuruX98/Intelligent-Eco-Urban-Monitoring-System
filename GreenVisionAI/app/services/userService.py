from app.models.user import User

class UserService:
    
    @staticmethod
    def register_user(data):
        return User.create_user(data)

    @staticmethod
    def get_user(user_id):
        return User.get_user_by_id(user_id)

    @staticmethod
    def authenticate_user(email, password):
        return User.verify_password(email, password)

    @staticmethod
    def update_user(user_id, data):
        return User.update_user(user_id, data)
    
    @staticmethod
    def get_user_eco_data(user_id):
        user = User.get_user_by_id(user_id)
        if user:
            return {
                "ecoPoints": user.get("ecoPoints", 0),
                "co2Saved": user.get("co2Saved", 0)
            }
        return None