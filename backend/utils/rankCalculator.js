// backend/utils/rankCalculator.js

/**
 * Enhanced Rank System for Potato Mafia Game
 * Backend implementation to maintain consistency with frontend
 */

const rankThresholds = [
  { rankLevel: 1, xpThreshold: 0, currentRank: 'Homeless Potato', benefits: 'Starting rank' },
  { rankLevel: 2, xpThreshold: 25, currentRank: 'Potato Sprout', benefits: 'Unlocks basic theft missions' },
  { rankLevel: 3, xpThreshold: 60, currentRank: 'Potato Peeler', benefits: 'Increased theft success rate +5%' },
  { rankLevel: 4, xpThreshold: 100, currentRank: 'Mashed Potato', benefits: 'Access to improved weapons' },
  { rankLevel: 5, xpThreshold: 180, currentRank: 'Baked Spud', benefits: 'Unlocks car theft missions' },
  { rankLevel: 6, xpThreshold: 300, currentRank: 'Fry Cook', benefits: 'Reduced jail time by 10%' },
  { rankLevel: 7, xpThreshold: 450, currentRank: 'Hash Brown Hustler', benefits: 'Unlocks gambling' },
  { rankLevel: 8, xpThreshold: 650, currentRank: 'Potato Mobster', benefits: 'Assassination cooldown -15%' },
  { rankLevel: 9, xpThreshold: 900, currentRank: 'Tater Tot Enforcer', benefits: 'Higher quality car thefts' },
  { rankLevel: 10, xpThreshold: 1200, currentRank: 'Spud Smuggler', benefits: 'Unlocks smuggling missions' },
  { rankLevel: 11, xpThreshold: 1600, currentRank: 'Potato Underboss', benefits: 'Unlock boss battles' },
  { rankLevel: 12, xpThreshold: 2100, currentRank: 'Tater Tot Titan', benefits: 'All cooldowns -20%' },
  { rankLevel: 13, xpThreshold: 2700, currentRank: 'Spudlord', benefits: 'Better race rewards' },
  { rankLevel: 14, xpThreshold: 3500, currentRank: 'Mashmaster General', benefits: 'Elite weapon access' },
  { rankLevel: 15, xpThreshold: 4500, currentRank: 'Duke of Dauphinoise', benefits: 'Reduced jail breakout difficulty' },
  { rankLevel: 16, xpThreshold: 5800, currentRank: 'Fry King', benefits: 'Premium gambling tables' },
  { rankLevel: 17, xpThreshold: 7500, currentRank: 'Emperor of the Taters', benefits: 'Special boss encounters' },
  { rankLevel: 18, xpThreshold: 9500, currentRank: 'Potato Overlord', benefits: 'Assassination success +25%' },
  { rankLevel: 19, xpThreshold: 12000, currentRank: 'The Ultimate Potato', benefits: 'Access to all game content' },
  { rankLevel: 20, xpThreshold: 15000, currentRank: 'Potato Queen', benefits: 'Max rank benefits & special avatar' },
];

/**
 * Get rank information for a given XP amount
 * @param {number} xp - Player's current XP
 * @returns {Object} Rank information
 */
const getRankForXp = (xp) => {
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
      currentRank: 'Max Rank Achieved',
      benefits: 'You have reached the highest rank!'
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
    progress: Math.min(100, Math.max(0, progress)), // Ensure progress is between 0-100
    benefits: currentRankInfo.benefits,
    nextRankBenefits: nextRankInfo.benefits,
  };
};

/**
 * Get XP required for a specific rank level
 * @param {number} targetRankLevel - The rank level to reach
 * @returns {number} XP required
 */
const getXpForRankLevel = (targetRankLevel) => {
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
const calculateXpReward = (activity, success, difficulty = 1) => {
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
 * Check if a player's rank gives them access to a particular feature
 * @param {number} rankLevel - Player's current rank level
 * @param {string} feature - Feature to check access for
 * @returns {boolean} Whether the player can access the feature
 */
const hasRankAccess = (rankLevel, feature) => {
  const featureRequirements = {
    'basic_theft': 1,           // Available from start
    'improved_theft': 3,        // Potato Peeler rank
    'car_theft': 5,             // Baked Spud rank
    'gambling': 7,              // Hash Brown Hustler rank
    'assassination': 8,         // Potato Mobster rank
    'boss_battles': 11,         // Potato Underboss rank
    'elite_weapons': 14,        // Mashmaster General rank
    'premium_gambling': 16,     // Fry King rank
    'special_bosses': 17,       // Emperor of the Taters rank
    'all_content': 19           // The Ultimate Potato rank
  };

  return rankLevel >= (featureRequirements[feature] || 1);
};

/**
 * Get rank-based modifier for specified activity
 * @param {number} rankLevel - Player's current rank level
 * @param {string} activity - Activity to get modifier for
 * @returns {number} Modifier value (usually a multiplier or percentage)
 */
const getRankModifier = (rankLevel, activity) => {
  // Default values for different activities
  const modifiers = {
    'theft_success': 0,
    'jail_time': 0,
    'cooldown_reduction': 0,
    'assassination_success': 0,
    'jail_breakout': 0
  };

  // Add rank bonuses
  if (rankLevel >= 3) modifiers.theft_success += 0.05;  // +5% from Potato Peeler
  if (rankLevel >= 5) modifiers.theft_success += 0.05;  // +5% more from Baked Spud
  if (rankLevel >= 6) modifiers.jail_time -= 0.10;      // -10% from Fry Cook
  if (rankLevel >= 8) modifiers.cooldown_reduction += 0.15; // +15% from Potato Mobster
  if (rankLevel >= 12) modifiers.cooldown_reduction += 0.05; // +5% more from Tater Tot Titan
  if (rankLevel >= 15) modifiers.jail_breakout += 0.20; // +20% from Duke of Dauphinoise
  if (rankLevel >= 18) modifiers.assassination_success += 0.25; // +25% from Potato Overlord
  
  return modifiers[activity] || 0;
};

module.exports = {
  getRankForXp,
  getXpForRankLevel,
  calculateXpReward,
  hasRankAccess,
  getRankModifier,
  rankThresholds
};