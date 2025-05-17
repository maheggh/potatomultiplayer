import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {
  FaShoppingCart, FaBoxOpen, FaMoneyBillWave, FaCheckCircle,
  FaTimesCircle, FaWarehouse, FaCoins, FaExclamationTriangle,
  FaArrowUp, FaArrowDown, FaFilter, FaSortAmountDown, FaSortAmountUp,
  FaBullseye, FaShoppingBag
} from 'react-icons/fa';
import { FaGun } from 'react-icons/fa6';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const WeaponStore = () => {
  const { money, inventory, updateUserData, isLoggedIn, loading: authLoading } = useContext(AuthContext);
  const [weapons, setWeapons] = useState([]);
  const [filteredWeapons, setFilteredWeapons] = useState([]);
  const [isLoadingWeapons, setIsLoadingWeapons] = useState(true);
  const [isProcessingAction, setIsProcessingAction] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [sortOrder, setSortOrder] = useState('priceAsc');
  const [showOwnedItems, setShowOwnedItems] = useState(true);
  const [filterAffordable, setFilterAffordable] = useState(false);

  const weaponCategories = {
    'pistol': { icon: <FaGun />, color: 'text-blue-400' }, // Using FaGun from fa6
    'rifle': { icon: '🎯', color: 'text-green-400' },
    'shotgun': { icon: '💥', color: 'text-orange-400' },
    'sniper': { icon: '🔭', color: 'text-purple-400' },
    'auto': { icon: '⚡', color: 'text-red-400' },
    'special': { icon: '✨', color: 'text-yellow-400' }
  };

  const getWeaponCategory = (weaponName) => {
    const lowerName = weaponName.toLowerCase();
    if (lowerName.includes('pistol') || lowerName.includes('handgun')) return 'pistol';
    if (lowerName.includes('rifle') && !lowerName.includes('sniper')) return 'rifle';
    if (lowerName.includes('shotgun') || lowerName.includes('pump')) return 'shotgun';
    if (lowerName.includes('sniper') || lowerName.includes('scope')) return 'sniper';
    if (lowerName.includes('machine') || lowerName.includes('auto')) return 'auto';
    return 'special';
  };

  const calculateValueRatio = (weapon) => {
    if (!weapon.price || weapon.price <= 0) return 0;
    return (weapon.accuracy / weapon.price) * 100;
  };

  const fetchWeapons = useCallback(async () => {
    setIsLoadingWeapons(true);
    setErrorMessage('');
    try {
      const response = await axios.get(`${API_URL}/weapons`);
      if (response.data.success) {
        const weaponsWithMetadata = (response.data.items || []).map(weapon => ({
          ...weapon,
          category: getWeaponCategory(weapon.name),
          valueRatio: calculateValueRatio(weapon)
        }));
        setWeapons(weaponsWithMetadata);
        applyFiltersAndSort(weaponsWithMetadata, sortOrder, filterAffordable, showOwnedItems);
      } else {
        setErrorMessage(response.data.message || 'Failed to fetch weapons list.');
      }
    } catch (error) {
      console.error("Error fetching weapons:", error);
      setErrorMessage(error.response?.data?.message || 'Network error fetching weapons.');
    } finally {
      setIsLoadingWeapons(false);
    }
  }, [sortOrder, filterAffordable, showOwnedItems]);

  const applyFiltersAndSort = (weaponsList, order, onlyAffordable, includeOwned) => {
    const userOwnsWeaponFunc = (weaponName) =>
      inventory?.some((item) => item && item.name === weaponName);

    let filtered = [...weaponsList];

    if (onlyAffordable) {
      filtered = filtered.filter(weapon => money >= weapon.price);
    }

    if (!includeOwned) {
      filtered = filtered.filter(weapon => !userOwnsWeaponFunc(weapon.name));
    }

    switch (order) {
      case 'priceAsc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'accuracyAsc':
        filtered.sort((a, b) => a.accuracy - b.accuracy);
        break;
      case 'accuracyDesc':
        filtered.sort((a, b) => b.accuracy - a.accuracy);
        break;
      case 'valueRatioDesc':
        filtered.sort((a, b) => b.valueRatio - a.valueRatio);
        break;
      default:
        filtered.sort((a, b) => a.price - b.price);
    }

    setFilteredWeapons(filtered);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchWeapons();
    } else {
      setWeapons([]);
      setFilteredWeapons([]);
      setIsLoadingWeapons(false);
    }
  }, [fetchWeapons, isLoggedIn]);

  useEffect(() => {
    applyFiltersAndSort(weapons, sortOrder, filterAffordable, showOwnedItems);
  }, [weapons, sortOrder, filterAffordable, showOwnedItems]);

  useEffect(() => {
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
    if (isProcessingAction || money < weaponPrice) return;

    setIsProcessingAction(weaponId);
    setErrorMessage('');
    setSuccessMessage('');

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API_URL}/weapons/buy`,
        { weaponId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        updateUserData({
          money: response.data.money,
          inventory: response.data.inventory
        });
        setSuccessMessage(`${weaponName} added to arsenal!`);
      } else {
        setErrorMessage(response.data.message || 'Failed to buy weapon.');
      }
    } catch (error) {
      console.error("Error buying weapon:", error);
      setErrorMessage(error.response?.data?.message || 'Server error buying weapon.');
    } finally {
      setIsProcessingAction(null);
    }
  };

  const handleSellWeapon = async (weaponName, sellPrice) => {
    if (isProcessingAction) return;

    setIsProcessingAction(weaponName);
    setErrorMessage('');
    setSuccessMessage('');

    const token = localStorage.getItem('token');
    try {
      const response = await axios.post(
        `${API_URL}/weapons/sell`,
        { weaponName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        updateUserData({
          money: response.data.money,
          inventory: response.data.inventory
        });
        setSuccessMessage(`${weaponName} sold for $${sellPrice}!`);
      } else {
        setErrorMessage(response.data.message || 'Failed to sell weapon.');
      }
    } catch (error) {
      console.error("Error selling weapon:", error);
      setErrorMessage(error.response?.data?.message || 'Server error selling weapon.');
    } finally {
      setIsProcessingAction(null);
    }
  };

  const userOwnsWeapon = useCallback(
    (weaponName) => inventory?.some((item) => item && item.name === weaponName),
    [inventory]
  );

  const weaponInventory = inventory?.filter(item =>
    item && item.attributes?.accuracy !== undefined
  ) || [];

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-purple-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-xl">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="bg-gray-800 p-8 rounded-xl shadow-xl border border-gray-700 max-w-md">
          <FaExclamationTriangle className="text-yellow-500 text-5xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-center mb-4">Authentication Required</h2>
          <p className="text-gray-300 text-center">Please log in to access the Weapon Store.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-bl from-gray-900 via-purple-900 to-gray-900 text-white pt-16 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-screen-xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-3">
            POTATO ARMORY
          </h1>
          <p className="text-lg text-gray-400">Get equipped with the finest weapons for your criminal enterprises</p>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <aside className="lg:col-span-3 space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-700 overflow-hidden">
              <img
                src="/assets/weaponstore.png"
                alt="Potato Weapon Master"
                className="w-full h-auto object-contain rounded-lg"
              />
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-5 rounded-xl shadow-lg border border-green-500/30">
              <h2 className="text-xl font-semibold text-green-300 flex items-center mb-2">
                <FaCoins className="mr-2 text-yellow-400" /> Your Balance
              </h2>
              <p className="text-3xl font-bold text-green-400">${money?.toLocaleString()}</p>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-5 rounded-xl shadow-lg border border-purple-500/30">
              <h2 className="text-xl font-semibold text-purple-300 flex items-center mb-3">
                <FaFilter className="mr-2" /> Filters
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Sort By</label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm"
                  >
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                    <option value="accuracyAsc">Accuracy: Low to High</option>
                    <option value="accuracyDesc">Accuracy: High to Low</option>
                    <option value="valueRatioDesc">Best Value</option>
                  </select>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="flex items-center text-gray-300">
                    <input
                      type="checkbox"
                      checked={filterAffordable}
                      onChange={() => setFilterAffordable(!filterAffordable)}
                      className="mr-2 rounded bg-gray-700 border-gray-600"
                    />
                    Show Only Affordable
                  </label>

                  <label className="flex items-center text-gray-300">
                    <input
                      type="checkbox"
                      checked={showOwnedItems}
                      onChange={() => setShowOwnedItems(!showOwnedItems)}
                      className="mr-2 rounded bg-gray-700 border-gray-600"
                    />
                    Show Owned Weapons
                  </label>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-5 rounded-xl shadow-lg border border-blue-500/30">
              <h2 className="text-xl font-semibold text-blue-300 flex items-center mb-3">
                <FaBoxOpen className="mr-2" /> Your Arsenal ({weaponInventory.length})
              </h2>

              {weaponInventory.length > 0 ? (
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                  {weaponInventory.map((weapon, idx) => {
                    const sellPrice = weapon.price ? Math.floor(weapon.price * 0.5) : 0;
                    const isSellingThis = isProcessingAction === weapon.name;
                    const categoryIcon = weaponCategories[getWeaponCategory(weapon.name)]?.icon || '🔫';

                    return (
                      <div
                        key={weapon.name + idx}
                        className="flex justify-between items-center bg-gray-800/70 p-3 rounded-lg shadow transition-colors duration-200 hover:bg-gray-800"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className={`w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 flex-shrink-0 ${weaponCategories[getWeaponCategory(weapon.name)]?.color || 'text-gray-300'}`}>
                            {React.isValidElement(categoryIcon) ? categoryIcon : categoryIcon}
                          </div>
                          <div className="overflow-hidden">
                            <span className="font-medium text-sm truncate block" title={weapon.name}>
                              {weapon.name}
                            </span>
                            <span className="text-xs text-gray-400">
                              Acc: {weapon.attributes?.accuracy}%
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSellWeapon(weapon.name, sellPrice)}
                          disabled={!!isProcessingAction}
                          className={`py-1 px-2.5 rounded-md text-xs font-semibold transition duration-200 flex items-center flex-shrink-0 ${
                            !isProcessingAction
                              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                              : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                          }`}
                        >
                          {isSellingThis ? (
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                            </svg>
                          ) : (
                            `$${sellPrice.toLocaleString()}`
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-400 italic py-3">
                  Your arsenal is empty.
                </p>
              )}
            </div>
          </aside>

          <main className="lg:col-span-9 bg-gray-800/60 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-yellow-300 flex items-center mb-3 md:mb-0">
                <FaShoppingCart className="mr-2 text-yellow-400" /> Available Weapons
              </h2>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-700 rounded-full text-sm flex items-center">
                  <FaBullseye className="mr-1 text-red-400" /> Accuracy
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded-full text-sm flex items-center">
                  <FaCoins className="mr-1 text-yellow-400" /> Price
                </span>
                <span className="px-3 py-1 bg-gray-700 rounded-full text-sm flex items-center">
                  <FaShoppingBag className="mr-1 text-green-400" /> Value
                </span>
              </div>
            </div>

            {isLoadingWeapons ? (
              <div className="text-center py-10">
                <svg className="animate-spin h-10 w-10 text-purple-500 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-400">Loading weapon inventory...</p>
              </div>
            ) : filteredWeapons.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWeapons.map((weapon) => {
                  const canAfford = money >= weapon.price;
                  const isOwned = userOwnsWeapon(weapon.name);
                  const isBuyingThis = isProcessingAction === weapon.id;
                  const category = getWeaponCategory(weapon.name);
                  const valueRating = weapon.valueRatio;
                  const categoryInfo = weaponCategories[category] || {};
                  const categoryIcon = categoryInfo.icon || '🔫';


                  let valueColor = 'text-red-400';
                  if (valueRating > 0.2) valueColor = 'text-yellow-400';
                  if (valueRating > 0.5) valueColor = 'text-green-400';
                  if (valueRating > 1.0) valueColor = 'text-blue-400';

                  return (
                    <div
                      key={weapon.id}
                      className={`bg-gradient-to-b from-gray-800 to-gray-800/80 p-4 rounded-lg shadow-lg flex flex-col h-full border transition-all duration-300 ${
                        isOwned ? 'border-blue-500/50 opacity-75' : canAfford ? 'border-gray-700 hover:border-purple-500/50' : 'border-red-500/30'
                      }`}
                    >
                      <div className="self-end mb-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${categoryInfo.color || 'bg-gray-700'}`}>
                          {React.isValidElement(categoryIcon) ? categoryIcon : categoryIcon} {category}
                        </span>
                      </div>

                      <div className="h-32 mb-3 flex items-center justify-center transition-transform duration-300 hover:scale-105">
                        <img
                          src={`/assets/${weapon.image || 'default.png'}`}
                          alt={weapon.name}
                          className="max-w-full max-h-full object-contain drop-shadow-lg"
                          loading="lazy"
                          onError={(e) => { e.target.onerror = null; e.target.src='/assets/default.png'; }}
                        />
                      </div>

                      <h3 className="text-md font-semibold text-white mb-1 truncate" title={weapon.name}>
                        {weapon.name}
                      </h3>

                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center text-sm">
                          <FaBullseye className="text-red-400 mr-1" />
                          <span>{weapon.accuracy}%</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <FaCoins className="text-yellow-400 mr-1" />
                          <span>${weapon.price?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className={`text-xs mb-3 ${valueColor} flex items-center`}>
                        <FaShoppingBag className="mr-1" />
                        Value: {valueRating > 1 ? 'Excellent' : valueRating > 0.5 ? 'Good' : valueRating > 0.2 ? 'Decent' : 'Poor'}
                      </div>

                      <div className="mt-auto pt-2">
                        {isOwned ? (
                          <span className="w-full block bg-blue-700/30 text-blue-300 py-2 px-4 rounded-lg text-sm font-semibold flex items-center justify-center">
                            <FaCheckCircle className="mr-1" /> In Arsenal
                          </span>
                        ) : (
                          <button
                            onClick={() => handleBuyWeapon(weapon.id, weapon.name, weapon.price)}
                            disabled={!!isProcessingAction || !canAfford}
                            className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition duration-200 flex items-center justify-center shadow-md ${
                              !isProcessingAction && canAfford
                                ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white transform hover:scale-105'
                                : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                            }`}
                          >
                            {isBuyingThis ? (
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                              </svg>
                            ) : (
                              !canAfford ? 'Not Enough Cash' : 'Buy Weapon'
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-800/30 rounded-lg border border-gray-700">
                <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-3" />
                <p className="text-gray-300 text-lg mb-1">No weapons match your filters</p>
                <p className="text-gray-400">Try changing your filter settings</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default WeaponStore;