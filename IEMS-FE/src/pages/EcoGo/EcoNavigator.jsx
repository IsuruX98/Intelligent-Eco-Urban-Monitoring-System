import React, { useState, useEffect, useRef, useCallback } from 'react';

const EcoNavigator = () => {
    const API_KEY = "YyYYbIZafaab29qAJAfhNflQg7PznEN1SQe6YXIC7Eo"; // Replace with your HERE API Key
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const scriptsLoadedRef = useRef(false);

    const [startLocation, setStartLocation] = useState("Colombo, Sri Lanka");
    const [endLocation, setEndLocation] = useState("Galle, Sri Lanka");
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [routeInfo, setRouteInfo] = useState("Click on the map to mark traffic incidents.");
    const [ecoPoints, setEcoPoints] = useState(0);
    const [co2SavedTrip, setCo2SavedTrip] = useState(0);
    const [communityCO2, setCommunityCO2] = useState(0);
    const [showDriveButton, setShowDriveButton] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);

    // References for map objects and state
    const currentMarkerRef = useRef(null);
    const routeCoordinatesRef = useRef([]);
    const startCoordsRef = useRef(null);
    const endCoordsRef = useRef(null);
    const watchIdRef = useRef(null);
    const trafficMarkersRef = useRef([]);
    const currentRouteRef = useRef(null);
    const originalRouteDataRef = useRef(null);
    const trafficMarksRef = useRef([]);
    const trafficMarkCountsRef = useRef({}); // Use a ref to track traffic mark counts

    // Traffic management states
    const [trafficMarkCounts, setTrafficMarkCounts] = useState({});

    // Fetch user's vehicles
    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        if (userId) {
            fetch(`http://127.0.0.1:5001/api/vehicles/vehicles/user/${userId}`)
                .then(response => response.json())
                .then(data => {
                    setVehicles(data);
                    if (data.length > 0) {
                        setSelectedVehicle(data[0]);
                    }
                })
                .catch(error => console.error('Error fetching vehicles:', error));
        }
    }, []);

    // Load HERE Maps scripts
    useEffect(() => {
        if (scriptsLoadedRef.current) return;

        const loadScripts = async () => {
            const scripts = [
                'https://js.api.here.com/v3/3.1/mapsjs-core.js',
                'https://js.api.here.com/v3/3.1/mapsjs-service.js',
                'https://js.api.here.com/v3/3.1/mapsjs-ui.js',
                'https://js.api.here.com/v3/3.1/mapsjs-mapevents.js'
            ];

            const loadScript = (url) => {
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.src = url;
                    script.async = true;
                    script.defer = true;
                    script.onload = resolve;
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            };

            try {
                for (const scriptUrl of scripts) {
                    await loadScript(scriptUrl);
                }

                // Load CSS for UI
                if (!document.querySelector('link[href*="mapsjs-ui.css"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.type = 'text/css';
                    link.href = 'https://js.api.here.com/v3/3.1/mapsjs-ui.css';
                    document.head.appendChild(link);
                }

                scriptsLoadedRef.current = true;
                setTimeout(() => setIsMapReady(true), 500); // Give time for scripts to initialize
            } catch (error) {
                console.error('Error loading HERE Maps scripts:', error);
            }
        };

        loadScripts();
    }, []);

    // Initialize map after scripts are loaded and component is mounted
    useEffect(() => {
        if (!isMapReady || !mapRef.current || mapInstanceRef.current) return;

        try {
            const platform = new window.H.service.Platform({
                apikey: API_KEY
            });

            const defaultLayers = platform.createDefaultLayers();
            const map = new window.H.Map(
                mapRef.current,
                defaultLayers.vector.normal.map,
                {
                    zoom: 10,
                    center: { lat: 6.92708, lng: 79.86124 }, // Colombo
                    pixelRatio: window.devicePixelRatio || 1
                }
            );

            // Make the map responsive
            window.addEventListener('resize', () => map.getViewPort().resize());

            const ui = window.H.ui.UI.createDefault(map, defaultLayers);
            const mapEvents = new window.H.mapevents.MapEvents(map);
            const behavior = new window.H.mapevents.Behavior(mapEvents);

            // Store map instance in ref
            mapInstanceRef.current = map;

            // Add tap event for traffic marking
            map.addEventListener('tap', handleMapTap);

            // Mark current location
            markCurrentLocation();

            // Clean up on unmount
            return () => {
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.dispose();
                }
                window.removeEventListener('resize', () => map.getViewPort().resize());
            };
        } catch (error) {
            console.error('Error initializing map:', error);
        }
    }, [isMapReady]);

    // Memoize geocodeLocation to prevent unnecessary re-renders
    const geocodeLocation = useCallback(async (location) => {
        const url = `https://geocode.search.hereapi.com/v1/geocode?apikey=${API_KEY}&q=${encodeURIComponent(location)}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                return data.items[0].position;
            } else {
                throw new Error(`No results found for "${location}"`);
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            throw error;
        }
    }, [API_KEY]);  // API_KEY as dependency

    // Calculate route - Debounced version

    const calculateRoute = useCallback(async (trafficCluster = null, ecoMode = false) => {
        if (!startLocation || !endLocation) {
            alert("Please enter both starting location and destination.");
            return;
        }

        try {
            const startCoords = await geocodeLocation(startLocation);
            const endCoords = await geocodeLocation(endLocation);
            startCoordsRef.current = startCoords;
            endCoordsRef.current = endCoords;

            const origin = `${startCoords.lat},${startCoords.lng}`;
            const destination = `${endCoords.lat},${endCoords.lng}`;
            const routeType = ecoMode ? "shortest" : "fastest";

            let avoidParam = '';
            if (trafficCluster) {
                const south = Math.min(trafficCluster.south, trafficCluster.north).toFixed(6);
                const north = Math.max(trafficCluster.south, trafficCluster.north).toFixed(6);
                const west = Math.min(trafficCluster.west, trafficCluster.east).toFixed(6);
                const east = Math.max(trafficCluster.west, trafficCluster.east).toFixed(6);
                avoidParam = `&avoid[areas]=bbox:${south},${west},${north},${east}`;
            }

            const url = `https://router.hereapi.com/v8/routes?apikey=${API_KEY}&transportMode=car&origin=${origin}&destination=${destination}&return=polyline,summary&traffic=true&routeType=${routeType}&alternatives=2${avoidParam}`;

            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Details:", errorData);
                throw new Error(`API Error: ${errorData.title || errorData.error || "Invalid request"}`);
            }
            const data = await response.json();
            console.log("API Response:", data);

            if (data.routes && data.routes.length > 0) {
                let selectedRoute = data.routes[0];
                let routePolyline = selectedRoute.sections[0].polyline;
                let summary = selectedRoute.sections[0].summary;

                if (trafficCluster && originalRouteDataRef.current) {
                    for (let i = 0; i < data.routes.length; i++) {
                        const altPolyline = data.routes[i].sections[0].polyline;
                        if (altPolyline !== originalRouteDataRef.current.polyline && isRouteAvoidingTraffic(altPolyline, trafficCluster)) {
                            selectedRoute = data.routes[i];
                            routePolyline = altPolyline;
                            summary = selectedRoute.sections[0].summary;
                            break;
                        }
                    }
                }

                const lineString = window.H.geo.LineString.fromFlexiblePolyline(routePolyline);
                currentRouteRef.current = new window.H.map.Polyline(lineString, {
                    style: { strokeColor: ecoMode ? "green" : "blue", lineWidth: 4 }
                });

                const startMarker = new window.H.map.Marker({ lat: startCoords.lat, lng: startCoords.lng });
                const endMarker = new window.H.map.Marker({ lat: endCoords.lat, lng: endCoords.lng });

                // Clear existing route and markers
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.removeObjects(mapInstanceRef.current.getObjects()); // Clear all objects
                    mapInstanceRef.current.addObjects([currentRouteRef.current, startMarker, endMarker]);  // Add route + markers
                }

                if (currentRouteRef.current)
                    mapInstanceRef.current.getViewModel().setLookAtData({ bounds: currentRouteRef.current.getBoundingBox() });

                routeCoordinatesRef.current = lineString.getLatLngAltArray().reduce((acc, val, idx, arr) => {
                    if (idx % 3 === 0) acc.push({ lat: val, lng: arr[idx + 1] });
                    return acc;
                }, []);

                const distanceKm = (summary.length / 1000).toFixed(2);
                const durationMin = (summary.duration / 60).toFixed(0);
                const co2Emission = calculateCO2Emission(summary.length, summary.duration);
                setRouteInfo(`Distance: ${distanceKm} km | Time: ${durationMin} min | CO2: ${co2Emission.toFixed(2)} kg | Click map to mark traffic.`);
                setCo2SavedTrip(0);
                setShowDriveButton(true);

                if (!trafficCluster) {
                    originalRouteDataRef.current = { distance: summary.length, duration: summary.duration, co2: co2Emission, polyline: routePolyline };
                }
                return { distance: summary.length, duration: summary.duration, co2: co2Emission, polyline: routePolyline };
            } else {
                console.log("No routes returned by API.");
                return null;
            }
        } catch (error) {
            console.error("Error in route calculation:", error);
            alert(`Error: ${error.message}. Falling back to original route if available.`);
            return null;
        }
    }, [API_KEY, startLocation, endLocation, selectedVehicle, geocodeLocation]);

    // Check if a route avoids traffic
    const isRouteAvoidingTraffic = useCallback((polyline, cluster) => {
        const lineString = window.H.geo.LineString.fromFlexiblePolyline(polyline);
        const coords = lineString.getLatLngAltArray().reduce((acc, val, idx, arr) => {
            if (idx % 3 === 0) acc.push({ lat: val, lng: arr[idx + 1] });
            return acc;
        }, []);

        for (let coord of coords) {
            if (coord.lat >= cluster.south && coord.lat <= cluster.north &&
                coord.lng >= cluster.west && coord.lng <= cluster.east) {
                return false; // Route passes through traffic area
            }
        }
        return true; // Route avoids traffic area
    }, []);

    // Mark current location
    const markCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    if (currentMarkerRef.current && mapInstanceRef.current.getObjects().indexOf(currentMarkerRef.current) !== -1) {
                        mapInstanceRef.current.removeObject(currentMarkerRef.current);
                    }
                    currentMarkerRef.current = new window.H.map.Marker({ lat: latitude, lng: longitude }, {
                        icon: new window.H.map.Icon("https://img.icons8.com/color/48/000000/car.png", { size: { w: 24, h: 24 } })
                    });
                    mapInstanceRef.current.addObject(currentMarkerRef.current);
                    mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    alert("Unable to get your location. Please enable location services.");
                }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    // Function to add trip to DB
    const addTripToDB = async (routeSummary) => {
        try {
            const user_id = localStorage.getItem('user_id');
            if (!user_id || !selectedVehicle || !routeSummary) return;
            const tripData = {
                user_id,
                vehicle_id: selectedVehicle._id.$oid,
                startLocation,
                destination: endLocation,
                distance: Math.round(routeSummary.length / 1000), // in km
                time: Math.round(routeSummary.duration / 60), // in min
                co2: Math.round(calculateCO2Emission(routeSummary.length, routeSummary.duration) * 1000) // in g
            };
            await fetch('http://127.0.0.1:5001/api/trip/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tripData)
            });
        } catch (err) {
            console.error('Failed to add trip:', err);
        }
    };

    // Start driving
    const startDriving = () => {
        if (!startCoordsRef.current) {
            alert("Please calculate a route first.");
            return;
        }

        // Add trip to DB before starting geolocation
        if (originalRouteDataRef.current) {
            addTripToDB({
                length: originalRouteDataRef.current.distance,
                duration: originalRouteDataRef.current.duration
            });
        }

        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }

        mapInstanceRef.current.setCenter({ lat: startCoordsRef.current.lat, lng: startCoordsRef.current.lng });
        mapInstanceRef.current.setZoom(15);

        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    if (currentMarkerRef.current && mapInstanceRef.current.getObjects().indexOf(currentMarkerRef.current) !== -1) {
                        mapInstanceRef.current.removeObject(currentMarkerRef.current);
                    }
                    currentMarkerRef.current = new window.H.map.Marker({ lat: latitude, lng: longitude }, {
                        icon: new window.H.map.Icon("https://img.icons8.com/color/48/000000/car.png", { size: { w: 24, h: 24 } })
                    });
                    mapInstanceRef.current.addObject(currentMarkerRef.current);
                    mapInstanceRef.current.setCenter({ lat: latitude, lng: longitude });
                },
                (error) => {
                    console.error("Geolocation error:", error);
                    alert("Unable to track your location. Ensure location services are enabled.");
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
        }
    };

    // Handle map tap for traffic marking
    const handleMapTap = useCallback(async (evt) => {
        const map = mapInstanceRef.current;
        const coord = map.screenToGeo(evt.currentPointer.viewportX, evt.currentPointer.viewportY);

        const newMark = { lat: coord.lat, lng: coord.lng, timestamp: Date.now() };
        trafficMarksRef.current.push(newMark);

        const trafficMarker = new window.H.map.Marker(newMark, {
            icon: new window.H.map.Icon("https://img.icons8.com/color/48/traffic-jam.png", { size: { w: 24, h: 24 } })
        });
        map.addObject(trafficMarker);
        trafficMarkersRef.current.push(trafficMarker);

        setEcoPoints(prev => prev + 10);

        // Update traffic mark counts using a ref
        const key = `${newMark.lat.toFixed(6)},${newMark.lng.toFixed(6)}`;

        setTrafficMarkCounts(prevCounts => {
            const newCounts = { ...prevCounts, [key]: (prevCounts[key] || 0) + 1 };
            trafficMarkCountsRef.current = newCounts;  // Update ref to the latest state
            return newCounts;
        });

        checkTrafficClustersAndRecalculate();
    }, [setEcoPoints]);

    // Check for traffic clusters and recalculate route
    const checkTrafficClustersAndRecalculate = useCallback(async () => {
        const CLUSTER_RADIUS = 0.005; // ~500m
        let clusters = [];

        trafficMarksRef.current.forEach((mark, index) => {
            let cluster = [mark];
            for (let i = 0; i < trafficMarksRef.current.length; i++) {
                if (i !== index && (Date.now() - trafficMarksRef.current[i].timestamp) < 3600000) {
                    const distance = getDistance(mark, trafficMarksRef.current[i]);
                    if (distance <= CLUSTER_RADIUS) {
                        cluster.push(trafficMarksRef.current[i]);
                    }
                }
            }
            if (cluster.length >= 3) {
                clusters.push(cluster);
            }
        });

        if (clusters.length > 0) {
            const trafficCluster = clusters[0]; // Use first cluster
            const lats = trafficCluster.map(m => m.lat);
            const lngs = trafficCluster.map(m => m.lng);
            const cluster = {
                south: Math.min(...lats) - 0.002,
                north: Math.max(...lats) + 0.002,
                west: Math.min(...lngs) - 0.002,
                east: Math.max(...lngs) + 0.002
            };

            clusters.forEach(cluster => {
                cluster.forEach(mark => {
                    const markerIndex = trafficMarksRef.current.findIndex(m => m.lat === mark.lat && m.lng === mark.lng);
                    if (markerIndex !== -1) {
                        const marker = trafficMarkersRef.current[markerIndex];
                        if (mapInstanceRef.current.getObjects().indexOf(marker) !== -1) {
                            mapInstanceRef.current.removeObject(marker);
                        }
                        trafficMarksRef.current.splice(markerIndex, 1);
                        trafficMarkersRef.current.splice(markerIndex, 1);
                    }
                });

                const avgLat = cluster.reduce((sum, m) => sum + m.lat, 0) / cluster.length;
                const avgLng = cluster.reduce((sum, m) => sum + m.lng, 0) / cluster.length;
                const trafficWarning = new window.H.map.Marker({ lat: avgLat, lng: avgLng }, {
                    icon: new window.H.map.Icon("https://img.icons8.com/color/48/traffic-light.png", { size: { w: 32, h: 32 } })
                });
                mapInstanceRef.current.addObject(trafficWarning);
                trafficMarkersRef.current.push(trafficWarning);
                trafficMarksRef.current.push({ lat: avgLat, lng: avgLng, timestamp: Date.now() });
            });

            // Find alternative route
            let shouldRecalculateRoute = false;

            for (const key in trafficMarkCountsRef.current) {
                if (trafficMarkCountsRef.current[key] >= 3) {
                    shouldRecalculateRoute = true;
                    break;
                }
            }

            const originalRoute = originalRouteDataRef.current || await calculateRoute();
            if (originalRoute && shouldRecalculateRoute) {
                const adjustedRoute = await calculateRoute(cluster, true);
                if (adjustedRoute && adjustedRoute.polyline !== originalRoute.polyline) {
                    const co2Saved = originalRoute.co2 - adjustedRoute.co2;
                    setRouteInfo(prev => `${prev}<br>CO2 Saved: ${co2Saved.toFixed(2)} kg by avoiding traffic!`);
                    setCo2SavedTrip(co2Saved.toFixed(2));
                    setCommunityCO2(prev => prev + co2Saved);
                    alert(`Route adjusted to avoid traffic. CO2 saved: ${co2Saved.toFixed(2)} kg`);
                } else {
                    alert("No alternative eco-route available. Using original route.");
                    const lineString = window.H.geo.LineString.fromFlexiblePolyline(originalRoute.polyline);
                    currentRouteRef.current = new window.H.map.Polyline(lineString, { style: { strokeColor: "blue", lineWidth: 4 } });
                    mapInstanceRef.current.addObjects([currentRouteRef.current]);
                    mapInstanceRef.current.getViewModel().setLookAtData({ bounds: currentRouteRef.current.getBoundingBox() });
                }
            } else if (!originalRoute) {
                console.warn("Original route not found, can't adjust route.");
            } else {
                console.log("Traffic condition not met for alternative route recalculation");
            }
        }
    }, [isRouteAvoidingTraffic, calculateRoute]);

    // Calculate distance between two points
    const getDistance = useCallback((point1, point2) => {
        const latDiff = point1.lat - point2.lat;
        const lngDiff = point1.lng - point2.lng;
        return Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
    }, []);

    // Calculate CO2 emissions
    const calculateCO2Emission = useCallback((distanceMeters, durationSeconds) => {
        const distanceKm = distanceMeters / 1000;
        const idleTimeMin = durationSeconds / 60 * 0.1;
        const co2PerKm = selectedVehicle ? selectedVehicle.CO2_Emission / 1000 : 0; // Convert g/km to kg/km
        const drivingCO2 = distanceKm * co2PerKm;
        const idleCO2 = idleTimeMin * 0.05;
        return drivingCO2 + idleCO2;
    }, [selectedVehicle]);

    return (
        <div className="h-screen flex flex-col bg-gradient-to-b from-gray-900 to-black text-white">
            {/* Control Panel */}
            <div className="bg-gray-800/90 shadow-xl border-b border-gray-700 p-4 md:p-6 rounded-b-3xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-4 md:mb-6">
                    <div className="flex flex-col">
                        <label className="text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Starting Location</label>
                        <input
                            type="text"
                            value={startLocation}
                            onChange={(e) => setStartLocation(e.target.value)}
                            placeholder="e.g., Colombo, Sri Lanka"
                            className="p-2 md:p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-sm md:text-base"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Destination</label>
                        <input
                            type="text"
                            value={endLocation}
                            onChange={(e) => setEndLocation(e.target.value)}
                            placeholder="e.g., Galle, Sri Lanka"
                            className="p-2 md:p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-sm md:text-base"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs md:text-sm font-semibold text-gray-300 mb-1 md:mb-2">Vehicle</label>
                        <select
                            value={selectedVehicle ? selectedVehicle._id.$oid : ''}
                            onChange={(e) => {
                                const selected = vehicles.find(v => v._id.$oid === e.target.value);
                                setSelectedVehicle(selected);
                            }}
                            className="p-2 md:p-3 border border-gray-700 rounded-lg bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-sm text-sm md:text-base"
                        >
                            {vehicles.map(vehicle => (
                                <option key={vehicle._id.$oid} value={vehicle._id.$oid}>
                                    {vehicle.vehicle_name} ({vehicle.CO2_Emission}g/km)
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <button
                        onClick={() => calculateRoute()}
                        className="px-4 md:px-6 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg font-semibold shadow hover:from-green-500 hover:to-green-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition text-sm md:text-base"
                    >
                        Calculate Route
                    </button>

                    {showDriveButton && (
                        <button
                            onClick={startDriving}
                            className="px-4 md:px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-semibold shadow hover:from-blue-500 hover:to-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition text-sm md:text-base"
                        >
                            Drive Now
                        </button>
                    )}
                </div>

                <div className="text-xs md:text-base text-gray-200 text-center font-medium min-h-[24px] md:min-h-[28px]" dangerouslySetInnerHTML={{ __html: routeInfo }}></div>
            </div>

            {/* Map Container */}
            <div className="flex-grow relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-gray-800 m-2 md:m-4">
                <div
                    ref={mapRef}
                    className="absolute inset-0 w-full h-full min-h-[250px] md:min-h-[400px] bg-gray-900/80"
                ></div>
                {!isMapReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90 z-10">
                        <p className="text-base md:text-lg font-semibold text-gray-400">Loading map...</p>
                    </div>
                )}
            </div>

            {/* Eco Dashboard */}
            <div className="fixed bottom-2 right-2 md:bottom-6 md:right-6 bg-gray-900/95 p-3 md:p-5 rounded-xl md:rounded-2xl shadow-2xl border border-green-700 z-20 backdrop-blur-md w-[90vw] max-w-xs md:max-w-sm">
                <p className="text-sm md:text-base font-semibold text-gray-200 mb-1">Eco-Points: <span className="font-bold text-green-400">{ecoPoints}</span></p>
                <p className="text-sm md:text-base font-semibold text-gray-200 mb-1">CO2 Saved (Trip): <span className="font-bold text-green-400">{co2SavedTrip}</span> kg</p>
                <p className="text-sm md:text-base font-semibold text-gray-200">Community CO2 Saved: <span className="font-bold text-green-400">{communityCO2}</span> kg</p>
            </div>
        </div>
    );
};

export default EcoNavigator;