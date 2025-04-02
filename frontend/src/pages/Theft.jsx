import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import JailStatus from '../components/JailStatus';
import axios from 'axios';
import { FaShoppingBag, FaHandPaper, FaDollarSign, FaCheckCircle, FaTimesCircle, FaSpinner, FaBox, FaLock, FaPercentage } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const categories = {
    'Purse': { image: '/assets/purse.png', description: 'Quick snatch, low reward.', baseChance: 60 },
    'ATM': { image: '/assets/atm.png', description: 'Crackable cash source.', baseChance: 40 },
    'Jewelry Store': { image: '/assets/jewelry.png', description: 'Sparkly goods, higher risk.', baseChance: 30 },
    'Bank': { image: '/assets/bank.png', description: 'The big score, heavy penalty.', baseChance: 5 }
};

const getItemImage = (item) => {
     if (item?.image && !item.image.includes('default-loot')) { return item.image; }
     const name = item?.name?.toLowerCase().replace(/\s+/g, '-');
     return name ? `/assets/${name}.png` : '/assets/default-loot.png';
};

const calculateSuccessDisplayChance = (baseChance, userLevel) => {
  const levelBonus = (userLevel || 1) * 1.5;
  const calculatedChance = baseChance + levelBonus;
  return Math.max(5, Math.min(calculatedChance, 95)).toFixed(1);
};

const Theft = () => {
  const { money, xp, rank, updateUserData, checkAndUpdateJailStatus, isInJail, jailEndTime, isLoggedIn, loading: authLoading, user } = useContext(AuthContext);
  const [stolenItems, setStolenItems] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [showPocket, setShowPocket] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isStealing, setIsStealing] = useState(null);
  const [isSelling, setIsSelling] = useState(null);

  const token = localStorage.getItem('token');
  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchStolenItems = useCallback(async () => {
    if (!token || !user) return;
    try {
      const itemsRes = await axios.get(`${API_URL}/theft/stolen-items`, authHeader);
      if (itemsRes.data.success) {
        setStolenItems(itemsRes.data.stolenItems || []);
      } else {
         console.error("Failed to fetch stolen items:", itemsRes.data.message);
         setFailureMessage("Could not load your stolen loot.");
      }
    } catch (error) {
      console.error('Error fetching stolen items:', error);
      setFailureMessage(error.response?.data?.message || 'Failed to load stolen loot.');
    } finally {
        setIsLoadingData(false);
    }
  }, [token, user]);

  useEffect(() => {
    if (isLoggedIn && user) {
        fetchStolenItems();
        // Initial check or if jail status might have changed elsewhere
        checkAndUpdateJailStatus();
    } else if (!isLoggedIn) {
        setStolenItems([]);
        setIsLoadingData(false);
    }
  }, [isLoggedIn, user, fetchStolenItems, checkAndUpdateJailStatus]);

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

  // --- Updated handleReleaseFromJail ---
  const handleReleaseFromJail = useCallback(() => {
    console.log("Attempting to release from jail via handleReleaseFromJail");
    updateUserData({ inJail: false, jailTimeEnd: null }); // Directly update context state
    setSuccessMessage('Sprung from the slammer! Back to business.');
  }, [updateUserData]); // Added dependency

  const stealItem = async (categoryName) => {
    if (isInJail || isStealing) return;
    setIsStealing(categoryName);
    setSuccessMessage('');
    setFailureMessage('');
    try {
      const res = await axios.post(`${API_URL}/theft/steal`, { itemType: categoryName }, authHeader);
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        if(res.data.stolenItem) {
            setStolenItems((prev) => [...prev, res.data.stolenItem]);
        }
        updateUserData({ xp: res.data.xp, rank: res.data.rank });
      }
    } catch (error) {
      const errorData = error.response?.data;
      setFailureMessage(errorData?.message || 'An error occurred during the theft.');
      if (errorData?.inJail && errorData?.jailTimeEnd) {
         // Update context immediately when jailed by API response
         updateUserData({ inJail: true, jailTimeEnd: errorData.jailTimeEnd });
      }
    } finally {
        setIsStealing(null);
    }
  };

  const sellItem = async (index) => {
    if (isSelling !== null || isInJail) return;
    setIsSelling(index);
    setSuccessMessage('');
    setFailureMessage('');
    try {
      const res = await axios.post(`${API_URL}/theft/sell`, { itemIndex: index }, authHeader);
      if (res.data.success) {
        setSuccessMessage(res.data.message);
        setStolenItems(res.data.stolenItems);
        updateUserData({ money: res.data.money });
      } else { setFailureMessage(res.data.message || 'Failed to sell the item.'); }
    } catch (error) { setFailureMessage(error.response?.data?.message || 'An error occurred while selling.'); }
    finally { setIsSelling(null); }
  };

  const pageLoading = authLoading || isLoadingData;

  if (pageLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading Petty Theft Ops...</div>;
  }
   if (!isLoggedIn) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Please log in to access Petty Theft.</div>;
  }
  if (!user) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Loading User Data...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12">
           <FaHandPaper className="mx-auto text-6xl text-orange-500 mb-4" />
           <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400 mb-2">
            Five-Finger Discount
          </h1>
          <p className="text-lg text-gray-400 italic">
            "More experience, better chances. But the bank? Still a long shot."
          </p>
        </div>

         {/* Message Area */}
        <div className="h-12 mb-6 max-w-3xl mx-auto text-center">
            {!isInJail && successMessage && ( <div className="p-3 bg-green-500/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm"><FaCheckCircle className="mr-2 flex-shrink-0" /> {successMessage}</div>)}
            {!isInJail && failureMessage && (<div className="p-3 bg-red-500/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm"><FaTimesCircle className="mr-2 flex-shrink-0" /> {failureMessage}</div>)}
        </div>

        {/* --- Theft Categories Grid - Added mb-16 for spacing --- */}
         <div className="relative mb-16"> {/* <<< Added more margin-bottom */}

            {/* --- JAIL OVERLAY --- */}
             {isInJail && (
                 <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-xl z-10 flex flex-col items-center justify-center p-4 border-2 border-yellow-500 shadow-lg">
                   {/* Pass the updated handler */}
                   <JailStatus jailTimeEnd={jailEndTime} onRelease={handleReleaseFromJail} />
                   <p className="mt-4 text-xl font-bold text-yellow-400 flex items-center gap-2">
                      <FaLock /> Actions Disabled While Jailed
                   </p>
                </div>
            )}
             {/* --- END JAIL OVERLAY --- */}

             {/* Actual Grid */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${isInJail ? 'opacity-30 pointer-events-none' : ''}`}>
                {Object.entries(categories).map(([categoryName, details]) => {
                    const isLoadingThis = isStealing === categoryName;
                    const displayChance = calculateSuccessDisplayChance(details.baseChance, user.level);
                    return (
                         <div key={categoryName} className={`bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl shadow-lg p-5 text-center flex flex-col justify-between border border-gray-600/50 transition duration-300 ease-in-out ${!isInJail && !isStealing ? 'hover:scale-105 hover:shadow-orange-500/20 hover:border-orange-500/50' : ''}`}>
                            <div className="flex-grow">
                                <h3 className="text-xl font-semibold mb-2 text-orange-300">{categoryName}</h3>
                                <p className="text-sm font-medium text-cyan-300 mb-3 flex items-center justify-center gap-1">
                                    <FaPercentage /> Success Chance: {displayChance}%
                                </p>
                                <div className="h-40 mb-4 flex items-center justify-center bg-gray-800/50 rounded-lg overflow-hidden p-2">
                                    <img src={details.image} alt={categoryName} className="max-h-full max-w-full object-contain" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src='/assets/default-loot.png'; }} />
                                </div>
                                <p className="text-sm text-gray-400 mb-4">{details.description}</p>
                            </div>
                            <button
                                onClick={() => stealItem(categoryName)}
                                disabled={isInJail || !!isStealing}
                                className={`w-full mt-auto py-2.5 px-4 rounded-lg font-semibold text-white transition duration-200 ease-in-out flex items-center justify-center gap-2 shadow-md ${
                                    isLoadingThis ? 'bg-orange-700 cursor-wait' :
                                    isStealing ? 'bg-gray-500 cursor-not-allowed' :
                                    'bg-orange-600 hover:bg-orange-500 transform hover:scale-105'
                                }`}
                            >
                                {isLoadingThis ? (<> <FaSpinner className="animate-spin" /> Snatching... </>) : (<> <FaShoppingBag /> Attempt Theft </>)}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div> {/* End of relative wrapper */}


         {/* Toggle Pocket Button - Disable when jailed */}
        <div className="text-center mb-8">
            <button
              onClick={() => setShowPocket((prev) => !prev)}
              disabled={isInJail} // <<< Disable button when jailed
               className={`bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-8 py-3 rounded-full transition duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-50 shadow-lg transform hover:scale-105 flex items-center justify-center gap-2 mx-auto ${
                    isInJail
                      ? 'opacity-50 cursor-not-allowed' // Style when disabled
                      : 'hover:from-teal-600 hover:to-cyan-700 transform hover:scale-105' // Normal hover styles
               }`}
            >
              <FaBox/> {showPocket ? 'Hide Pocket' : 'Check Pocket'} ({stolenItems.length})
            </button>
        </div>

         {/* Pocket Section */}
        {showPocket && (
          <div className="mt-4 bg-gray-800/70 backdrop-blur-md p-6 md:p-8 rounded-xl shadow-inner border border-gray-700/50 animate-fade-in">
             {/* Pocket content... no changes needed inside */}
             {/* ... (rest of pocket code remains the same) ... */}
             <h3 className="text-3xl font-semibold mb-6 text-gray-200 text-center">Your Stolen Loot</h3>
            {stolenItems.length > 0 ? (
               <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {stolenItems.map((item, idx) => {
                     const isSellingThis = isSelling === idx;
                     const sellValue = item.price || 0;
                     return (
                       <li key={item._id || idx} className="flex flex-col sm:flex-row items-center justify-between bg-gray-700/80 p-4 rounded-lg shadow hover:bg-gray-700 transition duration-200">
                         <div className="flex items-center mb-3 sm:mb-0 flex-grow mr-4">
                             <img src={getItemImage(item)} alt={item.name || 'Stolen Item'} className="w-16 h-16 object-contain rounded-md mr-4 border border-gray-600 bg-gray-800 p-1 flex-shrink-0" loading="lazy" onError={(e) => { e.target.onerror = null; e.target.src='/assets/default-loot.png'; }} />
                              <div className="flex-grow">
                                <span className="font-medium text-lg text-gray-100 block truncate" title={item.name}>{item.name || 'Unknown Item'}</span>
                                <span className="text-sm text-green-400 flex items-center gap-1"><FaDollarSign/> Sell Value: ${sellValue.toLocaleString()}</span>
                              </div>
                         </div>
                         <button
                             onClick={() => sellItem(idx)}
                             disabled={!!isSelling || isInJail} // Sell button also disabled if jailed
                             className={`bg-green-600 text-white px-5 py-2 rounded-lg transition duration-200 text-sm font-semibold flex items-center justify-center flex-shrink-0 ${ isInJail ? 'bg-gray-500 cursor-not-allowed' : isSellingThis ? 'opacity-70 cursor-wait' : isSelling ? 'bg-gray-500 cursor-not-allowed' : 'hover:bg-green-500 transform hover:scale-105' }`}
                         >
                             {isSellingThis ? <FaSpinner className="animate-spin h-5 w-5" /> : 'Sell'}
                         </button>
                       </li>
                     );
                  })}
               </ul>
               ) : ( <p className="text-center text-gray-400 italic py-5">Pocket's empty. Time to get grabby!</p> )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Theft;