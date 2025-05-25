import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Car, 
  Truck, 
  Bus, 
  Bike, 
  Plus, 
  Loader2, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  AlertCircle,
  Info,
  Leaf, // Icon for eco-friendly vehicles
  X, // Close icon
  FileUp // Add this import
} from "lucide-react";

const VirtualGarage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bestEcoVehicle, setBestEcoVehicle] = useState(null); // State for best eco vehicle
  const [ecoLoading, setEcoLoading] = useState(false); // Loading state for eco vehicle fetch
  const [ecoError, setEcoError] = useState(null); // Error state for eco vehicle fetch
  const [showModal, setShowModal] = useState(false); // State to control modal visibility
  const navigate = useNavigate();

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const userId = localStorage.getItem("user_id");
      const response = await fetch(`http://127.0.0.1:5001/api/vehicles/vehicles/user/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch vehicles");
      }
      const data = await response.json();
      setVehicles(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBestEcoVehicle = async () => {
    setEcoLoading(true);
    setEcoError(null);
    try {
      // Transform fetched vehicles into the format expected by the API
      const vehicleData = vehicles.map((vehicle) => ({
        Vehicle: vehicle.vehicle_name,
        CO2_Emissions: parseFloat(vehicle.CO2_Emission) || 0, // Ensure it's a number
        Engine_Capacity: parseFloat(vehicle.Engine_Capacity) || 0, // Ensure it's a number
        Engine_Power: parseFloat(vehicle.Engine_PowerPS) || 0, // Ensure it's a number
        Fuel_Type: vehicle.Fuel_Type || "Unknown", // Default to "Unknown" if Fuel_Type is missing
      }));
  
      const response = await fetch("http://127.0.0.1:5001/api/recommend/recommend_vehicle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vehicleData),
      });
  
      if (!response.ok) {
        throw new Error("Failed to fetch best eco-friendly vehicle");
      }
  
      const data = await response.json();
      setBestEcoVehicle(data.Best_Vehicle); // Set the best eco vehicle
      setShowModal(true); // Show the modal
    } catch (err) {
      setEcoError(err.message);
      console.error("Error fetching best eco-friendly vehicle:", err);
    } finally {
      setEcoLoading(false);
    }
  };
  
  // Function to close the modal
  const closeModal = () => {
    setShowModal(false);
    setBestEcoVehicle(null); // Clear the best eco vehicle data
  };

  const getVehicleIcon = (type) => {
    type = type ? type.toLowerCase() : "";
    switch (type) {
      case "sedan":
      case "hatchback":
      case "coupe":
        return <Car size={24} />;
      case "suv":
      case "pickup":
        return <Truck size={24} />;
      case "van":
      case "minivan":
      case "bus":
        return <Bus size={24} />;
      case "motorcycle":
      case "scooter":
        return <Bike size={24} />;
      default:
        return <Car size={24} />;
    }
  };

  const getVehicleColor = (type) => {
    type = type ? type.toLowerCase() : "";
    switch (type) {
      case "sedan":
      case "hatchback":
      case "coupe":
        return "bg-blue-900 text-blue-400";
      case "suv":
      case "pickup":
        return "bg-green-900 text-green-400";
      case "van":
      case "minivan":
      case "bus":
        return "bg-yellow-900 text-yellow-400";
      case "motorcycle":
      case "scooter":
        return "bg-purple-900 text-purple-400";
      default:
        return "bg-gray-900 text-gray-400";
    }
  };

  const handleEditVehicle = (vehicleId) => {
    navigate(`/edit-vehicle/${vehicleId}`);
  };

  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        // Make the actual DELETE request to the server
        const response = await fetch(`http://127.0.0.1:5001/api/vehicles/${vehicleId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        console.log("Delete vehicle:", vehicleId);
        // Update the UI by removing the deleted vehicle from the list
        setVehicles(vehicles.filter(v => v._id.$oid !== vehicleId));
        
      } catch (err) {
        console.error("Error deleting vehicle:", err);
      }
    }
  };

  const handleAddVehicle = () => {
    navigate("/ecogo/addVehicle");
  };

  const handleBackToDashboard = () => {
    navigate("/ecogo/dashboard");
  };

  const handleViewMore = (vehicle) => {
    navigate(`/ecogo/vehicleOverview`, { state: { vehicle } });
  };

  const handlePredictCO2 = (vehicleId) => {
    navigate(`/ecogo/predict/${vehicleId}`);
  };

  const handleUploadCertificate = (vehicleId) => {
    navigate(`/ecogo/upload-certificate/${vehicleId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center mb-8">
          <button 
            onClick={handleBackToDashboard}
            className="mr-4 p-2 bg-gray-800 rounded-full hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
            Virtual Garage
          </h1>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 size={40} className="animate-spin text-green-400 mb-4" />
            <p className="text-gray-400">Loading your vehicles...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900 bg-opacity-20 border border-red-800 rounded-xl p-6 flex items-center">
            <AlertCircle size={24} className="text-red-500 mr-3" />
            <p className="text-red-300">{error}</p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <p className="text-gray-400">
                  Showing {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
                </p>
              </div>
              <button
                onClick={handleAddVehicle}
                className="bg-gradient-to-r from-green-600 to-green-500 text-white px-4 py-2 rounded-lg hover:from-green-500 hover:to-green-400 focus:outline-none focus:ring-2 focus:ring-green-300 flex items-center"
              >
                <Plus size={18} className="mr-2" />
                Add Vehicle
              </button>
            </div>

            {/* Button to show best eco-friendly vehicle */}
            <div className="mb-6">
              <button
                onClick={fetchBestEcoVehicle}
                disabled={ecoLoading}
                className="bg-gradient-to-r from-teal-600 to-teal-500 text-white px-6 py-3 rounded-lg hover:from-teal-500 hover:to-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300 flex items-center"
              >
                <Leaf size={18} className="mr-2" />
                {ecoLoading ? "Finding Best Eco Vehicle..." : "Show Best Eco Vehicle"}
              </button>
            </div>

            {/* Modal for Best Eco Vehicle */}
            {showModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg w-full max-w-2xl relative">
                  {/* Close Button */}
                  <button
                    onClick={closeModal}
                    className="absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    <X size={20} />
                  </button>

                  {/* Modal Content */}
                  <h3 className="text-xl font-semibold text-gray-200 mb-4">Best Eco-Friendly Vehicle</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailCard label="Vehicle" value={bestEcoVehicle.Vehicle} />
                    <DetailCard label="CO2 Emissions" value={`${bestEcoVehicle.CO2_Emissions} g/km`} />
                    <DetailCard label="Engine Capacity" value={`${bestEcoVehicle.Engine_Capacity} cc`} />
                    <DetailCard label="Engine Power" value={`${bestEcoVehicle.Engine_Power} PS`} />
                    <DetailCard label="Fuel Type" value={bestEcoVehicle.Fuel_Type} />
                    <DetailCard label="Relative Closeness" value={bestEcoVehicle.Relative_Closeness.toFixed(2)} />
                    <DetailCard label="Rank" value={bestEcoVehicle.Rank} />
                  </div>
                </div>
              </div>
            )}

            {/* Rest of the code remains the same */}
            {vehicles.length === 0 ? (
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                <div className="bg-gray-700 rounded-full p-4 inline-flex mb-4">
                  <Car size={40} className="text-gray-400" />
                </div>
                <h2 className="text-xl font-semibold text-gray-300 mb-2">No vehicles found</h2>
                <p className="text-gray-400 mb-6">
                  Add your first vehicle to start tracking your carbon footprint.
                </p>
                <button
                  onClick={handleAddVehicle}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-300 inline-flex items-center"
                >
                  <Plus size={18} className="mr-2" />
                  Add Your First Vehicle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => (
                  <div 
                    key={vehicle._id.$oid} 
                    className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg hover:border-gray-600 transition-all"
                  >
                    {/* Vehicle details */}
                    <div className="flex items-center mb-4">
                      <div className={`w-12 h-12 ${getVehicleColor(vehicle.vehicle_type)} rounded-full flex items-center justify-center mr-4`}>
                        {getVehicleIcon(vehicle.vehicle_type)}
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-200">{vehicle.vehicle_name}</h3>
                        <p className="text-gray-400">{vehicle.year} {vehicle.model}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-400">Vehicle Type</p>
                        <p className="font-medium">{vehicle.vehicle_type}</p>
                      </div>
                      <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
                        <p className="text-xs text-gray-400">CO2 Emission</p>
                        <p className="font-medium">
                          {vehicle.CO2_Emission ? `${vehicle.CO2_Emission} g/km` : "N/A"}
                        </p>
                      </div>
                    </div>
                    
                    {vehicle.CO2_Emission && (
                      <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Emission Level</span>
                          <span>
                            {vehicle.CO2_Emission <= 120 ? "Low" : 
                             vehicle.CO2_Emission <= 180 ? "Medium" : "High"}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              vehicle.CO2_Emission <= 120 ? "bg-green-500" : 
                              vehicle.CO2_Emission <= 180 ? "bg-yellow-500" : "bg-red-500"
                              }`}
                            style={{ width: `${Math.min(vehicle.CO2_Emission / 3, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {!vehicle.CO2_Emission && (
                      <div className="mb-4 flex items-center bg-blue-900 bg-opacity-20 border border-blue-800 rounded-lg p-3">
                        <Info size={18} className="text-blue-400 mr-2" />
                        <p className="text-blue-300 text-sm">CO2 data not available</p>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <button
                        onClick={() => handleEditVehicle(vehicle._id.$oid)}
                        className="flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <Edit size={16} className="mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteVehicle(vehicle._id.$oid)}
                        className="flex items-center justify-center bg-red-900 bg-opacity-30 hover:bg-opacity-50 border border-red-800 text-red-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      >
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </button>
                    </div>

                    <div className="mt-4 flex justify-between">
                      <button
                        onClick={() => handleViewMore(vehicle)}
                        className="flex items-center justify-center bg-blue-900 bg-opacity-30 hover:bg-opacity-50 border border-blue-800 text-blue-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        View More
                      </button>
                      <button
                        onClick={() => handlePredictCO2(vehicle._id.$oid)}
                        className="flex items-center justify-center bg-green-900 bg-opacity-30 hover:bg-opacity-50 border border-green-800 text-green-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        Predict CO2 Emission
                      </button>
                    </div>

                    <div className="mt-4">
                      <button
                        onClick={() => handleUploadCertificate(vehicle._id.$oid)}
                        className="w-full flex items-center justify-center bg-purple-900 bg-opacity-30 hover:bg-opacity-50 border border-purple-800 text-purple-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <FileUp size={16} className="mr-2" />
                        Upload Eco Certificate
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Reusable DetailCard Component
const DetailCard = ({ label, value }) => (
  <div className="bg-gray-700 bg-opacity-50 p-3 rounded-lg">
    <p className="text-xs text-gray-400">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

export default VirtualGarage;