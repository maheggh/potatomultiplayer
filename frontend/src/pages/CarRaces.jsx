// Optimized CarRaces.jsx Component - Reducing API Calls

import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { 
  FaCar, FaFlagCheckered, FaDollarSign, FaTimesCircle, 
  FaCheckCircle, FaSpinner, FaClock, FaExclamationTriangle, 
  FaPlus, FaTrashAlt
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Define allCars directly or import if it gets large
const allCars = [
    { name: 'Luxury Spud Sedan', price: 120000, baseChance: 5, image: '/assets/luxury-spud-sedan.png', type: 'car' },
    { name: 'Sporty Tater Coupe', price: 40000, baseChance: 8, image: '/assets/sporty-tater-coupe.png', type: 'car' },
    { name: 'Potato Convertible', price: 30000, baseChance: 10, image: '/assets/potato-convertible.png', type: 'car' },
    { name: 'SUV Spud', price: 2000, baseChance: 20, image: '/assets/suv-spud.png', type: 'car' },
    { name: 'Hatchback Tuber', price: 1500, baseChance: 20, image: '/assets/hatchback-tuber.png', type: 'car' },
    { name: 'Sedan Yam', price: 20000, baseChance: 10, image: '/assets/sedan-yam.png', type: 'car' },
    { name: 'SUV Tater', price: 25000, baseChance: 8, image: '/assets/suv-tater.png', type: 'car' },
    { name: 'Spudnik Sports', price: 90000, baseChance: 4, image: '/assets/spudnik-sports.png', type: 'car' },
    { name: 'Compact Fry', price: 10000, baseChance: 25, image: '/assets/compact-fry.png', type: 'car' },
    { name: 'Curly Coupe', price: 15000, baseChance: 20, image: '/assets/curly-coupe.png', type: 'car' },
    { name: 'Wedge Wagon', price: 20000, baseChance: 15, image: '/assets/wedge-wagon.png', type: 'car' },
    { name: 'Crispy Convertible', price: 110000, baseChance: 5, image: '/assets/crispy-convertible.png', type: 'car' },
    { name: 'Mashed Mini', price: 500, baseChance: 30, image: '/assets/mashed-mini.png', type: 'car' },
    { name: 'Buttery Buggy', price: 8000, baseChance: 20, image: '/assets/buttery-buggy.png', type: 'car' },
    { name: 'Gravy Sedan', price: 12000, baseChance: 15, image: '/assets/gravy-sedan.png', type: 'car' },
    { name: 'Peeler Pickup', price: 18000, baseChance: 5, image: '/assets/peeler-pickup.png', type: 'car' },
    { name: 'Root Roadster', price: 7000, baseChance: 30, image: '/assets/root-roadster.png', type: 'car' },
    { name: 'Bulb Buggy', price: 10000, baseChance: 25, image: '/assets/bulb-buggy.png', type: 'car' },
    { name: 'Starch Sedan', price: 15000, baseChance: 15, image: '/assets/starch-sedan.png', type: 'car' },
    { name: 'Tuber Truck', price: 60000, baseChance: 5, image: '/assets/tuber-truck.png', type: 'car' },
];

// Util function to prevent excessive fetching
const debounce = (func, wait) => {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const CarRaces = () => {
  const { 
    user, 
    isLoggedIn, 
    loading: authLoading, 
    token
  } = useContext(AuthContext);
  
  const [stolenCars, setStolenCars] = useState([]);
  const [selectedCarName, setSelectedCarName] = useState('');
  const [raceResult, setRaceResult] = useState(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isLoadingCars, setIsLoadingCars] = useState(true);
  const [isRacing, setIsRacing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Refs to prevent excessive API calls
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);
  const cooldownTimer = useRef(null);
  const messageTimer = useRef(null);
  const authHeader = useRef(token ? { headers: { Authorization: `Bearer ${token}` } } : null);
  
  // Update auth header when token changes
  useEffect(() => {
    authHeader.current = token ? { headers: { Authorization: `Bearer ${token}` } } : null;
  }, [token]);

  // --- Cooldown Logic --- 
  const startCooldown = useCallback((duration) => {
    // Clear any existing timer
    if (cooldownTimer.current) {
      clearInterval(cooldownTimer.current);
    }
    
    const endTime = Date.now() + duration * 1000;
    localStorage.setItem('raceCooldownEnd', endTime);
    setCooldownSeconds(duration);

    cooldownTimer.current = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(cooldownTimer.current);
          localStorage.removeItem('raceCooldownEnd');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return cooldownTimer.current;
  }, []);

  // Initialize cooldown on load - if needed
  useEffect(() => {
    const cooldownEnd = parseInt(localStorage.getItem('raceCooldownEnd'), 10);
    if (cooldownEnd && Date.now() < cooldownEnd) {
      startCooldown(Math.ceil((cooldownEnd - Date.now()) / 1000));
    }
    
    // Cleanup on unmount
    return () => {
      if (cooldownTimer.current) {
        clearInterval(cooldownTimer.current);
      }
      if (messageTimer.current) {
        clearTimeout(messageTimer.current);
      }
    };
  }, [startCooldown]);

  // --- Data Fetching - Optimized ---
  const fetchStolenCars = useCallback(async (force = false) => {
    // Prevent excessive API calls
    const now = Date.now();
    if (
      !token || 
      !user || 
      isFetching.current || 
      (!force && now - lastFetchTime.current < 5000)
    ) {
      return;
    }
    
    isFetching.current = true;
    setErrorMessage('');
    
    if (isLoadingCars) {
      setIsLoadingCars(true);
    }
    
    try {
      // Use the cached auth header
      const response = await axios.get(`${API_URL}/users/me`, authHeader.current);
      
      if (response.data.success) {
        setStolenCars(response.data.userData.cars || []);
        lastFetchTime.current = now;
      } else {
        setErrorMessage('Failed to fetch your garage.');
        console.error("Fetch cars error:", response.data.message);
      }
    } catch (error) {
      setErrorMessage('Network error fetching garage.');
      console.error("Fetch cars network error:", error);
    } finally {
      setIsLoadingCars(false);
      
      // Add a small delay to prevent rapid successive fetches
      setTimeout(() => {
        isFetching.current = false;
      }, 1000);
    }
  }, [token, user, isLoadingCars]);

  // Initial data fetch
  useEffect(() => {
    if (isLoggedIn && user && !isFetching.current) {
      fetchStolenCars(true);
    } else if (!isLoggedIn) {
      setStolenCars([]);
      setIsLoadingCars(false);
    }
  }, [isLoggedIn, user, fetchStolenCars]);

  // Clear error/success messages after delay
  useEffect(() => {
    if (errorMessage || successMessage) {
      // Clear any existing timer
      if (messageTimer.current) {
        clearTimeout(messageTimer.current);
      }
      
      messageTimer.current = setTimeout(() => {
        setErrorMessage('');
        setSuccessMessage('');
      }, 5000);
    }
  }, [errorMessage, successMessage]);

  // --- API Calls for Race Outcome ---
  const removeCarAPI = async (carName) => {
    try {
      await axios.post(`${API_URL}/carraces/removeCar`, { carName }, authHeader.current);
      // Update local state instead of re-fetching
      setStolenCars(prev => prev.filter(car => car.name !== carName));
    } catch (error) {
      console.error("Error removing car:", error);
      // Fallback to re-fetch in case of error
      setTimeout(() => fetchStolenCars(true), 1000);
    }
  };

  const addCarAPI = async (car) => {
    try {
      await axios.post(`${API_URL}/carraces/addCar`, { car }, authHeader.current);
      // Update local state instead of re-fetching
      setStolenCars(prev => [...prev, car]);
    } catch (error) {
      console.error("Error adding car:", error);
      // Fallback to re-fetch in case of error
      setTimeout(() => fetchStolenCars(true), 1000);
    }
  };

  // --- Handle Race Logic ---
  const handleRace = async () => {
    if (cooldownSeconds > 0 || isRacing || !selectedCarName) {
      setErrorMessage(cooldownSeconds > 0 ? 'Cooldown active!' : !selectedCarName ? 'Select a car first!' : '');
      return;
    }

    setIsRacing(true);
    setErrorMessage('');
    setRaceResult(null);

    const playerCar = stolenCars.find(car => car.name === selectedCarName);
    if (!playerCar) {
      setErrorMessage('Selected car not found in your garage.');
      setIsRacing(false);
      return;
    }

    // Simple placeholder opponent generation
    const opponentCar = allCars[Math.floor(Math.random() * allCars.length)];

    // Simulate race outcome
    const playerSpeed = (playerCar.price || 500) / 1000 + Math.random() * 20;
    const opponentSpeed = (opponentCar.price || 500) / 1000 + Math.random() * 20;
    const crashChance = 0.08; // 8% crash chance

    // Add a short delay to simulate the race
    await new Promise(resolve => setTimeout(resolve, 1500));

    let resultData = {
      message: '',
      image: '/assets/race7.png',
      opponentCar: opponentCar,
      playerCar: playerCar,
      outcome: 'pending'
    };

    try {
      if (Math.random() < crashChance) {
        // --- Crash Outcome ---
        await removeCarAPI(playerCar.name);
        resultData.message = `💥 DISASTER! Your ${playerCar.name} crashed and burned!`;
        resultData.image = '/assets/race2.png';
        resultData.outcome = 'crash';
        resultData.lostCar = playerCar;
        
        // Extended cooldown for crashes - 60 seconds
        startCooldown(60);
      } else if (playerSpeed > opponentSpeed) {
        // --- Win Outcome ---
        const wonCar = allCars[Math.floor(Math.random() * allCars.length)];
        await addCarAPI(wonCar);
        resultData.message = `🏆 VICTORY! You smoked the ${opponentCar.name} and won a ${wonCar.name}!`;
        resultData.image = '/assets/race6.png';
        resultData.outcome = 'win';
        resultData.wonCar = wonCar;
        
        // Standard cooldown for wins - 30 seconds
        startCooldown(30);
      } else {
        // --- Loss Outcome ---
        await removeCarAPI(playerCar.name);
        resultData.message = `☠️ DEFEAT! The ${opponentCar.name} left your ${playerCar.name} in the dust! You lost your car.`;
        resultData.image = '/assets/race8.png';
        resultData.outcome = 'loss';
        resultData.lostCar = playerCar;
        
        // Moderate cooldown for losses - 45 seconds
        startCooldown(45);
      }

      setRaceResult(resultData);
      setSelectedCarName(''); // Deselect car after race

    } catch (error) {
      console.error('Race error:', error);
      setErrorMessage('An error occurred during the race API call.');
    } finally {
      setIsRacing(false);
    }
  };


  // --- Render ---
  if (authLoading) { 
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Session...</div>; 
  }
  
  if (!isLoggedIn) { 
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Please log in to access Car Races.</div>; 
  }

  const selectedCarObject = stolenCars.find(c => c.name === selectedCarName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <FaFlagCheckered className="mx-auto text-6xl text-yellow-400 mb-4 animate-pulse" />
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 mb-2">
            Underground Races
          </h1>
          <p className="text-lg text-gray-400 italic">
            "Risk your ride for riches and glory. Winner takes all... sometimes."
          </p>
        </div>

        {/* Message Area */}
        <div className="h-12 mb-6 max-w-3xl mx-auto text-center">
          {errorMessage && (
            <div className="p-3 bg-red-500/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm">
              <FaTimesCircle className="mr-2 flex-shrink-0" /> {errorMessage}
            </div>
          )}
          {successMessage && (
            <div className="p-3 bg-green-500/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm">
              <FaCheckCircle className="mr-2 flex-shrink-0" /> {successMessage}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left Side: Garage & Selection */}
          <div className="bg-gray-800/60 backdrop-blur-md rounded-xl shadow-xl p-6 border border-gray-700/50 space-y-6">
            <h2 className="text-2xl font-semibold text-purple-300 border-b border-gray-700 pb-2 mb-4">Select Your Racer</h2>
            {isLoadingCars ? (
              <div className="text-center py-10 text-gray-400">Loading Garage...</div>
            ) : stolenCars.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-2">
                {stolenCars.map((car, i) => (
                  <button
                    key={car._id || i}
                    onClick={() => setSelectedCarName(car.name)}
                    disabled={isRacing || cooldownSeconds > 0}
                    className={`p-3 rounded-lg bg-gray-700/70 border-2 transition duration-200 ease-in-out focus:outline-none ${
                      selectedCarName === car.name
                        ? 'border-yellow-400 ring-2 ring-yellow-400/50 shadow-lg scale-105'
                        : 'border-gray-600 hover:border-purple-500'
                    } ${isRacing || cooldownSeconds > 0 ? 'opacity-50 cursor-not-allowed filter grayscale' : ''}`}
                    title={`Select ${car.name}`}
                  >
                    <img
                      src={car.image || '/assets/default.png'}
                      alt={car.name}
                      className="w-full h-24 object-contain mb-2 rounded"
                      loading="lazy"
                      onError={(e) => { e.target.onerror = null; e.target.src='/assets/default.png'; }}
                    />
                    <p className="text-sm font-medium text-gray-200 truncate">{car.name}</p>
                    <p className="text-xs text-green-400">${(car.price || 0).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center py-10 text-gray-400 italic">Your garage is empty! Steal some cars first.</p>
            )}
          </div>

          {/* Right Side: Race Hub */}
          <div className="bg-gray-800/60 backdrop-blur-md rounded-xl shadow-xl p-6 border border-gray-700/50 space-y-6 flex flex-col items-center">
            <h2 className="text-2xl font-semibold text-yellow-400 mb-4">Race Hub</h2>

            {/* --- Race Visualization Area --- */}
            <div className="w-full bg-gray-700/50 rounded-lg p-4 min-h-[250px] flex flex-col items-center justify-center text-center shadow-inner">
              {raceResult ? (
                // Display Race Result
                <div className="animate-fade-in space-y-4">
                  <img src={raceResult.image} alt="Race Outcome" className="w-full max-w-xs sm:max-w-sm object-contain rounded-lg shadow-md mx-auto"/>
                  <p className={`text-xl font-semibold ${
                    raceResult.outcome === 'win' ? 'text-green-400' :
                    raceResult.outcome === 'crash' ? 'text-orange-500' : 'text-red-500'
                  }`}>{raceResult.message}</p>
                  {raceResult.opponentCar && <p className="text-sm text-gray-400">Opponent drove: {raceResult.opponentCar.name}</p>}
                </div>
              ) : selectedCarObject ? (
                // Display Selected Car vs Placeholder
                <div className="flex flex-col sm:flex-row items-center justify-around w-full gap-4">
                  <div className="text-center">
                    <img src={selectedCarObject.image || '/assets/default.png'} alt="Your Car" className="w-32 h-24 sm:w-40 sm:h-32 object-contain mb-2 animate-pulse-slow"/>
                    <p className="text-lg font-semibold text-gray-200">{selectedCarObject.name}</p>
                    <p className="text-sm text-green-400">Your Racer</p>
                  </div>
                  <p className="text-4xl font-bold text-gray-500 animate-bounce">VS</p>
                  <div className="text-center opacity-70">
                    <img src="/assets/mashy.png" alt="Opponent Placeholder" className="w-32 h-24 sm:w-40 sm:h-32 object-contain mb-2"/>
                    <p className="text-lg font-semibold text-gray-400">???</p>
                    <p className="text-sm text-gray-500">Rival</p>
                  </div>
                </div>
              ) : (
                // Prompt to select car
                <p className="text-gray-400 text-lg">Select a car from your garage to race!</p>
              )}
            </div>
            {/* --- End Race Visualization Area --- */}

            {/* Race Button & Cooldown */}
            <div className="w-full pt-4">
              {cooldownSeconds > 0 ? (
                <div className="w-full text-center p-3 rounded-lg bg-red-800/50 border border-red-600/50 text-red-300 font-semibold">
                  <FaClock className="inline mr-2 animate-spin-slow" />
                  Cooldown: {cooldownSeconds}s remaining
                </div>
              ) : (
                <button
                  onClick={handleRace}
                  disabled={isRacing || !selectedCarName || cooldownSeconds > 0}
                  className={`w-full py-3 px-6 rounded-lg text-lg font-bold text-white transition duration-300 ease-in-out flex items-center justify-center gap-2 shadow-lg transform hover:scale-105 ${
                    isRacing || !selectedCarName || cooldownSeconds > 0
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600'
                  }`}
                >
                  {isRacing ? (
                    <> <FaSpinner className="animate-spin" /> Racing... </>
                  ) : (
                    <> <FaFlagCheckered /> Start Race! </>
                  )}
                </button>
              )}
            </div>

            {/* Display error if car not selected and trying to race */}
            {!isRacing && !selectedCarName && cooldownSeconds <= 0 && (
              <p className="text-center text-yellow-400 text-sm mt-2 flex items-center justify-center gap-1">
                <FaExclamationTriangle/> Select a car first!
              </p>
            )}
            
            {/* Cooldown penalty explanation */}
            <div className="mt-4 p-3 border border-gray-700 rounded-lg bg-gray-800/50 text-gray-300 text-xs">
              <p className="mb-1"><span className="font-semibold text-white">Race Cooldowns:</span></p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="text-green-400">Win:</span> 30 second cooldown</li>
                <li><span className="text-red-400">Lose:</span> 45 second cooldown</li>
                <li><span className="text-orange-400">Crash:</span> 60 second cooldown</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-12 text-center text-gray-500 text-sm">
        Potato Underworld © {new Date().getFullYear()}. All rights reserved.
      </footer>
    </div>
  );
};

export default CarRaces;