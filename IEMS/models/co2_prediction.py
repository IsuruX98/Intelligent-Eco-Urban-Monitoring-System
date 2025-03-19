import pickle
import pandas as pd

import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model_co2_emmision.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "encoder_co2_emmision.pkl")

try:
    with open(MODEL_PATH, 'rb') as model_file:
        model_co2 = pickle.load(model_file)

    with open(ENCODER_PATH, 'rb') as encoder_file:
        encoder_co2 = pickle.load(encoder_file)

    print("Model and encoder loaded successfully!")

except FileNotFoundError as e:
    print(f"Error: {e}")
    model_co2 = None
    encoder_co2 = None

# Define the inference function for CO₂ prediction
def inference_co2(sample_json, cat_cols=['Transmission', 'Vehicle_Type', 'Fuel_Type', 'Powertrain']):
    df = pd.DataFrame([sample_json])

    if isinstance(encoder_co2, dict):
        # Apply encoding for categorical features
        for col in cat_cols:
            if col in df.columns:
                encoder = encoder_co2.get(col)
                if encoder:
                    df[col] = encoder.transform(df[col].str.strip())
                else:
                    return {'error': f'Encoder for column {col} not found in encoder dictionary.'}, 400
    else:
        return {'error': 'Encoder should be a dictionary containing individual encoders.'}, 500

    # Ensure numeric columns remain numeric
    df = df.apply(pd.to_numeric, errors='ignore')

    # Predict CO₂ emission
    X = df.values
    Ypred = model_co2.predict(X)
    return int(Ypred[0])
