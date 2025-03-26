import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const AssassinationPage = () => {
  const { user, money, updateUserData, isAlive, kills } = useContext(AuthContext);

  const [targets, setTargets] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [weapons, setWeapons] = useState([]);
  const [selectedWeapon, setSelectedWeapon] = useState(null);
  const [bossItems, setBossItems] = useState([]);
  const [selectedBossItem, setSelectedBossItem] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioImage, setScenarioImage] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [bulletsUsed, setBulletsUsed] = useState(1);

  const COOLDOWN_TIME = 60 * 1000;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();
        if (data.success) {
          setWeapons(data.userData.inventory.filter(item => item.attributes?.accuracy));
          setBossItems(data.userData.bossItems || []);
        } else {
          setErrorMessage(data.message || 'Failed to fetch user data.');
        }
      } catch {
        setErrorMessage('Server error occurred.');
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchTargets = async () => {
      try {
        const response = await fetch('/api/users/targets', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        const data = await response.json();
        if (response.ok && data.success) {
          setTargets(data.targets);
          if (data.targets.length === 0) {
            setErrorMessage('No valid targets are currently available.');
          }
        } else {
          setErrorMessage(data.message || 'Failed to fetch targets.');
        }
      } catch {
        setErrorMessage('Server error occurred while fetching targets.');
      }
    };
    fetchTargets();
  }, []);

  useEffect(() => {
    const lastAttempt = localStorage.getItem('lastAssassinationAttempt');
    if (lastAttempt) {
      const remainingCooldown = COOLDOWN_TIME - (Date.now() - new Date(lastAttempt).getTime());
      if (remainingCooldown > 0) {
        setCooldown(remainingCooldown);
        const interval = setInterval(() => {
          setCooldown(prev => (prev <= 1000 ? clearInterval(interval) || 0 : prev - 1000));
        }, 1000);
        return () => clearInterval(interval);
      }
    }
  }, []);

  const attemptAssassination = async () => {
    setResultMessage('');
    setErrorMessage('');
    setIsLoading(true);

    if (targets.length === 0) {
      setErrorMessage('No targets available.');
      setIsLoading(false);
      return;
    }

    if (!selectedTarget || !selectedWeapon) {
      setErrorMessage('You must select a target and a weapon.');
      setIsLoading(false);
      return;
    }

    if (bulletsUsed < 1 || bulletsUsed > 1000) {
      setErrorMessage('Bullets must be between 1 and 1000.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/assassination/attempt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          targetId: selectedTarget._id,
          weaponName: selectedWeapon.name,
          bossItemName: selectedBossItem?.name || null,
          bulletsUsed,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const newMoney = money - data.actualBulletCost + (data.lootMoney || 0);
        updateUserData({ money: newMoney, kills: data.updatedKills });
        setResultMessage(data.message);
        setScenarioImage('/assets/success.png');
        localStorage.setItem('lastAssassinationAttempt', new Date());
        setCooldown(COOLDOWN_TIME);
      } else {
        setErrorMessage(data.message || 'Assassination attempt failed.');
        setScenarioImage('/assets/failure.png');
      }
    } catch {
      setErrorMessage('Server error occurred during assassination.');
      setScenarioImage('/assets/error.png');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-20 text-white">
      <div className="container mx-auto px-6 py-12 md:flex md:gap-8">
        
        {/* Left Column: Interaction */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl font-bold text-red-500">Assassination Mission</h1>
          <p className="text-gray-400">Select your target and weapons, prepare your bullets, and make your move.<br/>
          But they will fire back... probably... so don't be an idiot.. okay?</p>

          {errorMessage && <p className="bg-red-800 p-3 rounded">{errorMessage}</p>}
          {resultMessage && <p className="bg-green-800 p-3 rounded">{resultMessage}</p>}

          {/* Select Target */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block mb-2">Choose Target:</label>
            <select
              value={selectedTarget?._id || ''}
              onChange={e => setSelectedTarget(targets.find(t => t._id === e.target.value))}
              className="w-full p-2 rounded bg-gray-700"
            >
              <option value="">Select Target</option>
              {targets.map(target => (
                <option key={target._id} value={target._id}>{target.username}</option>
              ))}
            </select>
          </div>

          {/* Select Weapon */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block mb-2">Choose Weapon:</label>
            <div className="flex flex-wrap gap-2">
              {weapons.map((weapon) => (
                <button
                  key={weapon.name}
                  onClick={() => setSelectedWeapon(selectedWeapon?.name === weapon.name ? null : weapon)}
                  className={`px-3 py-2 rounded ${
                    selectedWeapon?.name === weapon.name ? 'bg-yellow-500 text-black' : 'bg-gray-700'
                  }`}
                >
                  {weapon.name} ({weapon.attributes.accuracy}%)
                </button>
              ))}
            </div>
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
            onClick={attemptAssassination}
            disabled={isLoading || cooldown > 0}
            className={`w-full py-3 rounded font-bold ${
              isLoading || cooldown > 0 ? 'bg-gray-600' : 'bg-red-600 hover:bg-red-500'
            }`}
          >
            {isLoading ? 'Executing...' : 'Assassinate'}
          </button>

          {cooldown > 0 && <p className="text-yellow-400">Cooldown: {Math.ceil(cooldown / 1000)}s</p>}
        </div>

        {/* Right Column: Image */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center">
          <img src="/assets/assassination.png" className="rounded-xl shadow-xl" alt="Assassination" />
        </div>
      </div>
    </div>
  );
};

export default AssassinationPage;
