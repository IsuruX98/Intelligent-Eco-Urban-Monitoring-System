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
        <div className='bg-gray-900 min-h-screen text-white py-12 px-4 md:px-8 lg:px-16 xl:px-32 relative flex flex-col items-center'>
            <h1 className="text-4xl md:text-5xl text-green-400 font-extrabold mb-4 text-center drop-shadow-lg">
                Welcome to EcoGo!
            </h1>
            <div className="mb-8 text-center max-w-2xl">
                <p className="text-xl md:text-2xl text-green-200 font-semibold mb-2 animate-bounce">
                    🌱 Drive Greener. Live Cleaner. Inspire Others.
                </p>
                <p className="text-lg text-gray-300 mb-2">
                    EcoGo is your smart companion for eco-friendly driving. Predict your vehicle's CO2 emissions, discover the greenest routes, and track your positive impact on the planet all in one place!
                </p>
                <p className="text-lg text-gray-300">
                    Join a community of drivers making a real difference. Every trip, every point, every share helps build a cleaner future.
                </p>
            </div>
            <h2 className="text-2xl text-green-400 font-semibold mb-4 text-center">What Can You Do with EcoGo?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 w-full max-w-5xl">
                <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow-lg border border-green-700">
                    <span className="text-green-400 text-3xl mb-2">🚗</span>
                    <span className="font-bold text-lg mb-1">Virtual Garage</span>
                    <span className="text-gray-300 text-center text-sm">Add and manage your vehicles. See their eco stats at a glance.</span>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow-lg border border-green-700">
                    <span className="text-blue-400 text-3xl mb-2">🗺️</span>
                    <span className="font-bold text-lg mb-1">Eco Navigator</span>
                    <span className="text-gray-300 text-center text-sm">Find the greenest route for your journey and avoid traffic hotspots.</span>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow-lg border border-green-700">
                    <span className="text-yellow-400 text-3xl mb-2">📈</span>
                    <span className="font-bold text-lg mb-1">Track & Improve</span>
                    <span className="text-gray-300 text-center text-sm">Monitor your eco points, CO2 savings, and get personalized tips to improve.</span>
                </div>
                <div className="bg-gray-800 rounded-xl p-6 flex flex-col items-center shadow-lg border border-green-700">
                    <span className="text-pink-400 text-3xl mb-2">🎉</span>
                    <span className="font-bold text-lg mb-1">Share & Inspire</span>
                    <span className="text-gray-300 text-center text-sm">Share your achievements on social media and inspire friends to join the movement!</span>
                </div>
            </div>
            <div className="mt-8 flex flex-col items-center">
                <Link to='/ecogo/dashboard'>
                    <button className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-8 py-4 rounded-xl text-lg font-bold shadow-lg hover:from-green-600 hover:to-teal-600 transition-all duration-200 animate-pulse">
                        Get Started Now
                    </button>
                </Link>
                <p className="text-gray-400 text-sm mt-3">It's free, fun, and makes a real difference. 🌍</p>
            </div>
        </div>
    );
};

export default EcoGoHome;
