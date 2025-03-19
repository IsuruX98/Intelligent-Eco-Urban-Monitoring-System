import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import Chart from 'react-apexcharts';

const NoiseGuardHome = () => {
    const [mapCenter, setMapCenter] = useState([6.9271, 79.8612]);
    const [mapZoom, setMapZoom] = useState(13);
    const [selectedDetector, setSelectedDetector] = useState(null);
    const [chartData, setChartData] = useState({
        options: {
            chart: {
                id: 'sound-classification-chart',
                foreColor: '#fff', // Text color for the chart
                toolbar: {
                    show: false, // Hide the toolbar
                },
            },
            theme: {
                mode: 'dark', // Dark theme
            },
            xaxis: {
                categories: [],
                labels: {
                    style: {
                        colors: '#fff', // X-axis label color
                    },
                },
            },
            yaxis: {
                labels: {
                    style: {
                        colors: '#fff', // Y-axis label color
                    },
                    formatter: function (value) {
                        return value.toFixed(2) + '%';
                    },
                },
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '70%',
                    endingShape: 'rounded',
                },
            },
            dataLabels: {
                enabled: false,
            },
            stroke: {
                show: true,
                width: 2,
                colors: ['transparent'],
            },
            fill: {
                opacity: 1,
            },
            tooltip: {
                theme: 'dark', // Dark theme for tooltips
            },
        },
        series: [
            {
                name: 'Probability',
                data: [],
            },
        ],
    });

    // Hardcoded noise detector data
    const noiseDetectors = [
        {
            id: 1,
            name: "Detector 1",
            latitude: 6.9271,
            longitude: 79.8612,
            noiseLevel: 75,
            classification: {
                clapping: 0.9941753149032593,
                clock_alarm: 0.20266911387443542,
                crackling_fire: 0.9732205867767334,
            },
            trend: "Increasing",
        },
        {
            id: 2,
            name: "Detector 2",
            latitude: 6.9350,
            longitude: 79.8700,
            noiseLevel: 65,
            classification: {
                clapping: 0.8941753149032593,
                clock_alarm: 0.30266911387443542,
                crackling_fire: 0.8732205867767334,
            },
            trend: "Stable",
        },
    ];

    // Handle marker click
    const handleMarkerClick = (detector) => {
        setSelectedDetector(detector);
        updateChartData(detector.classification);
    };

    // Update chart data based on classification
    const updateChartData = (classification) => {
        const categories = Object.keys(classification);
        const data = Object.values(classification).map((value) => (value * 100).toFixed(2));

        setChartData({
            options: {
                ...chartData.options,
                xaxis: {
                    ...chartData.options.xaxis,
                    categories: categories,
                },
            },
            series: [
                {
                    name: 'Probability',
                    data: data,
                },
            ],
        });
    };

    // Simulate real-time updates every 5 seconds
    useEffect(() => {
        if (selectedDetector) {
            const interval = setInterval(() => {
                // Update noiseLevel
                const updatedNoiseLevel = Math.floor(Math.random() * 100);

                // Update classification
                const updatedClassification = {};
                const soundClasses = ['clapping', 'clock_alarm', 'crackling_fire', 'traffic', 'birds', 'wind']; // Example sound classes
                soundClasses.forEach((key) => {
                    updatedClassification[key] = Math.random();
                });

                // Update selectedDetector state
                setSelectedDetector({
                    ...selectedDetector,
                    noiseLevel: updatedNoiseLevel,
                    classification: updatedClassification,
                });

                // Update chart data
                updateChartData(updatedClassification);
            }, 5000);

            return () => clearInterval(interval);
        }
    }, [selectedDetector]);

    return (
        <div className='bg-gray-900 min-h-screen text-white py-12 px-12 md:px-8 lg:px-16 xl:px-32 relative'>
            <h1 className="text-4xl text-green-400 font-bold mb-8">
                NoiseGuard AI
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
            <div className="mb-8">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: "600px", width: "100%" }}
                >
                    <TileLayer
                        attribution="Google Maps Satellite"
                        url="https://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}"
                    />
                    {/* Render noise detector markers */}
                    {noiseDetectors.map((detector) => (
                        <Marker
                            key={detector.id}
                            position={[detector.latitude, detector.longitude]}
                            eventHandlers={{
                                click: () => handleMarkerClick(detector),
                            }}
                        >
                            <Popup>
                                <div>
                                    <h3 className="font-bold">{detector.name}</h3>
                                    <p>Noise Level: {detector.noiseLevel} dB</p>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </div>
            {/* Display selected noise detector details */}
            {selectedDetector && (
                <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                    <h2 className="text-2xl font-bold text-green-400 mb-4">
                        {selectedDetector.name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Location */}
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm text-gray-300 font-semibold">Location</p>
                            <p className="text-lg text-white">
                                {selectedDetector.latitude}, {selectedDetector.longitude}
                            </p>
                        </div>
                        {/* Noise Level */}
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm text-gray-300 font-semibold">Noise Level</p>
                            <p className="text-lg text-white">
                                {selectedDetector.noiseLevel} dB
                            </p>
                        </div>
                        {/* Trend */}
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm text-gray-300 font-semibold">Trend</p>
                            <p className="text-lg text-white">
                                {selectedDetector.trend}
                            </p>
                        </div>
                    </div>
                    {/* Chart */}
                    <div className="mt-6">
                        <h3 className="text-xl font-bold text-green-400 mb-4">Sound Classification</h3>
                        <Chart
                            options={chartData.options}
                            series={chartData.series}
                            type="bar"
                            height={350}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoiseGuardHome;