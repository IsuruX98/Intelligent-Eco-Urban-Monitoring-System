import React from "react";
import Eco from "../../assets/images/eco.webp";

const AboutUs = () => {
  return (
    <div className="bg-gray-900 py-16 md:py-24 px-6 sm:px-12 lg:px-32">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <span className="text-sky-500 text-sm sm:text-lg font-semibold mb-2 block">
            About Us
          </span>
          <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Intelligent EcoUrban Monitoring System (IEMS)
          </h2>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Addressing urban environmental challenges through AI-driven monitoring and predictive analytics.
          </p>
        </div>

        {/* Image + Overlay (Only on Medium and Larger Screens) */}
        <div className="relative w-full hidden sm:block">
          <img
            src={Eco}
            alt="IEMS"
            className="w-full h-[400px] md:h-[500px] object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/60 rounded-lg"></div>
          <div className="absolute inset-0 flex flex-col justify-center items-center text-center px-4 sm:px-8 md:px-12">
            <p className="text-gray-300 text-sm md:text-base max-w-3xl mb-4">
              With rapid urbanization and industrial growth, cities face significant environmental challenges, including air pollution, green space degradation, noise pollution, and vehicle emissions. Traditional monitoring systems often lack predictive modeling and integration with smart city frameworks.
            </p>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl mb-4">
              IEMS is an AI-powered framework designed to enhance urban sustainability through real-time monitoring, predictive analytics, and decision support systems. It consists of four key components:
            </p>
            <ul className="text-gray-300 text-sm md:text-base max-w-3xl list-disc text-left pl-6 mb-4">
              <li><strong>EcoSensor AI</strong> – IoT sensors and hybrid AI models for air quality monitoring and CO2 level prediction.</li>
              <li><strong>GreenVision AI</strong> – Satellite imagery and deep learning for assessing urban green spaces and environmental health indicators.</li>
              <li><strong>NoiseGuard AI</strong> – ML/DL-based models for classifying noise sources and monitoring urban soundscapes.</li>
              <li><strong>EcoGo AI</strong> – Predictive modeling for vehicle-induced CO2 emissions and strategic carbon footprint reduction.</li>
            </ul>
            <p className="text-gray-300 text-sm md:text-base max-w-3xl">
              By integrating IoT and AI, IEMS provides actionable intelligence for urban planners, policymakers, and citizens, empowering sustainable urban development.
            </p>
          </div>
        </div>

        {/* Text Content (Only on Small Devices) */}
        <div className="sm:hidden text-center">
          <p className="text-gray-300 text-sm max-w-2xl mx-auto mb-4">
            With rapid urbanization and industrial growth, cities face significant environmental challenges, including air pollution, green space degradation, noise pollution, and vehicle emissions. Traditional monitoring systems often lack predictive modeling and integration with smart city frameworks.
          </p>
          <p className="text-gray-300 text-sm max-w-2xl mx-auto mb-4">
            IEMS is an AI-powered framework designed to enhance urban sustainability through real-time monitoring, predictive analytics, and decision support systems. It consists of four key components:
          </p>
          <ul className="text-gray-300 text-sm max-w-2xl mx-auto list-disc text-left pl-6 mb-4">
            <li><strong>EcoSensor AI</strong> – IoT sensors and hybrid AI models for air quality monitoring and CO2 level prediction.</li>
            <li><strong>GreenVision AI</strong> – Satellite imagery and deep learning for assessing urban green spaces and environmental health indicators.</li>
            <li><strong>NoiseGuard AI</strong> – ML/DL-based models for classifying noise sources and monitoring urban soundscapes.</li>
            <li><strong>EcoGo AI</strong> – Predictive modeling for vehicle-induced CO2 emissions and strategic carbon footprint reduction.</li>
          </ul>
          <p className="text-gray-300 text-sm max-w-2xl mx-auto">
            By integrating IoT and AI, IEMS provides actionable intelligence for urban planners, policymakers, and citizens, empowering sustainable urban development.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
