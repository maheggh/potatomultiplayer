// File: components/assassination/DeadView.jsx

import React from 'react';
import { FaSkull } from 'react-icons/fa';

const DeadView = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-900/20 to-gray-900 py-20 text-white flex flex-col items-center justify-center px-4">
      <FaSkull className="text-red-500 text-6xl mb-6" />
      <h1 className="text-4xl font-bold text-red-500 mb-4 text-center">You Have Been Eliminated</h1>
      <p className="text-gray-400 mb-8 text-center max-w-md">Your assassination career has come to an abrupt end. Someone else was quicker on the trigger.</p>
      <div className="bg-gray-800/60 p-8 rounded-xl shadow-lg border border-red-500/30 max-w-lg">
        <img
          src="/assets/dead.png"
          alt="You are dead"
          className="w-full h-auto rounded-lg shadow-lg mb-6"
        />
        <p className="text-center text-gray-300">Respawn coming soon...</p>
      </div>
    </div>
  );
};

export default DeadView;