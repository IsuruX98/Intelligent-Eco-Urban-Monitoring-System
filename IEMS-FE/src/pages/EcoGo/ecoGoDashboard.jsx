import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ChevronRight, 
  Car, 
  Navigation, 
  PlusCircle, 
  BarChart, 
  Loader2,
  Instagram
} from "lucide-react";
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  TwitterIcon
} from 'react-share';

const EcoGoDashboard = ({ userId }) => {
  const [predictedCO2, setPredictedCO2] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ecoScore, setEcoScore] = useState(0); // Will be set from backend
  const [ecoPoints, setEcoPoints] = useState(0);
  const [trips, setTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(true);
  const [ecoPointsLoading, setEcoPointsLoading] = useState(true);
  const [ecoPointsError, setEcoPointsError] = useState(null);
  const [tripsError, setTripsError] = useState(null);
  const navigate = useNavigate();

  // Fetch eco points
  useEffect(() => {
    const uid = userId || localStorage.getItem("user_id");
    if (!uid) return;
    setEcoPointsLoading(true);
    fetch(`http://127.0.0.1:5001/api/users/eco_points/${uid}`)
      .then(res => res.json())
      .then(data => {
        setEcoPoints(data.ecoPoints || 0);
        setEcoScore(data.ecoScore || data.ecoPoints || 0); // fallback
        setEcoPointsError(null);
      })
      .catch(err => {
        setEcoPointsError("Failed to load eco points");
        setEcoPoints(0);
      })
      .finally(() => setEcoPointsLoading(false));
  }, [userId]);

  // Fetch trips
  useEffect(() => {
    setTripsLoading(true);
    fetch("http://127.0.0.1:5001/api/trip/all")
      .then(res => res.json())
      .then(data => {
        setTrips(Array.isArray(data) ? data : []);
        setTripsError(null);
      })
      .catch(err => {
        setTripsError("Failed to load trips");
        setTrips([]);
      })
      .finally(() => setTripsLoading(false));
  }, []);

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
                <h2 className="text-xl font-semibold text-gray-200">Your Eco Points</h2>
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
                      {ecoPointsLoading ? <tspan>...</tspan> : ecoPoints}
                    </text>
                    <text 
                      x="50" y="65" 
                      dominantBaseline="middle" 
                      textAnchor="middle"
                      fontSize="10"
                      fill="#d1d5db"
                    >
                      points
                    </text>
                  </svg>
                </div>
              </div>
              {ecoPointsError && <div className="text-red-400 text-center mb-2">{ecoPointsError}</div>}
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div className="p-2">
                  <p className="text-gray-400 text-xs">Monthly Savings</p>
                  <p className="text-green-400 font-bold">$2.0</p>
                </div>
                <div className="p-2">
                  <p className="text-gray-400 text-xs">CO2 Reduced</p>
                  <p className="text-green-400 font-bold">0.8 kg</p>
                </div>
              </div>
              {/* Social Share Buttons - Creative Section */}
              <div className="flex flex-col items-center mt-4">
                <div className="mb-2 text-center">
                  <span className="inline-block px-3 py-1 bg-green-700/80 rounded-full text-green-100 font-semibold text-sm mb-1 animate-bounce">
                    🎉 New!
                  </span>
                  <div className="font-bold text-lg text-green-300">
                    Proud of your eco points?
                  </div>
                  <div className="text-gray-300 text-sm">
                    Share your achievement and inspire your friends! 🌱🚗
                  </div>
                </div>
                <div className="flex gap-4 justify-center mt-2">
                  <FacebookShareButton
                    url={window.location.href}
                    quote={`I just earned ${ecoPoints} eco points and reduced my CO2 emissions with EcoGo! Join me in making a difference! 🌱🚗`}
                  >
                    <div className="group flex flex-col items-center">
                      <FacebookIcon size={40} round />
                      <span className="block text-xs text-center text-gray-400 mt-1 group-hover:text-green-400 transition">Facebook</span>
                    </div>
                  </FacebookShareButton>
                  <TwitterShareButton
                    url={window.location.href}
                    title={`I just earned ${ecoPoints} eco points and reduced my CO2 emissions with EcoGo! Join me in making a difference! 🌱🚗`}
                  >
                    <div className="group flex flex-col items-center">
                      <TwitterIcon size={40} round />
                      <span className="block text-xs text-center text-gray-400 mt-1 group-hover:text-green-400 transition">X (Twitter)</span>
                    </div>
                  </TwitterShareButton>
                  {/* Instagram: show icon, tooltip for screenshot/share */}
                  <div className="group flex flex-col items-center cursor-pointer relative">
                    <div className="bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 rounded-full p-1">
                      <Instagram size={36} className="text-white" />
                    </div>
                    <span className="block text-xs text-center text-gray-400 mt-1 group-hover:text-pink-400 transition">Instagram</span>
                    <div className="absolute left-1/2 -translate-x-1/2 top-12 z-20 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-3 py-2 shadow-lg w-44 text-center">
                      Share your achievement on Instagram by posting a screenshot to your story or feed!
                    </div>
                  </div>
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
              {tripsLoading ? (
                <div className="flex items-center justify-center h-20 text-gray-400">
                  <Loader2 className="animate-spin mr-2" /> Loading trips...
                </div>
              ) : tripsError ? (
                <div className="text-red-400 text-center mb-2">{tripsError}</div>
              ) : (
                <div className="space-y-3">
                  {trips.slice(0, 5).map((trip, idx) => (
                    <div key={trip._id || idx} className="flex items-center justify-between p-3 bg-gray-700 bg-opacity-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-green-900 rounded-full flex items-center justify-center mr-3">
                          <Navigation size={18} className="text-green-400" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {trip.startLocation || trip.start || "-"}
                            <span className="mx-2 text-green-400">→</span>
                            {trip.destination || trip.endLocation || "-"}
                          </p>
                          <p className="text-sm text-gray-400">{trip.distance ? `${trip.distance} km` : "-"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-gray-300">{trip.co2 ? `${(trip.co2 / 1000).toFixed(2)} kg` : "-"}</p>
                        <p className="text-xs text-gray-400">CO2</p>
                      </div>
                    </div>
                  ))}
                  {trips.length === 0 && <div className="text-gray-400 text-center">No trips found.</div>}
                </div>
              )}
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