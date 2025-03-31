import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa'; // Removed unused icons
import axios from 'axios';

// Ensure this points to your backend API (adjust if needed)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const Register = () => {
  const { login } = useContext(AuthContext); // Get the login function from context
  const [message, setMessage] = useState(null); // For success/error feedback
  const [isRegistering, setIsRegistering] = useState(false); // Loading state for the button
  const navigate = useNavigate(); // Hook for navigation

  // Function to handle the registration process
  const registerUser = async () => {
    setIsRegistering(true); // Set loading state
    setMessage(null); // Clear any previous messages

    try {
      // Send POST request to the registration endpoint (empty body for generation)
      const response = await axios.post(`${API_URL}/users/register`, {});
      const data = response.data; // Axios puts response data in .data
      console.log("Register Response Data:", data); // Log backend response

      // Check if the backend reported success
      if (data.success) {
        // Set a temporary success message before redirecting
        setMessage({ type: 'success', text: 'Account generated successfully! Redirecting...' });

        // Extract the generated password if it exists in the response
        const generatedPassword = data.userData?.generatedPassword;
        console.log("Generated password to pass to login:", generatedPassword); // Log the password being passed

        // Check if a login token was received
        if (data.token) {
          // Call the login function from AuthContext, passing the token
          // AND the generated password (it will be stored in localStorage temporarily)
          await login(data.token, generatedPassword);
          console.log("Login successful after registration, navigating to /");
          navigate('/'); // <<< NAVIGATE TO HOME PAGE immediately after login
        } else {
          // Handle case where registration succeeded but no token was sent
          setMessage({ type: 'error', text: 'Registration succeeded but no login token received.' });
          setIsRegistering(false); // Stop loading if there's no token to proceed
        }
        // No need to set isRegistering false here if navigation happens

      } else {
        // Handle registration failure reported by the backend
        setMessage({ type: 'error', text: data.message || 'Registration failed.' });
        setIsRegistering(false); // Stop loading on failure
      }
    } catch (error) {
       // Handle network errors or unexpected issues
       console.error("Error registering user:", error);
       // Try to get a specific error message from the backend response, or show a generic one
       setMessage({ type: 'error', text: error.response?.data?.message || 'Error registering user. Network or server issue.' });
       setIsRegistering(false); // Stop loading on error
    }
    // No 'finally' needed as success leads to navigation, and errors/failures set isRegistering false
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-purple-300 flex items-center justify-center">
        <FaUserPlus className="mr-2" /> Join the Potato Mafia
      </h2>

      {/* The button to trigger registration */}
      <button
        onClick={registerUser}
        disabled={isRegistering} // Disable button while processing
        className={`w-full font-semibold py-3 px-4 rounded-md transition duration-200 flex items-center justify-center ${
            isRegistering
                ? 'bg-gray-600 cursor-not-allowed' // Style for disabled state
                : 'bg-purple-700 hover:bg-purple-800 text-white' // Style for active state
        }`}
      >
        {isRegistering ? (
            // Show spinner and text when loading
            <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Account...
            </>
        ) : (
            // Default button text
            'Click for Instant Gangster Account'
        )}
      </button>

      {/* Area to display general success or error messages */}
      {message && (
        <div className={`p-4 rounded-md flex items-center ${
          message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'
        }`}>
          {message.type === 'success' ? <FaCheckCircle className="mr-2" /> : <FaTimesCircle className="mr-2" />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};

export default Register;