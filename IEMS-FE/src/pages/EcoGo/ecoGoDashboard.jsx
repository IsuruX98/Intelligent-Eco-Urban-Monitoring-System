import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  Car, 
  Navigation, 
  PlusCircle, 
  BarChart, 
  Loader2 
} from "lucide-react";

const EcoGoDashboard = ({ userId }) => {
  const [predictedCO2, setPredictedCO2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ecoScore, setEcoScore] = useState(76); // Sample eco score
  const navigate = useNavigate();

  // Sample data for the dashboard
  const recentTrips = [
    { id: 1, destination: "Office", distance: "12.3 km", emission: "2.1 kg" },
    { id: 2, destination: "Grocery Store", distance: "4.5 km", emission: "0.8 kg" },
    { id: 3, destination: "Gym", distance: "8.7 km", emission: "1.5 kg" }
  ];

  // Predict CO2 Emission handler
  const handlePredictCO2 = async () => {
    setLoading(true);
    try {
      const response = await fetch("/predict_emission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      setPredictedCO2(data.co2_emission);
    } catch (error) {
      console.error("Error predicting CO2 emission:", error);
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const goToGarage = () => navigate("/ecogo/virtualGarage");
  const goToEcoNavigator = () => navigate("/ecogo/navigator");
  const goToAddVehicle = () => navigate("/ecogo/addVehicle");
  const goToTrips = () => navigate("/trips-history");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-teal-500">
            EcoGo Dashboard
          </h1>
         
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content - 2/3 width on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Eco Score Card */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-200">Your Eco Score</h2>
                <span className="text-xs text-gray-400">Updated today</span>
              </div>
              
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="45"
                      fill="none" 
                      stroke="#1f2937" 
                      strokeWidth="10"
                    />
                    <circle 
                      cx="50" cy="50" r="45"
                      fill="none" 
                      stroke={ecoScore > 70 ? "#10b981" : ecoScore > 40 ? "#f59e0b" : "#ef4444"}
                      strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 45 * ecoScore / 100} ${2 * Math.PI * 45 * (100 - ecoScore) / 100}`}
                      strokeDashoffset="0"
                      transform="rotate(-90 50 50)"
                    />
                    <text 
                      x="50" y="50" 
                      dominantBaseline="middle" 
                      textAnchor="middle"
                      fontSize="24"
                      fontWeight="bold"
                      fill="white"
                    >
                      {ecoScore}
                    </text>
                    <text 
                      x="50" y="65" 
                      dominantBaseline="middle" 
                      textAnchor="middle"
                      fontSize="10"
                      fill="#d1d5db"
                    >
                      out of 100
                    </text>
                  </svg>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2">
                  <p className="text-gray-400 text-xs">Monthly Savings</p>
                  <p className="text-green-400 font-bold">$2.0</p>
                </div>
                <div className="p-2">
                  <p className="text-gray-400 text-xs">CO2 Reduced</p>
                  <p className="text-green-400 font-bold">0.8 kg</p>
                </div>
               
              </div>
            </div>

            {/* Recent Trips */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-200">Recent Trips</h2>
                <button 
                  onClick={goToTrips}
                  className="text-green-400 hover:text-green-300 flex items-center text-sm"
                >
                  View All <ChevronRight size={16} />
                </button>
              </div>
              
              <div className="space-y-3">
                {recentTrips.map(trip => (
                  <div key={trip.id} className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-green-900 rounded-full flex items-center justify-center mr-3">
                        <Navigation size={18} className="text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">{trip.destination}</p>
                        <p className="text-sm text-gray-400">{trip.distance}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-300">{trip.emission}</p>
                      <p className="text-xs text-gray-400">CO2</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side panel - 1/3 width on large screens */}
          <div className="space-y-6">
           

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
              <h2 className="text-xl font-semibold text-gray-200 mb-4">Quick Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={goToGarage}
                  className="w-full bg-gray-700 text-white p-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
                >
                  <div className="w-10 h-10 bg-blue-900 rounded-full flex items-center justify-center mr-3">
                    <Car size={18} className="text-blue-400" />
                  </div>
                  <span>View My Vehicles</span>
                </button>
                
                <button
                  onClick={goToEcoNavigator}
                  className="w-full bg-gray-700 text-white p-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
                >
                  <div className="w-10 h-10 bg-yellow-900 rounded-full flex items-center justify-center mr-3">
                    <Navigation size={18} className="text-yellow-400" />
                  </div>
                  <span>Eco Navigator</span>
                </button>
                
                <button
                  onClick={goToAddVehicle}
                  className="w-full bg-gray-700 text-white p-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center"
                >
                  <div className="w-10 h-10 bg-green-900 rounded-full flex items-center justify-center mr-3">
                    <PlusCircle size={18} className="text-green-400" />
                  </div>
                  <span>Add New Vehicle</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EcoGoDashboard;