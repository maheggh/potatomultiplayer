// File: components/assassination/AmmunitionSection.jsx

import React from 'react';
import { FaMoneyBill, FaDollarSign, FaSkull } from 'react-icons/fa';

const AmmunitionSection = ({
  bulletsUsed,
  bulletInputValue,
  isLoading,
  cooldown,
  money,
  successChance,
  retaliationChance,
  handleBulletInputChange,
  handleBulletInputBlur,
  getBulletCost
}) => {
  // Calculate bullet bonus info for display
  const getBulletBonusText = () => {
    if (bulletsUsed <= 10) {
      return `First ${bulletsUsed} bullets: +${bulletsUsed * 3}% success chance`;
    } else {
      const logBonus = Math.round((Math.log(bulletsUsed - 9) * 5));
      return `First 10 bullets: +30% success chance, plus ${logBonus}% from remaining ${bulletsUsed - 10} bullets`;
    }
  };

  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-5">
      <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center">
        <FaMoneyBill className="mr-2" /> Ammunition & Expenses
      </h2>

      <div className="mb-4">
        <label className="block text-gray-300 mb-2">Number of Bullets:</label>
        <input
          type="number"
          value={bulletInputValue}
          min="1"
          max="10000"
          onChange={handleBulletInputChange}
          onBlur={handleBulletInputBlur}
          className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50"
          disabled={isLoading || cooldown > 0}
        />

        <div className="flex justify-between text-sm text-gray-400 mt-2">
          <span>Cost per bullet: $100</span>
          <span className={getBulletCost() === 0 ? "text-green-400" : ""}>
            {getBulletCost() === 0 ? "FREE BULLETS!" : `Total: $${getBulletCost().toLocaleString()}`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Your Funds</p>
          <p className="font-bold text-green-400">${money?.toLocaleString()}</p>
        </div>

        <div className="bg-gray-700/50 p-3 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">Success Chance</p>
          <p className={`font-bold ${
            successChance >= 75 ? 'text-green-400' :
            successChance >= 50 ? 'text-yellow-400' :
            'text-red-400'
          }`}>{successChance}%</p>
        </div>
      </div>

      {/* Retaliation chance display */}
      {retaliationChance > 0 && (
        <div className="bg-gray-700/50 p-3 rounded-lg mb-4">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-400">Retaliation Risk</p>
            <p className={`font-bold ${
              retaliationChance <= 25 ? 'text-green-400' :
              retaliationChance <= 50 ? 'text-yellow-400' :
              'text-red-500'
            } flex items-center`}>
              <FaSkull className="mr-1" /> {retaliationChance}%
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-1">If you fail, target might kill you</p>
        </div>
      )}

      {/* Bullet info display */}
      <div className="bg-gray-700/50 p-3 rounded-lg">
        <p className="text-xs text-gray-400 mb-1">Bullet Effects</p>
        <p className="text-xs text-gray-300">
          {getBulletBonusText()}
        </p>
        {bulletsUsed > 20 && (
          <p className="text-xs text-red-400 mt-1">
            Warning: Using many bullets increases noise and retaliation chance
          </p>
        )}
      </div>
    </div>
  );
};

export default AmmunitionSection;