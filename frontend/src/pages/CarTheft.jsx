import React, { useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';

const venues = {
  'Rich Potato Neighborhood': {
    image: '/assets/rich.png',
  },
  'Spudville Downtown': {
    image: '/assets/downtown.png',
  },
  'Fries End Suburbs': {
    image: '/assets/fries.png',
  },
  'Mashy Meadows': {
    image: '/assets/mashy.png',
  },
  'Tuber Town': {
    image: '/assets/tuber.png',
  },
};

const CarTheft = () => {
  const { money, updateUserData } = useContext(AuthContext);
  const [stolenCars, setStolenCars] = useState([]);
  const [inJail, setInJail] = useState(false);
  const [jailTime, setJailTime] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [failureMessage, setFailureMessage] = useState('');
  const [showGarage, setShowGarage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('token');

  const fetchUserData = useCallback(async () => {
    const res = await fetch('/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (data.success) {
      setStolenCars(data.userData.cars || []);
      updateUserData({
        money: data.userData.money,
        xp: data.userData.xp,
        rank: data.userData.rank,
      });
      if (data.userData.inJail && data.userData.jailTimeEnd) {
        const timeLeft = Math.max(0, new Date(data.userData.jailTimeEnd) - Date.now());
        setInJail(timeLeft > 0);
        setJailTime(Math.ceil(timeLeft / 1000));
      } else {
        setInJail(false);
        setJailTime(0);
      }
    }
  }, [token, updateUserData]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setStolenCars(data.userData.cars || []);
          updateUserData({
            money: data.userData.money,
            xp: data.userData.xp,
            rank: data.userData.rank,
            inJail: data.userData.inJail,
            jailTimeEnd: data.userData.jailTimeEnd,
          });
          if (data.userData.inJail) {
            const jailEndTime = new Date(data.userData.jailTimeEnd).getTime();
            const jailTimeLeft = Math.ceil((jailEndTime - Date.now()) / 1000);
            if (jailTimeLeft > 0) {
              setInJail(true);
              setJailTime(jailTimeLeft);
            } else {
              setInJail(false);
              setJailTime(0);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
  
    fetchUserData();
  }, [updateUserData]);

useEffect(() => {
  if (!inJail || jailTime <= 0) return;

  const timer = setInterval(() => {
    setJailTime((prevTime) => {
      if (prevTime <= 1) {
        clearInterval(timer);
        setInJail(false);
        updateUserData({ inJail: false, jailTimeEnd: null });
        setSuccessMessage('You are free from jail!');
        return 0;
      }
      return prevTime - 1;
    });
  }, 1000);

  return () => clearInterval(timer);
}, [inJail, jailTime, updateUserData]);


  const stealCar = async (venueName) => {
    if (inJail || isLoading) return;
    setIsLoading(true);
    setSuccessMessage('');
    setFailureMessage('');

    try {
      const res = await fetch('/api/cartheft/steal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ venueName }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setStolenCars((prev) => [...prev, data.car]);
        updateUserData({ xp: data.xp, rank: data.rank });
      } else if (data.inJail) {
        setFailureMessage(data.message);
        setInJail(true);
        setJailTime(data.jailTime);
      } else {
        setFailureMessage(data.message);
      }
    } catch (error) {
      setFailureMessage('An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const sellCar = async (index) => {
    if (isLoading) return;
    setIsLoading(true);
    setSuccessMessage('');
    setFailureMessage('');

    try {
      const res = await fetch('/api/cartheft/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ carIndex: index }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(data.message);
        setStolenCars((prev) => prev.filter((_, i) => i !== index));
        updateUserData({ money: data.money });
      } else {
        setFailureMessage(data.message);
      }
    } catch {
      setFailureMessage('An error occurred while selling the car.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheat = async () => {
    const updatedMoney = money + 5000000;
    try {
      const res = await fetch('/api/users/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ money: updatedMoney, inJail: false, jailTimeEnd: null }),
      });

      if (res.ok) {
        setInJail(false);
        setJailTime(0);
        updateUserData({ money: updatedMoney });
        setSuccessMessage('Cheat activated: Money added and released from jail.');
      } else {
        setFailureMessage('Cheat failed.');
      }
    } catch {
      setFailureMessage('Cheat error.');
    }
  };

  return (
    <div className="container mx-auto p-6 mb-40 bg-white rounded-lg">
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Car Theft</h2>
      <p className="text-gray-500 text-center mb-4">
        Why steal a car when you can't even drive? <br />
        The rich have some nice cars, but also very good alarm systems.
      </p>
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(venues).map(([venueName, venue]) => (
          <div key={venueName} className="bg-gray-100 rounded shadow p-4 text-center">
            <h3 className="text-xl font-semibold mb-2">{venueName}</h3>
            <img src={venue.image} className="h-40 w-full object-cover rounded mb-4" alt={venueName} />
            <button
              disabled={inJail || isLoading}
              onClick={() => stealCar(venueName)}
              className={`w-full bg-blue-500 text-white py-2 rounded ${inJail || isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
            >
              {isLoading ? 'Stealing...' : 'Steal Car'}
            </button>
          </div>
        ))}
      </div>

      {successMessage && <div className="mt-4 bg-green-200 text-green-800 rounded p-2 text-center">{successMessage}</div>}
      {failureMessage && <div className="mt-4 bg-red-200 text-red-800 rounded p-2 text-center">{failureMessage}</div>}

      {inJail && (
        <div className="mt-4 bg-yellow-100 text-yellow-800 rounded p-4 text-center">
          <p className="font-semibold">You are in jail!</p>
          <p>Jail time left: {jailTime} seconds.</p>
          <img src="/assets/potatojail.JPG" className="w-64 h-64 object-cover mx-auto rounded mt-2" alt="Jail" />
        </div>
      )}

      <button onClick={() => setShowGarage((v) => !v)} className="mt-6 bg-gray-700 text-white px-6 py-3 rounded-full hover:bg-gray-800">
        {showGarage ? 'Hide Garage' : 'Show Garage'}
      </button>

      {showGarage && (
        <div className="mt-4 bg-gray-50 rounded shadow p-6">
          {stolenCars.length ? stolenCars.map((car, idx) => (
            <div key={idx} className="flex items-center justify-between bg-white rounded p-2 mb-2 shadow">
              <img src={car.image} className="w-16 h-16 rounded mr-4" alt={car.name} />
              <span>{car.name} (${car.price})</span>
              <button onClick={() => sellCar(idx)} className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Sell</button>
            </div>
          )) : <p>No cars in your garage.</p>}
        </div>
      )}

      <p className="mt-4 text-center font-bold">Money: ${money}</p>

      <button onClick={handleCheat} className="mt-4 bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700">Cheat</button>
    </div>
  );
};

export default CarTheft;
