// File: components/assassination/AssassinationZone.jsx

import React from 'react';
import { 
  FaCrosshairs, FaSpinner, FaHourglassHalf, 
  FaExclamationTriangle, FaDollarSign, FaClock 
} from 'react-icons/fa';

const AssassinationZone = ({
  cooldown,
  formatTime,
  scenarioImage,
  animationState,
  showResults,
  isLoading,
  selectedTargetId,
  selectedWeaponName,
  isAlive,
  bulletsUsed,
  money,
  getBulletCost,
  attemptAssassination,
  user,
  kills,
  xp
}) => {
  return (
    <div className="lg:col-span-7 flex flex-col">
      <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-5 flex-grow flex flex-col">
        <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center">
          <FaCrosshairs className="mr-2" /> Assassination Zone
        </h2>

        {cooldown > 0 && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-4 animate-pulse">
            <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
              <FaClock className="animate-pulse" />
              <span className="font-bold">Cooldown Active</span>
            </div>
            <p className="text-center text-gray-300 text-sm">
              You must wait {formatTime(cooldown)} before attempting another assassination.
            </p>
          </div>
        )}

        <div className="flex-grow flex flex-col items-center justify-center relative overflow-hidden rounded-lg bg-gray-900/50 mb-4">
          {animationState === 'preparing' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-ping w-16 h-16 rounded-full bg-red-500/20"></div>
            </div>
          )}

          {animationState === 'aiming' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-red-500 rounded-full animate-pulse flex items-center justify-center">
                  <div className="w-24 h-24 border-2 border-red-500 rounded-full animate-pulse flex items-center justify-center">
                    <div className="w-8 h-8 bg-red-500 rounded-full animate-ping"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {animationState === 'shooting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-full bg-red-500/20 animate-flash flex items-center justify-center">
                <div className="w-4 h-32 bg-red-500 animate-laser"></div>
              </div>
            </div>
          )}

          <img
            key={scenarioImage}
            src={scenarioImage}
            className={`max-w-full h-auto object-contain rounded-lg transition-opacity duration-300 ${
              animationState === 'shooting' ? 'opacity-70' : 'opacity-100'
            }`}
            alt="Assassination Scenario"
            onError={(e) => { e.target.onerror = null; e.target.src='/assets/error.png'; }}
            loading="lazy"
          />

          {showResults && (
            <div className={`absolute inset-0 flex items-center justify-center bg-black/70 transition-opacity duration-500 ${
              animationState === 'success' ? 'text-green-500' : 'text-red-500'
            }`}>
              <div className="text-center p-6">
                <span className="text-5xl font-bold block mb-4">
                  {animationState === 'success' ? 'TARGET ELIMINATED' : 'MISSION FAILED'}
                </span>
                {animationState === 'success' ? (
                  <p className="text-green-400 text-xl">Contract completed successfully</p>
                ) : (
                  <p className="text-red-400 text-xl">Target escaped or retaliated</p>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={attemptAssassination}
          disabled={isLoading || cooldown > 0 || !selectedTargetId || !selectedWeaponName || !isAlive || bulletsUsed < 1 || money < getBulletCost()}
          className={`w-full py-4 rounded-lg font-bold text-lg transition duration-300 ease-in-out flex items-center justify-center ${
            isLoading || cooldown > 0 || !selectedTargetId || !selectedWeaponName || !isAlive || bulletsUsed < 1 || money < getBulletCost()
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg shadow-red-500/20 transform hover:scale-105'
          }`}
        >
          {isLoading ? (
            <><FaSpinner className="animate-spin mr-2" /> Executing Mission...</>
          ) : cooldown > 0 ? (
            <><FaHourglassHalf className="mr-2" /> On Cooldown</>
          ) : !selectedTargetId || !selectedWeaponName ? (
            <><FaExclamationTriangle className="mr-2" /> Select Target & Weapon</>
          ) : money < getBulletCost() ? (
            <><FaDollarSign className="mr-2" /> Insufficient Funds</>
          ) : (
            <><FaCrosshairs className="mr-2" /> Execute Assassination</>
          )}
        </button>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-700/50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-400 mb-1">Your Level</p>
            <p className="font-bold">{user?.level || 1}</p>
          </div>

          <div className="bg-gray-700/50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-400 mb-1">Kill Count</p>
            <p className="font-bold text-red-400">{kills || 0}</p>
          </div>

          <div className="bg-gray-700/50 p-3 rounded-lg text-center">
            <p className="text-xs text-gray-400 mb-1">Experience</p>
            <p className="font-bold text-blue-400">{xp?.toLocaleString() || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssassinationZone;