import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaCrown } from 'react-icons/fa';

const NavBar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const linkClass =
    "text-white hover:text-purple-300 transition duration-200 font-semibold";

  return (
    <header className="bg-gradient-to-r from-purple-900 via-purple-800 to-purple-700 shadow-lg fixed w-full z-50">
      <nav className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
        {/* Logo */}
        <Link
          to="/"
          className="text-2xl md:text-3xl font-extrabold text-white flex items-center"
        >
          <FaCrown className="mr-2 text-yellow-300" />
          Potato Queen
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-6">
          <Link to="/" className={linkClass}>
            Home
          </Link>
          <Link to="/cartheft" className={linkClass}>
            Car Theft
          </Link>
          <Link to="/theft" className={linkClass}>
            Theft
          </Link>
          <Link to="/carraces" className={linkClass}>
            Car Races
          </Link>
          <Link to="/gambling" className={linkClass}>
            Gambling
          </Link>
          <Link to="/assassination" className={linkClass}>
            Assassination
          </Link>
          <Link to="/bosses" className={linkClass}>
            Bosses
          </Link>
          <Link to="/WeaponStore" className={linkClass}>
            Weapon Store
          </Link>
          <Link to="/score" className={linkClass}>
            Score
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden focus:outline-none"
          aria-label="Menu"
        >
          <div className="space-y-1.5">
            <span
              className={`block w-7 h-0.5 bg-white transition transform ${
                isMenuOpen ? "rotate-45 translate-y-2" : ""
              }`}
            ></span>
            <span
              className={`block w-7 h-0.5 bg-white transition opacity-${
                isMenuOpen ? "0" : "100"
              }`}
            ></span>
            <span
              className={`block w-7 h-0.5 bg-white transition transform ${
                isMenuOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            ></span>
          </div>
        </button>
      </nav>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-purple-800">
          <div className="flex flex-col items-center space-y-3 py-4">
            <Link
              to="/"
              className={linkClass}
              onClick={toggleMenu}
            >
              Home
            </Link>
            <Link
              to="/cartheft"
              className={linkClass}
              onClick={toggleMenu}
            >
              Car Theft
            </Link>
            <Link
              to="/theft"
              className={linkClass}
              onClick={toggleMenu}
            >
              Theft
            </Link>
            <Link
              to="/carraces"
              className={linkClass}
              onClick={toggleMenu}
            >
              Car Races
            </Link>
            <Link
              to="/gambling"
              className={linkClass}
              onClick={toggleMenu}
            >
              Gambling
            </Link>
            <Link
              to="/assassination"
              className={linkClass}
              onClick={toggleMenu}
            >
              Assassination
            </Link>
            <Link
              to="/bosses"
              className={linkClass}
              onClick={toggleMenu}
            >
              Bosses
            </Link>
            <Link
              to="/WeaponStore"
              className={linkClass}
              onClick={toggleMenu}
            >
              Weapon Store
            </Link>
            <Link
              to="/score"
              className={linkClass}
              onClick={toggleMenu}
            >
              Score
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default NavBar;
