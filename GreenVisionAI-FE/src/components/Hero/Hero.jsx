import React from "react";
import { Link as Scroll } from "react-scroll";
import BgImage from "../../assets/images/macro-green-leaf.webp";

const Hero = () => {
  return (
    <div
      className="relative isolate overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${BgImage})` }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>

      <div className="relative mt-[-50px] flex h-screen items-center justify-center">
        <div className="max-w-full flex-shrink-0 px-4 text-center lg:mx-0 lg:max-w-3xl lg:pt-8">
          <h1 className="mt-10 text-5xl font-bold tracking-tight text-white sm:text-6xl">
            Introducing
            <span className="text-green-400"> IEMS</span>:
            <span className="text-green-400"> Intelligent EcoUrban Monitoring System</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            An AI-driven framework integrating IoT, deep learning, and predictive analytics to enhance urban sustainability.
          </p>
          <div className="mt-5 flex items-center justify-center gap-x-6">
            <Scroll
              to="Services"
              spy={true}
              smooth={true}
              duration={500}
              className="rounded-md bg-green-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-400"
            >
              Learn More →
            </Scroll>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
