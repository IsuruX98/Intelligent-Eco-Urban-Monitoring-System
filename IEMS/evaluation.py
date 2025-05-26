import sys
import os
import numpy as np
from sklearn.metrics import mean_absolute_error, r2_score

# Add root directory to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

# Now import your model
from models.co2_prediction import inference_co2

# Mock data - adjust based on your actual model inputs
MOCK_DATA = [
    {
         "Transmission": "CVT",
        "Vehicle_Type": "Automatic",
        "Engine_Capacity": 1498,
        "Fuel_Type": "Petrol",
        "Powertrain": "Internal Combustion Engine (ICE)",
        "Engine_PowerPS": 121,
        "expected_co2": 139  # Example expected value in g/km
    },
   {
        "Transmission": "8AT",
        "Vehicle_Type": "Automatic",
        "Engine_Capacity": 1995,
        "Fuel_Type": "Diesel",
        "Powertrain": "Internal Combustion Engine (ICE)",
        "Engine_PowerPS": 150,
        "expected_co2": 142  # BMW 320d
    },
      {
        "Transmission": "E-CVT",
        "Vehicle_Type": "Automatic",
        "Engine_Capacity": 1798,
        "Fuel_Type": "Electric / Petrol",
        "Powertrain": "Hybrid Electric Vehicle (HEV)",
        "Engine_PowerPS": 122,
        "expected_co2": 97  # Toyota Prius
    },
]

def run_evaluation():
    actual = []
    predicted = []
    
    for test_case in MOCK_DATA:
        try:
            # Extract input features
            input_data = {k: v for k, v in test_case.items() if k != "expected_co2"}
            
            # Get prediction
            pred = inference_co2(input_data)
            
            # Store results
            actual.append(test_case["expected_co2"])
            predicted.append(pred)
            
            print(f"Input: {input_data}")
            print(f"Predicted: {pred:.2f} | Actual: {test_case['expected_co2']}")
            print("-" * 50)
            
        except Exception as e:
            print(f"Error on case {test_case}: {str(e)}")
            continue

    # Calculate metrics
    print("\nFinal Metrics:")
    print(f"MAE: {mean_absolute_error(actual, predicted):.2f} g/km")
    print(f"R² Score: {r2_score(actual, predicted):.2f}")
    print(f"Sample Count: {len(actual)}")

if __name__ == "__main__":
    run_evaluation()