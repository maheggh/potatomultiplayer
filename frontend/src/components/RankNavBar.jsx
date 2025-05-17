import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  FaMedal,
  FaStar,
  FaChevronUp,
  FaChevronDown,
  FaDollarSign,
  FaInfo,
  FaLevelUpAlt,
  FaGift,
} from 'react-icons/fa';

const RankNavbar = () => {
  const { xp, rank, rankInfo, isLoggedIn, money } = useContext(AuthContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBenefits, setShowBenefits] = useState(false);

  // Handle potential null/undefined values
  const currentXP = xp ?? 0;
  const currentRank = rank ?? 'Loading...';
  const currentMoney = money ?? 0;
  const currentRankThreshold = rankInfo?.currentRankThreshold ?? 0;
  const nextRankThreshold = rankInfo?.nextRankThreshold ?? Infinity;
  const xpForNext = rankInfo?.xpForNextLevel ?? 0;
  const currentRankLevel = rankInfo?.rankLevel ?? 1;
  const currentBenefits = rankInfo?.benefits ?? 'Basic features';
  const nextRankBenefits = rankInfo?.nextRankBenefits ?? 'Maximum rank reached';

  // Calculate progress safely
  const progressPercentage =
    nextRankThreshold !== Infinity && nextRankThreshold > currentRankThreshold
      ? Math.max(
          0,
          Math.min(
            100,
            ((currentXP - currentRankThreshold) /
              (nextRankThreshold - currentRankThreshold)) *
              100
          )
        )
      : 100;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleBenefits = () => {
    setShowBenefits(!showBenefits);
  };

  // Don't render if user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    // Main container
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-gray-900 via-gray-800/95 to-gray-800/90 backdrop-blur-sm border-t border-purple-700/30 shadow-[0_-4px_15px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out ${
        isExpanded ? 'pb-4' : 'pb-0'
      }`}
    >
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Collapsed View / Toggle Area */}
        <div
          className="flex justify-between items-center h-12 cursor-pointer group"
          onClick={toggleExpand}
          role="button"
          aria-expanded={isExpanded}
          aria-controls="rank-details"
        >
          {/* Left Side: Rank and Money */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Rank */}
            <div className="flex items-center gap-2">
              <FaMedal
                className={`text-xl ${
                  isExpanded
                    ? 'text-yellow-400'
                    : 'text-purple-400 group-hover:text-yellow-400 transition-colors'
                }`}
              />
              <span
                className={`font-semibold transition-colors ${
                  isExpanded
                    ? 'text-yellow-300'
                    : 'text-gray-200 group-hover:text-white'
                }`}
              >
                {currentRank} <span className="text-xs opacity-70">(Lvl {currentRankLevel})</span>
              </span>
            </div>

            {/* Money Display (always visible) */}
            <span className="flex items-center text-sm text-gray-400 group-hover:text-green-300 transition-colors ml-1 sm:ml-3">
              <FaDollarSign className="mr-1 text-green-500/70 text-base" />{' '}
              <span className="font-medium">
                ${currentMoney.toLocaleString()}
              </span>
            </span>
          </div>

          {/* Right Side: Toggle Button */}
          <div className="flex items-center gap-2">
            {/* XP Display (compact) */}
            {!isExpanded && (
              <span className="text-sm text-blue-300/70 flex items-center">
                <FaStar className="mr-1 text-blue-400/70" /> {currentXP.toLocaleString()} XP
              </span>
            )}
            <button
              className="p-2 text-gray-400 group-hover:text-white transition-colors flex-shrink-0"
              aria-label={isExpanded ? 'Collapse Rank Info' : 'Expand Rank Info'}
            >
              {isExpanded ? (
                <FaChevronDown className="h-5 w-5" />
              ) : (
                <FaChevronUp className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Content Area (XP Progress) */}
        <div
          id="rank-details"
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-96 opacity-100 pt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-gray-700/50 pt-3 space-y-4 text-sm">
            {/* XP Details */}
            <div className="flex justify-between items-center text-gray-300">
              <span className="flex items-center gap-1">
                <FaStar className="text-blue-400" /> XP Progress:
              </span>
              <span>
                {currentXP.toLocaleString()} /{' '}
                {nextRankThreshold === Infinity
                  ? 'MAX'
                  : nextRankThreshold.toLocaleString()}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>

            {/* XP to Next Rank & Next Rank Name */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              {nextRankThreshold !== Infinity ? (
                <div className="flex items-center gap-1 text-cyan-300">
                  <FaLevelUpAlt />
                  <span>Next: {rankInfo?.nextRank || '...'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-yellow-400">
                  <FaMedal />
                  <span>Maximum Rank Achieved!</span>
                </div>
              )}

              {nextRankThreshold !== Infinity && (
                <p className="text-xs text-cyan-300 pt-1 sm:pt-0">
                  {xpForNext.toLocaleString()} XP needed for next rank
                </p>
              )}
            </div>

            {/* Toggle Benefits Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleBenefits();
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-gray-700 rounded-md text-gray-300 hover:text-white transition-colors text-sm w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <FaGift className="text-purple-400" />
                <span>Rank Benefits</span>
              </div>
              <FaChevronDown
                className={`transition-transform duration-300 ${
                  showBenefits ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Benefits Details (conditionally shown) */}
            {showBenefits && (
              <div className="p-3 bg-gray-800/70 rounded-md border border-gray-700/50 text-sm space-y-3 mt-2">
                <div>
                  <h4 className="text-yellow-300 flex items-center gap-1 mb-1">
                    <FaMedal /> Current Rank Benefits:
                  </h4>
                  <p className="text-gray-300 ml-5">{currentBenefits}</p>
                </div>

                {nextRankThreshold !== Infinity && (
                  <div>
                    <h4 className="text-cyan-300 flex items-center gap-1 mb-1">
                      <FaLevelUpAlt /> Next Rank Unlocks:
                    </h4>
                    <p className="text-gray-300 ml-5">{nextRankBenefits}</p>
                  </div>
                )}

                <div className="pt-1 text-xs text-gray-400 italic">
                  <FaInfo className="inline-block mr-1" />
                  Earn XP by completing crimes, races, and other activities
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankNavbar;