import React, { useEffect, useState } from 'react';
import Chart from 'react-apexcharts';
import { useLocation } from 'react-router-dom';

const AnalysisResults = () => {
    const location = useLocation();
    const data = location.state?.data; // Access the data passed via state

    const [recommendations, setRecommendations] = useState([]); // State for recommendations

    useEffect(() => {
        if (!data) return; // Early return if no data is available

        const { segmentation_stats, forecast } = data;

        const recommendationsList = [];

        // Extract key metrics
        const ndviScore = parseFloat(segmentation_stats['NDVI Score']);
        const greenPercentage = parseFloat(segmentation_stats['Green Percentage']);
        const highDensity = parseFloat(segmentation_stats['High Vegetation Density Coverage']);
        const mediumDensity = parseFloat(segmentation_stats['Medium Vegetation Density Coverage']);
        const lowDensity = parseFloat(segmentation_stats['Low Vegetation Density Coverage']);
        const forecastValues = Object.values(forecast).map(value => parseFloat(value));
        const averageForecast = forecastValues.reduce((sum, value) => sum + value, 0) / forecastValues.length;

        // General Recommendations for All Users
        recommendationsList.push("🌱 **General Tips for Everyone:**");
        if (ndviScore < 0.3) {
            recommendationsList.push("- The vegetation health in your area is poor. Consider planting native trees and shrubs to improve greenery.");
        } else if (ndviScore >= 0.3 && ndviScore < 0.6) {
            recommendationsList.push("- The vegetation health in your area is moderate. Regular watering and soil enrichment can help improve it.");
        } else {
            recommendationsList.push("- The vegetation health in your area is excellent! Keep maintaining the green cover.");
        }

        if (greenPercentage < 30) {
            recommendationsList.push("- Your area has a low green percentage. Consider creating small gardens or green rooftops to increase vegetation.");
        } else if (greenPercentage >= 30 && greenPercentage < 70) {
            recommendationsList.push("- Your area has a moderate green percentage. Adding more plants or community gardens can enhance it further.");
        } else {
            recommendationsList.push("- Your area has a high green percentage. Great job! Ensure proper maintenance to sustain it.");
        }

        // Recommendations for City Planners
        recommendationsList.push("🏙️ **For City Planners:**");
        if (lowDensity > 50) {
            recommendationsList.push("- Large areas have low vegetation density. Plan urban forests or green belts to improve density.");
        }
        if (mediumDensity > 50) {
            recommendationsList.push("- Significant areas have medium vegetation density. Introduce vertical gardens or green walls in urban spaces.");
        }
        if (highDensity > 50) {
            recommendationsList.push("- Large areas have high vegetation density. Ensure proper urban planning to balance development and greenery.");
        }
        recommendationsList.push("- Use the forecast data to plan long-term green initiatives. For example, allocate budgets for tree planting in areas with declining vegetation health.");

        // Recommendations for Homeowners
        recommendationsList.push("🏡 **For Homeowners:**");
        if (ndviScore < 0.3) {
            recommendationsList.push("- Improve your garden's health by using organic fertilizers and mulching.");
        }
        if (greenPercentage < 30) {
            recommendationsList.push("- Plant drought-resistant plants or create a small vegetable garden to increase green cover.");
        }
        recommendationsList.push("- Regularly water your plants and ensure proper drainage to maintain healthy vegetation.");

        // Recommendations for Government
        recommendationsList.push("🏛️ **For Government Officials:**");
        if (averageForecast < 0.3) {
            recommendationsList.push("- The forecast indicates a decline in vegetation health. Launch public awareness campaigns about the importance of greenery.");
        }
        if (lowDensity > 50) {
            recommendationsList.push("- Allocate funds for afforestation projects in areas with low vegetation density.");
        }
        recommendationsList.push("- Implement policies to protect existing green spaces and promote sustainable urban development.");
        recommendationsList.push("- Encourage public-private partnerships for community gardening and urban greening projects.");

        // Recommendations for Normal Users
        recommendationsList.push("👤 **For Normal Users:**");
        recommendationsList.push("- Participate in local tree-planting drives or community gardening initiatives.");
        recommendationsList.push("- Use water-efficient irrigation methods for your plants to conserve resources.");
        recommendationsList.push("- Spread awareness about the benefits of green spaces and encourage others to contribute.");

        setRecommendations(recommendationsList); // Set the recommendations state
    }, [data]);

    if (!data) {
        return <div>No data available</div>;
    }

    const { forecast, segmentation_stats, segmentation_results } = data;

    // Extract relevant data for charts
    const vegetationDensityData = {
        options: {
            chart: {
                id: 'vegetation-density-chart',
            },
            labels: ['High Vegetation Density', 'Medium Vegetation Density', 'Low Vegetation Density'],
            colors: ['#00E396', '#FEB019', '#FF4560'],
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
            },
            labels: ['Green Percentage'],
            colors: ['#00E396'],
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

            {/* NDVI Score Card */}
            <div className="mb-8">
                <h2 className="text-2xl text-green-400 font-semibold mb-4">NDVI Score</h2>
                <div className="bg-gray-800 p-6 rounded-lg shadow-md">
                    <p className="text-3xl font-bold text-green-400">{ndviScore}</p>
                    <p className="text-gray-300">Normalized Difference Vegetation Index</p>
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