import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvent } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import axios from 'axios';

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const RectangleAreaSelector = ({ onSelectArea }) => {
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

        map.on(L.Draw.Event.CREATED, (event) => {
            const layer = event.layer;
            drawnItems.addLayer(layer);
            const bounds = layer.getBounds();
            onSelectArea(bounds);
        });

        return () => {
            map.removeControl(drawControl);
            map.removeLayer(drawnItems);
        };
    }, [map, onSelectArea]);

    return null;
};

// Custom Hook to Update Map Center
const ChangeView = ({ center }) => {
    const map = useMap();
    map.setView(center, 13);
    return null;
};

// Component to handle pin drop on map click
const PinDropHandler = ({ onPinDrop }) => {
    useMapEvent('click', (e) => {
        onPinDrop(e.latlng);
    });
    return null;
};

// Location Search Component
const LocationSearch = ({ onLocationSelect }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);

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

    return (
        <div className="mb-4">
            <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a location..."
                className="w-full px-4 py-2 rounded-md border border-gray-500 text-black"
            />
            <button
                onClick={handleSearch}
                className="bg-green-500 text-white px-4 py-2 rounded-md mt-2 hover:bg-green-600 transition mb-5"
            >
                Search
            </button>
        </div>
    );
};

// Main Component
const GreenVisionHome = () => {
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [mapCenter, setMapCenter] = useState([6.9271, 79.8612]); // Default to Colombo, Sri Lanka
    const [isLocationSelected, setIsLocationSelected] = useState(false);
    const [selectionMethod, setSelectionMethod] = useState('rectangle'); // 'rectangle' or 'pin'

    const handleSelectArea = (bounds) => {
        const { _northEast, _southWest } = bounds;
        setSelectedLocation({
            lat: (_northEast.lat + _southWest.lat) / 2,
            lng: (_northEast.lng + _southWest.lng) / 2,
            bounds,
        });
        setIsLocationSelected(true);
    };

    const handlePinDrop = (latlng) => {
        setSelectedLocation({ lat: latlng.lat, lng: latlng.lng });
        setIsLocationSelected(true);
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
            formData.append('image', imageFile);

            console.log('selectedLocation:', selectedLocation);
            console.log('imageFile:', imageFile);


            // try {
            //     const response = await axios.post('http://127.0.0.1:5000/api/tree', formData, {
            //         headers: {
            //             'Content-Type': 'multipart/form-data',
            //         },
            //     });
            //     console.log('Submission successful:', response.data);
            // } catch (error) {
            //     console.error('Error submitting data:', error);
            // }
        }
    };

    return (
        <div className='bg-gray-900 min-h-screen text-white py-12 px-12 md:px-8 lg:px-16 xl:px-32 relative'>
            <h1 className="text-4xl text-green-400 font-bold mb-8">
                GreenVision AI
            </h1>
            <div className="mb-8">
                <p className="text-lg text-gray-300 mb-4">
                    GreenVision AI leverages deep learning techniques and satellite imagery to assess urban green spaces, classify vegetation, and analyze environmental health indicators. This AI-powered system helps urban planners monitor and preserve green areas, contributing to a sustainable future.
                </p>
                <p className="text-lg text-gray-300">
                    By utilizing high-resolution satellite images and various vegetation indices, GreenVision AI provides real-time insights into the health of urban green spaces, helping address challenges related to urban heat islands, air quality, and biodiversity.
                </p>
            </div>

            {/* Instructions Section */}
            <div className="mb-12">
                <h2 className="text-2xl text-green-400 font-semibold mb-4">How to Use</h2>
                <ol className="list-decimal pl-6 text-gray-300">
                    <li>Choose a selection method: Rectangle or Pin.</li>
                    <li>Select a location on the map using the chosen method.</li>
                    <li>Take a screenshot of the selected area and upload it.</li>
                    <li>Click the "Submit" button to send the selected location and image snippet.</li>
                </ol>
            </div>

            {/* Selection Method Toggle */}
            <div className="mb-4">
                <label className="mr-4">
                    <input
                        type="radio"
                        value="rectangle"
                        checked={selectionMethod === 'rectangle'}
                        onChange={() => setSelectionMethod('rectangle')}
                    />
                    Rectangle Selection
                </label>
                <label>
                    <input
                        type="radio"
                        value="pin"
                        checked={selectionMethod === 'pin'}
                        onChange={() => setSelectionMethod('pin')}
                    />
                    Pin Selection
                </label>
            </div>

            {/* Search Component */}
            <LocationSearch onLocationSelect={(loc) => setMapCenter([loc.lat, loc.lng])} />

            {/* Map Section */}
            <div className="mb-8">
                <MapContainer
                    center={mapCenter}
                    zoom={13}
                    style={{ height: "800px", width: "100%" }}
                >
                    <ChangeView center={mapCenter} />
                    <TileLayer
                        attribution="Google Maps Satellite"
                        url="https://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}"
                    />
                    {selectionMethod === 'rectangle' && (
                        <RectangleAreaSelector onSelectArea={handleSelectArea} />
                    )}
                    {selectionMethod === 'pin' && (
                        <PinDropHandler onPinDrop={handlePinDrop} />
                    )}
                    {selectedLocation && (
                        <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
                            <Popup>
                                Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng}
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {/* Instructions for Screenshot and Upload */}
            {isLocationSelected && (
                <div className="mb-8">
                    <h2 className="text-2xl text-green-400 font-semibold mb-4">Next Steps</h2>
                    <p className="text-lg text-gray-300 mb-4">
                        You have selected a location. Please follow these steps:
                    </p>
                    <ol className="list-decimal pl-6 text-gray-300">
                        <li>Take a screenshot of the selected area on the map.</li>
                        <li>Upload the screenshot using the file input below.</li>
                    </ol>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="mt-4"
                    />
                    {imageFile && (
                        <div className="mt-4">
                            <h2 className="text-2xl text-green-400 font-semibold mb-4">Uploaded Image</h2>
                            <img src={URL.createObjectURL(imageFile)} alt="Uploaded Area" className="max-w-full h-auto" />
                        </div>
                    )}
                </div>
            )}

            {/* Submit Section */}
            <div className="text-center">
                {isLocationSelected && imageFile && (
                    <button
                        onClick={handleSubmit}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg shadow-md hover:bg-blue-600 transition duration-300 mt-4"
                    >
                        Submit
                    </button>
                )}
            </div>
        </div>
    );
};

export default GreenVisionHome;