import React, { useState } from "react";
import { AiOutlineClose, AiOutlineMenu, AiOutlineUser, AiOutlineLogout } from "react-icons/ai";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import AuthModal from "../AuthModel/AuthModel";
import UserProfileModal from "../UserProfileModal/UserProfileModal";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [nav, setNav] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleNav = () => setNav(!nav);

  return (
    <nav className="flex justify-between w-full py-4 lg:px-32 px-12 sticky top-0 z-50 bg-gray-900">
      <div className="flex items-center gap-6">
        <div className="cursor-pointer text-2xl font-bold text-white">
          <Link to="/">IEMS</Link>
        </div>

        <div className="hidden lg:flex items-center space-x-12 text-white">
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-4 py-2 text-sm font-medium text-white focus:outline-none"
            >
              Services
            </button>
            {dropdownOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-md">
                <Link to="/eco-sensor" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">EcoSensor AI</Link>
                <Link to="/green-vision" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">GreenVision AI</Link>
                <Link to="/noise-guard" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">NoiseGuard AI</Link>
                <Link to="/eco-go" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">EcoGo AI</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-6 text-white">
        {user ? (
          <>
            {/* User Profile Button */}
            <button
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-200"
            >
              <AiOutlineUser /> {user.name}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center gap-2 text-white bg-red-600 px-4 py-2 rounded-lg shadow-sm hover:bg-red-700"
            >
              <AiOutlineLogout /> Logout
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setShowLogin(true)} className="text-white">Sign In</button>
            <button onClick={() => setShowRegister(true)} className="bg-white text-gray-900 px-4 py-2 rounded-lg shadow-sm hover:bg-gray-200">Sign Up</button>
          </>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div onClick={handleNav} className="lg:hidden text-white">
        {nav ? <AiOutlineClose size={30} /> : <AiOutlineMenu size={30} />}
      </div>

      {/* Mobile Navigation */}
      <div className={`${nav ? "left-0" : "left-[-100%]"} fixed top-0 w-[60%] h-full bg-gray-900 p-4 text-white transition-all lg:hidden`}>
        <h1 className="text-2xl font-bold">IEMS</h1>
        <ul className="mt-10 space-y-4">
          <li><Link to="/ecosensor-ai" onClick={() => setNav(false)}>EcoSensor AI</Link></li>
          <li><Link to="/greenvision-ai" onClick={() => setNav(false)}>GreenVision AI</Link></li>
          <li><Link to="/noiseguard-ai" onClick={() => setNav(false)}>NoiseGuard AI</Link></li>
          <li><Link to="/ecogo-ai" onClick={() => setNav(false)}>EcoGo AI</Link></li>
        </ul>

        {/* Show Logout Button in Mobile Menu if Logged In */}
        {user && (
          <button
            onClick={logout}
            className="mt-6 flex items-center gap-2 text-white bg-red-600 px-4 py-2 rounded-lg shadow-sm hover:bg-red-700 w-full"
          >
            <AiOutlineLogout /> Logout
          </button>
        )}
      </div>

      <AuthModal isOpen={showLogin} onClose={() => setShowLogin(false)} mode="login" />
      <AuthModal isOpen={showRegister} onClose={() => setShowRegister(false)} mode="register" />
      {showProfileModal && <UserProfileModal user={user} onClose={() => setShowProfileModal(false)} logout={logout} />}
    </nav>
  );
};

export default Navbar;
