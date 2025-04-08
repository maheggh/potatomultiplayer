// frontend/src/components/UserStatus.jsx
import React, { useContext } from 'react'; // Removed useState, useEffect
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// Removed FaCopy, FaCheckCircle, FaExclamationTriangle, kept others + added stat icons
import { FaSignOutAlt, FaUserCircle, FaMoneyBillWave, FaStar, FaTachometerAlt, FaSkull } from 'react-icons/fa';

const UserStatus = () => {
  // Destructure necessary values, including stats you might want to display
  const { user, isLoggedIn, logout, loading, money, xp, rank, kills } = useContext(AuthContext);
  const navigate = useNavigate();

  // REMOVED: useEffect hook that checked temp_password
  // REMOVED: useState for tempPassword and copied
  // REMOVED: copyToClipboard function

  const handleLogout = () => {
    logout();
    navigate('/auth'); // Navigate to auth page after logout
  };

  // Loading state from AuthContext
  if (loading) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm text-white rounded-xl shadow-xl p-6 mx-auto mt-8 text-center border border-gray-700">
        Syncing with the mainframe...
      </div>
    );
  }

  // Fallback if somehow rendered while not logged in
  if (!isLoggedIn || !user) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm text-white rounded-xl shadow-xl p-6 mx-auto mt-8 text-center border border-gray-700">
        No active gangster found.
      </div>
    );
  }

  // Helper to format large numbers (optional)
  const formatNumber = (num) => {
     return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  }

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl shadow-2xl p-6 mx-auto max-w-md border border-purple-700/50 space-y-5"> {/* Added space-y-5 */}

      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-4">
        <div className="flex items-center gap-3">
          <FaUserCircle className="text-5xl text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">Account Dossier</h2>
            <p className="text-sm text-gray-400">Your Underworld Stats</p>
          </div>
        </div>
         {/* Moved logout button to the bottom for better flow */}
      </div>

      {/* REMOVED: Temporary Password Display Section */}

      {/* Username Display */}
      <div className="bg-gray-700/50 p-4 rounded-lg shadow-inner">
        <p className="text-lg flex items-center justify-between gap-2">
          <span className="font-semibold text-gray-300">Alias:</span>
          <span className="text-purple-300 font-bold text-xl">{user.username}</span>
        </p>
      </div>

       {/* Stats Section - ADDED */}
       <div className="grid grid-cols-2 gap-4 text-sm">
           <div className="bg-gray-700/40 p-3 rounded-lg flex items-center gap-2 shadow-sm">
                <FaMoneyBillWave className="text-green-400 text-xl" />
                <div>
                    <span className="block text-gray-400">Cash</span>
                    <strong className="text-green-300">{formatNumber(money)}</strong>
                </div>
           </div>
            <div className="bg-gray-700/40 p-3 rounded-lg flex items-center gap-2 shadow-sm">
                <FaStar className="text-yellow-400 text-xl" />
                 <div>
                    <span className="block text-gray-400">Respect (XP)</span>
                    <strong className="text-yellow-300">{xp.toLocaleString()}</strong>
                 </div>
           </div>
            <div className="bg-gray-700/40 p-3 rounded-lg flex items-center gap-2 shadow-sm">
                <FaTachometerAlt className="text-blue-400 text-xl" />
                <div>
                     <span className="block text-gray-400">Rank</span>
                     <strong className="text-blue-300">{rank}</strong>
                 </div>
           </div>
            <div className="bg-gray-700/40 p-3 rounded-lg flex items-center gap-2 shadow-sm">
                <FaSkull className="text-red-400 text-xl" />
                 <div>
                    <span className="block text-gray-400">Kills</span>
                    <strong className="text-red-300">{kills}</strong>
                 </div>
           </div>
       </div>
       {/* End Stats Section */}


      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
      >
        <FaSignOutAlt /> Go Off-Grid
      </button>
    </div>
  );
};

export default UserStatus;