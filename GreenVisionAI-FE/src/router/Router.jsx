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
import AnalysisResults from "../pages/AnalysisResults";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/green-vision" element={<GreenVisionHome />} />
      <Route path="/eco-sensor" element={<EcoSensorHome />} />
      <Route path="/noise-guard" element={<NoiseGuardHome />} />
      <Route path="/ecogo" element={<EcoGoHome />} />
      <Route path="/ecogo/dashboard" element={<EcoGoDashboard />} />
      <Route path="/addVehicle" element={<AddVehicle />} />
      <Route path="/predict/:vehicleId" element={<CO2Prediction />} />
      <Route path="/virtualGarage" element={<VirtualGarage />} />
      <Route path="/eco-go" element={<EcoGoHome />} />
      <Route path="/predict-air" element={<PredictionPageAir/>} />
      <Route path="/analysis-results" element={<AnalysisResults />} />
    </Routes>
  );
};

export default AppRouter;
