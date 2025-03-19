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

# Function to calculate vegetation density in an image
def calc_vegitation_density(image):
    image = cv.cvtColor(image, cv.COLOR_BGR2RGB)

    red_channel = image[:, :, 0].astype(float)
    green_channel = image[:, :, 1].astype(float)

    print(green_channel)

    ndvi = (green_channel - red_channel) / (green_channel + red_channel + 1e-10)  # Adding a small constant to avoid division by zero

    non_zer_idxs = (image != [0, 0, 0]).all(axis=-1)
    total_pixels = np.sum(non_zer_idxs)

    high_density_percentage = np.sum(
                                    np.logical_and(
                                        (green_channel > 171),
                                        non_zer_idxs
                                        )
                                    ) / total_pixels * 100

    medium_density_percentage = np.sum(
                                    np.logical_and( 
                                        (green_channel < 171),
                                        (green_channel > 86),
                                        non_zer_idxs
                                        )
                                    ) / total_pixels * 100
    
    low_density_percentage = np.sum(
                                    np.logical_and(         
                                        (green_channel < 86),
                                        (green_channel > 0),
                                        non_zer_idxs
                                        )
                                    ) / total_pixels * 100

    image[np.logical_and((green_channel >= 171), non_zer_idxs)] = [0, 255, 0]
    image[np.logical_and((green_channel < 171), (green_channel >= 86), non_zer_idxs)] = [0, 128, 0]
    image[np.logical_and((green_channel < 86), (green_channel > 0), non_zer_idxs)] = [0, 64, 0]

    low_density_percentage = np.round(low_density_percentage, 2)
    medium_density_percentage = np.round(medium_density_percentage, 2)
    high_density_percentage = 100 - low_density_percentage - medium_density_percentage  

    low_density_percentage = f"{low_density_percentage:.2f} %"
    medium_density_percentage = f"{medium_density_percentage:.2f} %"
    high_density_percentage = f"{high_density_percentage:.2f} %"

    return image,{
                'NDVI Score': np.round(np.mean(ndvi), 2),
                'High Vegetation Density Coverage': high_density_percentage,
                'Medium Vegetation Density Coverage': medium_density_percentage,
                'Low Vegetation Density Coverage': low_density_percentage
                }

def calc_vegetation_density(image):
    # Convert image to RGB format
    image_rgb = cv.cvtColor(image, cv.COLOR_BGR2RGB).astype(float)

    # Extract Red and Green channels
    red_channel = image_rgb[:, :, 0]
    green_channel = image_rgb[:, :, 1]

    # NDVI Calculation
    ndvi = (green_channel - red_channel) / (green_channel + red_channel + 1e-10)  # Avoid division by zero

    # Identify non-black pixels (valid area for analysis)
    non_black_pixels = np.any(image != [0, 0, 0], axis=-1)
    total_pixels = np.sum(non_black_pixels)

    # Improved vegetation density thresholds
    high_threshold = 180  # Dense greenery
    medium_threshold = 120  # Moderate greenery
    low_threshold = 60  # Sparse greenery

    # Compute density percentages
    high_density_percentage = np.sum((green_channel >= high_threshold) & non_black_pixels) / total_pixels * 100
    medium_density_percentage = np.sum((green_channel < high_threshold) & (green_channel >= medium_threshold) & non_black_pixels) / total_pixels * 100
    low_density_percentage = np.sum((green_channel < medium_threshold) & (green_channel >= low_threshold) & non_black_pixels) / total_pixels * 100

    # Update image with new vegetation colors
    image_updated = image.copy()
    image_updated[(green_channel >= high_threshold) & non_black_pixels] = [0, 255, 0]  # Bright Green for High Density
    image_updated[(green_channel < high_threshold) & (green_channel >= medium_threshold) & non_black_pixels] = [0, 200, 0]  # Medium Green for Medium Density
    image_updated[(green_channel < medium_threshold) & (green_channel >= low_threshold) & non_black_pixels] = [0, 150, 0]  # Dark Green for Low Density

    # Rounding percentages
    low_density_percentage = np.round(low_density_percentage, 2)
    medium_density_percentage = np.round(medium_density_percentage, 2)
    high_density_percentage = 100 - low_density_percentage - medium_density_percentage  

    low_density_percentage = f"{low_density_percentage:.2f} %"
    medium_density_percentage = f"{medium_density_percentage:.2f} %"
    high_density_percentage = f"{high_density_percentage:.2f} %"

    return image_updated, {
        'NDVI Score': np.round(np.mean(ndvi), 2),
        'High Vegetation Density Coverage': high_density_percentage,
        'Medium Vegetation Density Coverage': medium_density_percentage,
        'Low Vegetation Density Coverage': low_density_percentage
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
    app.run(port=5000, debug=True)