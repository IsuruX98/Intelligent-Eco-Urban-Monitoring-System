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
        <div className="mb-6">
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Search for a location..."
                className="w-full px-4 py-2 rounded-md border border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition duration-200 text-black"
            />
            <button
                onClick={handleSearch}
                className="bg-green-500 text-white px-4 py-2 rounded-md mt-3 hover:bg-green-600 transition duration-200"
            >
                Search
            </button>
            {suggestions.length > 0 && (
                <ul className="suggestions-list bg-white border border-gray-300 rounded-md mt-2">
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-black"
                        >
                            {suggestion.display_name}
                        </li>
                    ))}
                </ul>
            )}
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
                navigate('/analysis-results', { state: { data: response.data } });
            } catch (error) {
                console.error('Error submitting data:', error);
            }
        }
    };

    return (
        <div className='bg-gray-900 min-h-screen text-white py-12 px-4 sm:px-8 lg:px-16 xl:px-32'>
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

            <div className="mb-12">
                <h2 className="text-2xl text-green-400 font-semibold mb-4">How to Use</h2>
                <ol className="list-decimal pl-6 text-gray-300">
                    <li>Search for or locate the desired location on the map.</li>
                    <li>Take a cropped screenshot of the selected area by pressing the "PrtSc" key on your laptop.</li>
                    <li>Use the selection method (Rectangle or Pin) to mark the location on the map.</li>
                    <li>Upload the cropped screenshot of the selected area.</li>
                    <li>Click the "Submit" button to send the selected location and image snippet.</li>
                </ol>
            </div>

            <div className="mb-4 flex space-x-4">
                <label className="flex items-center space-x-2">
                    <input
                        type="radio"
                        value="rectangle"
                        checked={selectionMethod === 'rectangle'}
                        onChange={() => setSelectionMethod('rectangle')}
                        className="form-radio h-5 w-5 text-green-500"
                    />
                    <span className="text-gray-300">Rectangle Selection</span>
                </label>
                <label className="flex items-center space-x-2">
                    <input
                        type="radio"
                        value="pin"
                        checked={selectionMethod === 'pin'}
                        onChange={() => setSelectionMethod('pin')}
                        className="form-radio h-5 w-5 text-green-500"
                    />
                    <span className="text-gray-300">Pin Selection</span>
                </label>
            </div>

            <LocationSearch onLocationSelect={handleLocationSelect} />

            <div className="mb-8">
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
                                Lat: {selectedLocation.lat}, Lng: {selectedLocation.lng}
                            </Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>

            {isLocationSelected && (
                <div className="mb-8">
                    <h2 className="text-2xl text-green-400 font-semibold mb-4">Selected Area</h2>
                    {capturedArea && (
                        <div className="mt-4">
                            <div className="relative w-full max-w-2xl mx-auto">
                                <img
                                    src={capturedArea}
                                    alt="Selected Area"
                                    className="w-full h-auto rounded-lg shadow-md border-2 border-green-500"
                                    style={{ maxHeight: '500px', objectFit: 'contain' }}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-4">
                                <p className="text-sm text-gray-400">
                                    Image captured and ready for submission
                                </p>
                                <button
                                    onClick={handleDownloadImage}
                                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
                                >
                                    Download Image
                                </button>
                            </div>
                        </div>
                    )}
                    <p className="text-lg text-gray-300 mt-4">
                        The selected area has been captured. You can download it or proceed with the analysis.
                    </p>
                </div>
            )}

            <div className="text-center">
                {isLocationSelected && imageFile && (
                    <button
                        onClick={handleSubmit}
                        className="bg-green-500 text-white text-xl font-bold px-6 py-2 rounded-lg shadow-md hover:bg-green-600 w-full transition duration-300 mt-4"
                    >
                        Submit
                    </button>
                )}
            </div>
        </div>
    );
};

export default GreenVisionHome;