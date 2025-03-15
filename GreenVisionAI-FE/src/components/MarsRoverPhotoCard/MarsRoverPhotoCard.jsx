import React from "react";

const MarsRoverPhotoCard = ({ photo }) => {
  return (
    <div className="bg-black bg-opacity-50 rounded-lg overflow-hidden shadow-md">
      <img src={photo.img_src} alt="Mars Rover" className="w-full h-auto" />
      <div className="p-4">
        <p className="text-white font-semibold mb-2">
          {photo.camera.full_name}
        </p>
        <p className="text-gray-300">Sol: {photo.sol}</p>
        <p className="text-gray-300">Earth Date: {photo.earth_date}</p>
      </div>
    </div>
  );
};

export default MarsRoverPhotoCard;
