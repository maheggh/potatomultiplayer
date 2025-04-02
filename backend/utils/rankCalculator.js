// utils/rankCalculator.js

// Ensure rankLevel is included correctly
const rankThresholds = [
  { rankLevel: 1, xpThreshold: 0, currentRank: 'Homeless Potato' },
  { rankLevel: 2, xpThreshold: 100, currentRank: 'Potato Peeler' },
  { rankLevel: 3, xpThreshold: 250, currentRank: 'Mashed Potato' },
  { rankLevel: 4, xpThreshold: 500, currentRank: 'Baked Spud' },
  { rankLevel: 5, xpThreshold: 1000, currentRank: 'Fry Cook' },
  { rankLevel: 6, xpThreshold: 1600, currentRank: 'Hash Brown Hero' },
  { rankLevel: 7, xpThreshold: 2500, currentRank: 'Potato Mobster' },
  { rankLevel: 8, xpThreshold: 4000, currentRank: 'Tater Tot Titan' },
  { rankLevel: 9, xpThreshold: 6000, currentRank: 'Spudlord' },
  { rankLevel: 10, xpThreshold: 8500, currentRank: 'Mashmaster General' },
  { rankLevel: 11, xpThreshold: 12000, currentRank: 'Duke of Dauphinoise' },
  { rankLevel: 12, xpThreshold: 16000, currentRank: 'Fry King' },
  { rankLevel: 13, xpThreshold: 21000, currentRank: 'Emperor of the Taters' },
  { rankLevel: 14, xpThreshold: 27000, currentRank: 'Potato Overlord' },
  { rankLevel: 15, xpThreshold: 35000, currentRank: 'The Ultimate Potato' },
  { rankLevel: 16, xpThreshold: 45000, currentRank: 'Potato Queen' },
];

const getRankForXp = (xp) => {
  let currentRankInfo = rankThresholds[0];
  let nextRankInfo = null;

  console.log('--- Running getRankForXp ---'); // Add this
  console.log('Using thresholds:', rankThresholds); // Log the thresholds it sees
  console.log('Incoming XP:', xp); // Log the XP it received

  // Ensure xp is a number, default to 0 if not
  const currentXp = typeof xp === 'number' ? xp : 0;


  for (let i = 0; i < rankThresholds.length; i++) {
    if (currentXp >= rankThresholds[i].xpThreshold) {
      currentRankInfo = rankThresholds[i];
    } else {
      nextRankInfo = rankThresholds[i];
      break;
    }
  }

  // Handle max rank case
  if (!nextRankInfo) {
    nextRankInfo = {
      rankLevel: currentRankInfo.rankLevel + 1, // Hypothetical next level
      xpThreshold: Infinity,
      currentRank: 'Max Rank', // Or specific name like 'Potato Deity'
    };
  }

  // Calculate XP needed for the next level threshold
  const xpForNextLevel = nextRankInfo.xpThreshold === Infinity ? 0 : Math.max(0, nextRankInfo.xpThreshold - currentXp);

  return {
    currentRank: currentRankInfo.currentRank,         
    nextRank: nextRankInfo.currentRank,              
    currentXp: currentXp,                             
    nextRankThreshold: nextRankInfo.xpThreshold,      
    xpForNextLevel: xpForNextLevel,                   
    currentRankThreshold: currentRankInfo.xpThreshold,
    rankLevel: currentRankInfo.rankLevel,             
  };
};

module.exports = { getRankForXp, rankThresholds }; 