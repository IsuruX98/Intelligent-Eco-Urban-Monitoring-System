import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Mapbox configuration
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiaXp1cnV4OTgiLCJhIjoiY21iM2NscjBvMHVydTJxcHZ2dzFvOXhqbCJ9.X722UIsQ2W3IiWxluew_2Q';

// Gemini API configuration
const GEMINI_API_KEY = 'AIzaSyDLXYV5CeR6e7dahrr_F5EQIt8HyUK7dds';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

// Fix for default marker icons in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
    iconUrl: require('leaflet/dist/images/marker-icon.png'),
    shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AnalysisResults = () => {
    const location = useLocation();
    const data = location.state?.data; // Access the data passed via state

    console.log("data", data);

    const [recommendations, setRecommendations] = useState([]); // State for recommendations
    const [loadingRecommendations, setLoadingRecommendations] = useState(false);

    // Extract coordinates if available from the data
    const analysisLocation = data?.location || { lat: 6.9271, lng: 79.8612 }; // Default to Colombo if no location

    // Function to generate recommendations using Gemini API
    const generateRecommendations = async (analysisData) => {
        setLoadingRecommendations(true);
        try {
            const { segmentation_stats, forecast } = analysisData;

            // Prepare the prompt for Gemini
            const prompt = `
            You are a friendly gardening and environmental expert helping everyday people improve their green spaces. 
            
            Based on this vegetation analysis, provide 5-6 simple, easy-to-understand recommendations that anyone can follow:

            Current Situation:
            - Vegetation Health Score: ${segmentation_stats['NDVI Score']} (higher is better, range -1 to 1)
            - Green Coverage: ${segmentation_stats['Green Percentage']}
            - Dense Green Areas: ${segmentation_stats['High Vegetation Density Coverage']}
            - Medium Green Areas: ${segmentation_stats['Medium Vegetation Density Coverage']}
            - Sparse Green Areas: ${segmentation_stats['Low Vegetation Density Coverage']}
            
            Future Predictions:
            ${Object.entries(forecast).map(([month, value]) => `${month}: ${value}`).join(', ')}

            Please write recommendations that:
            - Use simple, everyday language (avoid technical jargon)
            - Are practical and doable for regular people
            - Include specific actions they can take
            - Use encouraging and positive tone
            - Add relevant emojis to make it friendly
            - Keep each recommendation to 1-2 sentences maximum

            Format like this:
            1. 🌱 [Simple action they can take]
            2. 💧 [Another easy step]
            3. 🌿 [Next recommendation]
            
            Focus on things like watering, planting, soil care, maintenance - things anyone can understand and do.
            `;

            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            };

            const response = await fetch(GEMINI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            const generatedText = result.candidates[0].content.parts[0].text;

            // Enhanced parsing for user-friendly recommendations with emojis
            let recommendationsList = [];

            // First, try to parse numbered recommendations with emojis
            const numberedMatches = generatedText.match(/\d+\s*[🌱💧🌿🌳✂️🐛☀️🍂🌸🪴💪🌷😎]\s*\*?\*?[^🌱💧🌿🌳✂️🐛☀️🍂🌸🪴💪🌷😎\d]*(?:[🌱💧🌿🌳✂️🐛☀️🍂🌸🪴💪🌷😎][^🌱💧🌿🌳✂️🐛☀️🍂🌸🪴💪🌷😎\d]*)?/g);

            if (numberedMatches && numberedMatches.length >= 3) {
                recommendationsList = numberedMatches
                    .map(item => {
                        // Clean up the text
                        return item
                            .replace(/^\d+\s*/, '') // Remove leading numbers
                            .replace(/\*\*/g, '') // Remove markdown bold
                            .trim();
                    })
                    .filter(item => item.length > 15);
            }

            // If numbered parsing didn't work, try line-by-line parsing
            if (recommendationsList.length < 3) {
                const lines = generatedText.split(/\n+/);
                recommendationsList = lines
                    .filter(line => {
                        const trimmed = line.trim();
                        // Look for lines with emojis or numbered recommendations
                        return (trimmed.length > 20 &&
                            (trimmed.match(/[🌱💧🌿🌳✂️🐛☀️🍂🌸🪴💪🌷😎]/) ||
                                trimmed.match(/^\d+[\.\)]/))) &&
                            !trimmed.toLowerCase().includes('based on') &&
                            !trimmed.toLowerCase().includes('here are');
                    })
                    .map(line => {
                        // Clean up each line
                        return line
                            .replace(/^\d+[\.\)]\s*/, '') // Remove leading numbers
                            .replace(/\*\*/g, '') // Remove markdown bold
                            .trim();
                    })
                    .slice(0, 7); // Limit to 7 recommendations
            }

            // Final fallback - split by emoji patterns
            if (recommendationsList.length < 3) {
                const emojiSplit = generatedText.split(/(?=[🌱💧🌿🌳✂️🐛☀️🍂🌸🪴💪🌷😎])/);
                recommendationsList = emojiSplit
                    .filter(item => item.trim().length > 20)
                    .map(item => item.trim())
                    .slice(0, 6);
            }

            // If all parsing failed, use the entire text as a single recommendation
            if (recommendationsList.length === 0) {
                recommendationsList = [generatedText.trim()];
            }

            setRecommendations(recommendationsList);

        } catch (error) {
            console.error('Error generating recommendations:', error);
            // Fallback to default recommendations if API fails
            setRecommendations([
                "🌐 Unable to generate personalized recommendations right now. Please check your internet connection and try the refresh button.",
                "🌱 Water your plants regularly, especially during dry periods. Most plants need water 2-3 times per week.",
                "🌿 Add some compost or organic fertilizer to your soil every few months to keep plants healthy and growing strong.",
                "🌳 Plant more trees and shrubs in empty spaces. Native plants work best because they're already used to your local weather.",
                "✂️ Trim dead or damaged branches regularly to help your plants stay healthy and grow better.",
                "🐛 Keep an eye out for pests and diseases. Remove any sick-looking leaves and consider natural pest control methods.",
                "☀️ Make sure your plants get the right amount of sunlight - some need full sun, others prefer shade."
            ]);
        } finally {
            setLoadingRecommendations(false);
        }
    };

    useEffect(() => {
        if (!data) return; // Exit early if data is unavailable

        // Generate AI recommendations using Gemini API
        generateRecommendations(data);
    }, [data]); // Re-run when `data` changes

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
    }, []);

    if (!data) {
        return <div>No data available</div>;
    }

    const { forecast, segmentation_stats, segmentation_results } = data;

    console.log("segmentation_stats", segmentation_stats['Green Percentage']);


    // Extract relevant data for charts
    const vegetationDensityData = {
        options: {
            chart: {
                id: 'vegetation-density-chart',
                background: 'transparent', // Transparent background
                foreColor: '#ffffff', // White text color
            },
            theme: {
                mode: 'dark', // Enable dark mode
            },
            labels: ['High Vegetation Density', 'Medium Vegetation Density', 'Low Vegetation Density'],
            colors: ['#00E396', '#FEB019', '#FF4560'],
            grid: {
                borderColor: '#333333', // Darker grid lines
            },
        },
        series: [
            parseFloat(segmentation_stats['High Vegetation Density Coverage']),
            parseFloat(segmentation_stats['Medium Vegetation Density Coverage']),
            parseFloat(segmentation_stats['Low Vegetation Density Coverage']),
        ],
    };

    const greenPercentageData = {
        options: {
            chart: {
                id: 'green-percentage-chart',
                type: 'radialBar',
                background: 'transparent', // Transparent background
                foreColor: '#ffffff', // White text color
            },
            theme: {
                mode: 'dark', // Enable dark mode
            },
            labels: ['Green Percentage'],
            colors: ['#00E396'],
            grid: {
                borderColor: '#333333', // Darker grid lines
            },
        },
        series: [parseFloat(segmentation_stats['Green Percentage'])],
    };
    const forecastData = {
        options: {
            chart: {
                id: 'forecast-chart',
            },
            xaxis: {
                categories: Object.keys(forecast),
            },
            tooltip: {
                theme: 'dark', // Set the tooltip theme to dark
                style: {
                    fontSize: '14px',
                    fontFamily: 'Arial, sans-serif',
                    color: '#000000', // Set the text color to black
                },
            },
        },
        series: [
            {
                name: 'Forecast',
                data: Object.values(forecast).map(value => parseFloat(value)),
            },
        ],
    };

    const getHealthStatusBadgeStyle = (ndviScore) => {
        if (ndviScore >= 0.6) {
            return "bg-green-500 text-white"; // Healthy
        } else if (ndviScore >= 0.3) {
            return "bg-yellow-500 text-gray-800"; // Moderate
        } else if (ndviScore >= 0) {
            return "bg-red-500 text-white"; // Poor
        } else {
            return "bg-gray-500 text-white"; // No Vegetation
        }
    };

    const getHealthStatus = (ndviScore) => {
        if (ndviScore >= 0.6) {
            return "Healthy";
        } else if (ndviScore >= 0.3) {
            return "Moderate";
        } else if (ndviScore >= 0) {
            return "Poor";
        } else {
            return "Low Vegetation";
        }
    };

    const calculateNDVIFromGreenPercentage = (greenPercentageString) => {
        const greenPercentage = parseGreenPercentage(greenPercentageString);
        // Map green percentage (0–100) to NDVI range (-1 to 1)
        const ndvi = (greenPercentage / 100) * 2 - 1;
        // Clamp the NDVI value to ensure it stays within -1 to 1
        return Math.min(Math.max(ndvi, -1), 1);
    };

    const parseGreenPercentage = (greenPercentageString) => {
        // Remove the '%' and trim any whitespace, then convert to a number
        return parseFloat(greenPercentageString.replace('%', '').trim());
    };

    const ndviScore = segmentation_stats['NDVI Score'];

    return (
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-green-900 min-h-screen text-white">

            <div className="px-4 sm:px-8 lg:px-16 xl:px-32 pb-16 pt-16">
                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
                        <div className="flex items-center mb-6">
                            <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-3 mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Vegetation Density Coverage</h2>
                        </div>
                        <Chart
                            options={vegetationDensityData.options}
                            series={vegetationDensityData.series}
                            type="donut"
                            height={350}
                        />
                    </div>
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl hover:shadow-green-500/10 transition-all duration-300">
                        <div className="flex items-center mb-6">
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-3 mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Green Coverage</h2>
                        </div>
                        <Chart
                            options={greenPercentageData.options}
                            series={greenPercentageData.series}
                            type="radialBar"
                            height={350}
                        />
                    </div>
                </div>

                {/* Enhanced NDVI Score Card */}
                <div className="mb-12">
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center mb-6">
                            <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg p-3 mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Vegetation Health Index</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* NDVI Score */}
                            <div className="text-center">
                                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-400/30">
                                    <p className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">
                                        {calculateNDVIFromGreenPercentage(segmentation_stats['Green Percentage']).toFixed(3)}
                                    </p>
                                    <p className="text-gray-300 font-semibold">NDVI Score</p>
                                    <p className="text-xs text-gray-400 mt-1">Vegetation Index</p>
                                </div>
                            </div>

                            {/* Health Status */}
                            <div className="text-center">
                                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl p-6 border border-blue-400/30">
                                    <div className="mb-3">
                                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${getHealthStatusBadgeStyle(calculateNDVIFromGreenPercentage(segmentation_stats['Green Percentage']))}`}>
                                            {getHealthStatus(calculateNDVIFromGreenPercentage(segmentation_stats['Green Percentage']))}
                                        </span>
                                    </div>
                                    <p className="text-gray-300 font-semibold">Health Status</p>
                                    <p className="text-xs text-gray-400 mt-1">Current Condition</p>
                                </div>
                            </div>

                            {/* Analysis Date */}
                            <div className="text-center">
                                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-400/30">
                                    <p className="text-2xl font-bold text-purple-300 mb-2">
                                        {new Date().toLocaleDateString()}
                                    </p>
                                    <p className="text-gray-300 font-semibold">Analysis Date</p>
                                    <p className="text-xs text-gray-400 mt-1">Report Generated</p>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="mt-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                            <p className="text-gray-300 text-center">
                                <span className="font-semibold text-green-400">NDVI Score</span> ranges from -1 to 1, where values closer to 1 indicate healthier vegetation.
                                This analysis helps assess the health and density of vegetation in your selected area.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Forecast Line Chart */}
                <div className="mb-12">
                    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center mb-6">
                            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-3 mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Vegetation Forecast</h2>
                        </div>
                        <Chart
                            options={forecastData.options}
                            series={forecastData.series}
                            type="line"
                            height={350}
                        />
                    </div>
                </div>

                {/* Segmentation Results Images */}
                <div className="mb-12">
                    <div className="flex items-center mb-8">
                        <div className="bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg p-3 mr-4">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Segmentation Analysis</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {Object.entries(segmentation_results).map(([key, value]) => (
                            <div key={key} className="bg-gradient-to-br from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-600/50 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                                <h3 className="text-lg font-bold text-white mb-4 text-center">{key}</h3>
                                <div className="relative overflow-hidden rounded-lg">
                                    <img
                                        src={`http://127.0.0.1:5000/${value}`}
                                        alt={key}
                                        className="w-full h-auto rounded-lg transition-transform duration-300 hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommendations */}
                <div className="mb-12">
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center">
                                <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg p-3 mr-4">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                    </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-white">AI-Powered Recommendations</h2>
                            </div>
                            {!loadingRecommendations && (
                                <button
                                    onClick={() => generateRecommendations(data)}
                                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Regenerate
                                </button>
                            )}
                        </div>
                        {loadingRecommendations ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
                                <span className="ml-3 text-gray-300">Generating AI recommendations...</span>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-center mb-4">
                                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold mr-3">
                                        AI Powered
                                    </div>
                                    <span className="text-gray-400 text-sm">Generated by Google Gemini AI</span>
                                </div>
                                <ul className="space-y-4 text-gray-300">
                                    {recommendations.map((recommendation, index) => (
                                        <li key={index} className="bg-gradient-to-r from-gray-700 to-gray-600 p-5 rounded-xl border-l-4 border-green-400 shadow-lg hover:shadow-xl transition-shadow duration-300">
                                            <div className="flex items-start">
                                                <span className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold mr-4 mt-1 flex-shrink-0 shadow-md">
                                                    {index + 1}
                                                </span>
                                                <div className="flex-1">
                                                    <p className="text-gray-100 leading-relaxed text-lg font-medium">
                                                        {recommendation}
                                                    </p>
                                                    {index === 0 && (
                                                        <div className="mt-2 text-xs text-green-300 font-semibold">
                                                            💡 Start with this one!
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 p-4 bg-green-900 bg-opacity-30 rounded-lg border border-green-500">
                                    <div className="flex items-center text-green-300">
                                        <span className="text-2xl mr-3">🌟</span>
                                        <div>
                                            <p className="font-semibold">Pro Tip:</p>
                                            <p className="text-sm text-green-200">Start with 1-2 recommendations and gradually implement more. Small, consistent actions lead to big improvements!</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Map Container */}
                <div className="mb-12">
                    <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-8 shadow-2xl">
                        <div className="flex items-center mb-6">
                            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg p-3 mr-4">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold text-white">Analysis Location</h2>
                        </div>
                        <div className="relative overflow-hidden rounded-xl border border-gray-600/50">
                            <MapContainer
                                center={[analysisLocation.lat, analysisLocation.lng]}
                                zoom={15}
                                scrollWheelZoom={true}
                                style={{ height: '450px', width: '100%' }}
                            >
                                <TileLayer
                                    url={`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`}
                                    attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> contributors'
                                />
                                <Marker position={[analysisLocation.lat, analysisLocation.lng]}>
                                    <Popup>
                                        <div className="text-black">
                                            <h3 className="font-bold text-green-600 mb-2">📍 Analysis Location</h3>
                                            <div className="space-y-1 text-sm">
                                                <p><strong>Coordinates:</strong> {analysisLocation.lat.toFixed(6)}, {analysisLocation.lng.toFixed(6)}</p>
                                                <p><strong>NDVI Score:</strong> {calculateNDVIFromGreenPercentage(segmentation_stats['Green Percentage']).toFixed(3)}</p>
                                                <p><strong>Green Coverage:</strong> {segmentation_stats['Green Percentage']}</p>
                                                <p><strong>Health Status:</strong> <span className="font-semibold">{getHealthStatus(calculateNDVIFromGreenPercentage(segmentation_stats['Green Percentage']))}</span></p>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalysisResults;