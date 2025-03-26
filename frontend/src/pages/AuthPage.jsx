import React, { useState } from 'react';
import Register from '../components/Register';
import Login from '../components/Login';

const AuthPage = () => {
  const [authMode, setAuthMode] = useState('register');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white flex items-center justify-center px-4 md:px-12">
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row shadow-xl bg-gray-800 rounded-2xl overflow-hidden">

        {/* Image Section */}
        <div className="hidden md:block md:w-1/2">
          <img
            src="/assets/potatologin.png"
            alt="Potato Mafia Queen"
            className="object-cover w-full h-full"
          />
        </div>

        {/* Form Section */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-start">

          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-6xl font-extrabold text-yellow-300 my-6">PotatoQueen</h1>
            <p className="text-gray-300 mt-2">
              Unleash your inner potatoqueen, start from the bottom
              establish your dominance, and become a queen of all the potatoes, in this weird potatoworld.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-700 rounded-full p-1 inline-flex text-base">
              <button
                onClick={() => setAuthMode('register')}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  authMode === 'register'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Register
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`px-6 py-2 rounded-full font-semibold transition-all duration-300 ${
                  authMode === 'login'
                    ? 'bg-purple-600 text-white shadow'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Login
              </button>
            </div>
          </div>

          {/* Auth Form */}
          <div className="bg-gray-700 p-6 rounded-xl shadow-inner max-h-[70vh] overflow-auto">
            {authMode === 'register' ? <Register /> : <Login />}
          </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;
