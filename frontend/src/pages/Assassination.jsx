import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const BOSS_ITEM_STATS = {
  'Presidential Medal': { description: '+5% Success Chance, +50% XP Gain', image: '/assets/presidential-medal.png' },
  "Dragon's Hoard": { description: '+10% Success Chance, +50% Loot Multiplier', image: '/assets/dragon-hoard.png' },
  'Mafia Ring': { description: '+15% Success Chance, -10% Retaliation Chance', image: '/assets/mafia-fortune.png' },
  'Invisible Cloak': { description: 'Prevents Retaliation', image: '/assets/invisible-cloak.png' },
  "Pirate's Compass": { description: '+300 Flat XP Bonus', image: '/assets/pirate-compass.png' },
  'Golden Spatula': { description: '+20% Success Chance, Bullets Cost $0', image: '/assets/golden-spatula.png' },
  'Star Dust': { description: '+25% Success Chance, +25% XP Gain', image: '/assets/star-dust.png' },
  "Sheriff's Badge": { description: 'Prevents Retaliation', image: '/assets/sheriffs-badge.png' },
};

const AssassinationPage = () => {
  const { user, money, inventory, bossItems, xp, kills, isAlive, updateUserData } = useContext(AuthContext);

  const [targets, setTargets] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [selectedWeaponName, setSelectedWeaponName] = useState('');
  const [selectedBossItemName, setSelectedBossItemName] = useState('');
  const [selectedBossItemInfo, setSelectedBossItemInfo] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioImage, setScenarioImage] = useState('/assets/assassination.png');
  const [cooldown, setCooldown] = useState(0);
  const [bulletsUsed, setBulletsUsed] = useState(1); // Validated number
  const [bulletInputValue, setBulletInputValue] = useState('1'); // Raw input string

  const COOLDOWN_TIME_MS = 60 * 1000;

  const availableWeapons = inventory.filter(item => item.attributes?.accuracy > 0);
  const uniqueBossItems = bossItems.reduce((acc, current) => {
      if (!acc.find(item => item.name === current.name)) {
          acc.push(current);
      }
      return acc;
  }, []);


  useEffect(() => {
    const fetchTargets = async () => {
      setIsLoading(true);
      setErrorMessage('');
      const token = localStorage.getItem('token');
      if (!token) {
          setErrorMessage("Not logged in.");
          setIsLoading(false);
          return;
      }
      try {
        const response = await axios.get(`${API_URL}/users/targets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setTargets(response.data.targets || []);
          if (!response.data.targets || response.data.targets.length === 0) {
            setErrorMessage('No valid targets are currently available.');
          }
        } else {
          setErrorMessage(response.data.message || 'Failed to fetch targets.');
        }
      } catch (error) {
        console.error("Error fetching targets:", error)
        setErrorMessage(error.response?.data?.message || 'Server error occurred while fetching targets.');
      } finally {
          setIsLoading(false);
      }
    };
    if (isAlive) {
      fetchTargets();
    } else {
        setIsLoading(false);
    }
  }, [isAlive]);

  useEffect(() => {
    const lastAttemptTime = parseInt(localStorage.getItem('lastAssassinationAttempt') || '0', 10);
    const now = Date.now();
    const timePassed = now - lastAttemptTime;
    const remainingCooldown = COOLDOWN_TIME_MS - timePassed;

    let intervalId = null;

    if (remainingCooldown > 0) {
      setCooldown(remainingCooldown);
      intervalId = setInterval(() => {
        setCooldown(prev => {
          const newCooldown = prev - 1000;
          if (newCooldown <= 0) {
            clearInterval(intervalId);
            return 0;
          }
          return newCooldown;
        });
      }, 1000);
    } else {
        setCooldown(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [resultMessage, errorMessage]);

  const handleSelectBossItem = (e) => {
    const itemName = e.target.value;
    setSelectedBossItemName(itemName);
    if (itemName && BOSS_ITEM_STATS[itemName]) {
        setSelectedBossItemInfo({
            name: itemName,
            ...BOSS_ITEM_STATS[itemName]
        });
    } else {
        setSelectedBossItemInfo(null);
    }
  };

  // --- Bullet Input Handling ---
  const handleBulletInputChange = (e) => {
    setBulletInputValue(e.target.value); // Update raw input value directly
  };

  const handleBulletInputBlur = () => {
    const parsedValue = parseInt(bulletInputValue, 10);
    let validValue = 1; // Default to 1 if invalid
    if (!isNaN(parsedValue)) {
        if (parsedValue > 10000) {
            validValue = 10000; // Clamp max
        } else if (parsedValue >= 1) {
            validValue = parsedValue; // Use valid number
        }
        // If parsedValue < 1, it defaults back to 1
    }
    setBulletsUsed(validValue); // Update the validated state
    setBulletInputValue(validValue.toString()); // Sync the input display
  };
  // --- End Bullet Input Handling ---

  const attemptAssassination = async () => {
    // Safety check bulletsUsed
    if (isLoading || cooldown > 0 || !isAlive || bulletsUsed < 1 || bulletsUsed > 10000) return;

    setResultMessage('');
    setErrorMessage('');
    setScenarioImage('/assets/assassination.png');

    if (!selectedTargetId) {
      setErrorMessage('You must select a target.');
      return;
    }
    if (!selectedWeaponName) {
       setErrorMessage('You must select a weapon.');
       return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(`${API_URL}/assassination/attempt`, {
        targetId: selectedTargetId,
        weaponName: selectedWeaponName,
        bossItemName: selectedBossItemName || null,
        bulletsUsed, // Send the validated number
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data;

      if (data.success) {
        updateUserData({
          money: data.updatedMoney,
          kills: data.updatedKills,
          xp: data.updatedXp,
          inventory: data.updatedInventory || inventory,
          bossItems: data.updatedBossItems || bossItems,
          rank: data.updatedRank
        });
        setResultMessage(data.message + (data.lootMoney > 0 ? ` You looted $${data.lootMoney.toLocaleString()}.` : ''));
        setScenarioImage('/assets/success.png');
        localStorage.setItem('lastAssassinationAttempt', Date.now().toString());
        setCooldown(COOLDOWN_TIME_MS);
      } else {
        setErrorMessage(data.message || 'Assassination attempt failed.');
        setScenarioImage(data.userDied ? '/assets/dead.png' : '/assets/failure.png');

        if (data.userDied) {
             updateUserData({
                isAlive: false,
                money: data.updatedMoney,
             });
        } else {
             updateUserData({
                money: data.updatedMoney,
                bossItems: data.updatedBossItems || bossItems,
             });
        }

         localStorage.setItem('lastAssassinationAttempt', Date.now().toString());
         setCooldown(COOLDOWN_TIME_MS);
      }
    } catch (error) {
       console.error("Error during assassination:", error)
       const errorMsg = error.response?.data?.message || 'Server error occurred during assassination.';
       setErrorMessage(errorMsg);
       setScenarioImage('/assets/error.png');
    } finally {
      setIsLoading(false);
      setSelectedBossItemName(''); // Reset dropdown selection
      setSelectedBossItemInfo(null); // Clear the displayed info box
    }
  };

  if (!isAlive) {
      return (
          <div className="min-h-screen bg-gray-900 py-20 text-white flex flex-col items-center justify-center">
               <h1 className="text-4xl font-bold text-red-500 mb-4">You are Dead!</h1>
               <p className="text-gray-400 mb-6">Assassinations are off the table for now.</p>
               <img src="/assets/dead.png" alt="You are dead" className="w-64 h-64 rounded-lg shadow-lg"/>
          </div>
      )
  }


  return (
    <div className="min-h-screen bg-gray-900 py-10 md:py-20 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 md:flex md:gap-8">

        {/* Left Column: Controls */}
        <div className="md:w-1/2 space-y-6 mb-8 md:mb-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-red-500">Assassination Mission</h1>
          <p className="text-gray-400">Select target, weapon, and perks. Take the shot, but watch your back.</p>

          {errorMessage && <div role="alert" className="bg-red-900 border border-red-700 text-red-300 p-3 rounded">{errorMessage}</div>}
          {resultMessage && <div role="alert" className="bg-green-900 border border-green-700 text-green-300 p-3 rounded">{resultMessage}</div>}

          {/* Target Selection */}
          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="target-select" className="block mb-2 font-medium text-gray-300">Choose Target:</label>
            <select
              id="target-select"
              value={selectedTargetId}
              onChange={e => setSelectedTargetId(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
              disabled={targets.length === 0 || isLoading}
            >
              <option value="">-- Select Target --</option>
              {targets.length > 0 ? (
                  targets.map(target => (
                    <option key={target._id} value={target._id}>
                        {target.username} (Lvl: {target.level || 1}, Rank: {target.rank})
                    </option>
                  ))
              ) : (
                  <option disabled>{isLoading ? 'Loading targets...' : 'No targets available'}</option>
              )}
            </select>
          </div>

          {/* Weapon Selection */}
          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="weapon-select" className="block mb-2 font-medium text-gray-300">Choose Weapon:</label>
            <select
              id="weapon-select"
              value={selectedWeaponName}
              onChange={e => setSelectedWeaponName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
              disabled={availableWeapons.length === 0 || isLoading}
            >
              <option value="">-- Select Weapon --</option>
              {availableWeapons.length > 0 ? (
                 availableWeapons.map((w, i) => (
                   <option key={w._id || i} value={w.name}>{w.name} (Acc: {w.attributes.accuracy}%)</option>
                 ))
                ) : (
                 <option disabled>No weapons in inventory</option>
                )
              }
            </select>
          </div>

           {/* Boss Item Selection */}
           <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="boss-item-select" className="block mb-2 font-medium text-gray-300">Use Boss Item (Optional):</label>
            <select
              id="boss-item-select"
              value={selectedBossItemName}
              onChange={handleSelectBossItem}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
              disabled={uniqueBossItems.length === 0 || isLoading}
            >
              <option value="">-- No Boss Item --</option>
              {uniqueBossItems.length > 0 ? (
                 uniqueBossItems.map((item, i) => {
                    const ownedItem = bossItems.find(bi => bi.name === item.name);
                    const quantity = ownedItem?.quantity || 0;
                    return (
                      <option key={item._id || i} value={item.name}>
                        {item.name} (Qty: {quantity})
                      </option>
                    );
                 })
                ) : (
                 <option disabled>No boss items owned</option>
                )
              }
            </select>
            {selectedBossItemInfo && (
                <div className="mt-3 p-3 bg-gray-700/50 rounded border border-gray-600 flex items-start gap-3 text-sm"> {/* Changed to items-start */}
                     <img
                        src={selectedBossItemInfo.image || '/assets/default_boss_item.png'}
                        alt={selectedBossItemInfo.name}
                        className="w-16 h-16 object-contain flex-shrink-0 bg-gray-800 p-1 rounded" // Larger image
                        loading="lazy"
                     />
                     <div className="flex-grow"> {/* Allow text to wrap */}
                        <p className="font-semibold text-gray-200 text-base mb-1">{selectedBossItemInfo.name}</p> {/* Slightly larger name */}
                        <p className="text-gray-400">{selectedBossItemInfo.description}</p>
                     </div>
                </div>
            )}
            <p className="text-xs text-gray-400 mt-1">Boss items are consumed on use (success or failure).</p>
          </div>

          {/* Updated Bullets Input */}
          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="bullets-input" className="block mb-2 font-medium text-gray-300">Bullets (Cost: $100 each):</label>
            <input
              id="bullets-input"
              type="number"
              value={bulletInputValue} // Bind to raw string state
              min="1"
              max="10000"
              onChange={handleBulletInputChange} // Update raw value
              onBlur={handleBulletInputBlur} // Validate on blur
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
              disabled={isLoading}
            />
             {/* Cost uses validated state */}
             <p className="text-xs text-gray-400 mt-1">Total Cost: ${(bulletsUsed * 100).toLocaleString()}</p>
          </div>

          {/* Action Button */}
          <button
            onClick={attemptAssassination}
            // Disable if loading, cooldown, no target/weapon, or validated bullets < 1
            disabled={isLoading || cooldown > 0 || !selectedTargetId || !selectedWeaponName || !isAlive || bulletsUsed < 1}
            className={`w-full py-3 rounded font-bold transition duration-200 ease-in-out ${
              isLoading || cooldown > 0 || !selectedTargetId || !selectedWeaponName || !isAlive || bulletsUsed < 1
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {isLoading ? 'Executing...' : cooldown > 0 ? `Cooldown (${Math.ceil(cooldown / 1000)}s)` : 'Attempt Assassination'}
          </button>

        </div>

        {/* Right Column: Image */}
        <div className="md:w-1/2 flex items-center justify-center p-4 bg-gray-800 rounded-lg shadow-lg">
             <img
                key={scenarioImage}
                src={scenarioImage}
                className="max-w-full max-h-96 h-auto object-contain rounded-xl"
                alt="Assassination Scenario"
                onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
                loading="lazy"
            />
        </div>
      </div>
    </div>
  );
};

export default AssassinationPage;