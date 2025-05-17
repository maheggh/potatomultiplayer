import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {
  FaCrown, FaSkull, /* FaGun removed */ FaDragon, FaUserSecret, FaAnchor,
  FaUtensils, FaSpaceShuttle, FaStar, FaShieldAlt, FaCheckCircle,
  FaTimesCircle, FaSpinner, FaInfoCircle, FaCoins
} from 'react-icons/fa';
import { FaGun } from 'react-icons/fa6'; // Import FaGun from fa6

const API_URL = import.meta.env.VITE_API_URL || '/api';

const bosses = {
  'Potato President': {
    image: '/assets/potato-president.png',
    icon: <FaCrown className="text-yellow-400" />,
    difficulty: 500,
    description: "The corrupt leader of the Potato Republic. Well-guarded with secret service spuds everywhere.",
    loot: {
      name: 'Presidential Medal',
      image: '/assets/presidential-medal.png',
      description: '+5% Success Chance, +50% XP Gain',
      rarity: "Uncommon"
    },
    xpReward: 1000,
    moneyReward: 2500
  },
  'Potato Dragon': {
    image: '/assets/potato-dragon.png',
    icon: <FaDragon className="text-red-500" />,
    difficulty: 1000,
    description: "A mythical beast that breathes fire and hoards golden treasures. The most formidable opponent.",
    loot: {
      name: "Dragon's Hoard",
      image: '/assets/dragon-hoard.png',
      description: '+10% Success Chance, +50% Loot Multiplier',
      rarity: "Legendary"
    },
    xpReward: 2000,
    moneyReward: 5000
  },
  'Potato Don': {
    image: '/assets/potato-boss.png',
    icon: <FaSkull className="text-gray-200" />,
    difficulty: 700,
    description: "The godfather of the Tuber Mafia. Always surrounded by loyal family members who'll take a bullet for him.",
    loot: {
      name: 'Mafia Ring',
      image: '/assets/mafia-fortune.png',
      description: '+15% Success Chance, -10% Retaliation Chance',
      rarity: "Rare"
    },
    xpReward: 1500,
    moneyReward: 3500
  },
  'Spud Spy': {
    image: '/assets/spud-spy.png',
    icon: <FaUserSecret className="text-blue-400" />,
    difficulty: 700,
    description: "Master of disguise and infiltration. You'll never see him coming, and he sees everything.",
    loot: {
      name: 'Invisible Cloak',
      image: '/assets/invisible-cloak.png',
      description: 'Prevents Retaliation during assassinations',
      rarity: "Epic"
    },
    xpReward: 1200,
    moneyReward: 2200
  },
  'Potato Pirate': {
    image: '/assets/potato-pirate.png',
    icon: <FaAnchor className="text-cyan-500" />,
    difficulty: 400,
    description: "The scourge of the Seven Seas. His crew of buccaneer spuds will make you walk the plank.",
    loot: {
      name: "Pirate's Compass",
      image: '/assets/pirate-compass.png',
      description: '+300 Flat XP Bonus per criminal activity',
      rarity: "Uncommon"
    },
    xpReward: 1800,
    moneyReward: 4000
  },
  'Gourmet Chef Tater': {
    image: '/assets/gourmet-chef.png',
    icon: <FaUtensils className="text-amber-300" />,
    difficulty: 450,
    description: "The culinary master with a temper as hot as his kitchen. His knife skills are unmatched.",
    loot: {
      name: 'Golden Spatula',
      image: '/assets/golden-spatula.png',
      description: '+20% Success Chance, Bullets Cost $0',
      rarity: "Epic"
    },
    xpReward: 1700,
    moneyReward: 3200
  },
  'Astronaut Spudnik': {
    image: '/assets/potato-astronaut.png',
    icon: <FaSpaceShuttle className="text-purple-400" />,
    difficulty: 600,
    description: "The first potato in space. His advanced tech and zero-gravity training make him a formidable opponent.",
    loot: {
      name: 'Star Dust',
      image: '/assets/star-dust.png',
      description: '+25% Success Chance, +25% XP Gain',
      rarity: "Legendary"
    },
    xpReward: 2500,
    moneyReward: 6000
  },
  'Sheriff Tater': {
    image: '/assets/sheriff-tater.png',
    icon: <FaShieldAlt className="text-yellow-600" />,
    difficulty: 550,
    description: "The law of the Wild West. His quick-draw skills are legendary, and he never misses.",
    loot: {
      name: "Sheriff's Badge",
      image: '/assets/sheriffs-badge.png',
      description: 'Prevents Retaliation during assassinations',
      rarity: "Rare"
    },
    xpReward: 1400,
    moneyReward: 2800
  },
};

const rarityColors = {
  "Common": "text-gray-300",
  "Uncommon": "text-green-400",
  "Rare": "text-blue-400",
  "Epic": "text-purple-400",
  "Legendary": "text-orange-400"
};

const BossesPage = () => {
  const { user, money, inventory, bossItems, xp, rank, updateUserData } = useContext(AuthContext);

  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [bulletsUsed, setBulletsUsed] = useState(1);
  const [bulletInputValue, setBulletInputValue] = useState('1');
  const [bossImage, setBossImage] = useState('/assets/bossbattle.png');
  const [successMessage, setSuccessMessage] = useState('');
  const [successLoot, setSuccessLoot] = useState(null);
  const [failureMessage, setFailureMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [bossDetails, setBossDetails] = useState(null);
  const [showBossModal, setShowBossModal] = useState(false);
  const [fightStats, setFightStats] = useState(null);
  const [bossHealth, setBossHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(100);

  const availableWeapons = inventory.filter(item => item.attributes?.accuracy > 0);

  const handleSelectBoss = (bossName) => {
    setSelectedTarget(bossName);
    setBossImage(bosses[bossName]?.image || '/assets/bossbattle.png');
    setBossDetails(bosses[bossName]);
    setSuccessMessage('');
    setSuccessLoot(null);
    setFailureMessage('');

    setFightStats(null);
    setBossHealth(100);
    setPlayerHealth(100);
  };

  const handleSelectWeapon = (e) => {
    setSelectedWeapon(e.target.value);
  };

  const handleBulletInputChange = (e) => {
    setBulletInputValue(e.target.value);
  };

  const handleBulletInputBlur = () => {
    const parsedValue = parseInt(bulletInputValue, 10);
    let validValue = 1;
    if (!isNaN(parsedValue)) {
        if (parsedValue > 10000) {
            validValue = 10000;
        } else if (parsedValue >= 1) {
            validValue = parsedValue;
        }
    }
    setBulletsUsed(validValue);
    setBulletInputValue(validValue.toString());
  };

  const calculateSuccessChance = (weaponAccuracy, bulletsUsed, targetDifficulty) => {
    if (!targetDifficulty) return 0;
    const rawChance = (weaponAccuracy * bulletsUsed * 10) / targetDifficulty;
    return Math.min(95, Math.max(5, Math.floor(rawChance)));
  };

  const attemptBossFight = async () => {
    if (isLoading || bulletsUsed < 1 || bulletsUsed > 10000) return;

    setIsLoading(true);
    setSuccessMessage('');
    setSuccessLoot(null);
    setFailureMessage('');
    setFightStats(null);

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

    const targetDifficulty = bosses[selectedTarget].difficulty;
    const successChance = calculateSuccessChance(
      weaponItem.attributes.accuracy,
      bulletsUsed,
      targetDifficulty
    );

    const rounds = Math.min(5, Math.ceil(bulletsUsed / 10));
    let bossHp = 100;
    let playerHp = 100;
    let fightLog = [];
    let finalRound = 0;

    const isSuccessful = Math.random() * 100 < successChance;

    for (let i = 0; i < rounds; i++) {
      const playerDamage = Math.floor(Math.random() * 30) + 10;
      bossHp = Math.max(0, bossHp - playerDamage);

      fightLog.push({
        round: i + 1,
        action: `You hit ${selectedTarget} for ${playerDamage} damage!`,
        bossHp,
        playerHp
      });

      if (bossHp <= 0) {
        finalRound = i + 1;
        break;
      }

      if (!isSuccessful) {
        const bossDamage = Math.floor(Math.random() * 25) + 5;
        playerHp = Math.max(0, playerHp - bossDamage);

        fightLog.push({
          round: i + 1,
          action: `${selectedTarget} strikes back for ${bossDamage} damage!`,
          bossHp,
          playerHp
        });

        if (playerHp <= 0) {
          finalRound = i + 1;
          break;
        }
      }
    }

    setBossHealth(bossHp);
    setPlayerHealth(playerHp);

    setFightStats({
      rounds: finalRound || rounds,
      log: fightLog,
      successChance,
      bulletsCost,
      weaponAccuracy: weaponItem.attributes.accuracy
    });

    const updatedMoney = money - bulletsCost;

    if (isSuccessful) {
      const bossData = bosses[selectedTarget];
      const loot = bossData.loot;
      const xpGained = bossData.xpReward;
      const moneyGained = bossData.moneyReward;
      const updatedXp = xp + xpGained;
      const finalMoney = updatedMoney + moneyGained;

      const newBossItems = [...bossItems];
      const existingItemIndex = newBossItems.findIndex(item => item.name === loot.name);
      if (existingItemIndex > -1) {
        newBossItems[existingItemIndex] = {
            ...newBossItems[existingItemIndex],
            quantity: (newBossItems[existingItemIndex].quantity || 0) + 1,
            image: loot.image
        };
      } else {
        newBossItems.push({
          name: loot.name,
          quantity: 1,
          image: loot.image,
          description: loot.description,
          rarity: loot.rarity
        });
      }

      try {
        await updateUserData({
          money: finalMoney,
          xp: updatedXp,
          bossItems: newBossItems,
        });

        setSuccessMessage(`Victory! Defeated ${selectedTarget} and gained ${xpGained} XP and $${moneyGained.toLocaleString()}! You obtained:`);
        setSuccessLoot({
            name: loot.name,
            image: loot.image,
            description: loot.description,
            rarity: loot.rarity
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

    setShowBossModal(true);
    setIsLoading(false);
  };

  const renderBossCard = (bossName, bossData) => {
    const isSelected = selectedTarget === bossName;

    return (
      <div
        key={bossName}
        className={`relative cursor-pointer p-4 rounded-lg transition-all duration-300 ${
          isSelected
            ? 'bg-yellow-900/50 border-2 border-yellow-500 shadow-lg shadow-yellow-500/20 transform scale-105'
            : 'bg-gray-800 border border-gray-700 hover:border-yellow-600/50 hover:bg-gray-700'
        }`}
        onClick={() => handleSelectBoss(bossName)}
      >
        <div className="flex items-center mb-2">
          <span className="text-xl mr-2">{bossData.icon}</span>
          <h3 className="font-bold text-yellow-400">{bossName}</h3>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Difficulty: {bossData.difficulty}</span>
          <span className="text-green-400">+{bossData.xpReward} XP</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-300 text-sm mb-1">
          <FaCoins className="text-yellow-400" />
          <span>Reward: ${bossData.moneyReward.toLocaleString()}</span>
        </div>

        {isSelected && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black rounded-full p-1">
            <FaCheckCircle />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-yellow-900/20 to-gray-900 text-white py-10 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Boss Battles</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Challenge legendary bosses for unique treasures and massive rewards. Choose your weapon wisely and bring enough bullets!
          </p>
        </div>

        <div className="h-12 mb-6 max-w-3xl mx-auto text-center">
          {failureMessage && <div className="p-3 bg-red-900 border border-red-700 text-red-300 rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm"><FaTimesCircle className="mr-2" /> {failureMessage}</div>}
          {successMessage && (
            <div className="p-3 bg-green-900 border border-green-700 text-green-300 rounded-lg shadow-md flex items-center justify-center animate-fade-in text-sm">
              <FaCheckCircle className="mr-2" /> {successMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
            <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center">
                <FaSkull className="mr-2" /> Choose Your Target
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
                {Object.entries(bosses).map(([bossName, bossData]) => renderBossCard(bossName, bossData))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6 order-1 lg:order-2">
            <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center">
              <img
                src={bossImage}
                className="max-w-full h-auto object-contain rounded-lg mb-4 max-h-[300px]"
                alt={selectedTarget || "Boss Battle Arena"}
                onError={(e) => { e.target.onerror = null; e.target.src='/assets/bossbattle.png'; }}
              />

              {bossDetails && (
                <div className="w-full mt-2">
                  <h3 className="text-xl font-bold text-yellow-400 mb-1">{selectedTarget}</h3>
                  <p className="text-gray-300 text-sm mb-3">{bossDetails.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-700/50 p-2 rounded">
                      <span className="block text-xs text-gray-400">Difficulty</span>
                      <span className="font-semibold">{bossDetails.difficulty}</span>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded">
                      <span className="block text-xs text-gray-400">XP Reward</span>
                      <span className="font-semibold text-green-400">+{bossDetails.xpReward}</span>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded">
                      <span className="block text-xs text-gray-400">Money Reward</span>
                      <span className="font-semibold text-yellow-400">${bossDetails.moneyReward.toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-700/50 p-2 rounded">
                      <span className="block text-xs text-gray-400">Loot Rarity</span>
                      <span className={`font-semibold ${rarityColors[bossDetails.loot.rarity]}`}>{bossDetails.loot.rarity}</span>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700/30 rounded flex items-center">
                    <img
                      src={bossDetails.loot.image}
                      className="w-10 h-10 object-contain mr-2"
                      alt={bossDetails.loot.name}
                    />
                    <div>
                      <p className={`font-semibold ${rarityColors[bossDetails.loot.rarity]}`}>{bossDetails.loot.name}</p>
                      <p className="text-xs text-gray-400">{bossDetails.loot.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6 order-3">
            <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center">
                <FaGun className="mr-2" /> Prepare for Battle
              </h2>

              <div className="mb-4">
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

              <div className="mb-6">
                <label htmlFor="bullets-input" className="block mb-2 font-medium text-gray-300">Bullets (Cost: $100 each):</label>
                <input
                  id="bullets-input"
                  type="number"
                  value={bulletInputValue}
                  min="1"
                  max="10000"
                  onChange={handleBulletInputChange}
                  onBlur={handleBulletInputBlur}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:ring focus:ring-yellow-500 focus:ring-opacity-50"
                />
                <p className="text-sm text-gray-400 mt-1">Total Cost: ${(bulletsUsed * 100).toLocaleString()}</p>
              </div>

              {selectedTarget && selectedWeapon && (
                <div className="mb-6 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                  <h3 className="text-md font-semibold text-gray-300 mb-2 flex items-center">
                    <FaInfoCircle className="mr-2 text-blue-400" /> Battle Assessment
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-400">Weapon Accuracy</p>
                      <p className="font-semibold">
                        {availableWeapons.find(w => w.name === selectedWeapon)?.attributes?.accuracy || 0}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Boss Difficulty</p>
                      <p className="font-semibold">{bosses[selectedTarget]?.difficulty || 0}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Bullets</p>
                      <p className="font-semibold">{bulletsUsed.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Success Chance</p>
                      <p className="font-semibold text-green-400">
                        {calculateSuccessChance(
                          availableWeapons.find(w => w.name === selectedWeapon)?.attributes?.accuracy || 0,
                          bulletsUsed,
                          bosses[selectedTarget]?.difficulty || 0
                        )}%
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={attemptBossFight}
                disabled={isLoading || !selectedTarget || !selectedWeapon || bulletsUsed < 1}
                className={`w-full py-3 rounded-lg font-bold transition duration-200 ease-in-out flex items-center justify-center ${
                  isLoading || !selectedTarget || !selectedWeapon || bulletsUsed < 1
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-600 to-red-600 hover:from-yellow-500 hover:to-red-500 text-white'
                }`}
              >
                {isLoading ? (
                  <><FaSpinner className="animate-spin mr-2" /> Fighting...</>
                ) : (
                  <>Start Boss Battle</>
                )}
              </button>

              <div className="mt-4 p-2 bg-gray-700/30 rounded-lg flex justify-between items-center">
                <span className="text-gray-400">Your Funds:</span>
                <span className="font-bold text-green-400">${money?.toLocaleString()}</span>
              </div>
            </div>

            {successLoot && (
              <div className="bg-green-900/20 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-green-700/50 animate-fade-in">
                <h3 className="text-xl font-bold text-green-400 mb-3 flex items-center">
                  <FaStar className="mr-2 text-yellow-400" /> Battle Reward
                </h3>

                <div className="flex items-start">
                  <img
                    src={successLoot.image}
                    alt={successLoot.name}
                    className="w-20 h-20 object-contain bg-green-900/30 p-2 rounded flex-shrink-0 mr-4"
                  />
                  <div>
                    <p className={`text-lg font-bold mb-1 ${rarityColors[successLoot.rarity]}`}>
                      {successLoot.name} <span className="text-xs font-normal">({successLoot.rarity})</span>
                    </p>
                    <p className="text-gray-300 text-sm">{successLoot.description}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showBossModal && fightStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-yellow-600">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Boss Battle Report</h2>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-400">Your Health</p>
                <div className="w-full bg-red-900/30 rounded-full h-4 mt-1">
                  <div
                    className="bg-red-600 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${playerHealth}%` }}
                  ></div>
                </div>
                <p className="text-lg font-bold mt-1">{playerHealth}%</p>
              </div>

              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-400">{selectedTarget}'s Health</p>
                <div className="w-full bg-yellow-900/30 rounded-full h-4 mt-1">
                  <div
                    className="bg-yellow-500 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${bossHealth}%` }}
                  ></div>
                </div>
                <p className="text-lg font-bold mt-1">{bossHealth}%</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-400">Weapon</p>
                <p className="font-bold">{selectedWeapon}</p>
                <p className="text-xs">Accuracy: {fightStats.weaponAccuracy}%</p>
              </div>

              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm text-gray-400">Success Chance</p>
                <p className="font-bold text-green-400">{fightStats.successChance}%</p>
                <p className="text-xs">Bullets Used: {bulletsUsed}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-lg mb-2">Battle Log</h3>
              <div className="bg-gray-900 p-3 rounded max-h-60 overflow-y-auto">
                {fightStats.log.map((entry, index) => (
                  <div key={index} className="mb-2 pb-2 border-b border-gray-700 last:border-0">
                    <p className="text-yellow-500 text-sm">Round {entry.round}</p>
                    <p className="text-sm">{entry.action}</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Boss HP: {entry.bossHp}%</span>
                      <span>Your HP: {entry.playerHp}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mb-4">
              <h3 className="font-bold text-xl mb-2">
                {successLoot ? (
                  <span className="text-green-400">Victory!</span>
                ) : (
                  <span className="text-red-400">Defeat</span>
                )}
              </h3>

              {successLoot && (
                <div className="p-3 bg-green-900/30 rounded-lg border border-green-600/30 flex items-center justify-center">
                  <img
                    src={successLoot.image}
                    alt={successLoot.name}
                    className="w-16 h-16 object-contain mr-3"
                  />
                  <div className="text-left">
                    <p className={`font-bold ${rarityColors[successLoot.rarity]}`}>{successLoot.name}</p>
                    <p className="text-sm text-gray-300">{successLoot.description}</p>
                  </div>
                </div>
              )}

              {!successLoot && (
                <p className="text-gray-400">
                  You were defeated by {selectedTarget}. Try again with more bullets or a better weapon!
                </p>
              )}
            </div>

            <button
              onClick={() => setShowBossModal(false)}
              className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BossesPage;