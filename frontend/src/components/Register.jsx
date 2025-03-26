import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const Register = () => {
  const { login, isLoggedIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) navigate('/');
  }, [isLoggedIn, navigate]);

  const registerUser = async () => {
    setIsRegistering(true);
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        setUsername(data.userData.username);
        setPassword(data.userData.password);
        localStorage.setItem('password', data.userData.password);
        setMessage({ type: 'success', text: 'User registered successfully!' });

        if (data.token) {
          await login(data.token, data.userData.password);
          setTimeout(() => {
            setUsername('');
            setPassword('');
            navigate('/');
          }, 2000);
        }
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error registering user' });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-purple-300 flex items-center justify-center">
        <FaUserPlus className="mr-2" /> Join the Potato Mafia
      </h2>

      <button
        onClick={registerUser}
        disabled={isRegistering}
        className="bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 px-4 rounded-md transition duration-200 w-full"
      >
        {isRegistering ? 'Registering...' : 'Generate Random Gangster Name'}
      </button>

      {username && password && (
        <div className="p-4 bg-green-100 border border-green-400 rounded-md text-gray-800">
          <div className="flex items-center mb-2">
            <FaCheckCircle className="text-green-600 mr-2" />
            <strong>Registration Successful!</strong>
          </div>
          <p><strong>Username:</strong> {username}</p>
          <p><strong>Password:</strong> {password}</p>
          <p className="text-sm text-red-500 font-semibold mt-2">
            ⚠️ Save this password now. You won’t see it again.
          </p>
        </div>
      )}

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
