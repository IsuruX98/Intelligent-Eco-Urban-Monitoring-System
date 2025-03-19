import numpy as np
import pandas as pd

# Define weights for each criterion: CO2, Engine Capacity, Engine Power, Fuel Type
WEIGHTS = np.array([0.5, 0.2, 0.2, 0.1])  # Adjust weights based on importance

FUEL_TYPE_VALUES = {
    "Petrol": 1.0,
    "Diesel": 0.8,
    "Hybrid": 0.5,
    "CNG": 0.6,
    "Electric": 0.3
}
WEATHER_WEIGHTS = {"Rainy": 1.2, "Sunny": 1.0, "Snowy": 1.5, "Windy": 1.1}
ROAD_TYPE_WEIGHTS = {"Highway": 1.0, "Urban": 1.2, "Rural": 1.3}

def recommend_vehicle(vehicle_data_list):
    """
    Rank user-owned vehicles using TOPSIS to recommend the most suitable one for reducing CO2 emissions.
    """

    if not isinstance(vehicle_data_list, list) or len(vehicle_data_list) == 0:
        raise ValueError("Input must be a list of vehicles with details.")

    for vehicle in vehicle_data_list:
        vehicle["Fuel_Type"] = FUEL_TYPE_VALUES.get(vehicle["Fuel_Type"], 1)

    df = pd.DataFrame(vehicle_data_list)
    criteria = ["CO2_Emissions", "Engine_Capacity", "Engine_Power", "Fuel_Type"]

    def normalize_matrix(matrix):
        return matrix / np.sqrt((matrix ** 2).sum())

    normalized_matrix = normalize_matrix(df[criteria])
    weighted_matrix = normalized_matrix * WEIGHTS

    ideal_solution = np.min(weighted_matrix, axis=0)
    nadir_solution = np.max(weighted_matrix, axis=0)

    distance_to_ideal = np.sqrt(((weighted_matrix - ideal_solution) ** 2).sum(axis=1))
    distance_to_nadir = np.sqrt(((weighted_matrix - nadir_solution) ** 2).sum(axis=1))

    relative_closeness = distance_to_nadir / (distance_to_ideal + distance_to_nadir)
    df["Relative_Closeness"] = relative_closeness
    df["Rank"] = df["Relative_Closeness"].rank(ascending=False)

    ranked_vehicles = df.sort_values("Rank")

    best_vehicle = ranked_vehicles.iloc[0]
    recommendations = {
        "Best_Vehicle": best_vehicle.to_dict(),
        "All_Vehicles_Ranked": ranked_vehicles.to_dict(orient="records")
    }
    return recommendations

def recommend_vehicle_with_conditions(vehicle_data_list, weather, road_type):
    """
    Recommend the best vehicle considering weather and road type factors.
    """
    if weather not in WEATHER_WEIGHTS or road_type not in ROAD_TYPE_WEIGHTS:
        raise ValueError("Invalid weather or road type provided.")

    weather_weight = WEATHER_WEIGHTS[weather]
    road_weight = ROAD_TYPE_WEIGHTS[road_type]

    for vehicle in vehicle_data_list:
        vehicle["Fuel_Type"] = FUEL_TYPE_VALUES.get(vehicle["Fuel_Type"], 1)

    df = pd.DataFrame(vehicle_data_list)
    criteria = ["CO2_Emissions", "Engine_Capacity", "Engine_Power", "Fuel_Type"]

    normalized_matrix = normalize_matrix(df[criteria])
    adjusted_weights = WEIGHTS * weather_weight * road_weight
    weighted_matrix = normalized_matrix * adjusted_weights

    ideal_solution = np.min(weighted_matrix, axis=0)
    nadir_solution = np.max(weighted_matrix, axis=0)

    distance_to_ideal = np.sqrt(((weighted_matrix - ideal_solution) ** 2).sum(axis=1))
    distance_to_nadir = np.sqrt(((weighted_matrix - nadir_solution) ** 2).sum(axis=1))

    relative_closeness = distance_to_nadir / (distance_to_ideal + distance_to_nadir)
    df["Relative_Closeness"] = relative_closeness
    df["Rank"] = df["Relative_Closeness"].rank(ascending=False)

    ranked_vehicles = df.sort_values("Rank")
    best_vehicle = ranked_vehicles.iloc[0]

    return {
        "Best_Vehicle": best_vehicle.to_dict(),
        "All_Vehicles_Ranked": ranked_vehicles.to_dict(orient="records")
    }

    
