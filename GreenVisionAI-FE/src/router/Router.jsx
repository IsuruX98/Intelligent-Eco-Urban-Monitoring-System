import React from "react";
import { Routes, Route } from "react-router-dom"; // Import useNavigate
import Home from "../pages/Home";
import GreenVisionHome from "../pages/GreenVisionHome";
import EcoSensorHome from "../pages/EcoSensorHome";
import NoiseGuardHome from "../pages/NoiseGuardHome";
import EcoGoHome from "../pages/EcoGoHome";

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/green-vision" element={<GreenVisionHome />} />
      <Route path="/eco-sensor" element={<EcoSensorHome />} />
      <Route path="/noise-guard" element={<NoiseGuardHome />} />
      <Route path="/eco-go" element={<EcoGoHome />} />
    </Routes>
  );
};

export default AppRouter;
