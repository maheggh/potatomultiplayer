import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const WeaponStore = () => {
  const { user } = useContext(AuthContext);
  const [money, setMoney] = useState(0);
  const [inventory, setInventory] = useState([]);
  const [weapons, setWeapons] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const weaponsResponse = await fetch('/api/weapons');
        const weaponsData = await weaponsResponse.json();
        if (weaponsResponse.ok && weaponsData.success) {
          setWeapons(weaponsData.items);
        } else {
          setErrorMessage(weaponsData.message || 'Failed to fetch weapons.');
        }

        const userResponse = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const userData = await userResponse.json();
        if (userResponse.ok && userData.success) {
          setMoney(userData.userData.money);
          setInventory(userData.userData.inventory || []);
        } else {
          setErrorMessage(userData.message || 'Failed to fetch user data.');
        }
      } catch {
        setErrorMessage('Server error occurred.');
      }
    };

    fetchData();
  }, []);

  const handleBuyWeapon = async (weaponId) => {
    try {
      const response = await fetch('/api/weapons/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ weaponId }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMoney(data.money);
        setInventory(data.inventory);
        setErrorMessage('');
      } else {
        setErrorMessage(data.message || 'Failed to buy weapon.');
      }
    } catch {
      setErrorMessage('Server error occurred.');
    }
  };

  const handleSellWeapon = async (weaponName) => {
    try {
      const response = await fetch('/api/weapons/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ weaponName }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setMoney(data.money);
        setInventory(data.inventory);
        setErrorMessage('');
      } else {
        setErrorMessage(data.message || 'Failed to sell weapon.');
      }
    } catch {
      setErrorMessage('Server error occurred.');
    }
  };

  const userOwnsWeapon = (weaponName) =>
    inventory.some((item) => item.name === weaponName);

  return (
    <div className="min-h-screen min-w-full bg-gray-900 text-white py-20">
      <div className="container min-w-full mx-auto px-6 py-12 md:flex md:gap-8">

        {/* Left Column: Store Illustration */}
        <div className="hidden md:flex md:w-1/2">
          <img
            src="/assets/weaponstore.png"
            className="object-fit"
            alt="Weapon Store"
          />
        </div>

        {/* Right Column: Shop Interaction */}
        <div className="md:w-1/2 space-y-6">
          <p className="text-gray-400">
            Upgrade your arsenal and dominate the potato mafia world!
          </p>

          {errorMessage && (
            <p className="bg-red-800 text-center p-3 rounded">{errorMessage}</p>
          )}

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-2xl mb-4 font-semibold">🛒 Available Weapons</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {weapons.map((weapon) => (
                <div
                  key={weapon.id}
                  className="bg-gray-700 p-3 rounded-lg shadow-lg flex flex-col items-center"
                >
                  <img
                    src={`/assets/${weapon.image}`}
                    alt={weapon.name}
                    className="w-20 h-20 mb-2 object-contain"
                  />
                  <h3 className="text-lg font-semibold text-yellow-300">{weapon.name}</h3>
                  <p className="text-green-400 font-semibold">💰 ${weapon.price}</p>
                  <p className="text-gray-300">🎯 {weapon.accuracy}% Accuracy</p>
                  {userOwnsWeapon(weapon.name) ? (
                    <button
                      disabled
                      className="mt-2 bg-gray-500 py-1 px-4 rounded-lg cursor-not-allowed"
                    >
                      Owned
                    </button>
                  ) : (
                    <button
                      onClick={() => handleBuyWeapon(weapon.id)}
                      className="mt-2 bg-yellow-500 hover:bg-yellow-400 text-black py-1 px-4 rounded-lg"
                    >
                      Buy
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-2xl mb-4 font-semibold">🎒 Your Inventory</h2>
            {inventory.filter(item => item.attributes?.accuracy).length ? (
              inventory.filter(item => item.attributes?.accuracy).map((invItem, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-gray-700 p-3 rounded-lg mb-2"
                >
                  <span className="text-gray-300">{invItem.name}</span>
                  <button
                    onClick={() => handleSellWeapon(invItem.name)}
                    className="bg-blue-600 hover:bg-blue-500 py-1 px-4 rounded-lg"
                  >
                    Sell for 💰 {(invItem.price * 0.5).toFixed(0)}
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400">No weapons owned yet.</p>
            )}
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-xl">
              💰 Money: <span className="text-green-400 font-bold">${money}</span>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WeaponStore;
