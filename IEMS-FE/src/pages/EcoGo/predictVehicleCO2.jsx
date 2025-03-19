import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Alert from './../../components/EcoGo/Alert'; // Import the Alert component

const CO2Prediction = () => {
    const { vehicleId } = useParams();
    const navigate = useNavigate(); // For navigation to Virtual Garage

    const [vehicleType, setVehicleType] = useState('');
    const [transmission, setTransmission] = useState('');
    const [fuelType, setFuelType] = useState('');
    const [powertrain, setPowertrain] = useState('');
    const [engineCapacity, setEngineCapacity] = useState('');
    const [enginePowerPS, setEnginePowerPS] = useState('');
    const [result, setResult] = useState('');
    const [showAlert, setShowAlert] = useState(false);
    const [alertType, setAlertType] = useState('success');
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        if (vehicleId) {
            console.log("Vehicle ID from URL:", vehicleId);
        }
    }, [vehicleId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = {
            vehicle_id: vehicleId,
            Transmission: transmission,
            Vehicle_Type: vehicleType,
            Fuel_Type: fuelType,
            Powertrain: powertrain,
            Engine_Capacity: engineCapacity,
            Engine_PowerPS: enginePowerPS
        };

        try {
            const response = await fetch('http://127.0.0.1:5001/api/co2/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const resultData = await response.json();

            if (resultData.predicted_co2_emission) {
                const message = `Predicted CO2 Emission: ${resultData.predicted_co2_emission} g/km`;
                setResult(message);
                setAlertMessage(message);
                setAlertType('success');
                setShowAlert(true);

                // Set a timeout to navigate to the virtual garage after showing the alert
                setTimeout(() => {
                    navigate('/ecogo/virtualGarage'); // Adjust this path as needed
                }, 3000); // This matches the default duration of the Alert component
            } else {
                setResult(`Error: ${resultData.error}`);
                setAlertMessage(`Error: ${resultData.error}`);
                setAlertType('error');
                setShowAlert(true);
            }
        } catch (error) {
            const errorMessage = `Error: ${error.message}`;
            setResult(errorMessage);
            setAlertMessage(errorMessage);
            setAlertType('error');
            setShowAlert(true);
        }
    };

    const handleAlertClose = () => {
        setShowAlert(false);
    };

    const vehicleTypeOptions = [
        { value: "Manual", label: "Manual" },
        { value: "Automatic", label: "Automatic" },
    ];

    const transmissionOptions = [
        { value: "M5", label: "M5" },
        { value: "SA5", label: "SA5" },
        { value: "SA7", label: "SA7" },
        { value: "A8", label: "A8" },
        { value: "A7", label: "A7" },
        { value: "A6", label: "A6" },
        { value: "A9-AWD", label: "A9-AWD" },
        { value: "M7", label: "M7" },
        { value: "8AT", label: "8AT" },
        { value: "AS", label: "AS" },
        { value: "M6", label: "M6" },
        { value: "CVT", label: "CVT" },
        { value: "A5", label: "A5" },
        { value: "SA8", label: "SA8" },
        { value: "DCT7", label: "DCT7" },
        { value: "A8-AWD", label: "A8-AWD" },
        { value: "10 Speed Automatic", label: "10 Speed Automatic" },
        { value: "A1", label: "A1" },
        { value: "eCVT", label: "eCVT" },
        { value: "AMT5", label: "AMT5" },
        { value: "5MT", label: "5MT" },
        { value: "6MT", label: "6MT" },
        { value: "7DCT", label: "7DCT" },
        { value: "DCT8", label: "DCT8" },
        { value: "DCT6", label: "DCT6" },
        { value: "6AT", label: "6AT" },
        { value: "M6-AWD", label: "M6-AWD" },
        { value: "MT6", label: "MT6" },
        { value: "7-Speed DCT", label: "7-Speed DCT" },
        { value: "MT7", label: "MT7" },
        { value: "6-speed auto DCT", label: "6-speed auto DCT" },
        { value: "MT5", label: "MT5" },
        { value: "AT6", label: "AT6" },
        { value: "E-CVT", label: "E-CVT" },
        { value: "A10", label: "A10" },
        { value: "8SP, SSG", label: "8SP, SSG" },
        { value: "75P. SSG", label: "75P. SSG" },
        { value: "AC", label: "AC" },
        { value: "A4", label: "A4" },
        { value: "8A-AWD", label: "8A-AWD" },
        { value: "7A-FWD", label: "7A-FWD" },
        { value: "7AT-FWD", label: "7AT-FWD" },
        { value: "8AT-AWD", label: "8AT-AWD" },
        { value: "8AT-FWD", label: "8AT-FWD" },
    ];

    const fuelTypeOptions = [
        { value: "Petrol", label: "Petrol" },
        { value: "Diesel", label: "Diesel" },
        { value: "Electric / Petrol", label: "Electric / Petrol" },
        { value: "Petrol / LPG", label: "Petrol / LPG" },
        { value: "Electric / Diesel", label: "Electric / Diesel" }
    ];

    const powertrainOptions = [
        { value: "Internal Combustion Engine (ICE)", label: "Internal Combustion Engine (ICE)" },
        { value: "Mild Hybrid Electric Vehicle (MHEV)", label: "Mild Hybrid Electric Vehicle (MHEV)" },
        { value: "Plug-in Hybrid Electric Vehicle (PHEV)", label: "Plug-in Hybrid Electric Vehicle (PHEV)" },
        { value: "Hybrid Electric Vehicle (HEV)", label: "Hybrid Electric Vehicle (HEV)" },
        { value: "Micro Hybrid", label: "Micro Hybrid" }
    ];


    return (
        <div className="bg-gray-900 min-h-screen flex items-center justify-center text-white py-12 px-6 sm:px-12 lg:px-16">
            {showAlert && (
                <Alert
                    message={alertMessage}
                    type={alertType}
                    duration={3000}
                    onClose={handleAlertClose}
                    showIcon={true}
                />
            )}

            <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
                <h1 className="text-3xl text-green-400 font-semibold text-center mb-6">CO2 Emission Prediction</h1>
                <form onSubmit={handleSubmit}>

                    <div key="VehicleType" className="mb-6">
                        <label className="block text-gray-300 font-semibold mb-2">Vehicle Type</label>
                        <select
                            className="w-full h-12 px-4 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                            value={vehicleType}
                            onChange={(e) => setVehicleType(e.target.value)}
                            required
                        >
                            <option value="" disabled selected>Select Vehicle Type</option>
                            {vehicleTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div key="Transmission" className="mb-6">
                        <label className="block text-gray-300 font-semibold mb-2">Transmission</label>
                        <select
                            className="w-full h-12 px-4 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                            value={transmission}
                            onChange={(e) => setTransmission(e.target.value)}
                            required
                        >
                            <option value="" disabled selected>Select Transmission</option>
                            {transmissionOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div key="Fuel_Type" className="mb-6">
                        <label className="block text-gray-300 font-semibold mb-2">Fuel Type</label>
                        <select
                            className="w-full h-12 px-4 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                            value={fuelType}
                            onChange={(e) => setFuelType(e.target.value)}
                            required
                        >
                            <option value="" disabled selected>Select Fuel Type</option>
                            {fuelTypeOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div key="Powertrain" className="mb-6">
                        <label className="block text-gray-300 font-semibold mb-2">Powertrain</label>
                        <select
                            className="w-full h-12 px-4 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                            value={powertrain}
                            onChange={(e) => setPowertrain(e.target.value)}
                            required
                        >
                            <option value="" disabled selected>Select Powertrain</option>
                            {powertrainOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>


                    {[
                        { label: "Engine Capacity (cc)", value: engineCapacity, setter: setEngineCapacity, type: "number", placeholder: "Enter engine capacity" },
                        { label: "Engine Power (PS)", value: enginePowerPS, setter: setEnginePowerPS, type: "number", placeholder: "Enter engine power" }
                    ].map(({ label, value, setter, type, placeholder }) => (
                        <div key={label} className="mb-6">
                            <label className="block text-gray-300 font-semibold mb-2">{label}</label>
                            <input className="w-full h-12 px-4 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                                type={type} value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder} required />
                        </div>
                    ))}

                    <button type="submit" className="w-full h-12 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-400 focus:ring-2 focus:ring-green-500 transition-all">
                        Predict CO2 Emission
                    </button>
                </form>

                {result && <p className="text-center text-gray-300 mt-6">{result}</p>}
            </div>
        </div>
    );
};

export default CO2Prediction;