import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FaShoppingCart, FaBoxOpen, FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaWarehouse, FaCoins, FaExclamationTriangle } from 'react-icons/fa'; // Added FaExclamationTriangle

const API_URL = import.meta.env.VITE_API_URL || '/api';

const WeaponStore = () => {
  const { money, inventory, updateUserData, isLoggedIn, loading: authLoading } = useContext(AuthContext);
  const [weapons, setWeapons] = useState([]);
  const [isLoadingWeapons, setIsLoadingWeapons] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchWeapons = useCallback(async () => {
    // ...(fetch logic remains the same)...
    setIsLoadingWeapons(true);
    setErrorMessage('');
    try {
      const response = await axios.get(`${API_URL}/weapons`);
      setWeapons(response.data.success ? (response.data.items || []) : []);
      if (!response.data.success) {
          setErrorMessage(response.data.message || 'Failed to fetch weapons list.');
      }
    } catch (error) {
      console.error("Error fetching weapons:", error);
      setErrorMessage(error.response?.data?.message || 'Network error fetching weapons.');
    } finally {
      setIsLoadingWeapons(false);
    }
  }, []);

  useEffect(() => {
    // ...(useEffect logic remains the same)...
     if (isLoggedIn) {
        fetchWeapons();
    } else {
        setWeapons([]);
        setIsLoadingWeapons(false);
    }
  }, [fetchWeapons, isLoggedIn]);

  useEffect(() => {
    // ...(message timer logic remains the same)...
     let timer;
    if (errorMessage || successMessage) {
        timer = setTimeout(() => {
            setErrorMessage('');
            setSuccessMessage('');
        }, 4000);
    }
    return () => clearTimeout(timer);
  }, [errorMessage, successMessage]);

  const handleBuyWeapon = async (weaponId, weaponName, weaponPrice) => {
    // ...(buy logic remains the same)...
    if (isProcessingAction || money < weaponPrice) return;
    setIsProcessingAction(weaponId);
    setErrorMessage('');
    setSuccessMessage('');
    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(`${API_URL}/weapons/buy`, { weaponId }, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        updateUserData({ money: response.data.money, inventory: response.data.inventory });
        setSuccessMessage(`${weaponName} added to arsenal!`);
      } else { setErrorMessage(response.data.message || 'Failed to buy weapon.'); }
    } catch (error) { console.error("Error buying weapon:", error); setErrorMessage(error.response?.data?.message || 'Server error buying weapon.'); }
    finally { setIsProcessingAction(null); }
  };

  const handleSellWeapon = async (weaponName, sellPrice) => {
    // ...(sell logic remains the same)...
    if (isProcessingAction) return;
    setIsProcessingAction(weaponName);
    setErrorMessage('');
    setSuccessMessage('');
    const token = localStorage.getItem('token');
    try {
        const response = await axios.post(`${API_URL}/weapons/sell`, { weaponName }, { headers: { Authorization: `Bearer ${token}` } });
        if (response.data.success) { updateUserData({ money: response.data.money, inventory: response.data.inventory }); setSuccessMessage(`${weaponName} sold for $${sellPrice}!`); }
        else { setErrorMessage(response.data.message || 'Failed to sell weapon.'); }
    } catch (error) { console.error("Error selling weapon:", error); setErrorMessage(error.response?.data?.message || 'Server error selling weapon.'); }
    finally { setIsProcessingAction(null); }
  };

  const userOwnsWeapon = useCallback(
    // ...(userOwnsWeapon logic remains the same)...
    (weaponName) => inventory?.some((item) => item && item.name === weaponName), [inventory]
  );

  const weaponInventory = inventory?.filter(item => item && item.attributes?.accuracy !== undefined) || [];

  // --- Render Logic ---

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Authenticating...</div>;
  if (!isLoggedIn) return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Log in required.</div>;

  return (
    <div className="min-h-screen bg-gradient-to-bl from-gray-900 via-purple-900 to-gray-900 text-white pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Use max-w-screen-xl for a very wide layout on large screens */}
      <div className="container mx-auto max-w-screen-xl">

         {/* Message Area */}
         <div className="h-10 mb-6 max-w-3xl mx-auto"> {/* Centered message area */}
            {errorMessage && ( <div className="p-3 bg-red-500/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm"><FaTimesCircle className="mr-2 flex-shrink-0" /> {errorMessage}</div>)}
            {successMessage && (<div className="p-3 bg-green-500/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm"><FaCheckCircle className="mr-2 flex-shrink-0" /> {successMessage}</div>)}
        </div>

        {/* Main Content Grid - Include Sidebar for Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* Sidebar: Image and Status (Funds/Inventory) */}
            {/* Takes 4 cols on lg screens, full width below lg */}
            <aside className="lg:col-span-4 space-y-8">
                {/* The Tall Image */}
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-700 overflow-hidden">
                     <img
                        src="/assets/weaponstore.png" // Your tall 1024x1536 image
                        alt="Potato Weapon Master"
                        // Constrain height, let width adjust, contain the image
                        className="w-full h-auto max-h-[50vh] md:max-h-[60vh] object-contain rounded-lg"
                     />
                     {/* Optional: Add a caption if needed */}
                     {/* <p className="text-center text-xs text-gray-400 mt-2">The Quartermaster</p> */}
                </div>

                 {/* Money Display Card */}
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl shadow-lg border border-green-500/30">
                    <h2 className="text-xl sm:text-2xl mb-3 font-semibold text-green-300 flex items-center">
                        <FaCoins className="mr-3 text-yellow-400" size={24}/> Your Stash
                    </h2>
                    <p className="text-3xl sm:text-4xl font-bold text-green-400">
                        ${money?.toLocaleString()}
                    </p>
                </div>

                 {/* Inventory Display Card */}
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-xl shadow-lg border border-blue-500/30">
                    <h2 className="text-xl sm:text-2xl mb-4 font-semibold text-blue-300 flex items-center">
                        <FaBoxOpen className="mr-3" /> Your Arsenal
                    </h2>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2 border-l-2 border-gray-700 pl-3">
                         {weaponInventory.length > 0 ? (
                            weaponInventory.map((invItem, idx) => {
                                const sellPrice = invItem.price ? parseFloat((invItem.price * 0.5).toFixed(0)) : 0;
                                const isSellingThis = isProcessingAction === invItem.name;
                                return (
                                    <div key={invItem.name + idx} className="flex justify-between items-center bg-gray-800/70 p-3 rounded-lg shadow transition-colors duration-200 hover:bg-gray-800">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-200 font-medium text-sm sm:text-base truncate" title={invItem.name}>{invItem.name}</span>
                                            {invItem.quantity > 1 && <span className="text-xs text-gray-400 font-mono flex-shrink-0">(x{invItem.quantity})</span>}
                                        </div>
                                        <button
                                            onClick={() => handleSellWeapon(invItem.name, sellPrice)}
                                            disabled={!!isProcessingAction}
                                            className={`py-1 px-2.5 rounded-md text-xs font-semibold transition duration-200 flex items-center flex-shrink-0 ${ /* ... button styles ... */ !isProcessingAction ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}>
                                            {isSellingThis ? <svg className="animate-spin h-4 w-4 text-white" /* ... spinner svg ... */ xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg> : `Sell 💰${sellPrice}`}
                                        </button>
                                    </div>
                                );
                            })
                        ) : ( <p className="text-center text-gray-400 italic py-4">Arsenal is empty.</p> )}
                    </div>
                </div>
            </aside>

            {/* Main Content: Available Weapons */}
            {/* Takes 8 cols on lg screens, full width below lg */}
            <main className="lg:col-span-8 bg-gray-700/60 backdrop-blur-sm p-6 md:p-8 rounded-xl shadow-lg border border-gray-600/50">
                <h2 className="text-3xl md:text-4xl mb-8 font-semibold text-yellow-300 flex items-center">
                    <FaShoppingCart className="mr-4 text-yellow-400" size={30}/> Today's Specials
                </h2>
                {isLoadingWeapons ? (
                    <div className="text-center text-gray-400 py-10">Loading fresh inventory...</div>
                ) : weapons.length > 0 ? (
                    // Adjust grid columns based on available space (lg:col-span-8)
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                         {weapons.map((weapon) => {
                            const canAfford = money >= weapon.price;
                            const isOwned = userOwnsWeapon(weapon.name);
                            const isBuyingThis = isProcessingAction === weapon.id;
                            return (
                                <div key={weapon.id} className={`bg-gradient-to-b from-gray-800 to-gray-800/80 p-5 rounded-lg shadow-lg flex flex-col text-center border border-gray-700 hover:border-purple-500/50 transition-all duration-300 group ${isOwned ? 'opacity-70 filter grayscale-[50%]' : 'hover:shadow-purple-500/20 hover:-translate-y-1'}`}> {/* Added grayscale for owned */}
                                    {/* Image Container */}
                                    <div className="h-40 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                                         <img
                                            src={`/assets/${weapon.image || 'default.png'}`}
                                            alt={weapon.name}
                                            className="max-w-full max-h-full object-contain drop-shadow-lg"
                                            loading="lazy"
                                            onError={(e) => { e.target.onerror = null; e.target.src='/assets/default.png'; }}
                                        />
                                    </div>
                                    {/* Weapon Info */}
                                    <h3 className="text-lg font-semibold text-yellow-400 mb-1 truncate" title={weapon.name}>{weapon.name}</h3>
                                    <p className="text-green-400 font-bold text-xl mb-1 flex items-center justify-center gap-1">
                                        <FaCoins className="text-yellow-500 opacity-80" />{weapon.price?.toLocaleString()}
                                    </p>
                                    <p className="text-gray-300 text-xs mb-4">🎯 {weapon.accuracy}% Accuracy</p>
                                    {/* Button Area */}
                                    <div className="mt-auto pt-3">
                                         {isOwned ? (
                                            <span className="w-full block bg-gray-600 text-gray-300 py-2 px-4 rounded-lg cursor-not-allowed text-sm font-semibold opacity-80">
                                                In Arsenal
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => handleBuyWeapon(weapon.id, weapon.name, weapon.price)}
                                                disabled={!!isProcessingAction || !canAfford || isOwned}
                                                className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition duration-200 flex items-center justify-center shadow-md ${ /* ... button styles ... */ canAfford && !isProcessingAction ? 'bg-yellow-500 hover:bg-yellow-400 text-black transform hover:scale-105' : 'bg-gray-500 text-gray-300 cursor-not-allowed opacity-60'}`}>
                                                {isBuyingThis ? <svg className="animate-spin h-5 w-5 text-black" /* ... spinner svg ... */ xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path></svg> : (!canAfford ? 'Not Enough Cash' : 'Acquire')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 ) : ( <p className="text-center text-gray-400 py-10">The shelves are empty... check back later!</p> )}
            </main>

        </div>
      </div>
    </div>
  );
};

export default WeaponStore;