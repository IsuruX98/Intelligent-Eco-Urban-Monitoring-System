import React from "react";

const AstronomyPictureOfDayModal = ({
  closeModal,
  handleSubmit,
  dateMode,
  setDateMode,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="max-w-lg mx-auto mb-8">
            <label htmlFor="dateMode" className="block mb-2 text-lg">
              Choose Date Selection Mode:
            </label>
            <select
              id="dateMode"
              value={dateMode}
              onChange={(e) => setDateMode(e.target.value)}
              className="border rounded-md px-4 py-2 w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500 appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 0.7rem center",
                backgroundSize: "1.2rem",
              }}
            >
              <option value="single">Single Date</option>
              <option value="range">Date Range</option>
            </select>
          </div>
          {dateMode === "single" && (
            <div className="max-w-lg mx-auto mb-8">
              <label htmlFor="startDate" className="block mb-2 text-lg">
                Select a Date:
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={today}
                min="1995-06-16"
                className="border rounded-md px-4 py-2 w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500 "
              />
            </div>
          )}
          {dateMode === "range" && (
            <>
              <div className="max-w-lg mx-auto mb-8">
                <label htmlFor="startDate" className="block mb-2 text-lg">
                  Start Date:
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={today}
                  min="1995-06-16"
                  className="border rounded-md px-4 py-2 w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="max-w-lg mx-auto mb-8">
                <label htmlFor="endDate" className="block mb-2 text-lg">
                  End Date:
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  max={today}
                  min="1995-06-16"
                  className="border rounded-md px-4 py-2 w-full bg-gray-800 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </>
          )}
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
};

export default AstronomyPictureOfDayModal;
