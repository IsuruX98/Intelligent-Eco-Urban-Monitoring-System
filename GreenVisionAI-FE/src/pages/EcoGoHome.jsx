import React, { useState } from 'react'; 
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import axios from 'axios';
import { Link } from "react-router-dom";

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const EcoGoHome = () => {
    return (
        <div className='bg-gray-900 min-h-screen text-white py-12 px-12 md:px-8 lg:px-16 xl:px-32 relative'>
            <h1 className="text-4xl text-green-400 font-bold mb-8">EcoGo: Predict and Reduce CO2 Emissions</h1>
            <div className="mb-8">
                <p className="text-lg text-gray-300 mb-4">
                    EcoGo helps drivers minimize their carbon footprint by providing CO2 emission predictions and recommendations for eco-friendly travel routes and vehicle usage.
                </p>
                <p className="text-lg text-gray-300">
                    By leveraging AI and real-time data, EcoGo offers sustainable travel insights, ensuring a greener future.
                </p>
            </div>
            <h2 className="text-2xl text-green-400 font-semibold mb-4">How It Works</h2>
            <ol className="list-decimal pl-6 text-gray-300">
                <li>Enter your start and destination locations.</li>
                <li>EcoGo calculates the best route with the lowest emissions.</li>
                <li>Receive personalized recommendations to reduce your carbon footprint.</li>
            </ol>
            <div className="mt-8">
                <Link to='/ecogo/dashboard'>
                <button Linkto='/ecogo/dashboard' className="bg-green-500 text-white px-6 py-3 rounded-md hover:bg-green-600 transition">
                    Get Started
                </button>
                </Link>
            </div>
        </div>
    );
};

export default EcoGoHome;
