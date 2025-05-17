// File: components/assassination/TargetSelection.jsx

import React from 'react';
import { FaUserAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const TargetSelection = ({
  targets,
  selectedTargetId,
  selectedTargetInfo,
  user,
  isLoading,
  cooldown,
  handleSelectTarget
}) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-5">
      <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center">
        <FaUserAlt className="mr-2" /> Target Selection
      </h2>

      <select
        value={selectedTargetId}
        onChange={handleSelectTarget}
        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 mb-4"
        disabled={targets.length === 0 || isLoading || cooldown > 0}
      >
        <option value="">-- Select Your Target --</option>
        {targets.length > 0 ? (
          targets.map(target => (
            <option key={target._id} value={target._id}>
              {target.username} (Lvl: {target.level || 1}, Rank: {target.rank})
            </option>
          ))
        ) : (
          <option disabled>{isLoading ? 'Loading targets...' : 'No targets available'}</option>
        )}
      </select>

      {selectedTargetInfo && (
        <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600">
          <h3 className="font-bold text-lg mb-2">{selectedTargetInfo.username}</h3>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <span className="text-gray-400 mr-2">Level:</span>
              <span className="font-medium">{selectedTargetInfo.level || 1}</span>
            </div>

            <div className="flex items-center">
              <span className="text-gray-400 mr-2">Rank:</span>
              <span className="font-medium">{selectedTargetInfo.rank}</span>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-400">
            {selectedTargetInfo.level > (user?.level || 1) ? (
              <p className="text-orange-400 flex items-center">
                <FaExclamationTriangle className="mr-1" /> Target is {selectedTargetInfo.level - (user?.level || 1)} levels higher - each level adds 15% difficulty
              </p>
            ) : selectedTargetInfo.level < (user?.level || 1) ? (
              <p className="text-green-400 flex items-center">
                <FaCheckCircle className="mr-1" /> Target is {(user?.level || 1) - selectedTargetInfo.level} levels lower - each level reduces difficulty by 5%
              </p>
            ) : (
              <p>Target is same level as you - standard difficulty</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetSelection;