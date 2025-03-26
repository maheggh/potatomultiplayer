// Register.jsx
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
    if (isLoggedIn) {
      navigate('/');
    }
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
        console.log('Password saved:', localStorage.getItem('password'));

        setMessage({ type: 'success', text: data.message || 'User registered successfully!' });

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
      console.error('Registration error:', error);
      setMessage({ type: 'error', text: 'Error registering user' });
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
      <button onClick={registerUser} disabled={isRegistering}>
        {isRegistering ? 'Registering...' : (
          <>
            <FaUserPlus /> Generate Random Gangster Name
          </>
        )}
      </button>

      {username && password && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded-md">
          <FaCheckCircle />
          <p><strong>Username:</strong> {username}</p>
          <p><strong>Password:</strong> {password}</p>
          <p className="text-red-500 font-bold">⚠️ Save this password now!</p>
        </div>
      )}

      {message && (
        <div className={`mt-6 p-4 ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
          {message.type === 'success' ? <FaCheckCircle /> : <FaTimesCircle />}
          <span>{message.text}</span>
        </div>
      )}
    </div>
  );
};

export default Register;
