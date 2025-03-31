import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import JailStatus from '../components/JailStatus'; // Keep importing the component
import axios from 'axios';
import { FaCarCrash, FaWarehouse, FaDollarSign, FaCheckCircle, FaTimesCircle, FaSpinner, FaKey, FaLock } from 'react-icons/fa'; // Added FaLock

const API_URL = import.meta.env.VITE_API_URL || '/api';

const venues = {
  'Rich Potato Neighborhood': { image: '/assets/rich.png', difficulty: 'High Risk', description: 'Luxury rides, heavy security.' },
  'Spudville Downtown': { image: '/assets/downtown.png', difficulty: 'Medium Risk', description: 'Busy streets, decent cars.' },
  'Fries End Suburbs': { image: '/assets/fries.png', difficulty: 'Medium Risk', description: 'Standard vehicles, moderate watch.' },
  'Mashy Meadows': { image: '/assets/mashy.png', difficulty: 'Low Risk', description: 'Older cars, less attention.' },
  'Tuber Town': { image: '/assets/tuber.png', difficulty: 'Low Risk', description: 'Work trucks and basic transport.' },
};

const CarTheft = () => {
  const { money, xp, rank, updateUserData, checkAndUpdateJailStatus, isInJail, jailEndTime, isLoggedIn, loading: authLoading, user } = useContext(AuthContext);
  const [stolenCars, setStolenCars] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [showGarage, setShowGarage] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isStealing, setIsStealing] = useState(null);
  const [isSelling, setIsSelling] = useState(null);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchCars = useCallback(async () => {
    if (!token || !user) return;
    // No need to set loading here, let initial authLoading handle it
    // setIsLoadingData(true);
    try {
      const profileRes = await axios.get(`${API_URL}/users/profile`, authHeader);
      if (profileRes.data.success) {
        setStolenCars(profileRes.data.userData.cars || []);
      } else {
         console.error("Failed to fetch cars from profile:", profileRes.data.message);
         setFailureMessage("Could not load your car data.");
      }
    } catch (error) {
      console.error('Error fetching cars data:', error);
      setFailureMessage(error.response?.data?.message || 'Failed to load car data.');
    } finally {
       // Ensure loading is false after fetch attempt, even if context is still loading initially
       setIsLoadingData(false);
    }
  }, [token, user]); // Removed setIsLoadingData from here

  useEffect(() => {
    if (isLoggedIn) {
        fetchCars();
        checkAndUpdateJailStatus();
    } else {
        setStolenCars([]);
        setIsLoadingData(false); // Set loading false if not logged in
    }
  }, [isLoggedIn, fetchCars, checkAndUpdateJailStatus]);

  useEffect(() => {
    let timer;
    if (failureMessage || successMessage) {
        timer = setTimeout(() => {
            setFailureMessage('');
            setSuccessMessage('');
        }, 5000);
    }
    return () => clearTimeout(timer);
  }, [failureMessage, successMessage]);

  const handleReleaseFromJail = useCallback(() => {
    setSuccessMessage('You are now free from jail! Time to get back to business.');
    // No need to fetch here usually, context update should trigger re-renders
    // fetchCars();
  }, []);

  const stealCar = async (venueName) => {
    // ...(steal logic remains the same)...
    if (isInJail || isStealing) return;
    setIsStealing(venueName);
    setSuccessMessage('');
    setFailureMessage('');
    try {
      const res = await axios.post(`${API_URL}/cartheft/steal`, { venueName }, authHeader);
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setStolenCars((prev) => [...prev, res.data.car]);
        updateUserData({ xp: res.data.xp, rank: res.data.rank });
      }
    } catch (error) {
      const errorData = error.response?.data;
      setFailureMessage(errorData?.message || 'An error occurred during the theft attempt.');
      if (errorData?.inJail) { checkAndUpdateJailStatus(); }
    } finally { setIsStealing(null); }
  };

  const sellCar = async (index) => {
    // ...(sell logic remains the same)...
     if (isSelling !== null || isInJail) return;
    setIsSelling(index);
    setSuccessMessage('');
    setFailureMessage('');
    try {
      const res = await axios.post(`${API_URL}/cartheft/sell`, { carIndex: index }, authHeader);
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setStolenCars(res.data.cars);
        updateUserData({ money: res.data.money });
      } else { setFailureMessage(res.data.message || 'Failed to sell the car.'); }
    } catch (error) { setFailureMessage(error.response?.data?.message || 'An error occurred while selling the car.'); }
    finally { setIsSelling(null); }
  };

  // Use combined loading state
  const pageLoading = authLoading || isLoadingData;

  if (pageLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Car Theft Operations...</div>;
  }
  if (!isLoggedIn) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Please log in to access Car Theft.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
          <FaCarCrash className="mx-auto text-6xl text-red-500 mb-4" />
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 mb-2">
            Grand Theft Spudo
          </h1>
          <p className="text-lg text-gray-400 italic">
            "Fast cars, faster getaways. Just keep your eyes peeled for Sheriff Tater."
          </p>
        </div>

         {/* Message Area - Only for Success/Failure now */}
         <div className="h-12 mb-6 max-w-3xl mx-auto text-center">
            {/* JailStatus component is removed from here */}
            {!isInJail && successMessage && ( <div className="p-3 bg-green-500/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm"><FaCheckCircle className="mr-2 flex-shrink-0" /> {successMessage}</div>)}
            {!isInJail && failureMessage && (<div className="p-3 bg-red-500/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm"><FaTimesCircle className="mr-2 flex-shrink-0" /> {failureMessage}</div>)}
        </div>


        {/* Theft Venues Grid - Wrapped for Overlay */}
        <div className="relative"> {/* <<< Wrapper with relative positioning */}

            {/* --- JAIL OVERLAY --- */}
            {isInJail && (
                <div className="absolute inset-0 bg-yellow-500/20 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center p-4">
                    {/* Render the JailStatus component prominently inside the overlay */}
                    <JailStatus jailTimeEnd={jailEndTime} onRelease={handleReleaseFromJail} />
                    <p className="mt-4 text-xl font-bold text-yellow-800 flex items-center gap-2">
                        <FaLock /> Actions Disabled While Jailed
                    </p>
                </div>
            )}
             {/* --- END JAIL OVERLAY --- */}

            {/* Actual Grid - Apply opacity when jailed */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 ${isInJail ? 'opacity-30 pointer-events-none' : ''}`}>
                {Object.entries(venues).map(([venueName, venue]) => {
                    const isLoadingThis = isStealing === venueName;
                    return (
                        // Card container - Remove grayscale filter
                        <div key={venueName} className={`bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-lg p-5 text-center flex flex-col justify-between border border-gray-600/50 transform transition duration-300 ease-in-out ${!isInJail && !isStealing ? 'hover:scale-105 hover:shadow-purple-500/20 hover:border-purple-500/50' : ''}`}>
                            <div>
                                <h3 className="text-xl font-semibold mb-2 text-purple-300">{venueName}</h3>
                                <p className="text-xs font-bold uppercase tracking-wider mb-3 text-yellow-400">{venue.difficulty}</p>
                                <div className="h-40 mb-4 flex items-center justify-center bg-gray-800/50 rounded-lg overflow-hidden p-2">
                                    <img src={venue.image} className="max-h-full max-w-full object-contain" alt={venueName} loading="lazy"/>
                                </div>
                                <p className="text-sm text-gray-400 mb-4">{venue.description}</p>
                            </div>
                            <button
                                // Keep disabled logic based on state
                                disabled={isInJail || !!isStealing}
                                onClick={() => stealCar(venueName)}
                                className={`w-full mt-auto py-2.5 px-4 rounded-lg font-semibold text-white transition duration-200 ease-in-out flex items-center justify-center gap-2 shadow-md ${
                                    // Button styling doesn't need jail check anymore, disabled handles it
                                    isLoadingThis ? 'bg-blue-700 cursor-wait' :
                                    isStealing ? 'bg-gray-500 cursor-not-allowed' :
                                    'bg-blue-600 hover:bg-blue-500 transform hover:scale-105'
                                }`}
                            >
                                {isLoadingThis ? (<> <FaSpinner className="animate-spin" /> Hotwiring... </>) : (<> <FaKey /> Attempt Heist </>)}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div> {/* End of relative wrapper */}


        {/* Toggle Garage Button */}
        <div className="text-center mb-8">
             <button onClick={() => setShowGarage((v) => !v)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-3 rounded-full hover:from-purple-700 hover:to-indigo-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-opacity-50 shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 mx-auto">
                 <FaWarehouse /> {showGarage ? 'Hide Garage' : 'Open Garage'} ({stolenCars.length})
             </button>
        </div>


        {/* Garage Section (remains the same) */}
        {showGarage && (
          <div className="mt-4 bg-gray-800/70 backdrop-blur-md p-6 md:p-8 rounded-xl shadow-inner border border-gray-700/50 animate-fade-in">
            <h3 className="text-3xl font-semibold mb-6 text-gray-200 text-center">Your Stolen Rides</h3>
            {stolenCars.length > 0 ? (
               <ul className="space-y-4">
                  {stolenCars.map((car, idx) => {
                     // ...(garage item rendering logic remains the same)...
                      const isSellingThis = isSelling === idx;
                      const sellValue = car.price || 0;
                      return (
                        <li key={car._id || idx} className="flex flex-col sm:flex-row items-center justify-between bg-gray-700/80 p-4 rounded-lg shadow hover:bg-gray-700 transition duration-200">
                          <div className="flex items-center mb-3 sm:mb-0 flex-grow mr-4">
                              <img src={car.image || '/assets/default.png'} className="w-20 h-16 object-contain rounded mr-4 border border-gray-600 bg-gray-800 p-1 flex-shrink-0" alt={car.name} />
                              <div className="flex-grow">
                                <span className="font-medium text-lg text-gray-100 block truncate" title={car.name}>{car.name}</span>
                                <span className="text-sm text-green-400 flex items-center gap-1"><FaDollarSign/> Est. Value: ${sellValue.toLocaleString()}</span>
                              </div>
                          </div>
                          <button
                              onClick={() => sellCar(idx)}
                              disabled={!!isSelling || isInJail}
                              className={`bg-green-600 text-white px-5 py-2 rounded-lg transition duration-200 text-sm font-semibold flex items-center justify-center flex-shrink-0 ${ isInJail ? 'bg-gray-500 cursor-not-allowed' : isSellingThis ? 'opacity-70 cursor-wait' : isSelling ? 'bg-gray-500 cursor-not-allowed' : 'hover:bg-green-500 transform hover:scale-105' }`}
                          >
                              {isSellingThis ? <FaSpinner className="animate-spin h-5 w-5" /> : 'Sell'}
                          </button>
                        </li>
                      );
                  })}
              </ul>
              ) : ( <p className="text-center text-gray-400 italic py-5">Garage's looking empty... Hit the streets!</p> )}
          </div>
        )}

        {/* User Stats Display (optional) */}
      </div>
    </div>
  );
};

export default CarTheft;