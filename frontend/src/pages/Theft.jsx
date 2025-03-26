import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';

const categories = ['Purse', 'Jewelry', 'ATM', 'Bank'];

const Theft = () => {
  const { money, updateUserData } = useContext(AuthContext);
  const [stolenItems, setStolenItems] = useState([]);
  const [inJail, setInJail] = useState(false);
  const [jailTime, setJailTime] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [showPocket, setShowPocket] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStolenItems = useCallback(async () => {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/theft/stolen-items', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const { stolenItems, inJail, jailTime } = await res.json();
      setStolenItems(stolenItems || []);
      setInJail(inJail);
      setJailTime(jailTime);
    }
  }, []);

  useEffect(() => {
    fetchStolenItems();
  }, [fetchStolenItems]);

  useEffect(() => {
    let interval;
    if (inJail && jailTime > 0) {
      interval = setInterval(() => {
        setJailTime((time) => {
          if (time <= 1) {
            clearInterval(interval);
            setInJail(false);
            updateUserData({ inJail: false, jailTimeEnd: null });
            setSuccessMessage('You are free from jail!');
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [inJail, jailTime, updateUserData]);

  const stealItem = async (category) => {
    if (inJail || isLoading) return;

    setSuccessMessage('');
    setFailureMessage('');
    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/theft/steal', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemType: category }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setStolenItems((prev) => [...prev, data.stolenItem]);
        updateUserData({ xp: data.xp, rank: data.rank });
      } else {
        setFailureMessage(data.message);
        if (data.inJail) {
          setInJail(true);
          setJailTime(data.jailTime);
        }
      }
    } catch {
      setFailureMessage('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const sellItem = async (index) => {
    const item = stolenItems[index];
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/theft/sell', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ itemName: item.name }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setStolenItems((prev) => prev.filter((_, i) => i !== index));
        updateUserData({ money: data.money });
      } else {
        setFailureMessage(data.message);
      }
    } catch {
      setFailureMessage('An error occurred while selling.');
    }
  };

  const handleCheat = async () => {
    const updatedMoney = money + 5000000;
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          money: updatedMoney,
          inJail: false,
          jailTimeEnd: null,
        }),
      });
      if (res.ok) {
        setInJail(false);
        setJailTime(0);
        updateUserData({ money: updatedMoney, inJail: false, jailTimeEnd: null });
        setSuccessMessage('Cheat activated: Money added and released from jail.');
      } else {
        setFailureMessage('Failed to activate cheat.');
      }
    } catch {
      setFailureMessage('An error occurred while activating cheat.');
    }
  };

  return (
    <div className="container mx-auto p-6 mb-40 bg-white rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Theft</h2>
      <p className="text-gray-500 mt-2 p-4 text-lg text-center">
        Steal from the weak, risk jail, and sell what you can before you're caught.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <div key={cat} className="p-4 bg-gray-100 rounded-lg shadow-md flex flex-col items-center">
            <h3 className="text-xl font-semibold mb-2 text-gray-700">{cat}</h3>
            <img 
              src={`/assets/${cat.toLowerCase()}.png`} 
              alt={cat}
              className="w-full h-64 object-contain rounded-md mb-4" 
            />
            <button
              onClick={() => stealItem(cat)}
              className={`w-full py-2 px-4 rounded-md text-white transition duration-200 ${
                inJail || isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
              }`}
              disabled={inJail || isLoading}
            >
              {isLoading ? 'Stealing...' : 'Steal'}
            </button>
          </div>
        ))}
      </div>

      {successMessage && (
        <div className="mt-6 p-4 bg-green-200 text-green-800 rounded-md text-center">
          {successMessage}
        </div>
      )}
      {failureMessage && (
        <div className="mt-6 p-4 bg-red-200 text-red-800 rounded-md text-center">
          {failureMessage}
        </div>
      )}

      {inJail && jailTime > 0 && (
        <div className="mt-6 p-6 bg-yellow-100 text-yellow-800 rounded-lg flex flex-col items-center">
          <p className="text-lg font-semibold">You are in jail!</p>
          <p className="text-md mt-2">Jail time left: {jailTime} seconds.</p>
          <img src="/assets/potatojail.JPG" alt="Jail" className="w-64 h-64 object-cover mt-4 rounded-md" />
        </div>
      )}

      <div className="mt-6 text-center">
        <button
          onClick={() => setShowPocket((prev) => !prev)}
          className="bg-gray-700 text-white px-6 py-3 rounded-full hover:bg-gray-800 transition duration-200"
        >
          {showPocket ? 'Hide Pocket' : 'Show Pocket'}
        </button>
        {showPocket && (
          <ul className="mt-6 bg-gray-50 p-6 rounded-lg shadow-md space-y-4">
            {stolenItems.length ? stolenItems.map((item, i) => (
              <li key={i} className="flex justify-between items-center">
                <img 
                  src={`/assets/${item.name.toLowerCase().replace(/\s+/g, '-')}.png`} 
                  alt={item.name} className="w-16 h-16 rounded-md"
                />
                <span>{item.name} (${item.price})</span>
                <button
                  onClick={() => sellItem(i)}
                  className="bg-green-500 text-white px-3 py-1 rounded-md"
                >
                  Sell
                </button>
              </li>
            )) : <p>No items in your pocket.</p>}
          </ul>
        )}
      </div>

      <div className="mt-6 text-center font-bold text-xl text-green-600">Money: ${money}</div>
      <button onClick={handleCheat} className="mt-6 bg-red-600 text-white px-6 py-3 rounded-full">
        Cheat
      </button>
    </div>
  );
};

export default Theft;
