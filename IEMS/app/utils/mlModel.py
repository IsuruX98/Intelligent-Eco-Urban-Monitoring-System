import uuid
import cv2 as cv
import numpy as np
import pandas as pd
import tensorflow as tf
from math import sin, cos, sqrt, atan2, radians

# Load Models
model_tree = tf.keras.models.load_model('artifacts/model_tree.h5')
model_forecast = tf.keras.models.load_model('artifacts/model_forecast.h5')

# Define learning rate schedule
lr_schedule = tf.keras.optimizers.schedules.ExponentialDecay(
    0.001, decay_steps=100000, decay_rate=0.96, staircase=True
)

# Compile the tree segmentation model
model_tree.compile(
    loss='categorical_crossentropy',
    optimizer=tf.keras.optimizers.legacy.Adam(lr_schedule),
    metrics=[tf.keras.metrics.CategoricalAccuracy(), tf.keras.metrics.Precision(), tf.keras.metrics.Recall(), tf.keras.metrics.AUC()]
)

model_forecast.compile(loss='mse', optimizer='adam', metrics=['mae', 'mse'])

# Function to preprocess images
def preprocess_input(image_path, input_shape=(256, 256, 3)):
    img = cv.imread(image_path)
    img = cv.cvtColor(img, cv.COLOR_BGR2RGB)
    img = cv.resize(img, (input_shape[0], input_shape[1]), interpolation=cv.INTER_AREA)
    return img.astype("f") / 255.0

# Inference function for tree segmentation
def inference_tree(image_path):
    img = preprocess_input(image_path)
    img = np.expand_dims(img, axis=0)
    pred = model_tree.predict(img)
    pred = np.argmax(pred, axis=-1).squeeze()
    green_percentage = np.sum(pred) / pred.size
    return f"{green_percentage * 100:.2f} %"

# Haversine distance calculation
def havesine_distance(p1, p2, R=6373.0):
    lon1, lat1 = map(radians, p1)
    lon2, lat2 = map(radians, p2)
    dlon, dlat = lon2 - lon1, lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))
