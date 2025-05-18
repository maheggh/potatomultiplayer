import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaCheckCircle, FaTimesCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';

// Direct URL to your backend - adjust if needed
const BACKEND_URL = import.meta.env.PROD 
  ? '/api'  // In production, use relative URL
  : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api');

const Register = () => {
  const { login } = useContext(AuthContext);
  const [message, setMessage] = useState(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState(null);
  const [generatedUsername, setGeneratedUsername] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(true);
  const navigate = useNavigate();

  const handleRegistration = async () => {
    setIsRegistering(true);
    setMessage(null);
    setGeneratedPassword(null);
    setGeneratedUsername(null);

    try {
      console.log("Making direct request to backend at:", `${BACKEND_URL}/users/register`);
      
      // Make direct API call to the backend, bypassing the proxy
      const response = await axios.post(`${BACKEND_URL}/users/register`, {});
      console.log("Register Component: Response from API:", response.data);
      
      if (response.data.success && response.data.token) {
        // Save the generated credentials
        const password = response.data.userData.generatedPassword;
        const username = response.data.userData.username;
        
        setGeneratedPassword(password);
        setGeneratedUsername(username);
        
        // Save credentials to localStorage if the user wants to
        if (saveCredentials) {
          localStorage.setItem('saved_username', username);
          localStorage.setItem('saved_password', password);
        }
        
        setMessage({ 
          type: 'success', 
          text: 'Account generated successfully! Save your login details before continuing.' 
        });
        
        // Call the login function with the token
        await login(response.data.token, password);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error("Error during registration process:", error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'An error occurred during registration.' 
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleContinue = () => {
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-purple-300 flex items-center justify-center">
        <FaUserPlus className="mr-2" /> Join the Potato Mafia
      </h2>

      {generatedUsername && generatedPassword ? (
        <div className="p-6 rounded-lg bg-gray-800 border border-purple-600 shadow-lg">
          <h3 className="text-xl font-bold text-green-400 mb-4">Account Created Successfully!</h3>
          
          <div className="space-y-4 mb-6">
            <div className="bg-gray-700 p-3 rounded-md">
              <p className="text-gray-400 text-sm mb-1">Your Gangster Name:</p>
              <p className="text-purple-300 font-bold text-lg">{generatedUsername}</p>
            </div>
            
            <div className="bg-gray-700 p-3 rounded-md">
              <div className="flex justify-between items-center mb-1">
                <p className="text-gray-400 text-sm">Your Secret Code:</p>
                <button 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <p className="text-purple-300 font-bold text-lg font-mono">
                {showPassword ? generatedPassword : '••••••••'}
              </p>
            </div>
            
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                id="save-credentials"
                checked={saveCredentials}
                onChange={(e) => setSaveCredentials(e.target.checked)}
                className="mr-2 h-4 w-4 text-purple-600 rounded border-gray-600 focus:ring-purple-500"
              />
              <label htmlFor="save-credentials" className="text-gray-300 text-sm">
                Save login details in this browser
              </label>
            </div>
          </div>
          
          <div className="bg-yellow-900/30 border border-yellow-700/50 p-3 rounded-md mb-4">
            <p className="text-yellow-200 text-sm">
              <strong>Important:</strong> Save this information! 
              Without your secret code, you will not be able to log in again.
            </p>
          </div>
          
          <button
            onClick={handleContinue}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md transition duration-200 font-semibold flex items-center justify-center gap-2"
          >
            <FaCheckCircle /> Continue to Game
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={handleRegistration}
            disabled={isRegistering}
            className={`w-full font-semibold py-3 px-4 rounded-md transition duration-200 flex items-center justify-center ${
              isRegistering
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-purple-700 hover:bg-purple-800 text-white'
            }`}
          >
            {isRegistering ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Account...
              </>
            ) : (
              'Click for Instant Gangster Account'
            )}
          </button>

          {message && (
            <div className={`p-4 rounded-md flex items-center ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
            }`}>
              {message.type === 'success' ? <FaCheckCircle className="mr-2" /> : <FaTimesCircle className="mr-2" />}
              <span>{message.text}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Register;