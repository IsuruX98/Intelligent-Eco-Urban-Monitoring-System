import React from "react";

const LoginForm = ({ onSubmit, formData, onChange }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-white">
          Email:
        </label>
        <input
          type="text"
          id="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white"
        />
      </div>
      <div className="mb-4">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-white"
        >
          Password:
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-white text-gray-900 py-2 rounded-md"
      >
        Login
      </button>
    </form>
  );
};

export default LoginForm;
