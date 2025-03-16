import React, { useState } from "react";

const AddVehicle = () => {
  const [vehicleData, setVehicleData] = useState({
    user_id: "67d1f174ee3d523a6cee1e32",
    vehicle_name: "",
    vehicle_type: "",
    year: "",
    model: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVehicleData({
      ...vehicleData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Vehicle Added:", vehicleData);
  };

  return (
    <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white py-12 px-6 sm:px-12 lg:px-16">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-3xl text-green-400 font-semibold text-center mb-6">Add Your Vehicle</h2>

        <form onSubmit={handleSubmit}>
          {[
            { label: "Vehicle Name", name: "vehicle_name", placeholder: "e.g., Toyota Camry" },
            { label: "Year", name: "year", type: "number", placeholder: "e.g., 2020" },
            { label: "Model", name: "model", placeholder: "e.g., LE" }
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

          <button type="submit" className="w-full h-12 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-400 focus:ring-2 focus:ring-green-500 transition-all">
            Add Vehicle
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
