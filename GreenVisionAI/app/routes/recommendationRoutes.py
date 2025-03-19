from flask import Blueprint, request, jsonify
from app.services.recommendationService import recommend_vehicle
from app.services.llmService import LLMService

recommend_bp = Blueprint("recommend", __name__)

llm_service = LLMService()
@recommend_bp.route("/recommend_vehicle", methods=["POST"])
def vehicle_recommendation():
    try:
        vehicles_data = request.get_json()
        
        if not vehicles_data or not isinstance(vehicles_data, list):
            return jsonify({"error": "Invalid input, must provide a list of vehicles"}), 400

        recommendations = recommend_vehicle(vehicles_data)
        
        return jsonify(recommendations), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@recommend_bp.route('/recommendation_llm', methods=['POST'])
def llm_recommendation():
    """
    Handle POST requests for generating recommendations using LLM.
    """
    try:
        input_data = request.get_json()
        if not input_data:
            return jsonify({'error': 'No input data provided'}), 400
        
        # Call the LLM service to generate recommendations
        llm_response = llm_service.generate_recommendations(input_data)

        if "error" in llm_response:
            return jsonify(llm_response), 500

        # Extract recommendations from LLM response
        recommendations = llm_response.get("choices", [{}])[0].get("message", {}).get("content", "No recommendations generated")

        return jsonify({'recommendations': recommendations}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500