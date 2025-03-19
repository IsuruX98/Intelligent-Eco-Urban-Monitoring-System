import React, { useState } from "react";
import { useAuth } from "../../context/authContext";

const LoginForm = () => {
  const { login } = useAuth(); // Use AuthContext
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMessage(""); // Clear previous messages

    const result = await login(formData);

    if (result.success) {
      setMessage("Login successful!");
    } else {
      setMessage(result.error || "Login failed.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      {message && <p className="mb-4 text-red-400">{message}</p>}
      <form onSubmit={onSubmit}>
        {["email", "password"].map((field) => (
          <div key={field} className="mb-4">
            <label htmlFor={field} className="block text-sm font-medium">
              {field.charAt(0).toUpperCase() + field.slice(1)}:
            </label>
            <input
              type={field === "password" ? "password" : "text"}
              id={field}
              name={field}
              value={formData[field]}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white"
            />
          </div>
        ))}
        <button type="submit" className="w-full bg-white text-gray-900 py-2 rounded-md">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginForm;
