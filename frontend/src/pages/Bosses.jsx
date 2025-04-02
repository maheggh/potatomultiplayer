import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const bosses = {
  'Potato President': { image: '/assets/potato-president.png', loot: { name: 'Presidential Medal', image: '/assets/presidential-medal.png', description: '+5% Success Chance, +50% XP Gain' }, xpReward: 1000 },
  'Potato Dragon': { image: '/assets/potato-dragon.png', loot: { name: "Dragon's Hoard", image: '/assets/dragon-hoard.png', description: '+10% Success Chance, +50% Loot Multiplier' }, xpReward: 2000 },
  'Potato Don': { image: '/assets/potato-boss.png', loot: { name: 'Mafia Ring', image: '/assets/mafia-fortune.png', description: '+15% Success Chance, -10% Retaliation Chance' }, xpReward: 1500 },
  'Spud Spy': { image: '/assets/spud-spy.png', loot: { name: 'Invisible Cloak', image: '/assets/invisible-cloak.png', description: 'Prevents Retaliation' }, xpReward: 1200 },
  'Potato Pirate': { image: '/assets/potato-pirate.png', loot: { name: "Pirate's Compass", image: '/assets/pirate-compass.png', description: '+300 Flat XP Bonus' }, xpReward: 1800 },
  'Gourmet Chef Tater': { image: '/assets/gourmet-chef.png', loot: { name: 'Golden Spatula', image: '/assets/golden-spatula.png', description: '+20% Success Chance, Bullets Cost $0' }, xpReward: 1700 },
  'Astronaut Spudnik': { image: '/assets/potato-astronaut.png', loot: { name: 'Star Dust', image: '/assets/star-dust.png', description: '+25% Success Chance, +25% XP Gain' }, xpReward: 2500 },
  'Sheriff Tater': { image: '/assets/sheriff-tater.png', loot: { name: "Sheriff's Badge", image: '/assets/sheriffs-badge.png', description: 'Prevents Retaliation' }, xpReward: 1400 },
};


const BossesPage = () => {
  const { user, money, inventory, bossItems, xp, rank, updateUserData } = useContext(AuthContext);

  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [bulletsUsed, setBulletsUsed] = useState(1); // Validated number of bullets
  const [bulletInputValue, setBulletInputValue] = useState('1'); // Raw input string
  const [bossImage, setBossImage] = useState('/assets/bossbattle.png');
  const [successMessage, setSuccessMessage] = useState('');
  const [successLoot, setSuccessLoot] = useState(null);
  const [failureMessage, setFailureMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableWeapons = inventory.filter(item => item.attributes?.accuracy > 0);

  const handleSelectBoss = (e) => {
    const bossName = e.target.value;
    setSelectedTarget(bossName);
    setBossImage(bosses[bossName]?.image || '/assets/bossbattle.png');
    setSuccessMessage('');
    setSuccessLoot(null);
    setFailureMessage('');
  };

  const handleSelectWeapon = (e) => {
    setSelectedWeapon(e.target.value);
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

  const calculateSuccessChance = (weaponAccuracy, bulletsUsed, targetChance) => {
    if (!targetChance) return 0;
    const rawChance = (weaponAccuracy * bulletsUsed * 10) / targetChance;
    return Math.min(1, Math.max(0, rawChance / 100));
  };

  const getTargetDifficulty = (targetName) => {
    const difficulties = {
      'Potato President': 500, 'Potato Dragon': 1000, 'Potato Don': 700,
      'Spud Spy': 700, 'Potato Pirate': 100, 'Gourmet Chef Tater': 50,
      'Astronaut Spudnik': 200, 'Sheriff Tater': 900,
    };
    return difficulties[targetName] || 5000;
  };

  const attemptBossFight = async () => {
    // Ensure bulletsUsed is valid before proceeding (it should be due to onBlur, but good safety check)
     if (isLoading || bulletsUsed < 1 || bulletsUsed > 10000) return;

    setIsLoading(true);
    setSuccessMessage('');
    setSuccessLoot(null);
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

    const bulletsCost = bulletsUsed * 100;
    if (money < bulletsCost) {
      setFailureMessage(`Not enough money for ${bulletsUsed} bullets (cost: $${bulletsCost.toLocaleString()}).`);
      setIsLoading(false);
      return;
    }

    const targetDifficulty = getTargetDifficulty(selectedTarget);
    const successChance = calculateSuccessChance(
      weaponItem.attributes.accuracy,
      bulletsUsed, // Use the validated bulletsUsed state
      targetDifficulty
    );

    const updatedMoney = money - bulletsCost;

    if (Math.random() < successChance) {
      const loot = bosses[selectedTarget].loot;
      const xpGained = bosses[selectedTarget].xpReward;
      const updatedXp = xp + xpGained;

      const newBossItems = [...bossItems];
      const existingItemIndex = newBossItems.findIndex(item => item.name === loot.name);
      if (existingItemIndex > -1) {
        newBossItems[existingItemIndex] = {
            ...newBossItems[existingItemIndex],
            quantity: (newBossItems[existingItemIndex].quantity || 0) + 1,
            image: loot.image
        };
      } else {
        newBossItems.push({ name: loot.name, quantity: 1, image: loot.image });
      }

      try {
        await updateUserData({
          money: updatedMoney,
          xp: updatedXp,
          bossItems: newBossItems,
        });
        setSuccessMessage(`Success! Defeated ${selectedTarget} and gained ${xpGained} XP! You obtained:`);
        setSuccessLoot({ // Store all loot details including description
            name: loot.name,
            image: loot.image,
            description: loot.description
        });
      } catch (error) {
           setFailureMessage("Fight succeeded, but failed to update your stats. Please check later.");
           console.error("Error calling updateUserData after boss win:", error);
      }

    } else {
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

          {/* Message Area */}
          {failureMessage && <div role="alert" className="bg-red-900 border border-red-700 text-red-300 p-3 rounded">{failureMessage}</div>}
          {successMessage && (
              <div role="alert" className="bg-green-900 border border-green-700 text-green-300 p-3 rounded">
                  <p className="mb-2">{successMessage}</p>
                  {/* Enhanced Loot Display */}
                  {successLoot && (
                      <div className="mt-2 flex items-start gap-4 p-3 bg-gray-800/50 rounded border border-green-600/30">
                          <img
                              src={successLoot.image}
                              alt={successLoot.name}
                              className="w-16 h-16 object-contain bg-gray-700 p-1 rounded flex-shrink-0" // Larger image (w/h-16)
                              loading="lazy"
                          />
                          <div className="text-sm flex-grow">
                              <span className="font-semibold block text-lg text-green-200 mb-1">{successLoot.name}</span> {/* Larger name */}
                              <p className="text-gray-300">{successLoot.description}</p> {/* Show description */}
                          </div>
                      </div>
                  )}
              </div>
          )}

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

          {/* Updated Bullet Input */}
          <div className="bg-gray-800 rounded-lg p-4 shadow-md">
            <label htmlFor="bullets-input" className="block mb-2 font-medium text-gray-300">Bullets (Cost: $100 each):</label>
            <input
              id="bullets-input"
              type="number" // Keep type="number" for mobile keyboards, but manage value as string
              value={bulletInputValue} // Bind to the raw string state
              min="1" // Browser hint, not enforced by React state logic here
              max="10000" // Browser hint
              onChange={handleBulletInputChange} // Update raw value on change
              onBlur={handleBulletInputBlur} // Validate and update 'bulletsUsed' on blur
              className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:ring focus:ring-yellow-500 focus:ring-opacity-50"
            />
             {/* Cost calculation uses the validated 'bulletsUsed' state */}
             <p className="text-xs text-gray-400 mt-1">Total Cost: ${(bulletsUsed * 100).toLocaleString()}</p>
          </div>

          <button
            onClick={attemptBossFight}
            disabled={isLoading || !selectedTarget || !selectedWeapon || bulletsUsed < 1} // Ensure bulletsUsed is valid
            className={`w-full py-3 rounded font-bold transition duration-200 ease-in-out ${
              isLoading || !selectedTarget || !selectedWeapon || bulletsUsed < 1
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-yellow-500 hover:bg-yellow-400 text-black'
            }`}
          >
            {isLoading ? 'Fighting...' : 'Attempt Fight'}
          </button>
        </div>

        <div className="md:w-1/2 flex items-center justify-center p-4 bg-gray-800 rounded-lg shadow-lg">
            <img
                key={bossImage}
                src={bossImage}
                className="max-w-full max-h-96 h-auto object-contain rounded-xl"
                alt={selectedTarget || "Boss Battle Arena"}
                onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
                loading="lazy"
            />
        </div>

      </div>
    </div>
  );
};

export default BossesPage;