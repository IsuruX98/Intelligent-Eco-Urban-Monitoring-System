import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet'; // Import L for Leaflet classes
import Chart from 'react-apexcharts';

// Fix for Leaflet default icon issues with Webpack/CRA
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


const NoiseGuardHome = () => {
    const [mapCenter, setMapCenter] = useState([6.915466876047198, 79.97422098528577]);
    const [mapZoom, setMapZoom] = useState(17); // Changed from 15 to 17 for ~500m range
    const [selectedDetector, setSelectedDetector] = useState(null);
    const [detectorPosition, setDetectorPosition] = useState({
        latitude: 6.915466876047198,
        longitude: 79.97422098528577
    });

    // --- State for Audio Recording ---
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const streamRef = useRef(null); // To store the media stream for cleanup
    const [liveAnalysisStatus, setLiveAnalysisStatus] = useState("Idle"); // New status for UI feedback

    // --- NEW: Web Audio API specific refs ---
    const audioContextRef = useRef(null); // To hold the AudioContext instance
    const isRecordingRef = useRef(false); // NEW: Ref to control the async sending loop

    // --- Chart Data State (Unchanged) ---
    const [chartData, setChartData] = useState({
        options: {
            chart: {
                id: 'sound-classification-chart',
                foreColor: '#fff',
                toolbar: {
                    show: false,
                },
            },
            theme: {
                mode: 'dark',
            },
            xaxis: {
                categories: [],
                labels: {
                    style: {
                        colors: '#fff',
                    },
                },
            },
            yaxis: {
                title: {
                    text: 'Detection Confidence (%)',
                    style: {
                        color: '#fff',
                        fontSize: '14px',
                    },
                },
                labels: {
                    style: {
                        colors: '#fff',
                    },
                    formatter: function (value) {
                        return Math.round(value) + '%';  // Round to whole number
                    }
                },
                min: 0,
                max: 100,
                tickAmount: 5,  // Show 5 ticks (0, 25, 50, 75, 100)
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    columnWidth: '70%',
                    endingShape: 'rounded',
                    distributed: true, // Enable distributed colors
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
                theme: 'dark',
                y: {
                    formatter: function (value) {
                        return Math.round(value) + '% confidence';  // Round to whole number
                    }
                }
            },
        },
        series: [
            {
                name: 'Detection Confidence',
                data: [],
            },
        ],
    });

    const [selectedSounds, setSelectedSounds] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isAlertActive, setIsAlertActive] = useState(false);
    const [detectedAlertSounds, setDetectedAlertSounds] = useState([]);

    // Add new state for email alerts at the top with other state declarations
    const [selectedEmails, setSelectedEmails] = useState([]);
    const [emailInput, setEmailInput] = useState('');
    const [emailError, setEmailError] = useState('');

    // Function to calculate new position within 5-10 meters
    const calculateNewPosition = (lat, lng) => {
        // Convert meters to degrees (approximately)
        // 1 degree of latitude ≈ 111,320 meters
        // 1 degree of longitude ≈ 111,320 * cos(latitude) meters
        const metersToLat = 1 / 111320;
        const metersToLng = 1 / (111320 * Math.cos(lat * Math.PI / 180));
        
        // Random distance between 5 and 10 meters
        const distance = Math.random() * 5 + 5;
        // Random angle in radians
        const angle = Math.random() * 2 * Math.PI;
        
        // Calculate new position
        const newLat = lat + (distance * metersToLat * Math.cos(angle));
        const newLng = lng + (distance * metersToLng * Math.sin(angle));
        
        return { latitude: newLat, longitude: newLng };
    };

    // Effect to move marker every 40 seconds
    useEffect(() => {
        if (selectedDetector) {
            const interval = setInterval(() => {
                setDetectorPosition(prev => {
                    const newPos = calculateNewPosition(prev.latitude, prev.longitude);
                    console.log('Moving detector to new position:', newPos);
                    return newPos;
                });
            }, 40000); // 40 seconds

            return () => clearInterval(interval);
        }
    }, [selectedDetector]);

    // Single noise detector data
    const noiseDetector = {
        id: 1,
        name: "NoiseGuard Detector",
        noiseLevel: 0,
        classification: {
            "clapping": 0.0, "clock_alarm": 0.0, "crackling_fire": 0.0,
        },
        trend: "Stable",
    };

    // Helper function to write a string into a DataView
    const writeString = (view, offset, string) => {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    };

    // Helper function to convert Float32Array to Int16 PCM data
    const floatTo16BitPCM = (output, offset, input) => {
        for (let i = 0; i < input.length; i++, offset += 2) {
            let s = Math.max(-1, Math.min(1, input[i]));
            output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    };

    // Add WAV encoder helper functions
    const encodeWAV = (samples, sampleRate = 16000) => {
        const buffer = new ArrayBuffer(44 + samples.length * 2);
        const view = new DataView(buffer);

        // RIFF identifier
        writeString(view, 0, 'RIFF');
        // file length minus RIFF identifier length and file description length
        view.setUint32(4, 36 + samples.length * 2, true);
        // RIFF type
        writeString(view, 8, 'WAVE');
        // format chunk identifier
        writeString(view, 12, 'fmt ');
        // format chunk length
        view.setUint32(16, 16, true);
        // sample format (raw)
        view.setUint16(20, 1, true);
        // channel count
        view.setUint16(22, 1, true);
        // sample rate
        view.setUint32(24, sampleRate, true);
        // byte rate (sample rate * block align)
        view.setUint32(28, sampleRate * 2, true);
        // block align (channel count * bytes per sample)
        view.setUint16(32, 2, true);
        // bits per sample
        view.setUint16(34, 16, true);
        // data chunk identifier
        writeString(view, 36, 'data');
        // data chunk length
        view.setUint32(40, samples.length * 2, true);
        // write the PCM samples
        floatTo16BitPCM(view, 44, samples);

        return new Blob([view], { type: 'audio/wav' });
    };

    // --- NEW: Function to send audio chunk to backend (returns a Promise) ---
    const sendAudioChunkToBackend = async () => {
        console.log("sendAudioChunkToBackend: Attempting to send chunk. Chunks in ref:", audioChunksRef.current.length);

        // IMPORTANT: Make a local copy of chunks and then clear the ref
        const chunksToSend = [...audioChunksRef.current];
        audioChunksRef.current = []; // Clear the ref immediately after copying

        if (chunksToSend.length === 0) {
            console.warn("sendAudioChunkToBackend: No audio chunks to send in this interval. Skipping.");
            setLiveAnalysisStatus("Waiting for more audio data...");
            return Promise.resolve(); // Resolve immediately if no chunks to send
        }

        setLiveAnalysisStatus("Preparing WAV audio for backend...");
        const wavBlob = encodeWAV(chunksToSend.map(chunk => chunk.getChannelData(0)));
        console.log(`Created WAV blob. Size: ${wavBlob.size} bytes, Type: ${wavBlob.type}`);

        const formData = new FormData();
        formData.append('file', wavBlob, `audio_chunk_${Date.now()}.wav`);

        setLiveAnalysisStatus("Sending WAV to backend...");
        console.log("Sending fetch request to backend...");

        try {
            const response = await fetch('http://localhost:5000/audio', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Backend response for chunk:', result);

                const newClassification = {};
                result.forEach(item => {
                    newClassification[item.class] = item.score;
                });

                // Update the selectedDetector's classification and a simulated noise level
                setSelectedDetector(prev => {
                    if (prev) {
                        return {
                            ...prev,
                            classification: newClassification,
                            noiseLevel: Math.floor(Math.random() * (90 - 40 + 1)) + 40, // Simulate noise level 40-90 dB
                            trend: Math.random() > 0.5 ? "Increasing" : "Decreasing" // Simulate trend
                        };
                    }
                    return null;
                });
                processNewAudioData(newClassification); // Update the chart with the new data
                setLiveAnalysisStatus("Analysis updated.");
                return; // Resolve the promise on successful completion
            } else {
                const errorText = await response.text();
                console.error('Error from backend for chunk:', response.status, errorText);
                setLiveAnalysisStatus("Error from backend.");
                throw new Error(`Backend error: ${response.status} - ${errorText}`); // Reject with an error
            }
        } catch (error) {
            console.error('Error in audio processing or sending:', error);
            setLiveAnalysisStatus(`Audio processing error: ${error.message}`);
            throw error; // Reject if any processing error occurs
        }
    };

    // --- NEW: Sequential processing loop ---
    const processAudioChunksSequentially = async () => {
        console.log("processAudioChunksSequentially: Checking if recording is active. isRecordingRef.current:", isRecordingRef.current);
        // Stop if recording is no longer active
        if (!isRecordingRef.current) {
            console.log("Stopping sequential chunk processing.");
            setLiveAnalysisStatus("Live analysis gracefully stopped.");
            return;
        }

        const sendIntervalDuration = 3000; // Desired interval between *start* of sends
        const startTime = Date.now();

        try {
            // Wait for the current chunk to be processed and sent
            await sendAudioChunkToBackend();

            // Calculate time taken for this chunk and adjust next send
            const timeTaken = Date.now() - startTime;
            // Ensure there's always a positive delay
            const delayForNextSend = Math.max(0, sendIntervalDuration - timeTaken);

            console.log(`processAudioChunksSequentially: Chunk processed in ${timeTaken}ms. Next send scheduled in ${delayForNextSend}ms.`);

            // Schedule the next send
            setTimeout(processAudioChunksSequentially, delayForNextSend);

        } catch (error) {
            console.error("Error during sequential audio chunk processing:", error);
            setLiveAnalysisStatus(`Analysis interrupted due to error: ${error.message}`);
            stopRecording(); // Stop recording on error
        }
    };


    // MODIFIED: Function to start audio recording
    const startRecording = async () => {
        if (isRecording) {
            console.log("startRecording: Already recording, skipping.");
            return;
        }
        console.log("startRecording: Initiating recording process.");

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    sampleSize: 16
                } 
            });
            streamRef.current = stream;
            console.log("Microphone access granted.");

            // Create AudioContext for processing
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);
            
            audioContextRef.current = audioContext;
            const audioChunks = [];

            processor.onaudioprocess = (e) => {
                if (!isRecordingRef.current) return;
                const inputData = e.inputBuffer.getChannelData(0);
                audioChunks.push(new Float32Array(inputData));
            };

            source.connect(processor);
            processor.connect(audioContext.destination);

            setIsRecording(true);
            isRecordingRef.current = true;
            setLiveAnalysisStatus("Recording and analyzing live audio...");

            // Start the processing loop
            const processInterval = setInterval(async () => {
                if (!isRecordingRef.current) {
                    clearInterval(processInterval);
                    return;
                }

                if (audioChunks.length > 0) {
                    // Concatenate all chunks
                    const concatenated = new Float32Array(audioChunks.reduce((acc, chunk) => acc + chunk.length, 0));
                    let offset = 0;
                    for (const chunk of audioChunks) {
                        concatenated.set(chunk, offset);
                        offset += chunk.length;
                    }
                    audioChunks.length = 0; // Clear the chunks

                    // Convert to WAV and send
                    const wavBlob = encodeWAV(concatenated);
                    await sendAudioToBackend(wavBlob);
                }
            }, 1000); // Process every second

            console.log("Recording started with WAV format.");

        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please ensure you have granted permission.');
            setIsRecording(false);
            isRecordingRef.current = false;
            setLiveAnalysisStatus("Microphone access denied or error.");
        }
    };

    const stopRecording = () => {
        if (isRecording) {
            console.log("stopRecording: Stopping recording process.");
            setIsRecording(false);
            isRecordingRef.current = false;

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
                console.log("Media stream tracks stopped.");
            }

            if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
                console.log("AudioContext closed.");
            }

            console.log("Live audio analysis stopped.");
            setLiveAnalysisStatus("Live analysis stopped.");
        } else {
            console.log("stopRecording: Not recording, nothing to stop.");
        }
    };

    const sendAudioToBackend = async (wavBlob) => {
        console.log(`Sending WAV audio to backend. Size: ${wavBlob.size} bytes, Type: ${wavBlob.type}`);
        
        const formData = new FormData();
        formData.append('file', wavBlob, `audio_chunk_${Date.now()}.wav`);

        try {
            const response = await fetch('http://localhost:5000/audio', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();
                console.log('Backend response:', result);
                console.log('Current selected sounds:', selectedSounds); // Debug log

                const newClassification = {};
                let noiseLevel = 0;
                
                // Process the results
                result.forEach(item => {
                    if (item.class === 'noise_level') {
                        noiseLevel = item.score;
                    } else {
                        newClassification[item.class] = item.score;
                    }
                });

                // Determine trend based on previous noise level
                const prevNoiseLevel = selectedDetector?.noiseLevel || 0;
                const trend = noiseLevel > prevNoiseLevel ? "Increasing" :
                            noiseLevel < prevNoiseLevel ? "Decreasing" :
                            "Stable";

                // Update selectedDetector with new data
                setSelectedDetector(prev => {
                    if (prev) {
                        return {
                            ...prev,
                            classification: newClassification,
                            noiseLevel: noiseLevel,
                            trend: trend
                        };
                    }
                    return null;
                });

                // Process new classification data and update chart
                processNewAudioData(newClassification);
                setLiveAnalysisStatus("Analysis updated.");
            } else {
                const errorText = await response.text();
                console.error('Error from backend:', response.status, errorText);
                setLiveAnalysisStatus("Error from backend.");
                throw new Error(`Backend error: ${response.status} - ${errorText}`);
            }
        } catch (error) {
            console.error('Error sending audio to backend:', error);
            setLiveAnalysisStatus(`Error: ${error.message}`);
            throw error;
        }
    };

    // Add email validation function
    const validateEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    // Add function to handle email addition
    const addEmailAlert = (e) => {
        e.preventDefault();
        const email = emailInput.trim();
        
        // Validate email
        if (!validateEmail(email)) {
            setEmailError('Please enter a valid email address');
            return;
        }

        // Check if email is already in the list
        if (selectedEmails.includes(email)) {
            setEmailError('This email is already added');
            return;
        }

        // Add email to the list
        const newEmails = [...selectedEmails, email];
        setSelectedEmails(newEmails);
        setEmailInput('');
        setEmailError('');
        console.log('Added email alert:', email);
    };

    // Add function to remove email
    const removeEmailAlert = (emailToRemove) => {
        const newEmails = selectedEmails.filter(email => email !== emailToRemove);
        setSelectedEmails(newEmails);
        console.log('Removed email alert:', emailToRemove);
    };

    // Modified function to process audio data and update chart
    const processNewAudioData = (classification, currentAlertTags = selectedSounds) => {
        console.log('Processing new audio data with alert tags:', currentAlertTags);
        
        // Get top 5 classifications for display
        const sortedClasses = Object.entries(classification)
            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
            .slice(0, 5);

        const categories = sortedClasses.map(([className]) => className);
        const data = sortedClasses.map(([, score]) => (score * 100));

        // Helper function to check if a classification matches any alert tag
        const matchesAlertTag = (className) => {
            return currentAlertTags.some(alertTag => {
                const classNameLower = className.toLowerCase();
                const alertTagLower = alertTag.toLowerCase();
                // Check for exact match or if either contains the other
                return classNameLower === alertTagLower || 
                       classNameLower.includes(alertTagLower) || 
                       alertTagLower.includes(classNameLower);
            });
        };

        // Check each category against alert tags
        const newlyDetectedAlertSounds = [];
        const colors = categories.map(className => {
            const isAlertSound = matchesAlertTag(className);
            if (isAlertSound) {
                console.log(`Alert tag match found: "${className}" matches one of our alert tags`);
                newlyDetectedAlertSounds.push(className);
            }
            return isAlertSound ? '#ef4444' : '#10b981';
        });

        // Update alert status
        const foundAlertSounds = newlyDetectedAlertSounds.length > 0;
        console.log('Current alert tags:', currentAlertTags);
        console.log('Alert-triggering classifications:', newlyDetectedAlertSounds);
        console.log('Alert status:', foundAlertSounds ? 'ACTIVE' : 'INACTIVE');

        // Always update alert state if we have alert tags and matches
        if (currentAlertTags.length > 0 && foundAlertSounds) {
            console.log('Setting alert ACTIVE - found matches for alert tags');
            setIsAlertActive(true);
            setDetectedAlertSounds(newlyDetectedAlertSounds);
        } else if (currentAlertTags.length === 0) {
            console.log('Setting alert INACTIVE - no alert tags set');
            setIsAlertActive(false);
            setDetectedAlertSounds([]);
        } else if (!foundAlertSounds) {
            console.log('Setting alert INACTIVE - no matches found for current alert tags');
            setIsAlertActive(false);
            setDetectedAlertSounds([]);
        }

        // Update chart with new data and colors
        setChartData(prevChartData => {
            // Keep track of previous categories that were colored red
            const prevCategories = prevChartData.options.xaxis.categories;
            const prevColors = prevChartData.options.colors || [];
            
            // Create a map of previous red categories
            const prevRedCategories = new Map();
            prevCategories.forEach((cat, index) => {
                if (prevColors[index] === '#ef4444') {
                    prevRedCategories.set(cat.toLowerCase(), true);
                }
            });

            // Update colors, maintaining red for categories that were previously red
            const updatedColors = categories.map((className, index) => {
                const wasRed = prevRedCategories.has(className.toLowerCase());
                const isAlertSound = matchesAlertTag(className);
                return (wasRed || isAlertSound) ? '#ef4444' : '#10b981';
            });

            return {
                ...prevChartData,
                options: {
                    ...prevChartData.options,
                    xaxis: {
                        ...prevChartData.options.xaxis,
                        categories: categories,
                    },
                    colors: updatedColors,
                },
                series: [
                    {
                        name: 'Detection Confidence',
                        data: data,
                    },
                ],
            };
        });

        // After updating alert status, send email if needed
        if (foundAlertSounds && selectedEmails.length > 0) {
            // Send email alert
            fetch('http://localhost:5000/send-alert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    emails: selectedEmails,
                    detectedSounds: newlyDetectedAlertSounds,
                    location: selectedDetector ? {
                        latitude: selectedDetector.latitude,
                        longitude: selectedDetector.longitude
                    } : null,
                    timestamp: new Date().toISOString()
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log('Email alert sent:', data);
            })
            .catch(error => {
                console.error('Error sending email alert:', error);
            });
        }
    };

    // Function to add a new sound tag
    const addSoundTag = (e) => {
        e.preventDefault();
        const sound = inputValue.trim();
        if (sound) {
            // Check if the sound is not already in the list
            if (!selectedSounds.includes(sound)) {
                const newSounds = [...selectedSounds, sound];
                setSelectedSounds(newSounds); // State update is scheduled
                console.log('Added alert sound:', sound, 'New list:', newSounds);
                
                // Re-process with the new list of sounds and current classification
                if (selectedDetector && selectedDetector.classification) {
                    processNewAudioData(selectedDetector.classification, newSounds); // Pass newSounds directly
                }
            }
            setInputValue(''); // Clear input after adding
        }
    };

    // Function to remove a sound tag
    const removeSoundTag = (soundToRemove) => {
        const newSounds = selectedSounds.filter(sound => sound !== soundToRemove);
        setSelectedSounds(newSounds); // State update is scheduled
        console.log('Removed alert sound:', soundToRemove, 'New list:', newSounds);
        
        // Re-process with the new list of sounds and current classification
        if (selectedDetector && selectedDetector.classification) {
            processNewAudioData(selectedDetector.classification, newSounds); // Pass newSounds directly
        }
    };

    // Update handleMarkerClick to use processNewAudioData
    const handleMarkerClick = () => {
        console.log("handleMarkerClick: Detector selected");
        setSelectedDetector({
            ...noiseDetector,
            latitude: detectorPosition.latitude,
            longitude: detectorPosition.longitude
        });
        processNewAudioData(noiseDetector.classification); // No need to pass currentAlertTags here
        startRecording();
    };

    // Add a helper function to determine noise level status
    const getNoiseLevelStatus = (level) => {
        if (level >= 85) return { color: 'text-red-500', status: 'Dangerous' };
        if (level >= 70) return { color: 'text-red-400', status: 'Unsafe' };
        if (level >= 55) return { color: 'text-yellow-500', status: 'Moderate' };
        return { color: 'text-green-500', status: 'Safe' };
    };

    // useEffect for cleaning up audio recording and AudioContext when component unmounts
    useEffect(() => {
        return () => {
            console.log("Component unmounting. Calling stopRecording.");
            stopRecording(); // This now also cleans up AudioContext
        };
    }, []);

    return (
        <div className={`min-h-screen text-white py-12 px-12 md:px-8 lg:px-16 xl:px-32 relative transition-colors duration-500 ${
            isAlertActive ? 'bg-red-900' : 'bg-gray-900'
        }`}>
            <h1 className="text-4xl text-green-400 font-bold mb-8">
                NoiseGuard AI
            </h1>
            <div className="mb-8">
                <p className="text-lg text-gray-300 mb-4">
                    NoiseGuard AI leverages deep learning techniques to analyze environmental audio, classify sounds, and provide real-time insights into urban noise pollution. This system helps urban planners monitor and mitigate noise, contributing to healthier and more sustainable cities.
                </p>
                <p className="text-lg text-gray-300">
                    By utilizing live audio feeds and advanced classification models, NoiseGuard AI identifies dominant sound events, helping address challenges related to urban noise levels, public health, and environmental well-being.
                </p>
            </div>

            <div className="mb-12">
                <h2 className="text-2xl text-green-400 font-semibold mb-4">How to Use</h2>
                <ol className="list-decimal pl-6 text-gray-300">
                    <li>Observe the map to see predefined Noise Detector locations.</li>
                    <li>Click on a <span className="text-blue-400 font-semibold">"Detector Marker"</span> on the map.</li>
                    <li>The system will then automatically start analyzing live audio from your laptop's microphone.</li>
                    <li>View real-time noise levels and sound classifications in the "Detector Details" section below.</li>
                    <li>Navigate away from this page or refresh to stop the live analysis.</li>
                </ol>
            </div>
            <div className="mb-8">
                <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: "600px", width: "100%" }}
                    maxZoom={19} // Add max zoom to prevent zooming in too far
                    minZoom={15} // Add min zoom to prevent zooming out too far
                >
                    <TileLayer
                        attribution="Google Maps Satellite"
                        url="https://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}"
                    />
                    {/* Single noise detector marker */}
                    <Marker
                        position={[detectorPosition.latitude, detectorPosition.longitude]}
                        eventHandlers={{
                            click: handleMarkerClick,
                        }}
                    >
                        <Popup>
                            <div>
                                <h3 className="font-bold">{noiseDetector.name}</h3>
                                <p>Click to start live analysis for this location.</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Position updates every 40 seconds
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Viewing range: ~500m
                                </p>
                            </div>
                        </Popup>
                    </Marker>
                </MapContainer>
            </div>

            {/* Live Analysis Status */}
            <div className="mb-8 p-4 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                <h2 className="text-xl font-bold text-green-400 mb-2">Live Analysis Status:</h2>
                <p className={`text-lg ${isRecording ? 'text-green-500' : 'text-red-500'}`}>
                    {liveAnalysisStatus}
                </p>
                {isRecording && (
                    <button onClick={stopRecording} className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition duration-300 ease-in-out">
                        Stop Live Analysis
                    </button>
                )}
            </div>

            {/* Display selected noise detector details */}
            {selectedDetector && (
                <div className="mt-8 p-6 bg-gray-800 rounded-lg shadow-lg border border-gray-700">
                    <h2 className="text-2xl font-bold text-green-400 mb-4">
                        {selectedDetector.name} - Live Data
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
                            {(() => {
                                const { color, status } = getNoiseLevelStatus(selectedDetector.noiseLevel);
                                return (
                                    <div>
                                        <p className={`text-lg ${color} font-bold`}>
                                            {selectedDetector.noiseLevel.toFixed(1)} dB
                                        </p>
                                        <p className={`text-sm ${color}`}>
                                            Status: {status}
                                        </p>
                                        <div className="mt-2 w-full bg-gray-600 rounded-full h-2.5">
                                            <div 
                                                className={`h-2.5 rounded-full ${
                                                    selectedDetector.noiseLevel >= 85 ? 'bg-red-500' :
                                                    selectedDetector.noiseLevel >= 70 ? 'bg-red-400' :
                                                    selectedDetector.noiseLevel >= 55 ? 'bg-yellow-500' :
                                                    'bg-green-500'
                                                }`}
                                                style={{ 
                                                    width: `${Math.min(100, (selectedDetector.noiseLevel / 100) * 100)}%` 
                                                }}
                                            ></div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {selectedDetector.noiseLevel >= 85 ? '⚠️ Prolonged exposure may cause hearing damage' :
                                             selectedDetector.noiseLevel >= 70 ? '⚠️ Extended exposure may be harmful' :
                                             selectedDetector.noiseLevel >= 55 ? 'ℹ️ Moderate noise level' :
                                             '✓ Safe noise level'}
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                        {/* Trend */}
                        <div className="bg-gray-700 p-4 rounded-lg">
                            <p className="text-sm text-gray-300 font-semibold">Trend</p>
                            <p className={`text-lg ${
                                selectedDetector.trend === "Increasing" ? 'text-red-400' :
                                selectedDetector.trend === "Decreasing" ? 'text-green-400' :
                                'text-yellow-400'
                            }`}>
                                {selectedDetector.trend}
                            </p>
                        </div>
                    </div>
                    {/* Chart */}
                    <div className="mt-6">
                        <h3 className="text-xl font-bold text-green-400 mb-4">Live Sound Classification</h3>
                        {chartData.series[0].data.length > 0 ? (
                            <Chart
                                options={chartData.options}
                                series={chartData.series}
                                type="bar"
                                height={350}
                            />
                        ) : (
                            <p className="text-gray-400">Waiting for live audio classifications...</p>
                        )}
                    </div>

                    {/* Sound Tag Input System */}
                    <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                        <h4 className="text-lg font-semibold text-green-400 mb-3">Alert Sounds</h4>
                        <form onSubmit={addSoundTag} className="mb-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Add sound to monitor (e.g., Music, Siren, Dog)"
                                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                        </form>
                        
                        {/* Display current tags */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedSounds.map((sound) => (
                                <div
                                    key={sound}
                                    className="flex items-center gap-2 px-3 py-1 bg-gray-600 rounded-full"
                                >
                                    <span className="text-white">{sound}</span>
                                    <button
                                        onClick={() => removeSoundTag(sound)}
                                        className="text-gray-300 hover:text-white"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {/* Alert Status */}
                        {isAlertActive && (
                            <div className="mt-3 p-2 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
                                <p className="text-red-400">
                                    ⚠️ Alert: Detected sounds are being monitored!
                                </p>
                                <p className="text-sm text-red-300 mt-1">
                                    Detected sounds: {detectedAlertSounds.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Email Alert System */}
                    <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                        <h4 className="text-lg font-semibold text-green-400 mb-3">Email Alerts</h4>
                        <form onSubmit={addEmailAlert} className="mb-3">
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    value={emailInput}
                                    onChange={(e) => {
                                        setEmailInput(e.target.value);
                                        setEmailError('');
                                    }}
                                    placeholder="Add email for alerts (e.g., user@example.com)"
                                    className={`flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                                        emailError ? 'border-2 border-red-500' : ''
                                    }`}
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {emailError && (
                                <p className="text-red-400 text-sm mt-1">{emailError}</p>
                            )}
                        </form>
                        
                        {/* Display current email alerts */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {selectedEmails.map((email) => (
                                <div
                                    key={email}
                                    className="flex items-center gap-2 px-3 py-1 bg-gray-600 rounded-full"
                                >
                                    <span className="text-white">{email}</span>
                                    <button
                                        onClick={() => removeEmailAlert(email)}
                                        className="text-gray-300 hover:text-white"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        
                        {/* Email alert status */}
                        {selectedEmails.length > 0 && (
                            <div className="mt-3 p-2 bg-blue-500 bg-opacity-20 border border-blue-500 rounded-lg">
                                <p className="text-blue-400">
                                    ✓ Email alerts enabled for {selectedEmails.length} address{selectedEmails.length > 1 ? 'es' : ''}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoiseGuardHome;