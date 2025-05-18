import React, { useState, useEffect, useContext, useCallback, useMemo, lazy, Suspense } from 'react';
import { AuthContext } from '../context/AuthContext';
import JailStatus from '../components/JailStatus';
import axios from 'axios';
import {
  FaCarCrash, FaWarehouse, FaDollarSign, FaCheckCircle,
  FaTimesCircle, FaSpinner, FaKey, FaLock, FaPercentage,
  FaExclamationTriangle, FaCarSide, FaMoneyBillWave
} from 'react-icons/fa';

// Pre-load common images
const preloadImage = (src) => {
  const img = new Image();
  img.src = src;
};

// Constants - move outside component to prevent re-creation
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Result Modal Component for clearer outcomes
const ResultModal = ({ type, message, car, venue, onClose }) => {
  if (!message) return null;

  let bgColor, icon, animation, carImage;
  
  if (type === 'success') {
    bgColor = 'bg-green-800';
    icon = <FaCheckCircle className="text-3xl text-green-400" />;
    animation = 'animate-slideIn';
    carImage = car?.image || (venue && venue.carImages ? venue.carImages[0] : null);
  } else if (type === 'caught') {
    bgColor = 'bg-red-800';
    icon = <FaLock className="text-3xl text-red-400" />;
    animation = 'animate-shake';
    carImage = '/assets/police-car.png';
  } else {
    bgColor = 'bg-yellow-800';
    icon = <FaExclamationTriangle className="text-3xl text-yellow-400" />;
    animation = 'animate-slideIn';
    carImage = '/assets/escape.png';
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <div className={`${bgColor} ${animation} rounded-xl p-6 max-w-md mx-auto shadow-2xl border border-gray-700 transform transition-all`}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 text-4xl">
            {icon}
          </div>
          
          {carImage && (
            <div className="mb-4 p-2 bg-gray-900/50 rounded-lg">
              <img 
                src={carImage} 
                alt={car?.name || (type === 'success' ? 'Stolen Car' : type === 'caught' ? 'Busted' : 'Escaped')} 
                className="w-60 h-100 object-contain mx-auto"
                onError={(e) => {e.target.src = '/assets/default-car.png';}}
              />
            </div>
          )}
          
          <h3 className="text-xl font-bold text-white mb-2">
            {type === 'success' ? 'Car Stolen Successfully!' : 
             type === 'caught' ? 'Busted by Security!' : 'Close Call!'}
          </h3>
          
          <p className="text-white mb-4">{message}</p>
          
          {car && type === 'success' && (
            <div className="mb-4 py-2 px-4 bg-green-900/50 rounded-lg">
              <p className="text-green-300 flex items-center justify-center gap-1 font-bold">
                <FaMoneyBillWave/> Value: ${car.price?.toLocaleString() || 0}
              </p>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className={`mt-2 py-2 px-4 rounded ${
              type === 'success' ? 'bg-green-600 hover:bg-green-500' : 
              type === 'caught' ? 'bg-red-600 hover:bg-red-500' :
              'bg-yellow-600 hover:bg-yellow-500'
            } text-white font-bold transition-colors`}
          >
            {type === 'success' ? 'Sweet!' : 
             type === 'caught' ? 'Darn!' : 'Close One!'}
          </button>
        </div>
      </div>
    </div>
  );
};

// The main Car Theft component
const CarTheft = () => {
  const {
    user,
    isLoggedIn,
    loading: authLoading,
    isInJail,
    updateUserData,
    checkAndUpdateJailStatus,
    token
  } = useContext(AuthContext);

  // Component state
  const [stolenCars, setStolenCars] = useState([]);
  const [venueData, setVenueData] = useState({});
  const [result, setResult] = useState({ show: false, type: null, message: '', car: null, venue: null });
  const [showGarage, setShowGarage] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isStealing, setIsStealing] = useState(null);
  const [isSelling, setIsSelling] = useState(null);
  const [jailStatus, setJailStatus] = useState(null);

  // Memoize auth header to prevent recreation
  const authHeader = useMemo(() => 
    token ? { headers: { Authorization: `Bearer ${token}` } } : null,
  [token]);

  // Updated success chance calculation function with diminishing returns
  const calculateSuccessDisplayChance = useCallback((baseChance, userLevel) => {
    // Match the server-side calculation for consistency
    let levelBonus = 0;
    if (userLevel) {
      // First 5 levels add 1% each
      const baseLevels = Math.min(5, userLevel);
      levelBonus += baseLevels;
      
      // Levels 6-15 add 0.5% each
      const midLevels = Math.max(0, Math.min(10, userLevel - 5));
      levelBonus += midLevels * 0.5;
      
      // Levels above 15 add 0.2% each
      const highLevels = Math.max(0, userLevel - 15);
      levelBonus += highLevels * 0.2;
    }
    
    const rawChance = baseChance + levelBonus;
    return Math.max(5, Math.min(rawChance, 85)).toFixed(1);
  }, []);

  // Fetch venues and cars data
  const fetchVenueData = useCallback(async () => {
    if (!token || !user) return;
    
    try {
      const res = await axios.get(`${API_URL}/cartheft/venues`, authHeader);
      if (res.data.success) {
        // Process venues to include UI-specific data
        const processedVenues = {};
        
        Object.entries(res.data.venues).forEach(([venueName, venue]) => {
          // Get available car images for this venue
          const carImages = venue.cars.map(car => car.image);
          
          // Map difficulty level to UI text
          let difficultyText;
          switch(venue.difficulty) {
            case 'high': difficultyText = 'High Risk'; break;
            case 'medium': difficultyText = 'Medium Risk'; break;
            case 'low': 
            default: difficultyText = 'Low Risk';
          }
          
          // Convert jail time from seconds to minutes for display
          const jailTimeInMinutes = Math.round(venue.jailTime / 60);
          
          // Determine background gradient based on difficulty
          let backgroundColor;
          switch(venue.difficulty) {
            case 'high': backgroundColor = 'from-purple-700 to-purple-900'; break;
            case 'medium': backgroundColor = venue.cars.length >= 5 
              ? 'from-blue-700 to-blue-900' 
              : 'from-cyan-700 to-cyan-900'; break;
            case 'low':
            default: backgroundColor = venue.cars.length >= 4 
              ? 'from-teal-700 to-teal-900' 
              : 'from-green-700 to-green-900';
          }
          
          // Generate a description based on car categories
          const categories = venue.cars.map(car => car.category);
          const uniqueCategories = [...new Set(categories)];
          let description;
          
          if (uniqueCategories.includes('luxury')) {
            description = 'Luxury rides, heavy security.';
          } else if (uniqueCategories.includes('sports')) {
            description = 'Sporty vehicles, decent security.';
          } else if (uniqueCategories.includes('suv')) {
            description = 'Family vehicles, moderate watch.';
          } else if (uniqueCategories.includes('truck')) {
            description = 'Work trucks and utility vehicles.';
          } else {
            description = 'Standard vehicles, varying security.';
          }
          
          // Determine venue image path based on name
          let image;
          if (venueName.includes('Rich')) image = '/assets/rich.png';
          else if (venueName.includes('Downtown')) image = '/assets/downtown.png';
          else if (venueName.includes('Fries')) image = '/assets/fries.png';
          else if (venueName.includes('Mashy')) image = '/assets/mashy.png';
          else if (venueName.includes('Tuber')) image = '/assets/tuber.png';
          else image = '/assets/default-venue.png';
          
          // Get base chance from the average of car baseChances in the venue
          const avgBaseChance = venue.cars.reduce((sum, car) => sum + car.baseChance, 0) / venue.cars.length;
          
          // Create the processed venue object with UI details
          processedVenues[venueName] = {
            ...venue,
            image,
            difficulty: difficultyText,
            description,
            baseChance: avgBaseChance,
            jailTime: jailTimeInMinutes,
            backgroundColor,
            carImages
          };
        });
        
        setVenueData(processedVenues);
      }
    } catch (err) {
      console.error('Failed to load venue data:', err);
    }
  }, [token, user, authHeader]);

  // Fetch user's cars
  const fetchCars = useCallback(async () => {
    if (!token || !user) {
      setIsLoadingData(false);
      return;
    }
    
    try {
      const profileRes = await axios.get(`${API_URL}/users/me`, authHeader);
      if (profileRes.data.success) {
        // Create a unique ID for each car to prevent duplicate key issues
        const carsWithUniqueIds = (profileRes.data.userData.cars || []).map((car, index) => ({
          ...car,
          uniqueId: `${car._id || 'car'}-${index}-${Date.now()}`
        }));
        setStolenCars(carsWithUniqueIds);
      }
    } catch (err) {
      console.error('Failed to load cars:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, [token, user, authHeader]);

  // Initial data loading
  useEffect(() => {
    if (isLoggedIn && user) {
      Promise.all([
        fetchVenueData(),
        fetchCars(),
        checkAndUpdateJailStatus().then(status => setJailStatus(status))
      ]).then(() => setIsLoadingData(false));
    } else {
      setStolenCars([]);
      setVenueData({});
      setIsLoadingData(false);
    }
  }, [isLoggedIn, user, fetchVenueData, fetchCars, checkAndUpdateJailStatus]);

  // Preload all venue and car images once venue data is loaded
  useEffect(() => {
    if (Object.keys(venueData).length > 0) {
      // Preload venue images
      Object.values(venueData).forEach(venue => {
        preloadImage(venue.image);
        // Preload car images for each venue
        if (venue.carImages) {
          venue.carImages.forEach(carImage => preloadImage(carImage));
        }
      });
      
      // Preload common feedback images
      preloadImage('/assets/police-car.png');
      preloadImage('/assets/escape.png');
      preloadImage('/assets/default-car.png');
    }
  }, [venueData]);

  // Handle jail release
  const handleReleaseFromJail = useCallback(() => {
    updateUserData({ inJail: false, jailTimeEnd: null, jailRecord: null });
    setJailStatus(null);
    setResult({
      show: true,
      type: 'success',
      message: 'Released from jail! Back to the streets.',
      car: null,
      venue: null
    });
  }, [updateUserData]);

  // Update jail status
  const handleUpdateJailStatus = useCallback((status) => {
    setJailStatus(status);
  }, []);

  // Close result modal
  const closeResult = () => {
    setResult({ show: false, type: null, message: '', car: null, venue: null });
  };

  // Car theft attempt function
  const stealCar = async (venueName) => {
    if (isInJail || isStealing) return;
    
    setIsStealing(venueName);
    const selectedVenue = venueData[venueName];
    
    try {
      const res = await axios.post(
        `${API_URL}/cartheft/steal`,
        { venueName },
        authHeader
      );
      
      if (res.data.success) {
        // Add unique ID to the car
        const stolenCar = {
          ...res.data.car,
          uniqueId: `${res.data.car._id || 'car'}-${Date.now()}`
        };
        
        // Update stolen cars list
        setStolenCars(prev => [...prev, stolenCar]);
        
        // Update user data
        updateUserData({ 
          xp: res.data.xp, 
          rank: res.data.rank, 
          level: res.data.level 
        });
        
        // Show success feedback
        setResult({
          show: true,
          type: 'success',
          message: res.data.message,
          car: stolenCar,
          venue: selectedVenue
        });
      } else {
        // Failed but escaped
        setResult({
          show: true,
          type: 'escaped',
          message: res.data.message,
          car: null,
          venue: selectedVenue
        });
      }
    } catch (error) {
      const errorData = error.response?.data;
      
      if (errorData?.inJail) {
        // Caught and jailed
        setResult({
          show: true,
          type: 'caught',
          message: errorData.message,
          car: null,
          venue: selectedVenue
        });
        
        // Update jail status
        checkAndUpdateJailStatus();
      } else {
        // Generic error
        setResult({
          show: true,
          type: 'escaped',
          message: errorData?.message || 'Something went wrong during the heist.',
          car: null,
          venue: selectedVenue
        });
      }
    } finally {
      setIsStealing(null);
    }
  };

  // Sell car function
  const sellCar = async (index) => {
    if (isSelling !== null || isInJail) return;
    
    setIsSelling(index);
    const carToSell = stolenCars[index];
    
    try {
      const res = await axios.post(
        `${API_URL}/cartheft/sell`,
        { carIndex: index },
        authHeader
      );
      
      if (res.data.success) {
        // Update cars list with unique IDs
        const updatedCars = (res.data.cars || []).map((car, i) => ({
          ...car,
          uniqueId: `${car._id || 'car'}-${i}-${Date.now()}`
        }));
        
        setStolenCars(updatedCars);
        updateUserData({ money: res.data.money });
        
        // Show success feedback
        setResult({
          show: true,
          type: 'success',
          message: res.data.message,
          car: { ...carToSell, sold: true }
        });
      } else {
        // Failed to sell
        setResult({
          show: true,
          type: 'escaped',
          message: res.data.message || 'Failed to sell the car.',
          car: null
        });
      }
    } catch (error) {
      // Error handling
      setResult({
        show: true,
        type: 'escaped',
        message: error.response?.data?.message || 'Error selling car.',
        car: null
      });
    } finally {
      setIsSelling(null);
    }
  };

  // Loading state
  if (authLoading || isLoadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
        <p className="text-xl">Loading Car Theft Operations...</p>
      </div>
    );
  }
  
  // Auth check
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <FaLock className="text-6xl text-blue-500 mb-4 mx-auto" />
          <p className="text-xl">Please log in to access Car Theft.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white pt-20 pb-12 px-4">
      {/* Result Modal */}
      {result.show && (
        <ResultModal
          type={result.type}
          message={result.message}
          car={result.car}
          venue={result.venue}
          onClose={closeResult}
        />
      )}

      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <FaCarCrash className="mx-auto text-6xl text-red-500 mb-4" />
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-400 mb-2">
            Grand Theft Spudo
          </h1>
          <p className="text-lg text-gray-400 italic">
            Higher level, better odds. Choose your target wisely.
          </p>
          
          {/* Level & Stats Display */}
          <div className="mt-4 inline-flex gap-4 bg-gray-800/50 rounded-lg p-2">
            <div className="px-3 py-1 bg-gray-700/50 rounded">
              <span className="text-xs text-gray-400">Level</span>
              <p className="font-bold text-yellow-400">{user?.level || 1}</p>
            </div>
            <div className="px-3 py-1 bg-gray-700/50 rounded">
              <span className="text-xs text-gray-400">XP</span>
              <p className="font-bold text-blue-400">{user?.xp || 0}</p>
            </div>
            <div className="px-3 py-1 bg-gray-700/50 rounded">
              <span className="text-xs text-gray-400">Rank</span>
              <p className="font-bold text-purple-400">{user?.rank || 'Rookie'}</p>
            </div>
          </div>
        </div>

        <div className="relative mb-16">
          {/* Jail Overlay */}
          {isInJail && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center p-4 border-2 border-yellow-500 shadow-lg">
              <JailStatus
                onRelease={handleReleaseFromJail}
                onUpdateJailStatus={handleUpdateJailStatus}
                token={token}
              />
            </div>
          )}

          {/* Venue Grid */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ${isInJail ? 'opacity-30 pointer-events-none' : ''}`}>
            {Object.entries(venueData).map(([venueName, venue]) => {
              const isLoadingThis = isStealing === venueName;
              const displayChance = calculateSuccessDisplayChance(venue.baseChance, user?.level);
              
              return (
                <div
                  key={venueName}
                  className={`bg-gradient-to-br ${venue.backgroundColor || 'from-gray-700 to-gray-800'} rounded-xl shadow-lg p-5 text-center flex flex-col justify-between border border-gray-600/50 transition-all duration-300 ease-in-out transform ${!isInJail && !isStealing ? 'hover:scale-102 hover:shadow-lg' : ''}`}
                >
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold mb-2 text-white">{venueName}</h3>
                    <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-gray-800/70 rounded mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-yellow-400">
                        {venue.difficulty}
                      </span>
                    </div>
                    <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-gray-800/70 rounded mb-3">
                      <FaPercentage className="text-cyan-400" /> 
                      <span className="font-medium text-cyan-300">{displayChance}%</span>
                    </div>
                    <div className="h-100 w-100 mb-4 flex items-center justify-center bg-gray-800/50 rounded-lg overflow-hidden p-2">
                      <img 
                        src={venue.image} 
                        alt={venueName} 
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                        onError={(e) => {e.target.src = '/assets/default-venue.png';}}
                      />
                    </div>
                    <p className="text-sm text-gray-300 mb-4">{venue.description}</p>
                  </div>
                  <button
                    onClick={() => stealCar(venueName)}
                    disabled={isInJail || !!isStealing}
                    className={`w-full mt-auto py-2.5 px-4 rounded-lg font-semibold text-white transition duration-200 flex items-center justify-center gap-2 shadow-md ${
                      isLoadingThis ? 'bg-blue-700 cursor-wait' :
                      isStealing ? 'bg-gray-500 cursor-not-allowed' :
                      'bg-blue-600 hover:bg-blue-500 active:bg-blue-700'
                    }`}
                  >
                    {isLoadingThis ? (
                      <><FaSpinner className="animate-spin" /> Hotwiring...</>
                    ) : (
                      <><FaKey /> Attempt Heist</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Garage Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowGarage((prev) => !prev)}
            disabled={isInJail}
            className={`bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full transition duration-300 shadow-lg flex items-center justify-center gap-2 mx-auto ${
              isInJail ? 'opacity-50 cursor-not-allowed' : 'hover:from-purple-700 hover:to-indigo-700 transform hover:scale-105'
            }`}
          >
            <FaWarehouse /> {showGarage ? 'Hide Garage' : 'Open Garage'} ({stolenCars.length})
          </button>
        </div>

        {/* Stolen Cars List */}
        {showGarage && (
          <div className="mt-4 bg-gray-800/70 backdrop-blur-md p-6 rounded-xl shadow-inner border border-gray-700/50 animate-fadeIn">
            <h3 className="text-3xl font-semibold mb-6 text-gray-200 text-center">Your Stolen Rides</h3>
            {stolenCars.length > 0 ? (
              <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {stolenCars.map((car, idx) => {
                  const isSellingThis = isSelling === idx;
                  const sellValue = car.price || 0;
                  return (
                    <li
                      key={car.uniqueId || `car-${idx}-${Date.now()}`}
                      className="flex flex-col sm:flex-row items-center justify-between bg-gray-700/80 p-4 rounded-lg shadow transition-all duration-200 hover:bg-gray-700"
                    >
                      <div className="flex items-center mb-3 sm:mb-0 flex-grow mr-4">
                        <div className="w-20 h-16 flex items-center justify-center border border-gray-600 bg-gray-800 p-1 rounded mr-4">
                          <img
                            src={car.image || '/assets/default-car.png'}
                            className="max-w-full max-h-full object-contain"
                            alt={car.name}
                            loading="lazy"
                            onError={(e) => {e.target.src = '/assets/default-car.png';}}
                          />
                        </div>
                        <div className="flex-grow">
                          <span
                            className="font-medium text-lg text-gray-100 block truncate"
                            title={car.name}
                          >
                            {car.name}
                          </span>
                          <span className="text-sm text-green-400 flex items-center gap-1">
                            <FaDollarSign /> Est. Value:{' '}
                            {sellValue.toLocaleString()}
                          </span>
                          {car.category && (
                            <span className="text-xs text-blue-300 block">
                              {car.category.charAt(0).toUpperCase() + car.category.slice(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => sellCar(idx)}
                        disabled={!!isSelling || isInJail}
                        className={`bg-green-600 text-white px-5 py-2 rounded-lg transition duration-200 text-sm font-semibold flex items-center justify-center flex-shrink-0 ${
                          isInJail
                            ? 'bg-gray-500 cursor-not-allowed'
                            : isSellingThis
                            ? 'opacity-70 cursor-wait'
                            : isSelling
                            ? 'bg-gray-500 cursor-not-allowed'
                            : 'hover:bg-green-500 active:bg-green-700 transform hover:scale-105'
                        }`}
                      >
                        {isSellingThis ? (
                          <FaSpinner className="animate-spin h-5 w-5" />
                        ) : (
                          'Sell'
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-8">
                <FaCarSide className="text-4xl text-blue-500 mx-auto mb-3 opacity-50" />
                <p className="text-gray-400 italic">Garage's looking empty... Hit the streets!</p>
              </div>
            )}
          </div>
        )}
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        Potato Underworld © {new Date().getFullYear()}. All rights reserved.
      </footer>
    </div>
  );
};

// Add these animations to your CSS file or Tailwind config
const cssAnimations = `
@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes shake {
  10%, 90% { transform: translate3d(-1px, 0, 0); }
  20%, 80% { transform: translate3d(2px, 0, 0); }
  30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
  40%, 60% { transform: translate3d(4px, 0, 0); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-slideIn {
  animation: slideIn 0.3s ease forwards;
}

.animate-shake {
  animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease forwards;
}

.animate-pulse {
  animation: pulse 1s infinite;
}

.animate-bounce {
  animation: bounce 0.5s ease infinite;
}

.hover\\:scale-102:hover {
  transform: scale(1.02);
}
`;

export default CarTheft;