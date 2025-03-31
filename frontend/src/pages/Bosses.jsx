// frontend/src/pages/BossesPage.jsx
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios'; // Use axios

const API_URL = import.meta.env.VITE_API_URL || '/api';

const BossesPage = () => {
  // Read data directly from context
  const { user, money, inventory, bossItems, xp, rank, updateUserData } = useContext(AuthContext);

  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [bulletsUsed, setBulletsUsed] = useState(1);
  const [bossImage, setBossImage] = useState('/assets/bossbattle.png'); // Default image
  const [successMessage, setSuccessMessage] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Loading state for the action

  // Filter weapons from inventory (assuming they have accuracy attribute)
  const availableWeapons = inventory.filter(item => item.attributes?.accuracy > 0);

  const bosses = {
    'Potato President': { image: '/assets/potato-president.png', loot: { name: 'Presidential Medal', image: '/assets/presidential-medal.png' }, xpReward: 1000 },
    'Potato Dragon': { image: '/assets/potato-dragon.png', loot: { name: "Dragon's Hoard", image: '/assets/dragon-hoard.png' }, xpReward: 2000 },
    'Potato Don': { image: '/assets/potato-boss.png', loot: { name: 'Mafia Ring', image: '/assets/mafia-fortune.png' }, xpReward: 1500 },
    'Spud Spy': { image: '/assets/spud-spy.png', loot: { name: 'Invisible Cloak', image: '/assets/invisible-cloak.png' }, xpReward: 1200 },
    'Potato Pirate': { image: '/assets/potato-pirate.png', loot: { name: "Pirate's Compass", image: '/assets/pirate-compass.png' }, xpReward: 1800 },
    'Gourmet Chef Tater': { image: '/assets/gourmet-chef.png', loot: { name: 'Golden Spatula', image: '/assets/golden-spatula.png' }, xpReward: 1700 },
    'Astronaut Spudnik': { image: '/assets/potato-astronaut.png', loot: { name: 'Star Dust', image: '/assets/star-dust.png' }, xpReward: 2500 },
    'Sheriff Tater': { image: '/assets/sheriff-tater.png', loot: { name: "Sheriff's Badge", image: '/assets/sheriffs-badge.png' }, xpReward: 1400 },
  };

  // No need for useEffect to fetch data, it comes from context

  const handleSelectBoss = (e) => {
    const bossName = e.target.value;
    setSelectedTarget(bossName);
    setBossImage(bosses[bossName]?.image || '/assets/bossbattle.png');
    setSuccessMessage(''); // Clear messages on new selection
    setFailureMessage('');
  };

  const handleSelectWeapon = (e) => {
    setSelectedWeapon(e.target.value);
  };

  const calculateSuccessChance = (weaponAccuracy, bulletsUsed, targetChance) => {
    // Ensure targetChance is not zero to avoid division by zero
    if (!targetChance) return 0;
    // Base chance calculation - adjust formula as needed for game balance
    // Example: More bullets improve chance, higher accuracy improves chance, target difficulty reduces chance
    const rawChance = (weaponAccuracy * bulletsUsed * 10) / targetChance;
    return Math.min(1, Math.max(0, rawChance / 100)); // Clamp between 0 and 1 (0% to 100%)
  };

  const getTargetDifficulty = (targetName) => {
    // Higher number means harder to defeat
    const difficulties = {
      'Potato President': 500, 'Potato Dragon': 1000, 'Potato Don': 700,
      'Spud Spy': 700, 'Potato Pirate': 100, 'Gourmet Chef Tater': 50,
      'Astronaut Spudnik': 200, 'Sheriff Tater': 900,
    };
    return difficulties[targetName] || 5000; // Default high difficulty
  };

  const attemptBossFight = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setSuccessMessage('');
    setFailureMessage('');

    const weaponItem = availableWeapons.find(item => item.name === selectedWeapon);

    if (!weaponItem || !weaponItem.attributes?.accuracy) {
      setFailureMessage("Select a valid weapon from your inventory.");
      setIsLoading(false);
      return;
    }
    if (!selectedTarget) {
      setFailureMessage('Select a boss to fight.');
      setIsLoading(false);
      return;
    }
    if (bulletsUsed < 1 || bulletsUsed > 10000) { // Allow more bullets maybe?
        setFailureMessage('Bullets must be between 1 and 10000.');
        setIsLoading(false);
        return;
    }

    const bulletsCost = bulletsUsed * 100;
    if (money < bulletsCost) {
      setFailureMessage(`Not enough money for ${bulletsUsed} bullets (cost: $${bulletsCost.toLocaleString()}).`);
      setIsLoading(false);
      return;
    }

    const targetDifficulty = getTargetDifficulty(selectedTarget);
    const successChance = calculateSuccessChance(
      weaponItem.attributes.accuracy,
      bulletsUsed,
      targetDifficulty
    );

    const updatedMoney = money - bulletsCost;

    // Simulate the fight
    if (Math.random() < successChance) {
      // --- Success ---
      const loot = bosses[selectedTarget].loot;
      const xpGained = bosses[selectedTarget].xpReward;
      const updatedXp = xp + xpGained;

      // Prepare the updated boss items array
      const newBossItems = [...bossItems];
      const existingItemIndex = newBossItems.findIndex(item => item.name === loot.name);
      if (existingItemIndex > -1) {
        newBossItems[existingItemIndex] = {
            ...newBossItems[existingItemIndex],
            quantity: (newBossItems[existingItemIndex].quantity || 0) + 1
        };
      } else {
        newBossItems.push({ name: loot.name, quantity: 1, image: loot.image });
      }

      // Call updateUserData ONCE with all changes
      try {
        await updateUserData({
          money: updatedMoney,
          xp: updatedXp,
          bossItems: newBossItems,
          // No need to send rank, context calculates it based on XP
        });
        setSuccessMessage(`Success! Defeated ${selectedTarget}, obtained ${loot.name}, and gained ${xpGained} XP!`);
      } catch (error) {
           setFailureMessage("Fight succeeded, but failed to update your stats. Please check later.");
           console.error("Error calling updateUserData after boss win:", error);
      }

    } else {
      // --- Failure ---
      // Only update money since bullets were used
       try {
            await updateUserData({ money: updatedMoney });
            setFailureMessage(`Failed to defeat ${selectedTarget}. You lost $${bulletsCost.toLocaleString()} on bullets.`);
       } catch (error) {
           setFailureMessage("Fight failed, and failed to update money. Please check later.");
            console.error("Error calling updateUserData after boss loss:", error);
       }
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-10 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 md:flex md:gap-8">

        <div className="md:w-1/2 space-y-6 mb-8 md:mb-0">
          <h1 className="text-3xl sm:text-4xl font-bold text-yellow-400">Boss Fights</h1>
          <p className="text-gray-400">
            Challenge legendary bosses for unique treasures. Bring enough bullets!
          </p>

          {failureMessage && <div role="alert" className="bg-red-900 border border-red-700 text-red-300 p-3 rounded">{failureMessage}</div>}
          {successMessage && <div role="alert" className="bg-green-900 border border-green-700 text-green-300 p-3 rounded">{successMessage}</div>}

          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="boss-select" className="block mb-2 font-medium text-gray-300">Select Boss:</label>
            <select
              id="boss-select"
              value={selectedTarget}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-yellow-500 focus:ring focus:ring-yellow-500 focus:ring-opacity-50"
              onChange={handleSelectBoss}
            >
              <option value="">-- Select a Boss --</option>
              {Object.keys(bosses).map(boss => (
                <option key={boss} value={boss}>{boss}</option>
              ))}
            </select>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="weapon-select" className="block mb-2 font-medium text-gray-300">Select Weapon:</label>
            <select
              id="weapon-select"
              value={selectedWeapon}
              className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-yellow-500 focus:ring focus:ring-yellow-500 focus:ring-opacity-50"
              onChange={handleSelectWeapon}
              disabled={availableWeapons.length === 0}
            >
              <option value="">-- Select a Weapon --</option>
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
            <label htmlFor="bullets-input" className="block mb-2 font-medium text-gray-300">Bullets (Cost: $100 each):</label>
            <input
              id="bullets-input"
              type="number"
              value={bulletsUsed}
              min="1"
              max="10000"
              onChange={e => setBulletsUsed(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:ring focus:ring-yellow-500 focus:ring-opacity-50"
            />
             <p className="text-xs text-gray-400 mt-1">Total Cost: ${(bulletsUsed * 100).toLocaleString()}</p>
          </div>

          <button
            onClick={attemptBossFight}
            disabled={isLoading || !selectedTarget || !selectedWeapon}
            className={`w-full py-3 rounded font-bold transition duration-200 ease-in-out ${
              isLoading || !selectedTarget || !selectedWeapon
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-400 text-black'
            }`}
          >
            {isLoading ? 'Fighting...' : 'Attempt Fight'}
          </button>
        </div>

        <div className="md:w-1/2 flex items-center justify-center p-4 bg-gray-800 rounded-lg shadow-lg">
            <img
                key={bossImage} // Add key to force re-render on change
                src={bossImage}
                className="max-w-full max-h-96 h-auto object-contain rounded-xl"
                alt={selectedTarget || "Boss Battle Arena"}
                onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
            />
        </div>

      </div>
    </div>
  );
};

export default BossesPage;