import uuid
import librosa
import cv2 as cv
import pickle, os
import numpy as np 
import pandas as pd
import tensorflow as tf
from math import sin, cos, sqrt, atan2, radians
from flask import Flask, request, jsonify,send_from_directory
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['UPLOAD_FOLDER'] = 'uploads'
CORS(app)     

# Define the paths for model and encoder
model_tree = tf.keras.models.load_model('artifacts/model_tree.h5')

# Define learning rate schedule for optimizer
lr_schedule = tf.keras.optimizers.schedules.ExponentialDecay(
                                                            0.001,
                                                            decay_steps=100000,
                                                            decay_rate=0.96,
                                                            staircase=True
                                                            )

# Compile the tree segmentation model with optimizer and evaluation metrics
model_tree.compile(
                    loss='categorical_crossentropy',
                    optimizer=tf.keras.optimizers.legacy.Adam(lr_schedule),
                    metrics=[
                        tf.keras.metrics.CategoricalAccuracy(),
                        tf.keras.metrics.Precision(),
                        tf.keras.metrics.Recall(),
                        tf.keras.metrics.AUC()
                        ]
                    )

# Load another model for CO2 emission prediction (model_forecast)
model_forecast = tf.keras.models.load_model('artifacts/model_forecast.h5')
model_forecast.compile(
                    loss='mse', 
                    optimizer='adam',
                    metrics=['mae', 'mse']
                    )

# Function to normalize image using Min-Max normalization
def minmax_norm(img):
    return (img - np.min(img)) / (np.max(img) - np.min(img))

# Function to normalize image using standard normalization (zero mean, unit variance)
def standar_norm(img):
    return (img - np.mean(img)) / np.std(img)

# Function to preprocess input image for model prediction
def preprocess_input(
                    image_path,
                    input_shape = (256, 256, 3)
                    ):
    img = cv.imread(image_path)
    original_img = img
    
    img = cv.cvtColor(img, cv.COLOR_BGR2RGB)
    img = np.asarray(img).astype("f")
    img = cv.resize(img, (input_shape[0], input_shape[1]), interpolation = cv.INTER_AREA)
    img = minmax_norm(img)
    return img, original_img

# Function to preprocess mask (output) for segmentation model
def preprocess_output(
                    mask_path,
                    output_shape_orig = (256, 256, 3),
                    building_color = (255, 255, 255),
                    background_color = (0, 0, 0)
                    ):
    mask = cv.imread(mask_path)
    mask = cv.cvtColor(mask, cv.COLOR_BGR2RGB)
    mask = cv.resize(mask, (output_shape_orig[0], output_shape_orig[1]), interpolation = cv.INTER_AREA)

    mask_new = np.zeros((mask.shape[0], mask.shape[1]))
    mask_new[np.all(mask == background_color, axis=-1)] = 0
    mask_new[np.all(mask == building_color, axis=-1)] = 1
        
    mask_new = mask_new.reshape(mask_new.shape[0] * mask_new.shape[1],)
    mask_new = tf.one_hot(mask_new, 2).numpy()
    return mask_new  

# Function to calculate tree coverage percentage in the image
def inference_tree(image_path):
    img = preprocess_input(image_path)[0]
    img = np.expand_dims(img, axis=0)
    pred = model_tree.predict(img)
    pred = np.argmax(pred, axis=-1).squeeze()
    green_prercentage = np.sum(pred) / pred.size
    return f"{green_prercentage * 100:.2f} %"

# Legacy function - kept for backward compatibility but not used
# The improved calc_vegetation_density function below should be used instead

def calc_vegetation_density(image):
    """
    Enhanced vegetation density calculation using multiple color spaces and adaptive thresholds
    """
    # Convert image to RGB format
    image_rgb = cv.cvtColor(image, cv.COLOR_BGR2RGB).astype(float)
    
    # Convert to HSV for better vegetation detection
    image_hsv = cv.cvtColor(image.astype(np.uint8), cv.COLOR_BGR2HSV).astype(float)
    
    # Extract channels
    red_channel = image_rgb[:, :, 0]
    green_channel = image_rgb[:, :, 1]
    blue_channel = image_rgb[:, :, 2]
    
    # HSV channels
    hue = image_hsv[:, :, 0]
    saturation = image_hsv[:, :, 1]
    value = image_hsv[:, :, 2]

    # Identify non-black pixels (valid area for analysis)
    non_black_pixels = np.any(image != [0, 0, 0], axis=-1)
    total_pixels = np.sum(non_black_pixels)
    
    if total_pixels == 0:
        return image, {
            'NDVI Score': 0.0,
            'High Vegetation Density Coverage': "0.00 %",
            'Medium Vegetation Density Coverage': "0.00 %",
            'Low Vegetation Density Coverage': "0.00 %"
        }

    # Enhanced NDVI calculation (approximation using visible bands)
    # Using Near-Infrared approximation: NIR ≈ Green + (Green - Red)
    nir_approx = green_channel + (green_channel - red_channel)
    ndvi = (nir_approx - red_channel) / (nir_approx + red_channel + 1e-10)
    
    # Alternative vegetation indices
    # Excess Green Index (ExG)
    exg = 2 * green_channel - red_channel - blue_channel
    
    # Green-Red Vegetation Index (GRVI)
    grvi = (green_channel - red_channel) / (green_channel + red_channel + 1e-10)
    
    # Vegetation detection using multiple criteria
    # 1. Green dominance
    green_dominant = (green_channel > red_channel) & (green_channel > blue_channel)
    
    # 2. HSV-based vegetation detection (green hue range)
    # Green hue is typically between 35-85 degrees in HSV
    green_hue = ((hue >= 35) & (hue <= 85)) | ((hue >= 35/2) & (hue <= 85/2))  # Handle different HSV scales
    high_saturation = saturation > 30  # Minimum saturation for vegetation
    sufficient_brightness = value > 20  # Minimum brightness
    
    # 3. NDVI-based vegetation detection
    vegetation_ndvi = ndvi > 0.1
    
    # 4. ExG-based vegetation detection
    vegetation_exg = exg > 10
    
    # Combine all vegetation detection methods
    vegetation_mask = (green_dominant & high_saturation & sufficient_brightness & 
                      vegetation_ndvi & vegetation_exg & non_black_pixels)
    
    # Calculate vegetation intensity for density classification
    # Combine multiple indicators for better classification
    vegetation_intensity = (
        0.4 * (green_channel / 255.0) +  # Green channel contribution
        0.3 * (ndvi + 1) / 2 +           # Normalized NDVI (0-1 range)
        0.2 * (saturation / 255.0) +     # Saturation contribution
        0.1 * (exg / 100.0)              # ExG contribution (normalized)
    )
    
    # Apply vegetation mask
    vegetation_intensity = vegetation_intensity * vegetation_mask
    
    # Adaptive thresholding based on the overall vegetation intensity distribution
    vegetation_pixels = vegetation_intensity[vegetation_mask]
    
    if len(vegetation_pixels) > 0:
        # Calculate percentiles for adaptive thresholds
        p25 = np.percentile(vegetation_pixels, 25)
        p50 = np.percentile(vegetation_pixels, 50)
        p75 = np.percentile(vegetation_pixels, 75)
        p90 = np.percentile(vegetation_pixels, 90)
        
        # Adaptive thresholds
        high_threshold = max(p75, 0.6)    # High density: top 25% or minimum 0.6
        medium_threshold = max(p50, 0.4)   # Medium density: median or minimum 0.4
        low_threshold = max(p25, 0.2)     # Low density: bottom 25% or minimum 0.2
    else:
        # Default thresholds if no vegetation detected
        high_threshold = 0.7
        medium_threshold = 0.5
        low_threshold = 0.3
    
    # Classify vegetation density
    high_density_mask = (vegetation_intensity >= high_threshold) & vegetation_mask
    medium_density_mask = (vegetation_intensity >= medium_threshold) & (vegetation_intensity < high_threshold) & vegetation_mask
    low_density_mask = (vegetation_intensity >= low_threshold) & (vegetation_intensity < medium_threshold) & vegetation_mask
    
    # Calculate percentages
    high_density_percentage = np.sum(high_density_mask) / total_pixels * 100
    medium_density_percentage = np.sum(medium_density_mask) / total_pixels * 100
    low_density_percentage = np.sum(low_density_mask) / total_pixels * 100
    
    # Update image with vegetation density colors
    image_updated = image.copy()
    image_updated[high_density_mask] = [0, 255, 0]    # Bright Green for High Density
    image_updated[medium_density_mask] = [0, 180, 0]  # Medium Green for Medium Density
    image_updated[low_density_mask] = [0, 120, 0]     # Dark Green for Low Density
    
    # Calculate overall NDVI score (only for vegetation areas)
    if np.sum(vegetation_mask) > 0:
        mean_ndvi = np.mean(ndvi[vegetation_mask])
    else:
        mean_ndvi = np.mean(ndvi[non_black_pixels]) if np.sum(non_black_pixels) > 0 else 0
    
    # Ensure percentages add up correctly and handle edge cases
    total_vegetation_percentage = high_density_percentage + medium_density_percentage + low_density_percentage
    
    # If total vegetation is very low, adjust the classification
    if total_vegetation_percentage < 5:  # Less than 5% vegetation
        # Recalculate with more lenient thresholds
        lenient_vegetation = (green_channel > red_channel) & (green_channel > blue_channel) & non_black_pixels
        if np.sum(lenient_vegetation) > 0:
            low_density_percentage = np.sum(lenient_vegetation) / total_pixels * 100
            medium_density_percentage = 0
            high_density_percentage = 0
            # Update image for lenient vegetation
            image_updated[lenient_vegetation] = [0, 100, 0]  # Very dark green for sparse vegetation
    
    # Round percentages
    high_density_percentage = np.round(high_density_percentage, 2)
    medium_density_percentage = np.round(medium_density_percentage, 2)
    low_density_percentage = np.round(low_density_percentage, 2)
    
    return image_updated, {
        'NDVI Score': np.round(mean_ndvi, 3),
        'High Vegetation Density Coverage': f"{high_density_percentage:.2f} %",
        'Medium Vegetation Density Coverage': f"{medium_density_percentage:.2f} %",
        'Low Vegetation Density Coverage': f"{low_density_percentage:.2f} %"
    }

# Haversine function to calculate distance between two geographic points
def havesine_distance(
                    p1, p2,
                    R = 6373.0
                    ):
    
    lon1, lat1 = p1
    lon2, lat2 = p2

    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)

    dlon = lon2 - lon1
    dlat = lat2 - lat1

    a = sin(dlat / 2)**2 + cos(lat1) * cos(lat2) * sin(dlon / 2)**2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))

    distance = R * c
    return distance

# Function to forecast vegetation coverage for the next 3 months
def inference_forecast(   
                        location_id,                                 
                        selective_window=12,
                        data_path = "data/TreeSegmentation/satellite_tree_coverage.csv"
                        ):
    df = pd.read_csv(data_path)
    del df['Timestamp']

    df = df.iloc[-selective_window:]
    X = np.array(df.values).reshape(1, selective_window, df.shape[1])

    Y_pred = model_forecast.predict(X)
    Y_pred = np.array(Y_pred).squeeze()
    Y_pred = np.round(Y_pred, 2)
    vals = (
            round(Y_pred[0][location_id], 2), 
            round(Y_pred[1][location_id], 2), 
            round(Y_pred[2][location_id], 2)
            )
    
    vals = {
            "month 1" : f"{vals[0]} %",
            "month 2" : f"{vals[1]} %",
            "month 3" : f"{vals[2]} %"
            }
    return vals

def visualize_inference_modified(
                                image_path, location,
                                background_color = (0, 0, 0),
                                output_shape_new = (65536, 2),
                                building_color = (255, 255, 255),
                                output_shape_orig = (256, 256, 3)
                                ):
    img, original_img = preprocess_input(image_path)
    height, width, _ = original_img.shape

    img = np.expand_dims(img, axis=0)
    pred = model_tree.predict(img)
    pred = np.argmax(pred, axis=-1).squeeze()

    pred_img = np.zeros((output_shape_new[0], 3))
    pred_img[np.where(pred == 0)] = background_color
    pred_img[np.where(pred == 1)] = building_color
    pred_img = pred_img.reshape(output_shape_orig[0], output_shape_orig[1], 3)

    # generate new image as background is black but foreground is in original color
    overlay = original_img.copy()
    overlay = cv.cvtColor(overlay, cv.COLOR_BGR2RGB)
    overlay = cv.resize(overlay, (output_shape_orig[0], output_shape_orig[1]), interpolation = cv.INTER_AREA)
    overlay = overlay.reshape(-1, 3)
    overlay[np.where(pred == 0)] = (0, 0, 0)
    overlay = overlay.reshape(output_shape_orig[0], output_shape_orig[1], 3)
    overlay, response = calc_vegetation_density(overlay)
    green_percentage = inference_tree(image_path)
    response['Green Percentage'] = green_percentage

    contour_img = original_img.copy()
    contour_img = cv.resize(contour_img, (output_shape_orig[0], output_shape_orig[1]), interpolation = cv.INTER_AREA)
    contour_img = cv.cvtColor(contour_img, cv.COLOR_BGR2RGB)

    pred_img_gray = np.uint8(pred_img[:, :, 0])
    edged = cv.Canny(pred_img_gray, 30, 200)
    contours, _ = cv.findContours(
                                            edged,  
                                            cv.RETR_EXTERNAL, 
                                            cv.CHAIN_APPROX_NONE
                                            ) 
    cv.drawContours(contour_img, contours, -1, (255, 0, 0), 1)
    
    original_path = f'store/Original/{str(uuid.uuid4())}.png'
    overlay_path = f'store/Overlay/{str(uuid.uuid4())}.png'
    contour_path = f'store/Contour/{str(uuid.uuid4())}.png'
    pred_path = f'store/Predict/{str(uuid.uuid4())}.png'

    overlay = cv.resize(overlay, (width, height), interpolation = cv.INTER_AREA)
    contour_img = cv.resize(contour_img, (width, height), interpolation = cv.INTER_AREA)
    pred_img = cv.resize(pred_img, (width, height), interpolation = cv.INTER_AREA)
        
    cv.imwrite(original_path, original_img)
    cv.imwrite(overlay_path, overlay)
    cv.imwrite(contour_path, contour_img)
    cv.imwrite(pred_path, pred_img)

    df_coor = pd.read_csv('data/TreeSegmentation/coordinates.csv')
    df_coor['distance'] = df_coor[['Longitude', 'Latitude']].apply(
                                                                lambda x: havesine_distance(
                                                                    (x['Longitude'], x['Latitude']),
                                                                    location
                                                                    ),
                                                                axis=1
                                                                )
    df_coor = df_coor.sort_values(by='distance')
    location_id = df_coor.index[0]
    print('Location ID : ', location_id)

    gree_evolution = inference_forecast(location_id)
    return {"segmentation_results" : {
                                    "original" : original_path,
                                    "overlay" : overlay_path,
                                    "contour" : contour_path,
                                    "predict" : pred_path
                                    },
            "segmentation_stats" : response,
            "forecast" : gree_evolution
            }

# Define a route to get tree segmentation prediction from an image
@app.route('/api/tree', methods=['POST'])
def tree():
    file = request.files['file']
    latitude = request.form['latitude']
    longitude = request.form['longitude']
    location = (float(longitude), float(latitude))
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(file_path)

    response = visualize_inference_modified(
                                            file_path, 
                                            location
                                            )
    os.remove(file_path)

    return jsonify(response)

@app.route('/store/<path:filename>')
def serve_static(filename):
    return send_from_directory('store', filename)

# @app.route('/api/forecast', methods=['POST'])
# def forecast():
#     data = request.get_json()
#     prediction = inference_forecast(data['location_id'])
#     return jsonify({"forecast": prediction})

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # default to 5000 if PORT is not set
    app.run(host='0.0.0.0', port=port, debug=True)