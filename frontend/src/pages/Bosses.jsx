import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const BossesPage = () => {
  const { user, updateUserData } = useContext(AuthContext); // Ensure updateUserData is available in the context
  const [money, setMoney] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [bossItems, setBossItems] = useState([]); 
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [bulletsUsed, setBulletsUsed] = useState(1);
  const [bossImage, setBossImage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [failureMessage, setFailureMessage] = useState('');

  const bosses = {
    'Potato President': {
      name: 'Presidential Medal',
      image: '/assets/potato-president.png',
      loot: { name: 'Presidential Medal', image: '/assets/presidential-medal.png' },
      xpReward: 1000, 
    },
    'Potato Dragon': {
      name: "Dragon's Hoard",
      image: '/assets/potato-dragon.png',
      loot: { name: "Dragon's Hoard", image: '/assets/dragon-hoard.png' },
      xpReward: 2000,
    },
    'Potato Don': {
      name: 'Mafia Ring',
      image: '/assets/potato-boss.png',
      loot: { name: 'Mafia Ring', image: '/assets/mafia-fortune.png' },
      xpReward: 1500,
    },
    'Spud Spy': {
      name: 'Invisible Cloak',
      image: '/assets/spud-spy.png',
      loot: { name: 'Invisible Cloak', image: '/assets/invisible-cloak.png' },
      xpReward: 1200,
    },
    'Potato Pirate': {
      name: "Pirate's Compass",
      image: '/assets/potato-pirate.png',
      loot: { name: "Pirate's Compass", image: '/assets/pirate-compass.png' },
      xpReward: 1800,
    },
    'Gourmet Chef Tater': {
      name: 'Golden Spatula',
      image: '/assets/gourmet-chef.png',
      loot: { name: 'Golden Spatula', image: '/assets/golden-spatula.png' },
      xpReward: 1700,
    },
    'Astronaut Spudnik': {
      name: 'Star Dust',
      image: '/assets/potato-astronaut.png',
      loot: { name: 'Star Dust', image: '/assets/star-dust.png' },
      xpReward: 2500,
    },
    'Sheriff Tater': {
      name: "Sheriff's Badge",
      image: '/assets/sheriff-tater.png',
      loot: { name: "Sheriff's Badge", image: '/assets/sheriffs-badge.png' },
      xpReward: 1400,
    },
  };

  const bossItemNames = Object.values(bosses).map((boss) => boss.loot.name);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setInventory(data.userData.inventory || []);
          setMoney(data.userData.money || 0);
          setBossItems(data.userData.bossItems || []);
        } else {
          setFailureMessage(data.message || 'Failed to fetch user data.');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setFailureMessage('Server error occurred.');
      }
    };
    fetchUserData();
  }, []);

  const handleSelectBoss = (e) => {
    const boss = e.target.value;
    setSelectedTarget(boss);
    setBossImage(bosses[boss]?.image || '');
  };

  const handleSelectWeapon = (e) => {
    setSelectedWeapon(e.target.value);
  };

  const calculateSuccessChance = (weaponAccuracy, bulletsUsed, targetChance) => {
    return Math.min(1, (weaponAccuracy * bulletsUsed) / 100 / targetChance);
  };

  const getTargetChance = (targetName) => {
    const chances = {
      'Potato President': 500,
      'Potato Dragon': 1000,
      'Potato Don': 700,
      'Spud Spy': 700,
      'Potato Pirate': 100,
      'Gourmet Chef Tater': 50,
      'Astronaut Spudnik': 200,
      'Sheriff Tater': 900,
    };
    return chances[targetName] || 5000;
  };

  const attemptBossFight = async () => {
    setSuccessMessage('');
    setFailureMessage('');

    const selectedWeaponItem = inventory.find((item) => item.name === selectedWeapon);

    if (!selectedWeaponItem || !selectedWeaponItem.attributes.accuracy) {
      setFailureMessage("You don't have a valid weapon selected.");
      return;
    }

    if (!selectedTarget) {
      setFailureMessage('You have not selected a boss.');
      return;
    }

    const bulletsCost = bulletsUsed * 100;
    if (money < bulletsCost) {
      setFailureMessage('You do not have enough money to execute the assassination.');
      return;
    }

    const targetChance = getTargetChance(selectedTarget);
    const successChance = calculateSuccessChance(
      selectedWeaponItem.attributes.accuracy,
      bulletsUsed,
      targetChance
    );

    const updatedMoney = money - bulletsCost;
    await updateUserMoney(updatedMoney);

    if (Math.random() < successChance) {
      const loot = bosses[selectedTarget].loot;

      const updatedBossItems = [...bossItems];
      const existingBossItem = updatedBossItems.find((item) => item.name === loot.name);

      if (existingBossItem) {
        existingBossItem.quantity += 1;
      } else {
        updatedBossItems.push({
          name: loot.name,
          quantity: 1,
          image: loot.image,
        });
      }

      setBossItems(updatedBossItems);

      await updateUserBossItems(updatedBossItems);

      const xpGained = bosses[selectedTarget].xpReward;
      const updatedXp = user.xp + xpGained;

      await updateUserXP(updatedXp);

      updateUserData({ xp: updatedXp, rank: user.rank }); 

      setSuccessMessage(`You defeated ${selectedTarget}, earned ${loot.name}, and gained ${xpGained} XP!`);
    } else {
      setFailureMessage(`The fight with ${selectedTarget} failed or the target escaped.`);
    }
  };

  const updateUserBossItems = async (updatedBossItems) => {
    try {
      const response = await fetch('/api/users/updateBossItems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ bossItems: updatedBossItems }),
      });
      if (!response.ok) throw new Error('Failed to update boss items.');
    } catch (error) {
      setFailureMessage('Server error occurred while updating boss items.');
    }
  };

  const updateUserMoney = async (updatedMoney) => {
    try {
      const response = await fetch('/api/users/updateMoney', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ money: updatedMoney }),
      });
      if (!response.ok) throw new Error('Error updating money.');
      const data = await response.json();
      setMoney(data.money);
    } catch (error) {
      setFailureMessage('Server error occurred while updating money.');
    }
  };

  const updateUserXP = async (updatedXp) => {
    try {
      const response = await fetch('/api/users/updateXP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ xp: updatedXp }),
      });
      if (!response.ok) throw new Error('Error updating XP.');
    } catch (error) {
      setFailureMessage('Server error occurred while updating XP.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-20">
      <div className="container mx-auto px-6 py-12 md:flex md:gap-8">

        {/* Left Column: Interaction */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl font-bold text-yellow-400">Boss Fights</h1>
          <p className="text-gray-400">
            Challenge the legendary bosses and seize their unique treasures. <br/>
            But bring enough bullets or you might get absolutely smashed.
          </p>

          {failureMessage && <p className="bg-red-800 p-3 rounded">{failureMessage}</p>}
          {successMessage && <p className="bg-green-800 p-3 rounded">{successMessage}</p>}

          {/* Select Boss */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block mb-2">Select Boss:</label>
            <select
              className="w-full p-2 rounded bg-gray-700"
              onChange={handleSelectBoss}
            >
              <option value="">Select Boss</option>
              {Object.keys(bosses).map(boss => (
                <option key={boss} value={boss}>{boss}</option>
              ))}
            </select>
          </div>

          {/* Select Weapon */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block mb-2">Select Weapon:</label>
            <select
              className="w-full p-2 rounded bg-gray-700"
              onChange={handleSelectWeapon}
            >
              <option value="">Select Weapon</option>
              {inventory.filter(w => w.attributes?.accuracy).map((w, i) => (
                <option key={i} value={w.name}>{w.name} ({w.attributes.accuracy}%)</option>
              ))}
            </select>
          </div>

          {/* Bullets */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block mb-2">Bullets (1 bullet = $100):</label>
            <input
              type="number"
              value={bulletsUsed}
              min="1"
              max="1000"
              onChange={e => setBulletsUsed(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 rounded"
            />
          </div>

          <button
            onClick={attemptBossFight}
            className="w-full py-3 rounded font-bold bg-yellow-500 hover:bg-yellow-400 text-black"
          >
            Execute
          </button>
        </div>

        {/* Right Column: Boss Image */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center">
          {bossImage ? (
            <img src={bossImage} className="rounded-xl shadow-xl" alt="Boss" />
          ) : (
            <img src="/assets/bossbattle.png" className="rounded-xl shadow-xl" alt="Default Boss" />
          )}
        </div>

      </div>
    </div>
  );
};

export default BossesPage;
