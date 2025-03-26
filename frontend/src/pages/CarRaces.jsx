import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const CarRaces = () => {
  const { user } = useContext(AuthContext);
  const [stolenCars, setStolenCars] = useState([]);
  const [selectedCar, setSelectedCar] = useState('');
  const [raceResult, setRaceResult] = useState(null);
  const [raceCooldown, setRaceCooldown] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  const allCars = [/* Your existing allCars array */];

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
    if (raceCooldown || !selectedCar) return;

    const playerCar = stolenCars.find(car => car.name === selectedCar);
    const opponentCar = allCars[Math.floor(Math.random() * allCars.length)];

    const playerSpeed = playerCar.price / 1000 + Math.random() * 20;
    const opponentSpeed = opponentCar.price / 1000 + Math.random() * 20;

    let message = '', image = '';

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
  };

  const startCooldown = duration => {
    setRaceCooldown(true);
    setCooldownMessage(`Lay low for ${duration} seconds.`);
    const interval = setInterval(() => {
      duration -= 1;
      setCooldownMessage(`Lay low for ${duration} seconds.`);
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

          {raceResult?.image && (
            <img
              src={raceResult.image}
              alt="Race Result"
              className="rounded-lg shadow-md w-full mt-4"
            />
          )}
        </div>

        {/* Right Side: Big Race Image */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center">
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
