from flask import Blueprint, request, jsonify
from models.co2_prediction import inference_co2, model_co2, encoder_co2
from app.services.vehicleService import VehicleService

co2_bp = Blueprint('co2', __name__)

@co2_bp.route('/predict', methods=['POST'])
def predict():
    """
    Handle POST requests for single vehicle CO₂ emission prediction.
    """
    try:
        if model_co2 is None or encoder_co2 is None:
            return jsonify({'error': 'Model or encoder not loaded'}), 500

        input_data = request.get_json()
        if not input_data:
            return jsonify({'error': 'No input data provided'}), 400

        vehicle_id = input_data.pop('vehicle_id', None)  # Extract vehicle_id
        if not vehicle_id:
            return jsonify({'error': 'Vehicle ID is required'}), 400

        # Predict CO₂ emission
        prediction = inference_co2(input_data)  # Run prediction on remaining input data

        # Update input_data with predicted CO₂ emission
        input_data['CO2_Emission'] = prediction

        # Update the vehicle with new data (including CO₂ emission)
        update_success = VehicleService.update_vehicle(vehicle_id, input_data)

        if not update_success:
            return jsonify({'error': 'Failed to update vehicle data'}), 500

        return jsonify({
            'predicted_co2_emission': prediction,
            'message': 'Vehicle CO₂ emission updated successfully'
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

