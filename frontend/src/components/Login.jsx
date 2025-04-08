import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSignInAlt, FaUser, FaLock, FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash, FaTrash, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUsername = localStorage.getItem('saved_username');
    const savedPassword = localStorage.getItem('saved_password');

    if (savedUsername && savedPassword) {
      setUsername(savedUsername);
      setPassword(savedPassword);
      setHasSavedCredentials(true);
      setRememberMe(true);
    } else {
        setHasSavedCredentials(false);
        setRememberMe(false);
    }
  }, []);

  const clearSavedCredentials = () => {
    localStorage.removeItem('saved_username');
    localStorage.removeItem('saved_password');
    setUsername('');
    setPassword('');
    setHasSavedCredentials(false);
    setRememberMe(false);
    setMessage({ type: 'info', text: 'Saved login info cleared.' });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await axios.post(`${API_URL}/users/login`, { username, password });
      const data = response.data;

      if (data.success) {
        if (rememberMe) {
            localStorage.setItem('saved_username', username);
            localStorage.setItem('saved_password', password);
            setHasSavedCredentials(true);
        } else {
            localStorage.removeItem('saved_username');
            localStorage.removeItem('saved_password');
            setHasSavedCredentials(false);
        }

        setMessage({ type: 'success', text: 'Login successful! Peeling back the layers...' });

        if (data.token) {
          await login(data.token, null);
          setIsLoading(false); // Reset loading state on success
          navigate('/');
        } else {
           setMessage({ type: 'error', text: 'Login succeeded but no token received. Contact support.' });
           setIsLoading(false);
        }
      } else {
        setMessage({ type: 'error', text: data.message || 'Login failed. Wrong name or secret code?' });
        setIsLoading(false);
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Network error. Is the potato server running?' });
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-white">
      <h2 className="text-3xl font-bold text-purple-300 flex items-center justify-center mb-6">
        <FaSignInAlt className="mr-3 text-purple-400" /> Login to Your Turf
      </h2>

        {message && (
            <div className={`p-4 rounded-lg flex items-center text-sm font-medium shadow-md ${
                 message.type === 'success' ? 'bg-green-500/30 text-green-300 border border-green-500' :
                 message.type === 'error' ? 'bg-red-500/30 text-red-300 border border-red-500' :
                 'bg-blue-500/30 text-blue-300 border border-blue-500'
            }`} role="alert">
            {message.type === 'success' ? <FaCheckCircle className="mr-2 flex-shrink-0" /> : message.type === 'error' ? <FaTimesCircle className="mr-2 flex-shrink-0" /> : <FaInfoCircle className="mr-2 flex-shrink-0" />}
            <span>{message.text}</span>
            </div>
        )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div>
          <label htmlFor="login-username" className="block text-sm font-medium text-gray-300 mb-1">
            Gangster Name
          </label>
          <div className="relative rounded-md shadow-sm">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaUser className="text-gray-400 h-5 w-5" />
            </div>
            <input
              type="text" id="login-username" value={username}
              onChange={(e) => setUsername(e.target.value)} required
              className="w-full pl-10 pr-3 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
              placeholder="e.g., Spudsy Malone" disabled={isLoading}
            />
          </div>
        </div>

        <div>
          <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-1">
            Secret Code
          </label>
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaLock className="text-gray-400 h-5 w-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'} id="login-password" value={password}
              onChange={(e) => setPassword(e.target.value)} required
              className="w-full pl-10 pr-10 py-2.5 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition duration-200"
              placeholder="••••••••" disabled={isLoading}
            />
             <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-200 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'} >
                {showPassword ? <FaEyeSlash className="h-5 w-5" /> : <FaEye className="h-5 w-5" />}
              </button>
            </div>
          </div>
           {hasSavedCredentials && (
                <button type="button" onClick={clearSavedCredentials}
                    className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center"
                    title="Clear saved login info from this browser">
                    <FaTrash className="mr-1" /> Forget Saved Login
                </button>
            )}
        </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <input
                id="remember-me" name="remember-me" type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-500 rounded bg-gray-700"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                 Save Login Info?
                </label>
            </div>
        </div>

        <button type="submit" disabled={isLoading}
          className={`w-full font-semibold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center text-base shadow-lg transform hover:scale-105 ${
            isLoading ? 'bg-gray-600 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
          }`} >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cracking the Safe...
            </>
          ) : (
            <>
              <FaSignInAlt className="mr-2" /> Enter the Underworld
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default Login;