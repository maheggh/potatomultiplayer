import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import Login from '../components/Login';
import Register from '../components/Register';
import { FaSignInAlt, FaUserPlus } from 'react-icons/fa';

const AuthPage = () => {
  // Get default mode from navigation state, fallback to 'login'
  const location = useLocation();
  const defaultMode = location.state?.defaultMode || 'login';

  const [mode, setMode] = useState(defaultMode); // 'login' or 'register'
  const navigate = useNavigate(); // Hook for navigation

  // Update mode if defaultMode changes (e.g., clicking different link on Home)
  useEffect(() => {
    setMode(location.state?.defaultMode || 'login');
  }, [location.state]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 px-4 py-12">
      <div className="container mx-auto max-w-6xl bg-gray-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* Column 1: Image Section */}
        <div className="hidden md:block relative">
          {/* You can use different images based on mode */}
          <img
            src={mode === 'login' ? "/assets/potatologin.png" : "/assets/register.png"} // Example images
            alt={mode === 'login' ? "Potato Mafia Login" : "Potato Mafia Register"}
            className="w-full h-full object-cover object-center" // Cover the container
          />
          {/* Optional overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-800 via-transparent to-transparent opacity-50"></div>
        </div>

        {/* Column 2: Form Section */}
        <div className="p-8 sm:p-12 lg:p-16">
          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-8">
            <button
              onClick={() => { setMode('login'); navigate('/auth', { state: { defaultMode: 'login' }, replace: true }); }} // Update state on click
              className={`flex-1 py-3 px-4 text-center font-semibold transition duration-300 flex items-center justify-center gap-2 ${
                mode === 'login'
                  ? 'text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-purple-300'
              }`}
            >
              <FaSignInAlt /> Login
            </button>
            <button
              onClick={() => { setMode('register'); navigate('/auth', { state: { defaultMode: 'register' }, replace: true }); }} // Update state on click
              className={`flex-1 py-3 px-4 text-center font-semibold transition duration-300 flex items-center justify-center gap-2 ${
                mode === 'register'
                  ? 'text-green-400 border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-green-300'
              }`}
            >
               <FaUserPlus /> Register
            </button>
          </div>

          {/* Render Login or Register Component */}
          {mode === 'login' ? <Login /> : <Register />}

        </div>
      </div>
    </div>
  );
};

export default AuthPage;