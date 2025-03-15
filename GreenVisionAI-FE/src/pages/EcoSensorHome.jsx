import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { Link } from 'react-router-dom';

Chart.register(...registerables);

const EcoSensorHome = () => {
  const [sensorData, setSensorData] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [currentAirQuality, setCurrentAirQuality] = useState(null);
  const [currentAirQualityType, setCurrentAirQualityType] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch("http://localhost:5000/get_data");
      const result = await response.json();

      if (result.success) {
        const dataArray = Object.values(result.data);
        const latestData = dataArray.slice(-10);

        setSensorData(latestData.map((entry) => entry.sensor_value));
        setTimestamps(
          latestData.map((entry) => new Date(entry.timestamp).toLocaleTimeString())
        );

        if (latestData.length > 0) {
          const latestEntry = latestData[latestData.length - 1];
          setCurrentAirQuality(latestEntry.sensor_value);
          setCurrentAirQualityType(latestEntry.air_quality);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const chartData = {
    labels: timestamps,
    datasets: [
      {
        label: "MQ-135 Sensor Value",
        data: sensorData,
        borderColor: "rgba(74, 222, 128, 1)",
        backgroundColor: "rgba(74, 222, 128, 0.2)",
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "rgba(74, 222, 128, 1)",
        pointBorderColor: "rgba(255, 255, 255, 0.8)",
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "rgba(74, 222, 128, 1)",
        pointHoverBorderColor: "rgba(255, 255, 255, 1)",
        pointHitRadius: 10,
      },
    ],
  };

  const chartOptions = {
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: "white",
        },
      },
      x: {
        ticks: {
          color: "white",
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: 'white'
        }
      }
    }
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white py-12 px-12 md:px-8 lg:px-16 xl:px-32 relative">
      <div className="md:flex md:justify-between md:items-center block mb-8">
        <h1 className="text-4xl text-green-400 font-bold md:mb-0 mb-8">
          EcoSensor
        </h1>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-green-400">Real-time Air Quality</h2>
        {currentAirQuality !== null && currentAirQualityType !== null ? (
          <p className="text-lg">
            Current Air Quality: <span className="font-bold text-green-300">{currentAirQuality}</span> ({currentAirQualityType})
          </p>
        ) : (
          <p>Loading air quality...</p>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-6 shadow-md mb-8" style={{ height: '300px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      <div className="bg-gray-800 rounded-lg p-6 shadow-md">
        <h2 className="text-2xl font-semibold mb-4 text-green-400">AI-Powered Air Quality Prediction</h2>
        <p className="text-lg mb-4">
          Unveiling Tomorrow's Atmosphere: Our AI model harnesses historical data and environmental factors to predict future air quality.
        </p>
        <p className="text-sm text-gray-400 mb-4">
          You can predict the Future Air quality from here you can input your location and the date and see the what is the Air quality of that.
        </p>

        {/* Prediction Button */}
        <Link to="/predict-air" className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded">
          Predict Air Quality
        </Link>
      </div>
    </div>
  );
};

export default EcoSensorHome;