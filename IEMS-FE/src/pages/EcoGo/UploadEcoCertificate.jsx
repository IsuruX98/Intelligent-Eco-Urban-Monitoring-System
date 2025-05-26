import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Alert from '../../components/EcoGo/Alert';

const UploadEcoCertificate = () => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState(null);
  const [fuelConsumption, setFuelConsumption] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleFuelConsumptionChange = (e) => {
    setFuelConsumption(e.target.value);
  };

  // Function to convert v/v to g/km
  const convertVvToGkm = (vvValue) => {
    // Conversion factor: 1 v/v = 1.96 g/km (approximate conversion)
    return (parseFloat(vvValue) * 1.96).toFixed(2);
  };

  // Function to update vehicle CO2 emission
  const updateVehicleCO2 = async (co2Value) => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/vehicles/update/${vehicleId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          CO2_Emission: co2Value
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update vehicle CO2 emission');
      }

      return true;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setAlert({
        show: true,
        message: 'Please select a file first',
        type: 'error'
      });
      return;
    }
    if (!fuelConsumption) {
      setAlert({
        show: true,
        message: 'Please enter the fuel consumption (km/L)',
        type: 'error'
      });
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('vehicle_id', vehicleId);
    formData.append('fuel_consumption_km_per_l', fuelConsumption);

    try {
      const response = await fetch('http://127.0.0.1:5001/api/co2/extract_co2_from_certificate', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        navigate('/ecogo/virtualGarage');
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to process certificate');
      }

    } catch (error) {
      setAlert({
        show: true,
        message: error.message || 'Failed to upload certificate',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold text-green-400 mb-6">Upload Eco Certificate</h1>
          
          {alert.show && (
            <Alert
              message={alert.message}
              type={alert.type}
              duration={3000}
              onClose={() => setAlert({ ...alert, show: false })}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-gray-300 font-medium">
                Select Certificate Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
              <p className="text-sm text-gray-400">
                Supported formats: JPG, PNG, PDF
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-gray-300 font-medium">
                Fuel Consumption (km/L)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={fuelConsumption}
                onChange={handleFuelConsumptionChange}
                placeholder="e.g., 15 for 15 km/L"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 focus:ring-2 focus:ring-green-500 focus:outline-none"
                required
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/ecogo/virtualGarage')}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload Certificate'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UploadEcoCertificate; 