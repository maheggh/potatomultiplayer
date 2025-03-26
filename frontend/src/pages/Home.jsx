import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import Register from '../components/Register';
import Login from '../components/Login';
import UserStatus from '../components/UserStatus';

const Home = () => {
  const { isLoggedIn, user } = useContext(AuthContext);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const storedPassword = localStorage.getItem('password');
    if (storedPassword) {
      setPassword(storedPassword);
    }
  }, [isLoggedIn]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 via-gray-900 to-black text-white py-20">
      <div className="container mx-auto px-6 md:px-12">
        
        {/* Banner Section */}
        <div className="mb-10">
          <img
            src="/assets/potatoqueen_banner.png"
            className="w-full max-h-64 object-cover rounded-xl shadow-xl"
            alt="Potato Queen Banner"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-gray-800 rounded-xl shadow-xl p-8">
          {/* Game Description */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Welcome to Potato Underworld!</h1>
            <p className="text-gray-300 text-lg">
              Step into a ruthless world of spud crime, betrayal, and power struggles. Ascend from being just another lowly potato to becoming the feared and revered Potato Queen. Engage in theft, boss battles, assassinations, and gambling to amass wealth and respect.  
            </p>
            <p className="text-gray-400">
              Strategize carefully—your choices decide if you rise to power or end up as mashed potatoes!
            </p>
          </div>

          {/* Illustration/Image */}
          <div className="flex justify-center">
            <img
              src="/assets/potatopleb.png"
              className="w-64 h-64 object-contain rounded-xl shadow-lg"
              alt="Potato Pleb"
            />
          </div>

          {/* Authentication and User Status */}
          <div className="col-span-2 mt-6">
            {!isLoggedIn ? (
              <div className="grid md:grid-cols-2 gap-8">
                <Register />
                <Login />
              </div>
            ) : (
              <div className="bg-gray-700 rounded-xl p-6 shadow-lg space-y-2">
                <UserStatus />
              </div>
            )}
          </div>

        </div>

        {/* Additional Information Section */}
        <div className="mt-12 bg-gray-800 rounded-xl shadow-xl p-6 text-center">
          <h2 className="text-3xl font-semibold mb-4">Game Features</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-gray-700 p-4 rounded-lg shadow">
              <h3 className="font-bold text-xl mb-2">💰 Theft & Gambling</h3>
              <p className="text-gray-300">Risk it all in high-stakes heists and gamble your fortunes.</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow">
              <h3 className="font-bold text-xl mb-2">🔫 Assassinations</h3>
              <p className="text-gray-300">Take down rivals and claim their riches to rise to the top.</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow">
              <h3 className="font-bold text-xl mb-2">👑 Boss Battles</h3>
              <p className="text-gray-300">Fight legendary potato bosses and collect rare treasures.</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg shadow">
              <h3 className="font-bold text-xl mb-2">🏎️ Car Races & Thefts</h3>
              <p className="text-gray-300">Race, steal, and collect cars to showcase your wealth.</p>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          Potato Underworld © 2024. All rights reserved.
        </footer>

      </div>
    </div>
  );
};

export default Home;
