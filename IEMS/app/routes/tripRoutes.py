from flask import Blueprint, request, jsonify
from app.models.trip import Trip

trip_bp = Blueprint('trip', __name__)

@trip_bp.route('/add', methods=['POST'])
def add_trip():
    data = request.json
    required_fields = ['user_id', 'vehicle_id', 'startLocation', 'destination', 'distance', 'time', 'co2']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'error': f"'{field}' is required."}), 400
    trip_id = Trip.create_trip(data)
    return jsonify({'message': 'Trip added successfully', 'trip_id': trip_id}), 201

@trip_bp.route('/all', methods=['GET'])
def get_all_trips():
    trips = Trip.get_all_trips()
    return jsonify(trips), 200 