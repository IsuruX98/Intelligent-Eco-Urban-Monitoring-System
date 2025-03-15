import React from "react";
//import { useAuth } from "../context/authContext";
import Hero from "../components/Hero/Hero";
import Services from "../components/Services/Services";
import AboutUs from "../components/AboutUs/AboutUs";

const Home = () => {
  //const { user, isLoggedIn } = useAuth();

  // if (!isLoggedIn) {
  //   // If user is already logged in, redirect to home page
  //   navigate("/login");
  // }

  return (
    <div>
      <Hero />
      <Services />
      <AboutUs />
    </div>
  );
};

export default Home;
