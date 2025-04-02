import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  FaMedal,
  FaStar,
  FaChevronUp,
  FaChevronDown,
  FaDollarSign, // Import the dollar sign icon
} from 'react-icons/fa';

const RankNavbar = () => {
  // 1. Destructure money from the context
  const { xp, rank, rankInfo, isLoggedIn, money } = useContext(AuthContext);
  const [isExpanded, setIsExpanded] = useState(false);

  // 2. Handle potential null/undefined values
  const currentXP = xp ?? 0;
  const currentRank = rank ?? 'Loading...';
  const currentMoney = money ?? 0; // Handle case where money might not be loaded yet
  const currentRankThreshold = rankInfo?.currentRankThreshold ?? 0;
  const nextRankThreshold = rankInfo?.nextRankThreshold ?? Infinity;
  const xpForNext = rankInfo?.xpForNextLevel ?? 0;

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
      : 100; // Max rank or invalid thresholds = 100%

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
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
          <div className="flex items-center gap-3 flex-wrap"> {/* Added flex-wrap for smaller screens */}
            {/* Rank */}
            <div className="flex items-center gap-2"> {/* Group Rank and Icon */}
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
                Rank: {currentRank}
              </span>
            </div>

            {/* Money Display (always visible when logged in and collapsed) */}
            {!isExpanded && (
              <span className="flex items-center text-sm text-gray-400 group-hover:text-green-300 transition-colors ml-1 sm:ml-3"> {/* Adjusted margin */}
                <FaDollarSign className="mr-1 text-green-500/70 text-base" />{' '}
                {/* Slightly larger icon */}
                <span className="font-medium">
                  ${currentMoney.toLocaleString()} {/* Added formatting */}
                </span>
              </span>
            )}
          </div>

          {/* Right Side: Toggle Button */}
          <button
            className="p-2 text-gray-400 group-hover:text-white transition-colors flex-shrink-0" // Prevent button shrinking
            aria-label={isExpanded ? 'Collapse Rank Info' : 'Expand Rank Info'}
          >
            {isExpanded ? (
              <FaChevronDown className="h-5 w-5" />
            ) : (
              <FaChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Expandable Content Area (XP Progress) */}
        <div
          id="rank-details"
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-40 opacity-100 pt-3' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="border-t border-gray-700/50 pt-3 space-y-2 text-sm">
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
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-[width] duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
                role="progressbar"
                aria-valuenow={progressPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>

            {/* XP to Next Rank */}
            {nextRankThreshold !== Infinity ? (
              <p className="text-xs text-right text-cyan-300 pt-1">
                {xpForNext.toLocaleString()} XP to next rank (
                {rankInfo?.nextRank || '...'})
              </p>
            ) : (
              <p className="text-xs text-right text-yellow-400 pt-1">
                Maximum Rank Achieved!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankNavbar;
