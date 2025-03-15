import React from "react";

const ApodItem = ({ item }) => {
  return (
    <div
      key={item.date}
      className="mb-8 bg-black bg-opacity-50 rounded-lg p-4 md:flex"
    >
      <img
        src={item.url}
        alt={item.title}
        className="mb-2 md:w-1/2 rounded-lg shadow-lg"
      />
      <div className="md:w-1/2 md:ml-8">
        <h2 className="text-2xl font-bold mb-4">{item.title}</h2>
        <p className="text-lg font-bold mb-4">{item.date}</p>
        <p className="text-lg">{item.explanation}</p>
      </div>
    </div>
  );
};

export default ApodItem;
