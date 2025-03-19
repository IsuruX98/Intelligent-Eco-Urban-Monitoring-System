import React, { useState } from "react";
import { useLocation } from "react-router-dom";

const VehicleOverview = () => {
  const location = useLocation();
  const { vehicle } = location.state || {};
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch recommendations
  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://127.0.0.1:5001/api/recommend/recommendation_llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          vehicle_id: vehicle._id.$oid,
          Transmission: vehicle.Transmission,
          Vehicle_Type: vehicle.Vehicle_Type,
          Engine_Capacity: vehicle.Engine_Capacity,
          Fuel_Type: vehicle.Fuel_Type,
          Powertrain: vehicle.Powertrain,
          Engine_PowerPS: vehicle.Engine_PowerPS,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Function to format recommendations
  const formatRecommendations = (text) => {
    // Replace **bold** with <strong>bold</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Replace *italic* with <em>italic</em>
    text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
    // Replace numbered lists with <ol> and bullet points with <ul>
    text = text.split("\n").map((line) => {
      if (/^\d+\./.test(line)) {
        return `<li>${line.replace(/^\d+\.\s*/, "")}</li>`;
      } else if (/^- /.test(line)) {
        return `<li>${line.replace(/^- /, "")}</li>`;
      }
      return line;
    }).join("\n");

    // Wrap numbered lists in <ol> and bullet lists in <ul>
    text = text.replace(/(<li>.*<\/li>)/g, (match) => {
      if (/^\d+\./.test(match)) {
        return `<ol>${match}</ol>`;
      } else {
        return `<ul>${match}</ul>`;
      }
    });

    return text;
  };

  // If no vehicle data is found, show a message
  if (!vehicle) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <p>No vehicle data available.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Vehicle Details Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg mb-8">
          <h2 className="text-2xl font-semibold text-gray-200 mb-6">Vehicle Overview</h2>

          {/* Grid for Vehicle Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailCard label="Vehicle Name" value={vehicle.vehicle_name} />
            <DetailCard label="Vehicle Type" value={vehicle.vehicle_type} />
            <DetailCard label="Year" value={vehicle.year} />
            <DetailCard label="CO2 Emission" value={`${vehicle.CO2_Emission} g/km`} />
            <DetailCard label="Engine Capacity" value={`${vehicle.Engine_Capacity} cc`} />
            <DetailCard label="Engine Power" value={`${vehicle.Engine_PowerPS} PS`} />
            <DetailCard label="Fuel Type" value={vehicle.Fuel_Type} />
            <DetailCard label="Powertrain" value={vehicle.Powertrain} />
            <DetailCard label="Transmission" value={vehicle.Transmission} />
            <DetailCard label="Vehicle Type" value={vehicle.Vehicle_Type} />
          </div>
        </div>

        {/* Generate Recommendations Section */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-semibold text-gray-200 mb-4">Generate Recommendations</h3>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="bg-gradient-to-r from-green-600 to-green-500 text-white px-6 py-3 rounded-lg hover:from-green-500 hover:to-green-400 focus:outline-none focus:ring-2 focus:ring-green-300 transition-all"
          >
            {loading ? "Generating Recommendations..." : "Generate Recommendations"}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-red-900 bg-opacity-20 border border-red-800 rounded-lg p-3">
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Recommendations Display */}
          {recommendations && (
            <div className="mt-6">
              <h3 className="text-xl font-semibold text-gray-200 mb-4">Recommendations</h3>
              <div className="bg-gray-700 bg-opacity-50 p-4 rounded-lg">
                {/* Format and display recommendations */}
                <div
                  className="text-gray-300"
                  dangerouslySetInnerHTML={{
                    __html: formatRecommendations(recommendations),
                  }}
                />
              </div>
            </div>
          )}
        </div>
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

export default VehicleOverview;