import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "../api/axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Fetch user details from API
  const fetchUserById = async (userId) => {
    try {
      const response = await axios.get(`http://127.0.0.1:5001/api/users/${userId}`);
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user profile:", error.response?.data || error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    
    if (userId) {
      setIsLoggedIn(true);
      fetchUserById(userId);
    } else {
      setAuthLoading(false);
    }
  }, []);

  const login = async (formData) => {
    try {
      const response = await axios.post("http://127.0.0.1:5001/api/users/login", formData);
      
      const userId = response.data.user_id;
      localStorage.setItem("user_id", userId);

      setIsLoggedIn(true);
      fetchUserById(userId);

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || "Login failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("user_id");
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
