import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaUserCircle, FaCopy, FaCheckCircle, FaExclamationTriangle, FaMoneyBillWave, FaStar, FaTachometerAlt, FaSkull } from 'react-icons/fa'; // Added stat icons

const UserStatus = () => {
  const { user, isLoggedIn, logout, loading, money, xp, rank, kills } = useContext(AuthContext);
  const navigate = useNavigate();
  const [tempPassword, setTempPassword] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
      if (isLoggedIn && !tempPassword) {
          const storedPassword = localStorage.getItem('temp_password');
          if (storedPassword) {
              console.log("UserStatus: Found temp password in localStorage.");
              setTempPassword(storedPassword);
              // Consider removing immediately after first display if desired
              // localStorage.removeItem('temp_password');
          } else {
              console.log("UserStatus: No temp password found in localStorage.");
          }
      }
      // Clear password display if user logs out while component is mounted
      if (!isLoggedIn && tempPassword) {
          setTempPassword('');
      }
  }, [isLoggedIn, tempPassword]);

  const handleLogout = () => {
    logout();
    navigate('/auth'); // Navigate to auth page after logout
  };

  const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500); // Show feedback slightly longer
      }, (err) => {
          console.error('Failed to copy text: ', err);
          // Optionally show an error message to the user here
      });
  };

  // Loading state from AuthContext
  if (loading) {
     return (
       <div className="bg-gray-800/80 backdrop-blur-sm text-white rounded-xl shadow-xl p-6 mx-auto mt-8 text-center border border-gray-700">
         Syncing with the mainframe...
       </div>
     );
  }

  // Shouldn't be reachable if parent component handles it, but good fallback
  if (!isLoggedIn || !user) {
     return (
       <div className="bg-gray-800/80 backdrop-blur-sm text-white rounded-xl shadow-xl p-6 mx-auto mt-8 text-center border border-gray-700">
         No active gangster found.
       </div>
     );
  }

  return (
    // Enhanced main container styling
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-xl shadow-2xl p-6 mx-auto max-w-md border border-purple-700/50">

      {/* Header Section */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <FaUserCircle className="text-5xl text-purple-400" />
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-blue-300">Account Dossier</h2>
            <p className="text-sm text-gray-400">Your Underworld Stats</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-400 hover:text-red-300 transition duration-200 p-2 rounded-full hover:bg-red-500/20"
          title="Disappear" // Themed title
        >
          <FaSignOutAlt size={22} />
        </button>
      </div>

      {/* Temporary Password Display */}
      {tempPassword && (
        <div className="bg-yellow-500/20 border-l-4 border-yellow-400 p-4 rounded-lg text-yellow-100 mb-6 shadow-lg animate-fade-in">
          <div className="flex items-start text-yellow-200 font-semibold mb-2">
            <FaExclamationTriangle className="mr-2 mt-0.5 flex-shrink-0 text-yellow-300" size={20}/>
            URGENT: Stash Your Secret Code NOW!
          </div>
          <div className="relative mb-3">
            <strong className="text-yellow-200">Password:</strong>
            {/* Password field */}
            <div className="mt-1 flex items-center bg-gray-900/50 p-2 rounded">
                <span className="flex-1 font-mono text-yellow-100 break-all text-sm tracking-wider">{tempPassword}</span>
                 <button
                    onClick={() => copyToClipboard(tempPassword)}
                    title="Copy Code"
                    className={`ml-2 p-1.5 rounded text-gray-300 hover:text-white hover:bg-gray-600/50 ${copied ? 'text-green-400' : ''}`}
                >
                    {copied ? <FaCheckCircle size={18}/> : <FaCopy size={18}/>}
                 </button>
            </div>

          </div>
        </div>
      )}

      {/* Username Display */}
      <div className="mb-6 bg-gray-700/50 p-4 rounded-lg shadow-inner">
        <p className="text-lg flex items-center gap-2">
          <span className="font-semibold text-gray-300">Alias:</span>
          <span className="text-purple-400 font-bold text-xl">{user.username}</span>
        </p>
      </div>

      {/* Logout Button - Enhanced */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-700 hover:from-red-700 hover:to-pink-800 text-white font-bold py-3 px-4 rounded-lg transition duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
      >
        <FaSignOutAlt /> Go Off-Grid
      </button>
    </div>
  );
};

export default UserStatus;