import React from "react";

const EPICImage = ({ image, date }) => {
  const imageUrl = `https://epic.gsfc.nasa.gov/archive/natural/${date.replace(
    /-/g,
    "/"
  )}/jpg/${image.image}.jpg`;

  return (
    <div className="bg-black bg-opacity-50 rounded-lg overflow-hidden shadow-md">
      <img src={imageUrl} alt={image.caption} className="w-full" />
      <div className="p-4">
        <p className="text-xl font-semibold mb-2 text-white">
          Date: {image.date}
        </p>
        <p className="text-gray-300">
          Coordinates: {image.coords.centroid_coordinates.lat},{" "}
          {image.coords.centroid_coordinates.lon}
        </p>
        <p className="text-gray-300">
          Sun Position: X: {image.coords.sun_j2000_position.x}, Y:{" "}
          {image.coords.sun_j2000_position.y}, Z:{" "}
          {image.coords.sun_j2000_position.z}
        </p>
        <p className="text-gray-300">
          Lunar Position: X: {image.coords.lunar_j2000_position.x}, Y:{" "}
          {image.coords.lunar_j2000_position.y}, Z:{" "}
          {image.coords.lunar_j2000_position.z}
        </p>
        <p className="text-gray-300">
          DSCOVR Position: X: {image.coords.dscovr_j2000_position.x}, Y:{" "}
          {image.coords.dscovr_j2000_position.y}, Z:{" "}
          {image.coords.dscovr_j2000_position.z}
        </p>
        <p className="text-gray-300">
          Attitude Quaternions: Q0: {image.coords.attitude_quaternions.q0}, Q1:{" "}
          {image.coords.attitude_quaternions.q1}, Q2:{" "}
          {image.coords.attitude_quaternions.q2}, Q3:{" "}
          {image.coords.attitude_quaternions.q3}
        </p>
      </div>
    </div>
  );
};

export default EPICImage;
