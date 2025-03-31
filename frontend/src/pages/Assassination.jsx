// frontend/src/pages/AssassinationPage.jsx
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AssassinationPage = () => {
  // Read data directly from context
  const { user, money, inventory, bossItems, xp, kills, isAlive, updateUserData } = useContext(AuthContext);

  const [targets, setTargets] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [selectedWeaponName, setSelectedWeaponName] = useState('');
  const [selectedBossItemName, setSelectedBossItemName] = useState(''); // Store name, backend finds it
  const [resultMessage, setResultMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioImage, setScenarioImage] = useState('/assets/assassination.png'); // Default image
  const [cooldown, setCooldown] = useState(0); // Cooldown in milliseconds
  const [bulletsUsed, setBulletsUsed] = useState(1);

  const COOLDOWN_TIME_MS = 60 * 1000; // 60 seconds

  // Filter available weapons from inventory
  const availableWeapons = inventory.filter(item => item.attributes?.accuracy > 0);
  // Available boss items (user might have duplicates, only show unique names for selection)
  const uniqueBossItems = bossItems.reduce((acc, current) => {
      if (!acc.find(item => item.name === current.name)) {
          acc.push(current);
      }
      return acc;
  }, []);


  // Fetch Targets on Mount
  useEffect(() => {
    const fetchTargets = async () => {
      setIsLoading(true); // Indicate loading targets
      setErrorMessage(''); // Clear previous errors
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
    fetchTargets();
  }, []); // Run only once

  // Cooldown Timer Logic (using local storage is okay for client-side feedback)
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
        setCooldown(0); // Ensure cooldown is 0 if not applicable
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [resultMessage, errorMessage]); // Re-check cooldown after an attempt result

  const attemptAssassination = async () => {
    if (isLoading || cooldown > 0 || !isAlive) return;

    setResultMessage('');
    setErrorMessage('');
    setScenarioImage('/assets/assassination.png'); // Reset image

    if (!selectedTargetId) {
      setErrorMessage('You must select a target.');
      return;
    }
    if (!selectedWeaponName) {
       setErrorMessage('You must select a weapon.');
       return;
    }
    if (bulletsUsed < 1 || bulletsUsed > 10000) {
      setErrorMessage('Bullets must be between 1 and 10000.');
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await axios.post(`${API_URL}/assassination/attempt`, {
        targetId: selectedTargetId,
        weaponName: selectedWeaponName,
        bossItemName: selectedBossItemName || null, // Send name or null
        bulletsUsed,
        // lootPercentage: 0.5 // Example: Or get from boss item logic if needed client-side
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = response.data; // Axios puts data directly in response.data

      if (data.success) {
        // --- Assassination Success ---
        const newMoney = money - data.actualBulletCost + (data.lootMoney || 0);
        // Update context state based on backend response
        updateUserData({
          money: newMoney,
          kills: data.updatedKills,
          xp: xp + (data.xpGained || 0), // Use XP gained from backend
          // Update inventory/boss items if backend modifies/removes them
          inventory: data.updatedInventory || inventory, // If backend sends updated inv
          bossItems: data.updatedBossItems || bossItems, // If backend sends updated boss items
        });
        setResultMessage(data.message);
        setScenarioImage('/assets/success.png');
        localStorage.setItem('lastAssassinationAttempt', Date.now().toString()); // Set cooldown timestamp
        setCooldown(COOLDOWN_TIME_MS); // Start client-side timer display
        // Maybe refresh targets list? Or backend removes the dead target?
      } else {
        // --- Assassination Failure ---
        setErrorMessage(data.message || 'Assassination attempt failed.');
        setScenarioImage('/assets/failure.png');
        // Update money only for bullet cost if assassination failed but user lived
         if (!data.userDied) {
              const cost = data.actualBulletCost || (bulletsUsed * 100); // Estimate cost if not returned
              updateUserData({ money: money - cost });
         }

        if (data.userDied) {
            setScenarioImage('/assets/dead.png'); // Specific image for death
            updateUserData({ isAlive: false }); // Update context about death
        }
         // Still set cooldown even on failure
         localStorage.setItem('lastAssassinationAttempt', Date.now().toString());
         setCooldown(COOLDOWN_TIME_MS);
      }
    } catch (error) {
       console.error("Error during assassination:", error)
       setErrorMessage(error.response?.data?.message || 'Server error occurred during assassination.');
       setScenarioImage('/assets/error.png');
    } finally {
      setIsLoading(false);
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

        <div className="md:w-1/2 space-y-6 mb-8 md:mb-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-red-500">Assassination Mission</h1>
          <p className="text-gray-400">Select target, weapon, and perks. Take the shot, but watch your back.</p>

          {errorMessage && <div role="alert" className="bg-red-900 border border-red-700 text-red-300 p-3 rounded">{errorMessage}</div>}
          {resultMessage && <div role="alert" className="bg-green-900 border border-green-700 text-green-300 p-3 rounded">{resultMessage}</div>}

          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="target-select" className="block mb-2 font-medium text-gray-300">Choose Target:</label>
            <select
              id="target-select"
              value={selectedTargetId}
              onChange={e => setSelectedTargetId(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
              disabled={targets.length === 0}
            >
              <option value="">-- Select Target --</option>
              {targets.length > 0 ? (
                  targets.map(target => (
                    <option key={target._id} value={target._id}>
                        {target.username} (Lvl: {target.level || 1}, Rank: {target.rank})
                    </option>
                  ))
              ) : (
                  <option disabled>No targets available</option>
              )}
            </select>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="weapon-select" className="block mb-2 font-medium text-gray-300">Choose Weapon:</label>
            <select
              id="weapon-select"
              value={selectedWeaponName}
              onChange={e => setSelectedWeaponName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
              disabled={availableWeapons.length === 0}
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

           <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="boss-item-select" className="block mb-2 font-medium text-gray-300">Use Boss Item (Optional):</label>
            <select
              id="boss-item-select"
              value={selectedBossItemName}
              onChange={e => setSelectedBossItemName(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
              disabled={uniqueBossItems.length === 0}
            >
              <option value="">-- No Boss Item --</option>
              {uniqueBossItems.length > 0 ? (
                 uniqueBossItems.map((item, i) => (
                   <option key={item._id || i} value={item.name}>{item.name} (Qty: {bossItems.find(bi => bi.name === item.name)?.quantity || 0})</option>
                 ))
                ) : (
                 <option disabled>No boss items owned</option>
                )
              }
            </select>
            <p className="text-xs text-gray-400 mt-1">Boss items may provide buffs but are consumed on use.</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="bullets-input" className="block mb-2 font-medium text-gray-300">Bullets (Cost: $100 each):</label>
            <input
              id="bullets-input"
              type="number"
              value={bulletsUsed}
              min="1"
              max="10000"
              onChange={e => setBulletsUsed(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
            />
             <p className="text-xs text-gray-400 mt-1">Total Cost: ${(bulletsUsed * 100).toLocaleString()}</p>
          </div>

          <button
            onClick={attemptAssassination}
            disabled={isLoading || cooldown > 0 || !selectedTargetId || !selectedWeaponName || !isAlive}
            className={`w-full py-3 rounded font-bold transition duration-200 ease-in-out ${
              isLoading || cooldown > 0 || !selectedTargetId || !selectedWeaponName || !isAlive
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-500 text-white'
            }`}
          >
            {isLoading ? 'Executing...' : cooldown > 0 ? `Cooldown (${Math.ceil(cooldown / 1000)}s)` : 'Attempt Assassination'}
          </button>

        </div>

        <div className="md:w-1/2 flex items-center justify-center p-4 bg-gray-800 rounded-lg shadow-lg">
             <img
                key={scenarioImage} // Force re-render if image src changes
                src={scenarioImage}
                className="max-w-full max-h-96 h-auto object-contain rounded-xl"
                alt="Assassination Scenario"
                onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
            />
        </div>
      </div>
    </div>
  );
};

export default AssassinationPage;