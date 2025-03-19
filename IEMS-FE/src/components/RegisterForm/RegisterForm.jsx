import React, { useState } from "react";

const RegisterForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState("");

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5001/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Registration successful!");
      } else {
        setMessage(data.message || "Registration failed.");
      }
    } catch (error) {
      setMessage("Error connecting to the server.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 text-white rounded-lg">
      <h2 className="text-xl font-bold mb-4">Register</h2>
      {message && <p className="mb-4 text-red-400">{message}</p>}
      <form onSubmit={onSubmit}>
        {["name", "email", "mobile", "password", "confirmPassword"].map((field) => (
          <div key={field} className="mb-4">
            <label htmlFor={field} className="block text-sm font-medium">
              {field.charAt(0).toUpperCase() + field.slice(1)}:
            </label>
            <input
              type={field.includes("password") ? "password" : "text"}
              id={field}
              name={field}
              value={formData[field]}
              onChange={onChange}
              className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white"
            />
          </div>
        ))}
        <button type="submit" className="w-full bg-white text-gray-900 py-2 rounded-md">
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterForm;
