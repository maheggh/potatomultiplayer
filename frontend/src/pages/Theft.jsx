import React, { useState, useEffect, useContext, useCallback, useMemo, Suspense } from 'react';
import { AuthContext } from '../context/AuthContext';
import JailStatus from '../components/JailStatus';
import axios from 'axios';
import {
  FaHandPaper, FaDollarSign, FaCheckCircle,
  FaTimesCircle, FaSpinner, FaBox, FaLock, FaPercentage,
  FaShoppingBag, FaExclamationTriangle
} from 'react-icons/fa';

// Pre-load common images
const preloadImage = (src) => {
  const img = new Image();
  img.src = src;
};

// Constants - move outside component to prevent re-creation
const API_URL = import.meta.env.VITE_API_URL || '/api';

const categories = {
  'Purse': { 
    image: '/assets/purse.png', 
    description: 'Quick snatch, low reward.', 
    baseChance: 60,
    successAnimation: 'animate-bounce',
    failAnimation: 'animate-shake',
    backgroundColor: 'from-orange-700 to-orange-900'
  },
  'ATM': { 
    image: '/assets/atm.png', 
    description: 'Crackable cash source.', 
    baseChance: 40,
    successAnimation: 'animate-pulse',
    failAnimation: 'animate-shake',
    backgroundColor: 'from-green-700 to-green-900'
  },
  'Jewelry Store': { 
    image: '/assets/jewelry.png', 
    description: 'Sparkly goods, higher risk.', 
    baseChance: 30,
    successAnimation: 'animate-sparkle',
    failAnimation: 'animate-shake-hard',
    backgroundColor: 'from-blue-700 to-blue-900'
  },
  'Bank': { 
    image: '/assets/bank.png', 
    description: 'The big score, heavy penalty.', 
    baseChance: 5,
    successAnimation: 'animate-jackpot',
    failAnimation: 'animate-alarm',
    backgroundColor: 'from-purple-700 to-purple-900'
  }
};

// Memoized helper function
const getItemImage = (item) => {
  if (item?.image && !item.image.includes('default-loot')) { 
    return item.image; 
  }
  const name = item?.name?.toLowerCase().replace(/\s+/g, '-');
  return name ? `/assets/${name}.png` : '/assets/default-loot.png';
};

const calculateSuccessDisplayChance = (baseChance, userLevel) => {
  const levelBonus = (userLevel || 1) * 1; // Reduced from 1.5 to 1 for balance
  const calculatedChance = baseChance + levelBonus;
  return Math.max(5, Math.min(calculatedChance, 85)).toFixed(1); // Capped at 85% instead of 95%
};

// Feedback Modal Component for clearer outcomes
const FeedbackModal = ({ type, message, item, onClose }) => {
  if (!message) return null;

  let bgColor, icon, animation, itemImage;
  
  if (type === 'success') {
    bgColor = 'bg-green-800';
    icon = <FaCheckCircle className="text-3xl text-green-400" />;
    animation = 'animate-slideIn';
    itemImage = item ? getItemImage(item) : null;
  } else {
    bgColor = 'bg-red-800';
    icon = <FaTimesCircle className="text-3xl text-red-400" />;
    animation = 'animate-shake';
    itemImage = '/assets/police-siren.png';
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70 backdrop-blur-sm">
      <div className={`${bgColor} ${animation} rounded-xl p-6 max-w-md mx-auto shadow-2xl border border-gray-700 transform transition-all`}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 text-4xl">
            {icon}
          </div>
          
          {itemImage && (
            <div className="mb-4 p-2 bg-gray-900/50 rounded-lg">
              <img 
                src={itemImage} 
                alt={item?.name || 'Result'} 
                className="w-32 h-32 object-contain mx-auto"
                onError={(e) => {e.target.src = '/assets/default-loot.png';}}
              />
            </div>
          )}
          
          <h3 className="text-xl font-bold text-white mb-2">
            {type === 'success' ? 'Success!' : 'Busted!'}
          </h3>
          
          <p className="text-white mb-4">{message}</p>
          
          {item && type === 'success' && (
            <div className="mb-4 py-2 px-4 bg-green-900/50 rounded-lg">
              <p className="text-green-300 font-bold">${item.price.toLocaleString()}</p>
            </div>
          )}
          
          <button 
            onClick={onClose}
            className={`mt-2 py-2 px-4 rounded ${type === 'success' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'} text-white font-bold transition-colors`}
          >
            {type === 'success' ? 'Sweet!' : 'Darn!'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Actual Theft Component
const Theft = () => {
  // Extract what we need from context
  const {
    money, xp, rank, level, updateUserData, checkAndUpdateJailStatus,
    isInJail, isLoggedIn, loading: authLoading, user, token
  } = useContext(AuthContext);

  // State management
  const [stolenItems, setStolenItems] = useState([]);
  const [feedback, setFeedback] = useState({ show: false, type: null, message: '', item: null });
  const [showPocket, setShowPocket] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isStealing, setIsStealing] = useState(null);
  const [isSelling, setIsSelling] = useState(null);
  const [jailStatus, setJailStatus] = useState(null);
  const [loadedImages, setLoadedImages] = useState({});

  // Memoize auth header to prevent recreation
  const authHeader = useMemo(() => 
    token ? { headers: { Authorization: `Bearer ${token}` } } : null,
  [token]);

  // Preload common images when component mounts
  useEffect(() => {
    // Preload category images
    Object.values(categories).forEach(category => {
      preloadImage(category.image);
    });
    // Preload common feedback images
    preloadImage('/assets/police-siren.png');
    preloadImage('/assets/default-loot.png');
  }, []);

  // Optimized data fetching
  const fetchStolenItems = useCallback(async () => {
    if (!token || !user) return;
    try {
      const itemsRes = await axios.get(`${API_URL}/theft/stolen-items`, authHeader);
      if (itemsRes.data.success) {
        setStolenItems(itemsRes.data.stolenItems || []);
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [token, user, authHeader]);

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchStolenItems();
      checkAndUpdateJailStatus().then(status => {
        setJailStatus(status);
      });
    } else {
      setStolenItems([]);
      setIsLoadingData(false);
    }
  }, [isLoggedIn, user, fetchStolenItems, checkAndUpdateJailStatus]);

  const handleReleaseFromJail = useCallback(() => {
    updateUserData({ inJail: false, jailTimeEnd: null, jailRecord: null });
    setJailStatus(null);
    setFeedback({
      show: true,
      type: 'success',
      message: 'Released from jail! Back to business.',
      item: null
    });
  }, [updateUserData]);

  const handleUpdateJailStatus = useCallback((status) => {
    setJailStatus(status);
  }, []);

  const closeFeedback = () => {
    setFeedback({ show: false, type: null, message: '', item: null });
  };

  const stealItem = async (categoryName) => {
    if (isInJail || isStealing) return;
    
    setIsStealing(categoryName);
    
    try {
      const res = await axios.post(
        `${API_URL}/theft/steal`, 
        { itemType: categoryName }, 
        authHeader
      );
      
      if (res.data.success) {
        if (res.data.stolenItem) {
          setStolenItems(prev => [...prev, res.data.stolenItem]);
          
          // Show success feedback with item
          setFeedback({
            show: true,
            type: 'success',
            message: res.data.message,
            item: res.data.stolenItem
          });
        } else {
          // Success but no item
          setFeedback({
            show: true,
            type: 'success',
            message: res.data.message,
            item: null
          });
        }
        
        updateUserData({ 
          xp: res.data.xp, 
          rank: res.data.rank, 
          level: res.data.level 
        });
      }
    } catch (error) {
      const errorData = error.response?.data;
      
      // Show failure feedback
      setFeedback({
        show: true,
        type: 'failure',
        message: errorData?.message || 'An error occurred during the theft.',
        item: null
      });
      
      // Check if sent to jail
      if (errorData?.inJail) {
        checkAndUpdateJailStatus();
      }
    } finally {
      setIsStealing(null);
    }
  };

  const sellItem = async (index) => {
    if (isSelling !== null || isInJail) return;
    
    setIsSelling(index);
    const itemToSell = stolenItems[index];
    
    try {
      const res = await axios.post(
        `${API_URL}/theft/sell`, 
        { itemIndex: index }, 
        authHeader
      );
      
      if (res.data.success) {
        setStolenItems(res.data.stolenItems);
        updateUserData({ money: res.data.money });
        
        // Show success feedback
        setFeedback({
          show: true,
          type: 'success',
          message: res.data.message,
          item: { ...itemToSell, sold: true }
        });
      } else {
        // Show failure feedback
        setFeedback({
          show: true,
          type: 'failure',
          message: res.data.message || 'Failed to sell the item.',
          item: null
        });
      }
    } catch (error) {
      setFeedback({
        show: true,
        type: 'failure',
        message: error.response?.data?.message || 'An error occurred while selling.',
        item: null
      });
    } finally {
      setIsSelling(null);
    }
  };

  // Loading state
  const pageLoading = authLoading || isLoadingData;
  if (pageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <FaSpinner className="animate-spin text-4xl text-orange-500 mb-4" />
        <p className="text-xl">Loading Theft Operations...</p>
      </div>
    );
  }
  
  // Auth check
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <FaLock className="text-6xl text-orange-500 mb-4 mx-auto" />
          <p className="text-xl">Please log in to access Petty Theft.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white pt-20 pb-12 px-4">
      {/* Feedback Modal */}
      {feedback.show && (
        <FeedbackModal
          type={feedback.type}
          message={feedback.message}
          item={feedback.item}
          onClose={closeFeedback}
        />
      )}

      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10">
          <FaHandPaper className="mx-auto text-6xl text-orange-500 mb-4" />
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-400 mb-2">
            Five-Finger Discount
          </h1>
          <p className="text-lg text-gray-400 italic">
            "More experience, better chances. But the bank? Still a long shot."
          </p>
          
          {/* Level & Stats Display */}
          <div className="mt-4 inline-flex gap-4 bg-gray-800/50 rounded-lg p-2">
            <div className="px-3 py-1 bg-gray-700/50 rounded">
              <span className="text-xs text-gray-400">Level</span>
              <p className="font-bold text-yellow-400">{level}</p>
            </div>
            <div className="px-3 py-1 bg-gray-700/50 rounded">
              <span className="text-xs text-gray-400">XP</span>
              <p className="font-bold text-blue-400">{xp}</p>
            </div>
            <div className="px-3 py-1 bg-gray-700/50 rounded">
              <span className="text-xs text-gray-400">Rank</span>
              <p className="font-bold text-purple-400">{rank}</p>
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

          {/* Theft Categories */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${isInJail ? 'opacity-30 pointer-events-none' : ''}`}>
            {Object.entries(categories).map(([name, details]) => {
              const isLoadingThis = isStealing === name;
              const chance = calculateSuccessDisplayChance(details.baseChance, level);
              return (
                <div 
                  key={name} 
                  className={`bg-gradient-to-br ${details.backgroundColor} rounded-xl shadow-lg p-5 text-center flex flex-col justify-between border border-gray-600/50 transition-all duration-300 ease-in-out transform hover:scale-102 hover:shadow-lg`}
                >
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold mb-2 text-white">{name}</h3>
                    <div className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-gray-800/70 rounded mb-3">
                      <FaPercentage className="text-cyan-400" /> 
                      <span className="font-medium text-cyan-300">{chance}%</span>
                    </div>
                    <div className="h-32 mb-4 flex items-center justify-center bg-gray-800/50 rounded-lg overflow-hidden p-2">
                      <img 
                        src={details.image} 
                        alt={name} 
                        className="max-h-full max-w-full object-contain"
                        loading="lazy"
                        onError={(e) => {e.target.src = '/assets/default-loot.png';}}
                      />
                    </div>
                    <p className="text-sm text-gray-300 mb-4">{details.description}</p>
                  </div>
                  <button
                    onClick={() => stealItem(name)}
                    disabled={isInJail || !!isStealing}
                    className={`w-full mt-auto py-2.5 px-4 rounded-lg font-semibold text-white transition duration-200 flex items-center justify-center gap-2 shadow-md ${
                      isLoadingThis ? 'bg-orange-700 cursor-wait' :
                      isStealing ? 'bg-gray-500 cursor-not-allowed' :
                      'bg-orange-600 hover:bg-orange-500 active:bg-orange-700'
                    }`}
                  >
                    {isLoadingThis ? (
                      <><FaSpinner className="animate-spin" /> Snatching...</>
                    ) : (
                      <><FaShoppingBag /> Attempt Theft</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pocket Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowPocket((prev) => !prev)}
            disabled={isInJail}
            className={`bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-8 py-3 rounded-full transition duration-300 shadow-lg flex items-center justify-center gap-2 mx-auto ${
              isInJail ? 'opacity-50 cursor-not-allowed' : 'hover:from-teal-600 hover:to-cyan-700 transform hover:scale-105'
            }`}
          >
            <FaBox /> {showPocket ? 'Hide Pocket' : 'Check Pocket'} ({stolenItems.length})
          </button>
        </div>

        {/* Stolen Items List */}
        {showPocket && (
          <div className="mt-4 bg-gray-800/70 backdrop-blur-md p-6 rounded-xl shadow-inner border border-gray-700/50 animate-fadeIn">
            <h3 className="text-3xl font-semibold mb-6 text-gray-200 text-center">Your Stolen Loot</h3>
            {stolenItems.length > 0 ? (
              <ul className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {stolenItems.map((item, idx) => {
                  const isSellingThis = isSelling === idx;
                  const itemKey = `${idx}-${item.name}-${item._id || 'unknown'}`;
                  return (
                    <li 
                      key={itemKey} 
                      className="flex flex-col sm:flex-row items-center justify-between bg-gray-700/80 p-4 rounded-lg shadow transition-all duration-200 hover:bg-gray-700"
                    >
                      <div className="flex items-center mb-3 sm:mb-0 flex-grow mr-4">
                        <div className="w-16 h-16 flex items-center justify-center border border-gray-600 bg-gray-800 p-1 rounded mr-4">
                          <img 
                            src={getItemImage(item)} 
                            className="max-w-full max-h-full object-contain" 
                            alt={item.name || 'Stolen'} 
                            loading="lazy"
                            onError={(e) => {e.target.src = '/assets/default-loot.png';}}
                          />
                        </div>
                        <div className="flex-grow">
                          <span className="font-medium text-lg text-gray-100 block">{item.name || 'Unknown Item'}</span>
                          <span className="text-sm text-green-400 flex items-center gap-1">
                            <FaDollarSign /> ${item.price?.toLocaleString() || 0}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => sellItem(idx)}
                        disabled={!!isSelling || isInJail}
                        className={`bg-green-600 text-white px-5 py-2 rounded-lg text-sm font-semibold flex items-center justify-center transition-all duration-200 ${
                          isInJail ? 'bg-gray-500 cursor-not-allowed' : 
                          isSellingThis ? 'opacity-70 cursor-wait' : 
                          'hover:bg-green-500 active:bg-green-700'
                        }`}
                      >
                        {isSellingThis ? <FaSpinner className="animate-spin h-5 w-5" /> : 'Sell'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-8">
                <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-3" />
                <p className="text-gray-400 italic">Your pocket's empty. Time to get grabby!</p>
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

export default Theft;