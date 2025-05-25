import React from "react";
import { Routes, Route } from "react-router-dom"; // Import useNavigate
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

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/green-vision" element={<GreenVisionHome />} />
      <Route path="/eco-sensor" element={<EcoSensorHome />} />
      <Route path="/noise-guard" element={<NoiseGuardHome />} />
      <Route path="/eco-go" element={<EcoGoHome />} />
      <Route path="/ecogo/navigator" element={<EcoNavigator />} />
      <Route path="/ecogo/dashboard" element={<EcoGoDashboard />} />
      <Route path="ecogo/addVehicle" element={<AddVehicle />} />
      <Route path="ecogo/predict/:vehicleId" element={<CO2Prediction />} />
      <Route path="ecogo/virtualGarage" element={<VirtualGarage />} />
      <Route path="ecogo/vehicleOverview" element={<VehicleOverview />} />
      <Route path="ecogo/upload-certificate/:vehicleId" element={<UploadEcoCertificate />} />
      <Route path="/predict-air" element={<PredictionPageAir/>} />
      <Route path="/analysis-results" element={<AnalysisResults />} />
    </Routes>
  );
};

export default AppRouter;
