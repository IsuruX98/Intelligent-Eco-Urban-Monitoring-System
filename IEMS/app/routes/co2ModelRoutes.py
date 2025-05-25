from flask import Blueprint, request, jsonify
from models.co2_prediction import inference_co2, model_co2, encoder_co2
from app.services.vehicleService import VehicleService
from app.services.llmService import LLMService
from app.utils.ocr_utils import extract_text_from_image
import os
import tempfile

co2_bp = Blueprint('co2', __name__)
llm_service = LLMService()

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


@co2_bp.route('/extract_co2_from_certificate', methods=['POST'])
def extract_co2_from_certificate():
    """
    Accepts an image file, runs OCR, extracts CO2 emission value, and calculates g/km using user-provided fuel consumption in km/L and the vehicle's fuel type from the database.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part in the request'}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        # Get vehicle_id and fuel_consumption_km_per_l from request
        vehicle_id = request.form.get('vehicle_id')
        fuel_consumption_km_per_l = request.form.get('fuel_consumption_km_per_l')
        if not vehicle_id:
            return jsonify({'error': 'Vehicle ID is required'}), 400
        if not fuel_consumption_km_per_l:
            return jsonify({'error': 'Fuel consumption (km/L) is required'}), 400

        try:
            fuel_consumption_km_per_l = float(fuel_consumption_km_per_l)
            if fuel_consumption_km_per_l <= 0:
                return jsonify({'error': 'Fuel consumption (km/L) must be greater than zero'}), 400
            # Convert km/L to l/100km
            fuel_consumption = 100 / fuel_consumption_km_per_l
        except ValueError:
            return jsonify({'error': 'Fuel consumption (km/L) must be a number'}), 400

        # Fetch vehicle from DB to get fuelType
        vehicle = VehicleService.get_vehicle_by_id(vehicle_id)
        if not vehicle:
            return jsonify({'error': 'Vehicle not found'}), 404
        fuel_type = vehicle.get('fuelType')
        if not fuel_type:
            return jsonify({'error': 'Fuel type not found in vehicle record'}), 400

        # Save the uploaded file to a cross-platform temporary location
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
            file.save(tmp.name)
            temp_path = tmp.name

        # Run OCR to extract text
        ocr_text = extract_text_from_image(temp_path)

        # Call LLM to extract CO2 value
        llm_response = llm_service.extract_co2_from_text(ocr_text)
        if "error" in llm_response:
            os.remove(temp_path)
            return jsonify(llm_response), 500

        # Extract the CO2 value from LLM response
        co2_value = llm_response.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
        
        try:
            # Use fuelType from DB for CO2 calculation
            if fuel_type.lower() in ["gasoline", "petrol"]:
                co2_per_liter = 2320  # g/liter
            elif fuel_type.lower() == "diesel":
                co2_per_liter = 2640  # g/liter
            else:
                co2_per_liter = 2320  # Default to gasoline if unknown

            # Calculate CO2 emissions in g/km
            co2_gkm = (co2_per_liter * fuel_consumption) / 100

            # Update vehicle with new CO2 emission value
            update_data = {'CO2_Emission': round(co2_gkm, 2)}
            update_success = VehicleService.update_vehicle(vehicle_id, update_data)
            
            if not update_success:
                os.remove(temp_path)
                return jsonify({'error': 'Failed to update vehicle data'}), 500

            # Clean up the temporary file
            os.remove(temp_path)

            return jsonify({
                'co2_value_vv': float(co2_value),
                'fuel_consumption_km_per_l': fuel_consumption_km_per_l,
                'fuel_consumption_l_per_100km': round(fuel_consumption, 2),
                'fuel_type': fuel_type,
                'co2_value_gkm': round(co2_gkm, 2),
                'message': 'Vehicle CO₂ emission updated successfully'
            }), 200

        except ValueError:
            os.remove(temp_path)
            return jsonify({'error': 'Invalid CO2 value extracted from certificate'}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500

