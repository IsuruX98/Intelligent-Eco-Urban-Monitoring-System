import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/EcoGo/Alert"; // Import the Alert component

const AddVehicle = () => {
  const navigate = useNavigate();
  const [vehicleData, setVehicleData] = useState({
    user_id: "",
    vehicle_name: "",
    vehicle_type: "",
    fuelType: "",
    year: "",
  });
  const [alert, setAlert] = useState({
    show: false,
    message: "",
    type: "success"
  });

  // Fetch user_id from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    if (storedUserId) {
      setVehicleData((prev) => ({ ...prev, user_id: storedUserId }));
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleData({
      ...vehicleData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post("http://127.0.0.1:5001/api/vehicles/", vehicleData, {
        headers: { "Content-Type": "application/json" },
      });

      
      // Show success alert
      setAlert({
        show: true,
        message: "Vehicle added successfully! Redirecting to your garage...",
        type: "success"
      });
      
      // Reset form
      setVehicleData({
        user_id: localStorage.getItem("user_id") || "",
        vehicle_name: "",
        vehicle_type: "",
        fuelType: "",
        year: "",
      });
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate("/ecogo/virtualGarage");
      }, 2000);
      
    } catch (error) {
      console.error("Error adding vehicle:", error);
      
      // Show error alert
      setAlert({
        show: true,
        message: "Failed to add vehicle. Please try again.",
        type: "error"
      });
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white py-12 px-6 sm:px-12 lg:px-16">
      {alert.show && (
        <Alert
          message={alert.message}
          type={alert.type}
          duration={3000}
          onClose={() => setAlert({ ...alert, show: false })}
        />
      )}
      
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl text-green-400 font-semibold text-center mb-6">Add Your Vehicle</h2>

        <form onSubmit={handleSubmit}>
          {[
            { label: "Vehicle Name", name: "vehicle_name", placeholder: "e.g., Toyota Camry" },
            { label: "Year", name: "year", type: "number", placeholder: "e.g., 2020" }
          ].map(({ label, name, type, placeholder }) => (
            <div key={name} className="mb-6">
              <label htmlFor={name} className="block text-gray-300 font-semibold mb-2">{label}</label>
              <input
                type={type || "text"}
                id={name}
                name={name}
                value={vehicleData[name]}
                onChange={handleInputChange}
                placeholder={placeholder}
                className="w-full h-12 px-4 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                required
              />
            </div>
          ))}

          <div className="mb-6">
            <label htmlFor="vehicle_type" className="block text-gray-300 font-semibold mb-2">Vehicle Type</label>
            <select
              id="vehicle_type"
              name="vehicle_type"
              value={vehicleData.vehicle_type}
              onChange={handleInputChange}
              className="w-full h-12 px-4 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            >
              <option value="">Select Vehicle Type</option>
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Truck">Truck</option>
              <option value="Coupe">Coupe</option>
              <option value="Hatchback">Hatchback</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="fuelType" className="block text-gray-300 font-semibold mb-2">Fuel Type</label>
            <select
              id="fuelType"
              name="fuelType"
              value={vehicleData.fuelType}
              onChange={handleInputChange}
              className="w-full h-12 px-4 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            >
              <option value="">Select Fuel Type</option>
              <option value="Petrol">Petrol</option>
              <option value="Diesel">Diesel</option>
              <option value="Electric">Electric</option>
              <option value="Hybrid">Hybrid</option>
              <option value="LPG">LPG</option>
            </select>
          </div>

          <button type="submit" className="w-full h-12 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-400 focus:ring-2 focus:ring-green-500 transition-all">
            Add Vehicle
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;