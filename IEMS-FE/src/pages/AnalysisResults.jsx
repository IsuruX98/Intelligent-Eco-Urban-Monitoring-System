import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useLocation } from 'react-router-dom';

const AnalysisResults = () => {
    const location = useLocation();
    const data = location.state?.data; // Access the data passed via state

    console.log("data", data);


    const [recommendations, setRecommendations] = useState([]); // State for recommendations

    useEffect(() => {
        if (!data) return; // Exit early if data is unavailable

        const { segmentation_stats, forecast } = data;
        const recommendationsList = [];

        console.log(forecast);


        // Extract and process forecast values
        const forecastValues = Object.values(forecast).map(value => parseFloat(value));
        const firstMonth = forecastValues[0]; // First recorded month
        const lastMonth = forecastValues[forecastValues.length - 1]; // Most recent month

        // Determine the trend based on first and last month values
        if (lastMonth < firstMonth) {
            recommendationsList.push(
                "📉 **Declining Vegetation Health Trend Detected**:\n" +
                "The forecast suggests a downward trend in vegetation health over the coming months. This may be due to factors such as " +
                "changing weather conditions, inadequate soil nutrients, or increased plant stress. To counteract this decline, consider:\n" +
                "  - **Improving soil quality** with organic compost or mineral supplements 🧪\n" +
                "  - **Enhancing irrigation** strategies to prevent moisture stress 💦\n" +
                "  - **Monitoring for pests and diseases**, taking early action if needed 🐛\n" +
                "  - **Using mulching techniques** to retain soil moisture and protect root systems 🍂\n" +
                "Taking these proactive steps can help slow or even reverse the decline."
            );
        } else if (lastMonth > firstMonth) {
            recommendationsList.push(
                "📈 **Improving Vegetation Health Trend Detected**:\n" +
                "The forecast indicates an increase in vegetation health over time, which is a positive sign! This could be due to favorable " +
                "growing conditions, effective land management, or recent environmental conservation efforts. To maintain and accelerate this growth:\n" +
                "  - **Expand vegetation coverage** by planting additional trees, shrubs, or crops 🌱\n" +
                "  - **Optimize fertilization practices** to ensure plants receive adequate nutrients 🌿\n" +
                "  - **Continue sustainable watering routines** to support long-term health 💧\n" +
                "  - **Encourage biodiversity** by introducing native plant species and maintaining a balanced ecosystem 🦋\n" +
                "Your efforts are yielding great results! Keep up the good work to sustain long-term vegetation health."
            );
        } else {
            recommendationsList.push(
                "📊 **Stable Vegetation Health Trend Detected**:\n" +
                "The forecast shows minimal fluctuation in vegetation health, indicating that conditions are relatively stable. While this is a good sign, " +
                "it’s essential to maintain your current practices and make small improvements to prevent unexpected deterioration. Consider:\n" +
                "  - **Regular soil testing** to monitor nutrient levels and adjust care accordingly 🧪\n" +
                "  - **Periodic pruning and maintenance** to promote plant health and growth ✂️\n" +
                "  - **Monitoring climate changes** and adapting vegetation care routines based on seasonal variations 🌦️\n" +
                "  - **Encouraging community involvement** in conservation efforts to keep green spaces thriving 🤝\n" +
                "By staying proactive, you can ensure that vegetation health remains stable or even improves in the future."
            );
        }


        // NDVI Score Analysis
        const ndviScore = parseFloat(segmentation_stats['NDVI Score']);
        if (ndviScore < 0.3) {
            recommendationsList.push(
                "⚠️ Low NDVI Score: Your vegetation health appears poor. To improve plant vitality, consider enhancing soil quality with compost or fertilizers, optimizing irrigation schedules, and reducing soil compaction."
            );
        } else if (ndviScore >= 0.3 && ndviScore < 0.6) {
            recommendationsList.push(
                "ℹ️ Moderate NDVI Score: Your vegetation is in fair condition. Regular monitoring, proper irrigation, and occasional fertilization can help maintain and enhance plant health."
            );
        } else {
            recommendationsList.push(
                "✅ High NDVI Score: Your vegetation is thriving! Continue with your current practices and monitor for any seasonal changes that may require adjustments."
            );
        }

        // Green Percentage Analysis
        const greenPercentage = parseFloat(segmentation_stats['Green Percentage']);
        if (greenPercentage < 30) {
            recommendationsList.push(
                "🌱 Low Green Cover: The area has limited greenery. You may want to plant more trees, shrubs, or ground cover to enhance biodiversity and improve air quality."
            );
        } else if (greenPercentage >= 30 && greenPercentage < 70) {
            recommendationsList.push(
                "🌿 Moderate Green Cover: Your area has a decent amount of vegetation. Consider increasing greenery by introducing native plants or vertical gardens."
            );
        } else {
            recommendationsList.push(
                "🌳 High Green Cover: Your area is well-vegetated! Keep up with regular maintenance and tree care to sustain its health."
            );
        }

        // Vegetation Density Analysis
        const highDensity = parseFloat(segmentation_stats['High Vegetation Density Coverage']);
        const mediumDensity = parseFloat(segmentation_stats['Medium Vegetation Density Coverage']);
        const lowDensity = parseFloat(segmentation_stats['Low Vegetation Density Coverage']);

        if (lowDensity > 50) {
            recommendationsList.push(
                "🏜️ Low Vegetation Density: Over half of the area has sparse vegetation. Consider reforestation, afforestation, or introducing more drought-resistant plant species."
            );
        }
        if (mediumDensity > 50) {
            recommendationsList.push(
                "🌾 Medium Vegetation Density: A significant portion of the area has moderate vegetation coverage. Regular watering, pruning, and fertilization can help increase density."
            );
        }
        if (highDensity > 50) {
            recommendationsList.push(
                "🌲 High Vegetation Density: Your area has lush greenery! Maintain soil health and monitor for overcrowding to ensure plant sustainability."
            );
        }

        setRecommendations(recommendationsList); // Update recommendations state
    }, [data]); // Re-run when `data` changes


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
        <div className="bg-gray-900 min-h-screen text-white py-12 px-12 md:px-8 lg:px-16 xl:px-32">
            <h1 className="text-4xl text-green-400 font-bold mb-8">Analysis Results</h1>

            {/* Vegetation Density Coverage and Green Percentage Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                    <h2 className="text-2xl text-green-400 font-semibold mb-4">Vegetation Density Coverage</h2>
                    <Chart
                        options={vegetationDensityData.options}
                        series={vegetationDensityData.series}
                        type="donut"
                        height={350}
                    />
                </div>
                <div>
                    <h2 className="text-2xl text-green-400 font-semibold mb-4">Green Percentage</h2>
                    <Chart
                        options={greenPercentageData.options}
                        series={greenPercentageData.series}
                        type="radialBar"
                        height={350}
                    />
                </div>
            </div>

            {/* Enhanced NDVI Score Card with Dynamic Data and Badge */}
            <div className="mb-8">
                <h2 className="text-2xl text-green-400 font-semibold mb-4">NDVI Score</h2>
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                    {/* NDVI Score */}
                    <p className="text-3xl font-bold text-green-400">
                        {calculateNDVIFromGreenPercentage(segmentation_stats['Green Percentage'])}
                    </p>
                    <p className="text-gray-300">Normalized Difference Vegetation Index</p>

                    {/* Additional Details */}
                    <div className="mt-4">
                        <p className="text-gray-400">
                            <span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}
                        </p>
                        <p className="text-gray-400">
                            <span className="font-semibold">Area Covered:</span> SLIIT
                        </p>
                        <p className="text-gray-400">
                            <span className="font-semibold">Health Status:</span>
                            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-semibold ${getHealthStatusBadgeStyle(calculateNDVIFromGreenPercentage(segmentation_stats['Green Percentage']))}`}>
                                {getHealthStatus(calculateNDVIFromGreenPercentage(segmentation_stats['Green Percentage']))}
                            </span>
                        </p>
                    </div>

                    {/* Description */}
                    <div className="mt-4">
                        <p className="text-gray-400">
                            The NDVI score ranges from -1 to 1, where values closer to 1 indicate healthier vegetation.
                            This score helps in assessing the health and density of vegetation in the specified area.
                        </p>
                    </div>
                </div>
            </div>

            {/* Forecast Line Chart */}
            <div className="mb-8">
                <h2 className="text-2xl text-green-400 font-semibold mb-4">Forecast</h2>
                <Chart
                    options={forecastData.options}
                    series={forecastData.series}
                    type="line"
                    height={350}
                />
            </div>

            {/* Segmentation Results Images */}
            <div className="mb-8">
                <h2 className="text-2xl text-green-400 font-semibold mb-4">Segmentation Results</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(segmentation_results).map(([key, value]) => (
                        <div key={key} className="bg-gray-800 p-4 rounded-lg shadow-md">
                            <h3 className="text-lg text-green-400 font-semibold mb-2">{key}</h3>
                            <img src={`http://127.0.0.1:5000/${value}`} alt={key} className="w-full h-auto rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Recommendations */}
            <div className="mb-8">
                <h2 className="text-2xl text-green-400 font-semibold mb-4">Recommendations</h2>
                <ul className="list-disc pl-6 text-gray-300">
                    {recommendations.map((recommendation, index) => (
                        <li key={index} className="mb-2">{recommendation}</li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AnalysisResults;