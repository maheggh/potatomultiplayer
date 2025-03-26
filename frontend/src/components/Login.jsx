import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt, FaExclamationCircle, FaCheckCircle } from 'react-icons/fa';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: `Error: ${data.message}` });
        return;
      }

      if (data.token) {
        login(data.token);
        setMessage({ type: 'success', text: 'Login successful!' });
        setTimeout(() => navigate('/'), 1500);
      } else {
        setMessage({ type: 'error', text: 'Invalid credentials' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error during login' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-purple-300 flex items-center justify-center">
        <FaSignInAlt className="mr-2" /> Login to Your Empire
      </h2>

      <div>
        <label htmlFor="username" className="block text-sm mb-1">Username</label>
        <div className="flex items-center bg-gray-800 rounded-md px-3 py-2">
          <FaUser className="text-gray-400 mr-2" />
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-transparent text-white outline-none"
            placeholder="Enter username"
          />
        </div>
      </div>

      <div>
        <label htmlFor="password" className="block text-sm mb-1">Password</label>
        <div className="flex items-center bg-gray-800 rounded-md px-3 py-2">
          <FaLock className="text-gray-400 mr-2" />
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent text-white outline-none"
            placeholder="Enter password"
          />
        </div>
      </div>

      <button
        onClick={handleLogin}
        className={`w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 px-4 rounded-md transition duration-200 ${
          isLoading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        disabled={isLoading}
      >
        {isLoading ? 'Logging in...' : 'Login'}
      </button>

      {message && (
        <div className={`p-4 rounded-md flex items-center ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <FaCheckCircle className="mr-2" /> : <FaExclamationCircle className="mr-2" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};

export default Login;
