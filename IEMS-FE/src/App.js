import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext";
import { ReactNotifications } from "react-notifications-component";
import Layout from "./layout/Layout";
import "leaflet/dist/leaflet.css";
import "react-notifications-component/dist/theme.css";

const App = () => {
  return (
    <BrowserRouter>
      <ReactNotifications />
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
