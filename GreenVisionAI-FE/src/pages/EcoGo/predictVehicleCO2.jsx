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
            const response = await fetch('http://127.0.0.1:5000/api/co2/predict', {
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
                    {[
                        { label: "Vehicle Type", value: vehicleType, setter: setVehicleType, options: ["Manual", "Automatic"] },
                        { label: "Transmission", value: transmission, setter: setTransmission, options: ["CVT", "M5", "SA5"] },
                        { label: "Fuel Type", value: fuelType, setter: setFuelType, options: ["Petrol", "Diesel", "Electric / Petrol"] },
                        { label: "Powertrain", value: powertrain, setter: setPowertrain, options: ["Internal Combustion Engine (ICE)", "Mild Hybrid Electric Vehicle (MHEV)"] }
                    ].map(({ label, value, setter, options }) => (
                        <div key={label} className="mb-6">
                            <label className="block text-gray-300 font-semibold mb-2">{label}</label>
                            <select className="w-full h-12 px-4 border border-gray-600 rounded-lg bg-gray-700 text-white focus:ring-2 focus:ring-green-500 focus:outline-none"
                                value={value} onChange={(e) => setter(e.target.value)} required>
                                <option value="" disabled>Select {label}</option>
                                {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    ))}

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