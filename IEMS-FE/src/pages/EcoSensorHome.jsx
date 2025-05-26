import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from "chart.js";
import { Link } from "react-router-dom"; // Assuming react-router-dom is set up
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

// Register Chart.js components
Chart.register(...registerables);

// Firebase config (your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBcalgO9vafdMBjemg1fqik0c2nYyz7ujU",
  authDomain: "esp-32-firebase-90634.firebaseapp.com",
  databaseURL:
    "https://esp-32-firebase-90634-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp-32-firebase-90634",
  storageBucket: "esp-32-firebase-90634.firebasestorage.app",
  messagingSenderId: "627135290506",
  appId: "1:627135290506:web:d8cc3791c3cc774e9b6173",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const EcoSensorHome = () => {
  // --- Firebase Data States ---
  const [sensorData, setSensorData] = useState([]);
  const [timestamps, setTimestamps] = useState([]);
  const [currentAirQuality, setCurrentAirQuality] = useState(null);
  const [currentAirQualityType, setCurrentAirQualityType] = useState(null);
  const [healthImpact, setHealthImpact] = useState(null);

  // --- Prediction Form States ---
  const [showSlider, setShowSlider] = useState(false); // Controls modal visibility
  const [step, setStep] = useState(1); // Current step in the prediction process (1: Location, 2: Date, 3: Results)

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [date, setDate] = useState("");
  const [dateError, setDateError] = useState(""); // Error message for date validation
  const [loading, setLoading] = useState(false); // Loading state for prediction API calls
  const [predictionResult, setPredictionResult] = useState(null); // Predicted AQI
  const [temperature, setTemperature] = useState(null); // Predicted temperature
  const [humidity, setHumidity] = useState(null); // Predicted humidity
  const [error, setError] = useState(""); // General error message for prediction process

  // Refs for Google Map and Marker
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // --- useEffect for Firebase Realtime DB Data Fetching ---
  useEffect(() => {
    // Reference to the 'sensor_data' node in Firebase Realtime Database
    const dataRef = ref(database, "sensor_data");

    // Set up a listener for real-time data changes
    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val(); // Get the data from the snapshot
      if (data) {
        // Convert the object of data into an array
        const dataArray = Object.values(data);
        // Get only the latest 10 entries for the chart
        const latestData = dataArray.slice(-10);

        // Extract sensor values and format timestamps for the chart
        const sensorValues = latestData.map(
          (entry) => entry.sensor_value_mq135
        );
        const timeLabels = latestData.map((entry) => {
          const ts = entry.timestamp * 1000; // Convert Unix timestamp to milliseconds
          const d = new Date(ts);
          if (isNaN(d)) return "N/A"; // Handle invalid dates
          return d.toLocaleTimeString(); // Format time for display
        });

        // Update state with fetched data
        setSensorData(sensorValues);
        setTimestamps(timeLabels);

        // Get the latest entry for current air quality display
        if (latestData.length > 0) {
          const latestEntry = latestData[latestData.length - 1];
          setCurrentAirQuality(latestEntry.sensor_value_mq135);
          setCurrentAirQualityType(latestEntry.air_quality);
        }
      }
    });

    // Cleanup function: unsubscribe from the Firebase listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount

  // --- useEffect for Google Map Initialization ---
  useEffect(() => {
    // Only initialize map if the slider is shown and it's step 1
    if (!showSlider || step !== 1) return;

    // Define geographical bounds for Sri Lanka to restrict map view
    const sriLankaBounds = {
      north: 9.85,
      south: 5.91,
      west: 79.67,
      east: 82.0,
    };
    // Calculate the center of Sri Lanka
    const center = {
      lat: (sriLankaBounds.north + sriLankaBounds.south) / 2,
      lng: (sriLankaBounds.west + sriLankaBounds.east) / 2,
    };

    // Check if Google Maps script is already loaded
    if (!window.google) {
      // If not loaded, dynamically create and append the script tag
      const script = document.createElement("script");
      // IMPORTANT: Replace 'YOUR_GOOGLE_MAPS_API_KEY' with your actual API key
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB1IGr0WmaabcIu7OOLwoc5Rt-PTqCjb7E&callback=initMap`;
      script.async = true;
      document.head.appendChild(script);

      // Define the global callback function for Google Maps API
      window.initMap = () => {
        initMap(center, sriLankaBounds);
      };
    } else {
      // If already loaded, just call the initMap function
      initMap(center, sriLankaBounds);
    }

    // Function to initialize the Google Map
    function initMap(center, bounds) {
      // Create a new Google Map instance
      const map = new window.google.maps.Map(mapRef.current, {
        center, // Initial map center
        zoom: 8, // Initial zoom level
        restriction: {
          latLngBounds: bounds, // Restrict map to Sri Lanka bounds
          strictBounds: false, // Allow slight panning outside bounds
        },
        disableDefaultUI: true, // Disable default UI controls for a cleaner look
        zoomControl: true, // Enable zoom control
      });

      // Create a draggable marker at the center
      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: true, // Allow user to drag the marker
        title: "Drag to select location",
      });
      markerRef.current = marker; // Store marker instance in ref

      // Set initial latitude and longitude states
      setLatitude(center.lat);
      setLongitude(center.lng);

      // Add listener for marker drag end event
      marker.addListener("dragend", () => {
        const pos = marker.getPosition(); // Get new position after drag
        setLatitude(pos.lat());
        setLongitude(pos.lng());
      });

      // Add listener for map click event to move the marker
      map.addListener("click", (e) => {
        marker.setPosition(e.latLng); // Move marker to clicked location
        setLatitude(e.latLng.lat());
        setLongitude(e.latLng.lng());
      });
    }
  }, [showSlider, step]); // Re-run effect when slider visibility or step changes

  // --- Date Validation Function ---
  const validateDate = (selectedDate) => {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    if (selectedDate < today) {
      return "Please select today or a future date."; // Error if date is in the past
    }
    return ""; // No error
  };

  // --- Handle Date Input Change ---
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setDate(selectedDate); // Update date state
    setDateError(validateDate(selectedDate)); // Validate and set error message
  };

  // --- Handle Next Button Click in Prediction Modal ---
  const handleNext = async () => {
    setError(""); // Clear previous errors
    setPredictionResult(null); // Clear previous prediction results
    setHealthImpact(null); // Clear previous health impact

    if (step === 1) {
      // Step 1: Location selection
      if (latitude === null || longitude === null) {
        setError("Please select a location on the map.");
        return;
      }
      setStep(2); // Move to next step
    } else if (step === 2) {
      // Step 2: Date selection and API calls
      if (!date) {
        setError("Please select a date.");
        return;
      }
      if (dateError) {
        setError(dateError); // Show date validation error if any
        return;
      }

      setLoading(true); // Set loading state to true
      setError(""); // Clear any previous errors before new API calls

      try {
        const dateStr = date;

        // Fetch weather data from Open-Meteo API
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,relative_humidity_2m_max&timezone=Asia/Colombo&forecast_days=7`;
        const weatherResponse = await fetch(weatherUrl);
        const weatherData = await weatherResponse.json();

        // Validate weather data response
        if (!weatherData.daily || !weatherData.daily.time) {
          throw new Error("Invalid weather data received.");
        }

        // Find the index of the selected date in the forecast
        const dateIndex = weatherData.daily.time.indexOf(dateStr);
        if (dateIndex === -1) {
          throw new Error("Selected date is not within the weather forecast range (7 days).");
        }

        // Extract temperature and humidity for the selected date
        const temperatureMax = weatherData.daily.temperature_2m_max[dateIndex];
        const humidity = weatherData.daily.relative_humidity_2m_max[dateIndex];

        // Prepare payload for AQI prediction API
        const predictionPayload = {
          latitude,
          longitude,
          date: dateStr + " 12:00:00", // Append time for backend compatibility
          temperature_max: temperatureMax,
          humidity: humidity,
        };

        // Call backend AQI prediction API
        const response = await fetch(
          "http://127.0.0.1:5000/predict_air_quality", // Replace with your actual backend URL
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(predictionPayload),
          }
        );

        const result = await response.json();

        // Handle prediction API errors
        if (!response.ok) {
          setError(result.error || "Air quality prediction failed.");
          setLoading(false);
          return;
        }

        // Update state with prediction results
        setPredictionResult(result.predicted_aqi);
        setTemperature(temperatureMax);
        setHumidity(humidity);

        // Call health impact prediction API with the obtained AQI, temperature, and humidity
        const healthResponse = await fetch(
          "http://127.0.0.1:5000/predict_health_impact", // Replace with your actual backend URL
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              aqi: result.predicted_aqi,
              temperature: temperatureMax,
              humidity: humidity,
            }),
          }
        );

        const healthResult = await healthResponse.json();

        // Handle health impact API errors
        if (!healthResponse.ok) {
          setError(healthResult.error || "Health impact prediction failed.");
        } else {
          setHealthImpact(healthResult.predicted_class_label);
        }

        setStep(3); // Move to results step
      } catch (err) {
        setError(err.message || "An unexpected error occurred during prediction.");
      } finally {
        setLoading(false); // Always set loading to false after API calls
      }
    }
  };

  // --- Handle Closing the Prediction Modal ---
  const handleCloseSlider = () => {
    setShowSlider(false); // Hide the modal
    // Reset all modal-related states to their initial values
    setStep(1);
    setLatitude(null);
    setLongitude(null);
    setDate("");
    setDateError("");
    setPredictionResult(null);
    setTemperature(null);
    setHumidity(null);
    setHealthImpact(null);
    setError("");
    setLoading(false);
  };

  // --- Chart Data and Options for Real-time Sensor Display ---
  const chartData = {
    labels: timestamps, // X-axis labels (timestamps)
    datasets: [
      {
        label: "MQ-135 Sensor Value", // Dataset label
        data: sensorData, // Y-axis data (sensor values)
        borderColor: "rgba(74, 222, 128, 1)", // Green color for the line
        backgroundColor: "rgba(74, 222, 128, 0.2)", // Light green fill under the line
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
        beginAtZero: true, // Start Y-axis from zero
        ticks: { color: "white" }, // White color for Y-axis labels
        grid: { color: "rgba(255, 255, 255, 0.1)" }, // Light grid lines
      },
      x: {
        ticks: { color: "white" }, // White color for X-axis labels
        grid: { color: "rgba(255, 255, 255, 0.1)" }, // Light grid lines
      },
    },
    responsive: true, // Chart resizes with container
    maintainAspectRatio: false, // Do not maintain aspect ratio (allows flexible height)
    plugins: {
      legend: {
        labels: { color: "white" }, // White color for legend text
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker tooltip background
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(74, 222, 128, 0.5)',
        borderWidth: 1,
        cornerRadius: 6,
      }
    },
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white font-inter py-12 px-4 sm:px-8 md:px-16 lg:px-24 xl:px-32 relative">
      {/* Main content wrapper for max width and centering */}
      <div className="max-w-screen-xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-12">
          <h1 className="text-4xl sm:text-5xl text-green-400 font-extrabold mb-6 md:mb-0 drop-shadow-lg">
            EcoSensor
          </h1>
          {/* You can add navigation links here if needed */}
        </div>

        {/* EcoSensor Information Card */}
        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-xl mb-8 border border-gray-700 transition-all duration-300 hover:scale-[1.01]">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-green-400">
            EcoSensor Information
          </h2>
          <p className="text-lg mb-4 text-gray-300 leading-relaxed">
            EcoSensor is a real-time air quality monitoring system designed to
            provide accurate and up-to-date information about the air you breathe.
          </p>
          <p className="text-base text-gray-400 mb-4 leading-relaxed">
            This system uses an MQ-135 sensor to detect various gases in the
            atmosphere and displays the sensor values in a user-friendly chart.
          </p>
          <p className="text-base text-gray-400 leading-relaxed">
            The system also provides AI-powered air quality predictions, allowing
            you to anticipate future air quality conditions.
          </p>
        </div>

        {/* How to Use Card */}
        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-xl mt-8 mb-8 border border-gray-700 transition-all duration-300 hover:scale-[1.01]">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-green-400">
            How to Use
          </h2>
          <ol className="list-decimal list-inside pl-4 text-gray-300 text-base">
            <li className="mb-2">
              View the real-time air quality data displayed in the chart.
            </li>
            <li className="mb-2">
              Check the current air quality status and type displayed above the
              chart.
            </li>
            <li className="mb-2">
              Click the "Predict Air Quality" button to open the prediction tool.
            </li>
            <li className="mb-2">
              Pick location, date, and get predicted AQI + weather info.
            </li>
          </ol>
        </div>

        {/* Real-time Air Quality Info */}
        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-xl mb-8 border border-gray-700 transition-all duration-300 hover:scale-[1.01]">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-green-400">
            Real-time Air Quality
          </h2>
          {currentAirQuality !== null && currentAirQualityType !== null ? (
            <p className="text-xl sm:text-2xl">
              Current Air Quality:{" "}
              <span className="font-extrabold text-green-300 animate-pulse">
                {currentAirQuality}
              </span>{" "}
              <span className="font-semibold text-green-300"></span>
            </p>
          ) : (
            <p className="text-lg text-gray-400">Loading real-time air quality data...</p>
          )}
        </div>

        {/* Chart Section */}
        <div
          className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-xl mb-8 border border-gray-700"
          style={{ height: "350px" }} // Increased height for better chart visibility
        >
          <Line
            key={sensorData.join(",") + timestamps.join(",")} // Key to force re-render on data change
            data={chartData}
            options={chartOptions}
          />
        </div>

        {/* AI-Powered Prediction Section */}
        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-xl mb-8 border border-gray-700 transition-all duration-300 hover:scale-[1.01]">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-green-400">
            AI-Powered Air Quality Prediction
          </h2>
          <p className="text-lg mb-4 text-gray-300 leading-relaxed">
            Unveiling Tomorrow's Atmosphere: Our AI model harnesses historical
            data and environmental factors to predict future air quality.
          </p>
          <p className="text-base text-gray-400 mb-6 leading-relaxed">
            You can predict the future air quality by inputting your
            location and the desired date to see the predicted air quality for that time.
          </p>
          {/* This Link assumes you have react-router-dom set up */}
          <Link
            to="/predict-air"
            className="inline-flex items-center justify-center bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg
                       transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-75"
          >
            Predict Air Quality 
            {/* Example icon, consider using lucide-react or similar */}
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
          </Link>
        </div>

        {/* Predict Air Quality with Weather Data Section */}
        <div className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-xl mb-8 border border-gray-700 transition-all duration-300 hover:scale-[1.01]">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-green-400">
            Predict Air Quality with Weather Data
          </h2>
          <p className="text-lg mb-4 text-gray-300 leading-relaxed">
            Combine environmental weather data with sensor readings to get
            enhanced, more accurate air quality predictions for your chosen location and date.
          </p>
          <button
            onClick={() => setShowSlider(true)}
            className="inline-flex items-center justify-center bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg
                       transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
          >
            Open Prediction Tool
            {/* Example icon */}
            <svg className="ml-2 -mr-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </button>
        </div>
      </div> {/* End of max-w-screen-xl mx-auto wrapper */}

      {/* --- Prediction Slider/Modal --- */}
      {showSlider && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 sm:p-6">
          <div className="bg-gray-800 rounded-xl p-6 sm:p-8 shadow-2xl w-full relative
                          max-w-sm sm:max-w-lg md:max-w-2xl lg:max-w-3xl
                          max-h-[90vh] overflow-y-auto transform scale-95 animate-fade-in-up">
            {/* Close Button */}
            <button
              onClick={handleCloseSlider}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 text-3xl font-bold"
              title="Close Prediction Tool"
            >
              &times;
            </button>

            {/* Step Indicators */}
            <div className="flex justify-center items-center space-x-3 mb-6">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold transition-all duration-300
                              ${step === 1 ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-700 text-gray-400'}`}>
                1
              </div>
              <div className={`w-12 h-1 bg-gray-700 rounded-full ${step > 1 ? 'bg-green-500' : ''} transition-colors duration-300`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold transition-all duration-300
                              ${step === 2 ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-700 text-gray-400'}`}>
                2
              </div>
              <div className={`w-12 h-1 bg-gray-700 rounded-full ${step > 2 ? 'bg-green-500' : ''} transition-colors duration-300`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full text-lg font-bold transition-all duration-300
                              ${step === 3 ? 'bg-green-500 text-white shadow-lg' : 'bg-gray-700 text-gray-400'}`}>
                3
              </div>
            </div>

            {/* Step 1: Pick Location */}
            {step === 1 && (
              <>
                <h3 className="text-2xl font-bold mb-4 text-green-400 text-center">
                  Step 1: Select Location
                </h3>
                <p className="text-gray-400 text-center mb-4">Click on the map or drag the marker to choose a location in Sri Lanka.</p>
                <div
                  ref={mapRef}
                  className="w-full rounded-lg shadow-inner border border-gray-700"
                  style={{ height: "300px" }} // Fixed height for map, consider responsive height for production
                  id="map"
                ></div>
                <p className="mt-4 text-white text-center text-lg">
                  Latitude: <b className="text-green-300">{latitude?.toFixed(5) ?? "N/A"}</b>, Longitude:{" "}
                  <b className="text-green-300">{longitude?.toFixed(5) ?? "N/A"}</b>
                </p>
              </>
            )}

            {/* Step 2: Select Date */}
            {step === 2 && (
              <>
                <h3 className="text-2xl font-bold mb-4 text-green-400 text-center">
                  Step 2: Select Date
                </h3>
                <p className="text-gray-400 text-center mb-4">Choose a date within the next 7 days for the prediction.</p>
                <input
                  type="date"
                  value={date}
                  onChange={handleDateChange}
                  className="w-full p-3 rounded-lg bg-gray-700 text-white border border-gray-600
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                             transition-all duration-200"
                  min={new Date().toISOString().split("T")[0]} // today or future only
                />
                {dateError && <p className="text-red-500 mt-2 text-sm text-center">{dateError}</p>}
              </>
            )}

            {/* Step 3: Prediction Results */}
            {step === 3 && (
              <>
                <h3 className="text-2xl font-bold mb-4 text-green-400 text-center">
                  Prediction Results
                </h3>
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <svg className="animate-spin h-10 w-10 text-green-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-lg text-gray-300">Loading prediction and weather data...</p>
                  </div>
                ) : error ? (
                  <div className="bg-red-900 bg-opacity-30 p-4 rounded-lg border border-red-700 text-red-300 text-center">
                    <p className="font-semibold mb-2">Error:</p>
                    <p>{error}</p>
                  </div>
                ) : (
                  <div className="space-y-4 text-lg">
                    <p>
                      Predicted AQI:{" "}
                      <span className="font-bold text-green-300 text-2xl">
                        {predictionResult ?? "N/A"}
                      </span>
                    </p>
                    <p>
                      Temperature:{" "}
                      <span className="font-bold text-blue-300">
                        {temperature !== null ? `${temperature}°C` : "N/A"}
                      </span>
                    </p>
                    <p>
                      Humidity:{" "}
                      <span className="font-bold text-purple-300">
                        {humidity !== null ? `${humidity}%` : "N/A"}
                      </span>
                    </p>
                    <p>
                      Health Impact:{" "}
                      <span className="font-bold text-yellow-300">
                        {healthImpact ?? "N/A"}
                      </span>
                      <span className="text-sm text-gray-400 block mt-1">
                        (e.g., "Good", "Moderate", "Unhealthy for Sensitive Groups")
                      </span>
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-bold py-2 px-5 rounded-lg shadow-md
                             transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Back
                </button>
              )}
              {step < 3 && (
                <button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-2 px-5 rounded-lg shadow-md
                             transition-all duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {step === 2 ? "Get Prediction" : "Next"}
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleCloseSlider}
                  className="bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-2 px-5 rounded-lg shadow-md
                             transition-all duration-200 ease-in-out"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EcoSensorHome;

