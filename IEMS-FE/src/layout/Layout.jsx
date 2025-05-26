import React from "react";
import Router from "../router/Router";
import Navbar from "../components/NavBar/Navbar";
import Footer from "../components/Footer/Footer";

const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-grow">
                <Router />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
