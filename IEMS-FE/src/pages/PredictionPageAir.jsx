import React, { useState, useEffect, useRef } from 'react';

const PredictionPageAir = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [date, setDate] = useState('');
  const [dateError, setDateError] = useState('');
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const mapRef = useRef(null);

  useEffect(() => {
    const initMap = () => {
      const sriLankaBounds = {
        north: 9.85,
        south: 5.91,
        west: 79.67,
        east: 82.00,
      };

      const center = {
        lat: (sriLankaBounds.north + sriLankaBounds.south) / 2,
        lng: (sriLankaBounds.west + sriLankaBounds.east) / 2,
      };

      const map = new window.google.maps.Map(mapRef.current, {
        center: center,
        zoom: 8,
        restriction: {
          latLngBounds: sriLankaBounds,
          strictBounds: false,
        },
      });

      const marker = new window.google.maps.Marker({
        position: center,
        map: map,
        draggable: true,
      });

      setLatitude(center.lat);
      setLongitude(center.lng);

      marker.addListener('dragend', () => {
        setLatitude(marker.getPosition().lat());
        setLongitude(marker.getPosition().lng());
      });

      map.addListener('click', (mapsMouseEvent) => {
        marker.setPosition(mapsMouseEvent.latLng);
        setLatitude(mapsMouseEvent.latLng.lat());
        setLongitude(mapsMouseEvent.latLng.lng());
      });
    };

    if (window.google) {
      initMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyB1IGr0WmaabcIu7OOLwoc5Rt-PTqCjb7E&callback=initMap`;
      script.defer = true;
      document.head.appendChild(script);
      window.initMap = initMap;
    }
  }, []);

  const handleDateChange = (event) => {
    const selectedDate = event.target.value;
    setDate(selectedDate);
    setDateError(validateDate(selectedDate));
  };

  const validateDate = (selectedDate) => {
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate < today) {
      return 'Please select a future date.';
    }
    return '';
  };

  const handlePredict = async () => {
    setPredictionResult(null);
    setError('');
    if (dateError) {
      setError(dateError);
      return;
    }
    if (latitude === null || longitude === null || date === '') {
      setError('Please select location and date.');
      return;
    }

    const predictionData = {
      latitude: latitude,
      longitude: longitude,
      date: date + " 12:00:00" // adding time to match backend format
    };

    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:5000/predict_air_quality', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(predictionData),
      });

      const data = await response.json();

      if (response.ok) {
        setPredictionResult(data.predicted_aqi.toFixed(2));
      } else {
        setError(data.error || 'Prediction failed');
      }
    } catch (err) {
      setError('Server error or unable to reach backend');
    }

    setLoading(false);
  };

  return (
    <div className="bg-gray-900 min-h-screen text-white py-12 px-12 md:px-8 lg:px-16 xl:px-32 relative">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-semibold mb-4 text-green-400">
          Predict Your Air Quality
        </h1>
        <p className="text-lg text-gray-400">
          Select a location on the map and a future date to see the predicted air quality.
        </p>
      </div>

      <div ref={mapRef} style={{ height: '400px', width: '100%' }}></div>

      <div className="max-w-md mx-auto bg-gray-800 rounded-lg p-8 shadow-md mt-8">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Latitude:
          </label>
          <input
            type="text"
            value={latitude !== null ? latitude : ''}
            readOnly
            className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Longitude:
          </label>
          <input
            type="text"
            value={longitude !== null ? longitude : ''}
            readOnly
            className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Date:
          </label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            className="w-full px-3 py-2 border rounded-md bg-gray-700 text-white focus:ring-green-500 focus:border-green-500"
          />
          {dateError && <p className="text-red-500 text-sm mt-1">{dateError}</p>}
        </div>

        <button
          onClick={handlePredict}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-md"
          disabled={loading}
        >
          {loading ? 'Predicting...' : 'Predict'}
        </button>

        {error && <p className="text-red-500 mt-4">{error}</p>}

        {predictionResult !== null && (
          <div className="mt-6 p-4 bg-green-700 rounded-md text-center text-xl font-semibold">
            Predicted AQI: {predictionResult}
          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionPageAir;
