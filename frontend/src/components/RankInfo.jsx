// frontend/src/components/RankInfo.jsx

import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FaMedal, FaStar, FaLock, FaUnlock, FaLevelUpAlt, FaTrophy, FaChevronRight } from 'react-icons/fa';
import { rankThresholds } from '../utils/rankCalculator';

const RankInfo = () => {
  const { xp, rank, rankInfo, isLoggedIn } = useContext(AuthContext);
  const [viewMode, setViewMode] = useState('current'); // 'current', 'next', 'all'

  if (!isLoggedIn || !rankInfo) {
    return null;
  }

  const currentRankLevel = rankInfo.rankLevel || 1;
  const nextRank = rankInfo.nextRank;
  const currentRank = rank || 'Loading...';
  const currentXP = xp || 0;
  const xpForNext = rankInfo.xpForNextLevel || 0;
  const maxRank = currentRankLevel >= rankThresholds.length;
  
  const getRankColor = (level) => {
    if (level === currentRankLevel) return 'text-yellow-400';
    if (level < currentRankLevel) return 'text-gray-400';
    if (level === currentRankLevel + 1) return 'text-cyan-400';
    return 'text-gray-600';
  };

  const renderAllRanks = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {rankThresholds.map((rankData, index) => {
          const isCurrentRank = rankData.rankLevel === currentRankLevel;
          const isUnlocked = rankData.rankLevel <= currentRankLevel;
          const isNextRank = rankData.rankLevel === currentRankLevel + 1;
          
          return (
            <div 
              key={rankData.rankLevel}
              className={`p-3 rounded-lg border ${
                isCurrentRank 
                  ? 'bg-yellow-900/20 border-yellow-600/50' 
                  : isNextRank 
                    ? 'bg-cyan-900/20 border-cyan-600/50' 
                    : isUnlocked 
                      ? 'bg-gray-800/50 border-gray-700/50'
                      : 'bg-gray-900/50 border-gray-800/30'
              } transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`text-lg ${getRankColor(rankData.rankLevel)}`}>
                    {isUnlocked ? <FaUnlock /> : <FaLock />}
                  </div>
                  <h3 className={`font-medium ${getRankColor(rankData.rankLevel)}`}>
                    {rankData.currentRank}
                  </h3>
                </div>
                <span className="text-xs bg-gray-800 px-2 py-1 rounded-full">
                  Level {rankData.rankLevel}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <FaStar className="text-blue-400" />
                <span>{rankData.xpThreshold.toLocaleString()} XP Required</span>
              </div>
              
              <p className="text-sm text-gray-300">
                {rankData.benefits}
              </p>
              
              {isCurrentRank && (
                <div className="mt-2 pt-2 border-t border-yellow-600/30 text-xs text-yellow-300 flex items-center">
                  <FaTrophy className="mr-1" /> Current Rank
                </div>
              )}
              
              {isNextRank && (
                <div className="mt-2 pt-2 border-t border-cyan-600/30 text-xs text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center">
                    <FaLevelUpAlt className="mr-1" /> Next Rank
                  </span>
                  <span>{xpForNext.toLocaleString()} XP needed</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderCurrentRank = () => {
    const currentRankData = rankThresholds.find(r => r.rankLevel === currentRankLevel) || rankThresholds[0];
    
    return (
      <div className="bg-gradient-to-br from-yellow-900/30 to-gray-900 border border-yellow-600/50 rounded-lg p-4 my-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaMedal className="text-3xl text-yellow-400" />
            <div>
              <h2 className="text-xl font-bold text-yellow-300">{currentRank}</h2>
              <p className="text-xs text-gray-400">Rank Level {currentRankLevel}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium text-blue-300">{currentXP.toLocaleString()} XP</div>
            <p className="text-xs text-gray-400">Current Experience</p>
          </div>
        </div>
        
        <div className="bg-gray-800/70 p-3 rounded-md mb-3">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Rank Benefits:</h3>
          <p className="text-sm text-yellow-200">{currentRankData.benefits}</p>
        </div>
        
        {!maxRank && (
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>Progress to {nextRank}</span>
            <span>
              {xpForNext.toLocaleString()} XP needed
            </span>
          </div>
        )}
        
        {!maxRank && (
          <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
              style={{ width: `${rankInfo.progress}%` }}
            ></div>
          </div>
        )}
        
        {maxRank && (
          <div className="flex items-center justify-center p-2 bg-yellow-900/30 border border-yellow-600/30 rounded-md">
            <FaTrophy className="text-yellow-400 mr-2" />
            <span className="text-yellow-300">Maximum Rank Achieved!</span>
          </div>
        )}
      </div>
    );
  };

  const renderNextRank = () => {
    if (maxRank) {
      return (
        <div className="bg-gradient-to-br from-yellow-900/30 to-gray-900 border border-yellow-600/50 rounded-lg p-4 my-4 text-center">
          <FaTrophy className="text-4xl text-yellow-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-yellow-300 mb-2">Maximum Rank Achieved!</h2>
          <p className="text-gray-400">You've reached the highest rank as the Potato Queen.</p>
          <p className="text-gray-400 mt-1">Continue your criminal career and dominate the leaderboards!</p>
        </div>
      );
    }
    
    const nextRankData = rankThresholds.find(r => r.rankLevel === currentRankLevel + 1);
    if (!nextRankData) return null;
    
    return (
      <div className="bg-gradient-to-br from-cyan-900/30 to-gray-900 border border-cyan-600/50 rounded-lg p-4 my-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FaLevelUpAlt className="text-3xl text-cyan-400" />
            <div>
              <h2 className="text-xl font-bold text-cyan-300">{nextRankData.currentRank}</h2>
              <p className="text-xs text-gray-400">Next Rank (Level {nextRankData.rankLevel})</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-medium text-blue-300">{nextRankData.xpThreshold.toLocaleString()} XP</div>
            <p className="text-xs text-gray-400">Required Experience</p>
          </div>
        </div>
        
        <div className="bg-gray-800/70 p-3 rounded-md mb-3">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Unlocks:</h3>
          <p className="text-sm text-cyan-200">{nextRankData.benefits}</p>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>Your Progress</span>
          <span>
            {xpForNext.toLocaleString()} XP needed
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
            style={{ width: `${rankInfo.progress}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-900/80 backdrop-blur-sm rounded-lg border border-purple-900/30 p-4 shadow-xl max-w-2xl mx-auto">
      <h2 className="text-lg font-bold text-purple-300 mb-3 flex items-center">
        <FaMedal className="mr-2 text-purple-400" />
        Potato Mafia Rank System
      </h2>
      
      <div className="flex border-b border-gray-700 mb-4">
        <button 
          className={`px-4 py-2 text-sm font-medium ${viewMode === 'current' ? 'text-yellow-300 border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setViewMode('current')}
        >
          Current Rank
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${viewMode === 'next' ? 'text-cyan-300 border-b-2 border-cyan-500' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setViewMode('next')}
        >
          Next Rank
        </button>
        <button 
          className={`px-4 py-2 text-sm font-medium ${viewMode === 'all' ? 'text-purple-300 border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setViewMode('all')}
        >
          All Ranks
        </button>
      </div>
      
      {viewMode === 'current' && renderCurrentRank()}
      {viewMode === 'next' && renderNextRank()}
      {viewMode === 'all' && renderAllRanks()}
      
      <div className="mt-4 border-t border-gray-700 pt-3 text-sm text-gray-400">
        <p className="flex items-center gap-1">
          <FaStar className="text-blue-400" /> 
          Earn XP by completing crimes, races, assassinations, boss battles and other activities
        </p>
      </div>
    </div>
  );
};

export default RankInfo;