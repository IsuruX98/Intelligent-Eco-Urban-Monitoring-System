import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

// Mapbox configuration
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiaXp1cnV4OTgiLCJhIjoiY21iM2NscjBvMHVydTJxcHZ2dzFvOXhqbCJ9.X722UIsQ2W3IiWxluew_2Q';
const MAPBOX_STYLE_URL = 'mapbox://styles/mapbox/satellite-v9';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RectangleAreaSelector = ({ onSelectArea, onCaptureArea }) => {
    const map = useMap();

    useEffect(() => {
        const drawnItems = new L.FeatureGroup();
        map.addLayer(drawnItems);

        const drawControl = new L.Control.Draw({
            draw: {
                polygon: false,
                polyline: false,
                circle: false,
                marker: false,
                circlemarker: false,
                rectangle: true,
            },
            edit: {
                featureGroup: drawnItems,
            },
        });

        map.addControl(drawControl);

        map.on(L.Draw.Event.CREATED, async (event) => {
            const layer = event.layer;
            drawnItems.addLayer(layer);
            const bounds = layer.getBounds();
            onSelectArea(bounds);

            try {
                // Get bounds
                const sw = bounds.getSouthWest();
                const ne = bounds.getNorthEast();
                // Set image size (max 1280x1280 for free tier)
                const width = 600;
                const height = 400;
                // Build Mapbox Static Images API URL
                const url = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/[${sw.lng},${sw.lat},${ne.lng},${ne.lat}]/${width}x${height}?access_token=${MAPBOX_ACCESS_TOKEN}`;
                // Fetch the image as a blob
                const response = await fetch(url);
                const blob = await response.blob();
                const imageUrl = URL.createObjectURL(blob);
                // Create a File object from the blob
                const file = new File([blob], "selected-area.jpg", { type: "image/jpeg" });
                onCaptureArea(imageUrl, file);
            } catch (error) {
                console.error('Error capturing area:', error);
            }
        });

        return () => {
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
        };
    }, [map, onSelectArea, onCaptureArea]);

    return null;
};

const ChangeView = ({ center, zoom }) => {
    const map = useMap();
    map.setView(center, zoom);
    return null;
};

const PinDropHandler = ({ onPinDrop }) => {
    useMapEvent('click', (e) => {
        onPinDrop(e.latlng);
    });
    return null;
};

const LocationSearch = ({ onLocationSelect }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    const debounce = (func, delay) => {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    };

    const fetchSuggestions = async (query) => {
        if (query.length > 2) {
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`
                );
                const data = await response.json();
                setSuggestions(data);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        } else {
            setSuggestions([]);
        }
    };

    const debouncedFetchSuggestions = debounce(fetchSuggestions, 300);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        debouncedFetchSuggestions(value);
    };

    const handleSearch = async () => {
        if (!query) return;
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
            );
            const data = await response.json();
            if (data.length > 0) {
                const { lat, lon, display_name } = data[0];
                onLocationSelect({ lat: parseFloat(lat), lng: parseFloat(lon), name: display_name });
                setSuggestions([]);
            }
        } catch (error) {
            console.error('Error fetching location:', error);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        const { lat, lon, display_name } = suggestion;
        setQuery(display_name);
        onLocationSelect({ lat: parseFloat(lat), lng: parseFloat(lon), name: display_name });
        setSuggestions([]);
    };

    return (
        <div className="mb-8 relative z-[100]">
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center mb-4">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-2 mr-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">Search Location</h3>
                </div>
                <div className="relative">
                    <div className="relative">
                        <input
                            type="text"
                            value={query}
                            onChange={handleInputChange}
                            placeholder="Search for a location (e.g., Central Park, New York)..."
                            className="w-full px-4 py-3 pl-12 rounded-xl border border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition duration-200 backdrop-blur-sm"
                        />
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                    </div>
                    <button
                        onClick={handleSearch}
                        className="mt-3 w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                        🔍 Search Location
                    </button>
                    {suggestions.length > 0 && (
                        <div className="absolute z-[9999] w-full mt-2">
                            <ul className="bg-gray-800/95 backdrop-blur-sm border border-gray-600/50 rounded-xl shadow-2xl overflow-hidden">
                                {suggestions.map((suggestion, index) => (
                                    <li
                                        key={index}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="px-4 py-3 hover:bg-gray-700/50 cursor-pointer text-gray-200 border-b border-gray-700/50 last:border-b-0 transition-colors duration-200"
                                    >
                                        <div className="flex items-center">
                                            <svg className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span className="text-sm">{suggestion.display_name}</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const GreenVisionHome = () => {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [mapCenter, setMapCenter] = useState([6.9271, 79.8612]);
    const [mapZoom, setMapZoom] = useState(13);
    const [isLocationSelected, setIsLocationSelected] = useState(false);
    const [selectionMethod, setSelectionMethod] = useState('rectangle');
    const [capturedArea, setCapturedArea] = useState(null);
    const navigate = useNavigate();

    console.log(capturedArea);


    const handleSelectArea = (bounds) => {
        const { _northEast, _southWest } = bounds;
        setSelectedLocation({
            lat: (_northEast.lat + _southWest.lat) / 2,
            lng: (_northEast.lng + _southWest.lng) / 2,
            bounds,
        });
        setIsLocationSelected(true);
    };

    const handleCaptureArea = (imageUrl, file) => {
        setCapturedArea(imageUrl);
        setImageFile(file);
        console.log('Captured area saved as file:', file);
    };

    const handleDownloadImage = () => {
        if (imageFile) {
            const downloadLink = document.createElement('a');
            downloadLink.href = URL.createObjectURL(imageFile);
            downloadLink.download = `selected-area-${new Date().getTime()}.jpg`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    const handlePinDrop = (latlng) => {
        setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
        setIsLocationSelected(true);
    };

    const handleLocationSelect = (loc) => {
        setMapCenter([loc.lat, loc.lng]);
        setMapZoom(18);
    };

    const handleImageUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setImageFile(file);
        }
    };

    const handleSubmit = async () => {
        if (selectedLocation && imageFile) {
            const formData = new FormData();
            formData.append('latitude', selectedLocation.lat);
            formData.append('longitude', selectedLocation.lng);
            formData.append('file', imageFile);

            try {
                const response = await axios.post('http://127.0.0.1:5000/api/tree', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                navigate('/analysis-results', {
                    state: {
                        data: {
                            ...response.data,
                            location: selectedLocation
                        }
                    }
                });
            } catch (error) {
                console.error('Error submitting data:', error);
            }
        }
    };

    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 min-h-screen text-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0"></div>
                <div className="relative py-16 px-4 sm:px-8 lg:px-16 xl:px-32">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent mb-6">
                            GreenVision AI
                        </h1>
                        <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-6">
                            GreenVision AI leverages deep learning techniques and satellite imagery to assess urban green spaces, classify vegetation, and analyze environmental health indicators. This AI-powered system helps urban planners monitor and preserve green areas, contributing to a sustainable future.
                        </p>
                        <p className="text-lg text-gray-400 max-w-3xl mx-auto">
                            By utilizing high-resolution satellite images and various vegetation indices, GreenVision AI provides real-time insights into the health of urban green spaces, helping address challenges related to urban heat islands, air quality, and biodiversity.
                        </p>
                        <div className="mt-8 flex justify-center">
                            <div className="bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full px-8 py-3">
                                <span className="text-green-300 font-semibold text-lg">🌿 AI-Powered Environmental Analysis</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-8 lg:px-16 xl:px-32 pb-16">

                {/* How to Use Section */}
                <div className="mb-12">
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center mb-6">
                            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-3 mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">How to Use GreenVision AI</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-400/30 hover:scale-105 transition-transform duration-300">
                                <div className="flex items-center mb-4">
                                    <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">1</span>
                                    <h3 className="text-lg font-semibold text-green-300">🔍 Search Location</h3>
                                </div>
                                <p className="text-gray-300">Search for or locate the desired location on the interactive satellite map.</p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-400/30 hover:scale-105 transition-transform duration-300">
                                <div className="flex items-center mb-4">
                                    <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">2</span>
                                    <h3 className="text-lg font-semibold text-blue-300">📐 Select Area</h3>
                                </div>
                                <p className="text-gray-300">Use Rectangle or Pin selection method to mark your area of interest on the map.</p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-400/30 hover:scale-105 transition-transform duration-300">
                                <div className="flex items-center mb-4">
                                    <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-3">3</span>
                                    <h3 className="text-lg font-semibold text-purple-300">🚀 Analyze</h3>
                                </div>
                                <p className="text-gray-300">Click Submit to get AI-powered vegetation analysis and environmental insights.</p>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                            <p className="text-gray-300 text-center">
                                <span className="font-semibold text-green-400">💡 Pro Tip:</span> The system automatically captures satellite imagery when you select an area - no manual screenshots needed!
                            </p>
                        </div>
                    </div>
                </div>

                {/* Selection Method */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-center mb-4">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-2 mr-3">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-white">Selection Method</h3>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <label className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectionMethod === 'rectangle'
                                ? 'border-green-400 bg-green-500/20 shadow-lg shadow-green-500/20'
                                : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                                }`}>
                                <input
                                    type="radio"
                                    value="rectangle"
                                    checked={selectionMethod === 'rectangle'}
                                    onChange={() => setSelectionMethod('rectangle')}
                                    className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectionMethod === 'rectangle' ? 'border-green-400' : 'border-gray-400'
                                    }`}>
                                    {selectionMethod === 'rectangle' && (
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-white font-semibold">📐 Rectangle Selection</span>
                                    <p className="text-gray-400 text-sm">Draw a rectangle to select an area</p>
                                </div>
                            </label>
                            <label className={`flex items-center space-x-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${selectionMethod === 'pin'
                                ? 'border-green-400 bg-green-500/20 shadow-lg shadow-green-500/20'
                                : 'border-gray-600 bg-gray-700/30 hover:border-gray-500'
                                }`}>
                                <input
                                    type="radio"
                                    value="pin"
                                    checked={selectionMethod === 'pin'}
                                    onChange={() => setSelectionMethod('pin')}
                                    className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectionMethod === 'pin' ? 'border-green-400' : 'border-gray-400'
                                    }`}>
                                    {selectionMethod === 'pin' && (
                                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                                    )}
                                </div>
                                <div>
                                    <span className="text-white font-semibold">📍 Pin Selection</span>
                                    <p className="text-gray-400 text-sm">Click to place a pin marker</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                <LocationSearch onLocationSelect={handleLocationSelect} />

                {/* Interactive Map */}
                <div className="mb-8">
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-6 shadow-2xl">
                        <div className="flex items-center mb-6">
                            <div className="bg-gradient-to-r from-green-500 to-teal-500 rounded-lg p-3 mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Interactive Satellite Map</h2>
                        </div>
                        <div className="relative overflow-hidden rounded-xl border border-gray-600/50 shadow-2xl">
                            <MapContainer
                                center={mapCenter}
                                zoom={mapZoom}
                                style={{ height: "600px", width: "100%" }}
                            >
                                <ChangeView center={mapCenter} zoom={mapZoom} />
                                <TileLayer
                                    attribution='© <a href="https://www.mapbox.com/about/maps/">Mapbox</a>'
                                    url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`}
                                />
                                {selectionMethod === 'rectangle' && (
                                    <RectangleAreaSelector
                                        onSelectArea={handleSelectArea}
                                        onCaptureArea={handleCaptureArea}
                                    />
                                )}
                                {selectionMethod === 'pin' && (
                                    <PinDropHandler onPinDrop={handlePinDrop} />
                                )}
                                {selectedLocation && (
                                    <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                                        <Popup>
                                            <div className="text-black">
                                                <h3 className="font-bold text-green-600 mb-2">📍 Selected Location</h3>
                                                <p><strong>Latitude:</strong> {selectedLocation.lat.toFixed(6)}</p>
                                                <p><strong>Longitude:</strong> {selectedLocation.lng.toFixed(6)}</p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        </div>
                        <div className="mt-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                            <p className="text-gray-300 text-center text-sm">
                                <span className="font-semibold text-green-400">🛰️ High-Resolution Satellite Imagery:</span> Use the tools above to select your area of interest on this interactive map.
                            </p>
                        </div>
                    </div>
                </div>

                {isLocationSelected && (
                    <div className="mb-8">
                        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-8 shadow-2xl">
                            <div className="flex items-center mb-6">
                                <div className="bg-gradient-to-r from-emerald-500 to-green-500 rounded-lg p-3 mr-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-white">Selected Area Preview</h2>
                            </div>
                            {capturedArea && (
                                <div className="space-y-6">
                                    <div className="relative w-full max-w-3xl mx-auto">
                                        <div className="relative overflow-hidden rounded-xl border-2 border-green-400/50 shadow-2xl">
                                            <img
                                                src={capturedArea}
                                                alt="Selected Area"
                                                className="w-full h-auto"
                                                style={{ maxHeight: '500px', objectFit: 'contain' }}
                                            />
                                            <div className="absolute top-4 left-4">
                                                <div className="bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
                                                    ✅ Area Captured
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            <p className="text-gray-300 font-medium">
                                                Satellite image captured and ready for AI analysis
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleDownloadImage}
                                            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-6 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
                                        >
                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Download Image
                                        </button>
                                    </div>
                                </div>
                            )}
                            <div className="mt-6 p-4 bg-green-900/30 rounded-lg border border-green-500/30">
                                <div className="flex items-center text-green-300">
                                    <span className="text-2xl mr-3">🎯</span>
                                    <div>
                                        <p className="font-semibold">Ready for Analysis!</p>
                                        <p className="text-sm text-green-200">Your selected area has been captured. Click the submit button below to start the AI-powered vegetation analysis.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Submit Section */}
                {isLocationSelected && imageFile && (
                    <div className="text-center">
                        <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-8 shadow-2xl">
                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-white mb-2">🚀 Ready to Analyze</h3>
                                <p className="text-gray-300">Start your AI-powered vegetation analysis now</p>
                            </div>
                            <button
                                onClick={handleSubmit}
                                className="w-full bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white text-xl font-bold px-8 py-4 rounded-xl shadow-2xl hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center"
                            >
                                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                                Start AI Analysis
                                <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                            <div className="mt-4 flex items-center justify-center text-gray-400 text-sm">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                Secure processing with advanced AI algorithms
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GreenVisionHome;