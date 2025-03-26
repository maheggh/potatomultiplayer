import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash, FaSignOutAlt, FaUserCircle } from 'react-icons/fa';

const UserStatus = () => {
  const { user, isLoggedIn, logout, loading } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

useEffect(() => {
  if (typeof window !== 'undefined' && isLoggedIn && user) {
    const storedPassword = localStorage.getItem('password');
    console.log('Retrieved from localStorage:', storedPassword);
    if (storedPassword) setPassword(storedPassword);
  }
}, [isLoggedIn, user]);

  useEffect(() => {
    if (user && !user.isAlive) navigate('/dead');
  }, [user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );

  if (!isLoggedIn || !user)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold">Not logged in</div>
      </div>
    );

  return (
    <div className="bg-gray-800 text-white rounded-xl shadow-xl p-6 mx-auto mt-8">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-4 mb-4">
        <div className="flex items-center">
          <FaUserCircle className="text-4xl mr-2 text-gray-300" />
          <h2 className="text-2xl font-bold">Account Information</h2>
        </div>
        <button
          onClick={handleLogout}
          className="text-red-500 hover:text-red-600 transition duration-200"
          title="Logout"
        >
          <FaSignOutAlt size={24} />
        </button>
      </div>

      {/* User Credentials */}
      <div className="mb-4">
        <p className="text-lg">
          <strong>Username:</strong> <span className="text-green-400">{user.username}</span>
        </p>
      </div>

      {password ? (
  <div className="mb-6">
    <label className="block font-semibold mb-2">Password:</label>
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={password}
        readOnly
        className="w-full px-4 py-2 pr-10 border border-gray-600 bg-gray-700 rounded-md focus:outline-none"
      />
      <button
        onClick={() => setShowPassword(!showPassword)}
        className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-300"
        title={showPassword ? 'Hide Password' : 'Show Password'}
      >
        {showPassword ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
    <p className="text-sm text-gray-400 mt-2">Remember to save your credentials safely!</p>
  </div>
) : (
  <div className="mb-6 text-red-400">
    Password not available. Make sure to save it when registering!
  </div>
)}

      {/* User Stats (Optional addition) */}
      <div className="bg-gray-700 p-4 rounded-lg shadow-inner mb-4">
        <h3 className="text-xl font-semibold mb-2">Statistics</h3>
        <ul className="text-gray-200 space-y-1">
          <li>💰 Money: <span className="text-green-300">${user.money}</span></li>
          <li>⭐ XP: <span className="text-yellow-300">{user.xp}</span></li>
          <li>🏅 Rank: <span className="text-blue-300">{user.rank}</span></li>
          <li>🔫 Kills: <span className="text-red-400">{user.kills}</span></li>
        </ul>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition duration-200"
      >
        <FaSignOutAlt className="mr-2" />
        Logout
      </button>
    </div>
  );
};

export default UserStatus;
