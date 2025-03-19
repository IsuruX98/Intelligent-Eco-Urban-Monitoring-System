import React from "react";
import { Link } from "react-router-dom";
import EcoSensor from "../../assets/images/eco-senser.webp";
import GreenVision from "../../assets/images/tree.webp";
import NoiseGuard from "../../assets/images/noice.webp";
import EcoGo from "../../assets/images/eco-go.webp";

const services = [
  {
    title: "EcoSensor AI",
    description:
      "Utilizes IoT sensors and hybrid AI models for real-time air quality monitoring and CO2 level prediction.",
    imageUrl: EcoSensor,
    alt: "EcoSensor AI",
    route: "/eco-sensor",
  },
  {
    title: "GreenVision AI",
    description:
      "Leverages satellite imagery and deep learning techniques to assess urban green spaces, classify vegetation, and analyze environmental health indicators.",
    imageUrl: GreenVision,
    alt: "GreenVision AI",
    route: "/green-vision",
  },
  {
    title: "NoiseGuard AI",
    description:
      "Implements ML/DL-based models to classify noise sources, monitor urban soundscapes, and assess noise pollution trends.",
    imageUrl: NoiseGuard,
    alt: "NoiseGuard AI",
    route: "/noise-guard",
  },
  {
    title: "EcoGo AI",
    description:
      "Predicts vehicle-induced CO2 emissions and provides strategic recommendations for reducing carbon footprints through data-driven insights.",
    imageUrl: EcoGo,
    alt: "EcoGo AI",
    route: "/eco-go",
  },
];

const FeaturedServices = () => {
  return (
    <div id="Services" className="bg-gray-900 pb-20 pt-32 lg:px-32 px-12">
      <div className="container mx-auto">
        <div className="mb-12 text-center">
          <span className="text-green-500 text-lg font-semibold mb-2 block">
            Featured Services
          </span>
          <h2 className="text-white text-3xl font-bold mb-4 sm:text-4xl md:text-5xl">
            Explore Our Offerings
          </h2>
          <p className="text-gray-300 text-base">
            Discover our cutting-edge AI-driven solutions for environmental sustainability.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <Link to={service.route} key={index}>
              <div className="bg-gray-800 p-6 rounded-lg shadow-md transition duration-300 hover:shadow-lg hover:ring-2 hover:ring-green-500 cursor-pointer h-full">
                <img
                  src={service.imageUrl}
                  alt={service.alt}
                  className="w-full h-48 object-cover mb-4 rounded-lg"
                />
                <h4 className="text-white text-lg font-semibold mb-2">
                  {service.title}
                </h4>
                <p className="text-gray-300">{service.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FeaturedServices;