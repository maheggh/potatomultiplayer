// File: components/assassination/WeaponSelection.jsx

import React from 'react';
import { FaGun } from 'react-icons/fa6';

const WeaponSelection = ({
  availableWeapons,
  selectedWeaponName,
  selectedWeaponInfo,
  isLoading,
  cooldown,
  handleSelectWeapon
}) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-5">
      <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center">
        <FaGun className="mr-2" /> Weapon Selection
      </h2>

      <select
        value={selectedWeaponName}
        onChange={handleSelectWeapon}
        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 mb-4"
        disabled={availableWeapons.length === 0 || isLoading || cooldown > 0}
      >
        <option value="">-- Select Your Weapon --</option>
        {availableWeapons.length > 0 ? (
          availableWeapons.map((weapon, i) => (
            <option key={weapon._id || i} value={weapon.name}>
              {weapon.name} (Accuracy: {weapon.attributes.accuracy}%)
            </option>
          ))
        ) : (
          <option disabled>No weapons in inventory</option>
        )}
      </select>

      {selectedWeaponInfo && (
        <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
          <h3 className="font-bold text-lg mb-2">{selectedWeaponInfo.name}</h3>

          <div className="flex items-center mb-3">
            <span className="text-gray-400 mr-2">Accuracy:</span>
            <div className="flex-grow h-2 bg-gray-600 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${selectedWeaponInfo.attributes.accuracy}%` }}
              ></div>
            </div>
            <span className="ml-2 font-medium">{selectedWeaponInfo.attributes.accuracy}%</span>
          </div>

          <div className="text-xs text-gray-400">
            {selectedWeaponInfo.attributes.accuracy > 75 ? (
              <p className="text-green-400">High-precision weapon - excellent for assassinations</p>
            ) : selectedWeaponInfo.attributes.accuracy > 50 ? (
              <p>Good accuracy - suitable for most targets</p>
            ) : (
              <p className="text-orange-400">Low accuracy - consider using more bullets</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeaponSelection;