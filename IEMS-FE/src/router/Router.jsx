import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import GreenVisionHome from "../pages/GreenVisionHome";
import EcoSensorHome from "../pages/EcoSensorHome";
import NoiseGuardHome from "../pages/NoiseGuardHome";
import EcoGoHome from "../pages/EcoGoHome";
import PredictionPageAir from "../pages/PredictionPageAir";
import AddVehicle from "../pages/EcoGo/addVehicle";
import CO2Prediction from "../pages/EcoGo/predictVehicleCO2";
import EcoGoDashboard from "../pages/EcoGo/ecoGoDashboard";
import VirtualGarage from "../pages/EcoGo/VirtualGarage";
import VehicleOverview from "../pages/EcoGo/VehicleOverview";
import EcoNavigator from "../pages/EcoGo/EcoNavigator";
import AnalysisResults from "../pages/AnalysisResults";
import UploadEcoCertificate from "../pages/EcoGo/UploadEcoCertificate";

// Export the routes configuration separately
export const routes = [
    { path: "/", element: Home },
    { path: "/green-vision", element: GreenVisionHome },
    { path: "/eco-sensor", element: EcoSensorHome },
    { path: "/noise-guard", element: NoiseGuardHome },
    { path: "/eco-go", element: EcoGoHome },
    { path: "/ecogo/navigator", element: EcoNavigator },
    { path: "/ecogo/dashboard", element: EcoGoDashboard },
    { path: "ecogo/addVehicle", element: AddVehicle },
    { path: "ecogo/predict/:vehicleId", element: CO2Prediction },
    { path: "ecogo/virtualGarage", element: VirtualGarage },
    { path: "ecogo/vehicleOverview", element: VehicleOverview },
    { path: "ecogo/upload-certificate/:vehicleId", element: UploadEcoCertificate },
    { path: "/predict-air", element: PredictionPageAir },
    { path: "/analysis-results", element: AnalysisResults }
];

// Create the router component
const Router = () => {
    return (
        <Routes>
            {routes.map(({ path, element: Element }) => (
                <Route key={path} path={path} element={<Element />} />
            ))}
        </Routes>
    );
};

export default Router;
