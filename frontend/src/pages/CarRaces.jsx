import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const CarRaces = () => {
  const { user } = useContext(AuthContext);
  const [stolenCars, setStolenCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState('');
  const [raceResult, setRaceResult] = useState(null);
  const [raceCooldown, setRaceCooldown] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  const allCars = [
    { name: 'Luxury Spud Sedan', price: 120000, baseChance: 5, image: '/assets/luxury-spud-sedan.png', type: 'car' },
    { name: 'Sporty Tater Coupe', price: 40000, baseChance: 8, image: '/assets/sporty-tater-coupe.png', type: 'car' },
    { name: 'Potato Convertible', price: 30000, baseChance: 10, image: '/assets/potato-convertible.png', type: 'car' },
    { name: 'SUV Spud', price: 2000, baseChance: 20, image: '/assets/suv-spud.png', type: 'car' },
    { name: 'Hatchback Tuber', price: 1500, baseChance: 20, image: '/assets/hatchback-tuber.png', type: 'car' },
    { name: 'Sedan Yam', price: 20000, baseChance: 10, image: '/assets/sedan-yam.png', type: 'car' },
    { name: 'SUV Tater', price: 25000, baseChance: 8, image: '/assets/suv-tater.png', type: 'car' },
    { name: 'Spudnik Sports', price: 90000, baseChance: 4, image: '/assets/spudnik-sports.png', type: 'car' },
    { name: 'Compact Fry', price: 10000, baseChance: 25, image: '/assets/compact-fry.png', type: 'car' },
    { name: 'Curly Coupe', price: 15000, baseChance: 20, image: '/assets/curly-coupe.png', type: 'car' },
    { name: 'Wedge Wagon', price: 20000, baseChance: 15, image: '/assets/wedge-wagon.png', type: 'car' },
    { name: 'Crispy Convertible', price: 110000, baseChance: 5, image: '/assets/crispy-convertible.png', type: 'car' },
    { name: 'Mashed Mini', price: 500, baseChance: 30, image: '/assets/mashed-mini.png', type: 'car' },
    { name: 'Buttery Buggy', price: 8000, baseChance: 20, image: '/assets/buttery-buggy.png', type: 'car' },
    { name: 'Gravy Sedan', price: 12000, baseChance: 15, image: '/assets/gravy-sedan.png', type: 'car' },
    { name: 'Peeler Pickup', price: 18000, baseChance: 5, image: '/assets/peeler-pickup.png', type: 'car' },
    { name: 'Root Roadster', price: 7000, baseChance: 30, image: '/assets/root-roadster.png', type: 'car' },
    { name: 'Bulb Buggy', price: 10000, baseChance: 25, image: '/assets/bulb-buggy.png', type: 'car' },
    { name: 'Starch Sedan', price: 15000, baseChance: 15, image: '/assets/starch-sedan.png', type: 'car' },
    { name: 'Tuber Truck', price: 60000, baseChance: 5, image: '/assets/tuber-truck.png', type: 'car' },
  ];

  useEffect(() => {
    fetchStolenCars();
    const cooldownEnd = parseInt(localStorage.getItem('raceCooldownEnd'), 10);
    if (cooldownEnd && Date.now() < cooldownEnd) {
      startCooldown(Math.ceil((cooldownEnd - Date.now()) / 1000));
    }
  }, []);

  const fetchStolenCars = async () => {
    const response = await fetch('/api/users/profile', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    const data = await response.json();
    if (data.success) setStolenCars(data.userData.cars || []);
  };

  const handleRace = async () => {
    if (raceCooldown || !selectedCar) {
      alert('Select a car and ensure no cooldown is active.');
      return;
    }
  
    const playerCar = stolenCars.find(car => car.name === selectedCar);
    const opponentCar = allCars[Math.floor(Math.random() * allCars.length)];
  
    const playerSpeed = playerCar.price / 1000 + Math.random() * 20;
    const opponentSpeed = opponentCar.price / 1000 + Math.random() * 20;
  
    let message = '', image = '';
  
    try {
      if (Math.random() < 0.08) {
        await removeCar(playerCar.name);
        message = `Disaster! Your ${playerCar.name} crashed!`;
        image = '/assets/race2.png';
      } else if (playerSpeed > opponentSpeed) {
        const wonCar = allCars[Math.floor(Math.random() * allCars.length)];
        await addCar(wonCar);
        message = `You won! You took home a ${wonCar.name}.`;
        image = '/assets/race6.png';
      } else {
        await removeCar(playerCar.name);
        message = `You lost your ${playerCar.name}!`;
        image = '/assets/race8.png';
      }
  
      setRaceResult({ message, image });
      startCooldown(30);
      setSelectedCar('');
    } catch (error) {
      console.error('Race error:', error);
      alert('An error occurred during the race.');
    }
  };
  

  const startCooldown = duration => {
    setRaceCooldown(true);
    setCooldownMessage(`You have too much heat on you dawg, lay low for ${duration} seconds.`);
    const interval = setInterval(() => {
      duration -= 1;
      setCooldownMessage(`You have too much heat on you dawg, lay low for ${duration} seconds.`);
      if (duration <= 0) {
        clearInterval(interval);
        setRaceCooldown(false);
        setCooldownMessage('');
        localStorage.removeItem('raceCooldownEnd');
      }
    }, 1000);
    localStorage.setItem('raceCooldownEnd', Date.now() + duration * 1000);
  };

  const removeCar = async name => {
    await fetch('/api/carraces/removeCar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ carName: name }),
    });
    fetchStolenCars();
  };

  const addCar = async car => {
    await fetch('/api/carraces/addCar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ car }),
    });
    fetchStolenCars();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white py-20">
      <div className="container mx-auto px-6 py-12 md:flex md:gap-8">

        {/* Left Side: Interaction */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl font-bold text-yellow-400">Underground Car Races</h1>
          <p className="text-gray-400">
            Enter the dangerous world of underground racing. Win, and you’ll ride home richer. Lose, and you'll walk home empty-handed.
          </p>

          {cooldownMessage && <p className="bg-red-800 p-3 rounded">{cooldownMessage}</p>}
          {raceResult && <p className="bg-gray-800 p-3 rounded">{raceResult.message}</p>}

          {/* Car Selection */}
          <div className="bg-gray-800 rounded-lg p-4">
            <label className="block mb-2">Select Your Car:</label>
            <select
              className="w-full p-2 rounded bg-gray-700"
              value={selectedCar}
              onChange={e => setSelectedCar(e.target.value)}
            >
              <option value="">Choose a car</option>
              {stolenCars.map((car, i) => (
                <option key={i} value={car.name}>{car.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRace}
            disabled={raceCooldown || !selectedCar}
            className="w-full py-3 rounded font-bold bg-yellow-500 hover:bg-yellow-400 text-black"
          >
            Start Race
          </button>

          {raceResult && (
  <div className="mt-6 bg-gray-800 rounded-xl shadow-lg overflow-hidden p-4 flex flex-col items-center justify-center">
    <img
      src={raceResult.image}
      alt="Race Outcome"
      className="w-full max-w-md object-cover rounded-lg shadow-md mb-4"
    />
    <p className="text-center text-xl font-semibold text-gray-100">
      {raceResult.message}
    </p>
  </div>
)}
        </div>

        {/* Right Side: Big Race Image */}
        <div className="">
          <img
            src="/assets/race7.png"
            alt="Racing Scene"
            className="rounded-xl shadow-xl"
          />
        </div>

      </div>
    </div>
  );
};

export default CarRaces;
