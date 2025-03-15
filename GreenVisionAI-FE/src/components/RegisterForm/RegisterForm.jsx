import React from "react";

const RegisterForm = ({ onSubmit, formData, onChange }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-white">
          Name:
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white"
        />
      </div>
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
          htmlFor="mobile"
          className="block text-sm font-medium text-white"
        >
          Mobile:
        </label>
        <input
          type="text"
          id="mobile"
          name="mobile"
          value={formData.mobile}
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
      <div className="mb-4">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-white"
        >
          Confirm Password:
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={onChange}
          className="w-full px-3 py-2 border rounded-md bg-gray-800 text-white"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-white text-gray-900 py-2 rounded-md"
      >
        Register
      </button>
    </form>
  );
};

export default RegisterForm;
