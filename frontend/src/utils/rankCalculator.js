// frontend/src/utils/rankCalculator.js

/**
 * Enhanced Rank System for Potato Mafia Game
 * Features:
 * - 30 ranks total with a challenging progression curve
 * - Significantly steeper XP requirements for advanced ranks
 * - Exponential growth for top-tier ranks making them true achievements
 * - Themed prestigious titles for all rank levels
 */

const rankThresholds = [
  // Early ranks - accessible progression
  { rankLevel: 1, xpThreshold: 0, currentRank: 'Homeless Potato' },
  { rankLevel: 2, xpThreshold: 50, currentRank: 'Potato Sprout' },
  { rankLevel: 3, xpThreshold: 120, currentRank: 'Potato Peeler' },
  { rankLevel: 4, xpThreshold: 250, currentRank: 'Mashed Potato' },
  { rankLevel: 5, xpThreshold: 450, currentRank: 'Baked Spud' },
  
  // Mid-tier ranks - moderate progression
  { rankLevel: 6, xpThreshold: 800, currentRank: 'Fry Cook' },
  { rankLevel: 7, xpThreshold: 1300, currentRank: 'Hash Brown Hustler' },
  { rankLevel: 8, xpThreshold: 2000, currentRank: 'Potato Mobster' },
  { rankLevel: 9, xpThreshold: 3000, currentRank: 'Tater Tot Enforcer' },
  { rankLevel: 10, xpThreshold: 4500, currentRank: 'Spud Smuggler' },
  
  // Advanced ranks - challenging progression
  { rankLevel: 11, xpThreshold: 6500, currentRank: 'Potato Underboss' },
  { rankLevel: 12, xpThreshold: 9000, currentRank: 'Tater Tot Titan' },
  { rankLevel: 13, xpThreshold: 12000, currentRank: 'Spudlord' },
  { rankLevel: 14, xpThreshold: 16000, currentRank: 'Mashmaster General' },
  { rankLevel: 15, xpThreshold: 21000, currentRank: 'Duke of Dauphinoise' },
  
  // Expert ranks - steep progression
  { rankLevel: 16, xpThreshold: 28000, currentRank: 'Fry King' },
  { rankLevel: 17, xpThreshold: 37000, currentRank: 'Emperor of the Taters' },
  { rankLevel: 18, xpThreshold: 48000, currentRank: 'Potato Overlord' },
  { rankLevel: 19, xpThreshold: 62000, currentRank: 'The Ultimate Potato' },
  { rankLevel: 20, xpThreshold: 80000, currentRank: 'Potato Godfather' },
  
  // ELITE RANKS - extremely difficult to achieve
  { rankLevel: 21, xpThreshold: 105000, currentRank: 'Starchy Sovereign' },
  { rankLevel: 22, xpThreshold: 135000, currentRank: 'Tuber Tyrant' },
  { rankLevel: 23, xpThreshold: 175000, currentRank: 'Pomme de Terror' },
  { rankLevel: 24, xpThreshold: 225000, currentRank: 'Spud Supreme' },
  { rankLevel: 25, xpThreshold: 290000, currentRank: 'Potato Patriarch' },
  
  // LEGENDARY RANKS - true endgame content
  { rankLevel: 26, xpThreshold: 370000, currentRank: 'Immortal Yam' },
  { rankLevel: 27, xpThreshold: 470000, currentRank: 'Elder Root' },
  { rankLevel: 28, xpThreshold: 600000, currentRank: 'Potato Deity' },
  { rankLevel: 29, xpThreshold: 750000, currentRank: 'The Omnispud' },
  
  // ULTIMATE RANK - nearly impossible to achieve
  { rankLevel: 30, xpThreshold: 1000000, currentRank: 'Potato Singularity' },
];

/**
 * Get rank information for a given XP amount
 * @param {number} xp - Player's current XP
 * @returns {Object} Rank information
 */
export const getRankForXp = (xp) => {
  let currentRankInfo = rankThresholds[0];
  let nextRankInfo = null;

  for (let i = 0; i < rankThresholds.length; i++) {
    if (xp >= rankThresholds[i].xpThreshold) {
      currentRankInfo = rankThresholds[i];
    } else {
      nextRankInfo = rankThresholds[i];
      break;
    }
  }

  if (!nextRankInfo) {
    nextRankInfo = {
      rankLevel: currentRankInfo.rankLevel,
      xpThreshold: Infinity,
      currentRank: 'Max Rank Achieved'
    };
  }

  const xpForNextLevel = nextRankInfo.xpThreshold - xp;
  const progress = nextRankInfo.xpThreshold !== Infinity 
    ? ((xp - currentRankInfo.xpThreshold) / (nextRankInfo.xpThreshold - currentRankInfo.xpThreshold)) * 100
    : 100;

  return {
    currentRank: currentRankInfo.currentRank,
    nextRank: nextRankInfo.currentRank,
    currentXp: xp,
    nextRankThreshold: nextRankInfo.xpThreshold,
    xpForNextLevel,
    currentRankThreshold: currentRankInfo.xpThreshold,
    rankLevel: currentRankInfo.rankLevel,
    progress: Math.min(100, Math.max(0, progress)) // Ensure progress is between 0-100
  };
};

/**
 * Get XP required for a specific rank level
 * @param {number} targetRankLevel - The rank level to reach
 * @returns {number} XP required
 */
export const getXpForRankLevel = (targetRankLevel) => {
  const rankInfo = rankThresholds.find(rank => rank.rankLevel === targetRankLevel);
  return rankInfo ? rankInfo.xpThreshold : null;
};

/**
 * Calculate XP reward based on activity and success
 * @param {string} activity - Type of activity (theft, carTheft, race, etc.)
 * @param {boolean} success - Whether the activity was successful
 * @param {number} difficulty - Difficulty level (1-5)
 * @returns {number} XP reward
 */
export const calculateXpReward = (activity, success, difficulty = 1) => {
  // Base XP rewards for different activities
  const baseRewards = {
    theft: 5,
    carTheft: 8,
    race: 10,
    gambling: 3,
    assassination: 15,
    bossBattle: 25,
    jailBreak: 12,
    smuggling: 10
  };

  // If activity doesn't exist in our map, default to 5 XP
  const baseXp = baseRewards[activity] || 5;
  
  // Failed attempts still give some XP, just less
  const successMultiplier = success ? 1 : 0.3;
  
  // Difficulty multiplier (between 1-3x based on difficulty 1-5)
  const difficultyMultiplier = 1 + ((Math.min(5, Math.max(1, difficulty)) - 1) / 2);
  
  // Calculate final XP reward and round to nearest integer
  return Math.round(baseXp * successMultiplier * difficultyMultiplier);
};

/**
 * Calculate time estimate to reach next rank with current XP gain rate
 * @param {number} currentXp - Player's current XP
 * @param {number} averageXpPerHour - Average XP gained per hour
 * @returns {Object} Time estimate information
 */
export const calculateTimeToNextRank = (currentXp, averageXpPerHour) => {
  if (!averageXpPerHour || averageXpPerHour <= 0) {
    return { hours: Infinity, days: Infinity };
  }
  
  const rankInfo = getRankForXp(currentXp);
  const xpNeeded = rankInfo.xpForNextLevel;
  
  if (xpNeeded === Infinity) {
    return { hours: Infinity, days: Infinity, message: "You've reached the maximum rank!" };
  }
  
  const hoursNeeded = xpNeeded / averageXpPerHour;
  const daysNeeded = hoursNeeded / 24;
  
  return {
    hours: hoursNeeded,
    days: daysNeeded,
    message: hoursNeeded < 24 
      ? `Approximately ${Math.ceil(hoursNeeded)} hours to reach ${rankInfo.nextRank}`
      : `Approximately ${Math.ceil(daysNeeded)} days to reach ${rankInfo.nextRank}`
  };
};

export { rankThresholds };