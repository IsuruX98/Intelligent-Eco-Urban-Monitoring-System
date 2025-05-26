import React from "react";
import Router from "../router/Router";
import Navbar from "../components/NavBar/Navbar";
import Footer from "../components/Footer/Footer";
import useScrollToTop from "../hooks/useScrollToTop";
import ScrollToTop from "../components/ScrollToTop/ScrollToTop";

const Layout = () => {
  // Automatically scroll to top on route changes
  useScrollToTop();

  return (
    <div>
      <Navbar />
      <Router />
      <Footer />
      {/* Add scroll to top button that appears when user scrolls down */}
      <ScrollToTop showButton={true} autoScroll={false} />
    </div>
  );
};

export default Layout;
