import React from "react";

const EPICModal = ({ closeModal, handleSubmit, date, setDate, loading }) => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-gray-900 bg-opacity-80 flex justify-center items-center z-20">
      <div className="bg-gray-800 rounded-lg p-8 relative">
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-200 focus:outline-none"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
          <label htmlFor="date" className="block mb-2 text-lg text-white">
            Select a Date:
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={today}
            className="border rounded-md px-4 py-2 w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mt-4"
            disabled={loading}
          >
            {loading ? "Loading..." : "Search"}
          </button>
          <p className="mt-3">
            TIP: The first acquired images start on 2015-09-01
          </p>
        </form>
      </div>
    </div>
  );
};

export default EPICModal;
