// frontend/src/utils/rankCalculator.js

const rankThresholds = [
    { rankLevel: 1, xpThreshold: 0, currentRank: 'Homeless Potato' },
    { rankLevel: 2, xpThreshold: 50, currentRank: 'Potato Peeler' },
    { rankLevel: 3, xpThreshold: 100, currentRank: 'Mashed Potato' },
    { rankLevel: 4, xpThreshold: 200, currentRank: 'Baked Spud' },
    { rankLevel: 5, xpThreshold: 500, currentRank: 'Fry Cook' },
    { rankLevel: 6, xpThreshold: 800, currentRank: 'Hash Brown Hero' },
    { rankLevel: 7, xpThreshold: 1200, currentRank: 'Potato Mobster' },
    { rankLevel: 8, xpThreshold: 2000, currentRank: 'Tater Tot Titan' },
    { rankLevel: 9, xpThreshold: 3000, currentRank: 'Spudlord' },
    { rankLevel: 10, xpThreshold: 4250, currentRank: 'Mashmaster General' },
    { rankLevel: 11, xpThreshold: 6000, currentRank: 'Duke of Dauphinoise' },
    { rankLevel: 12, xpThreshold: 8000, currentRank: 'Fry King' },
    { rankLevel: 13, xpThreshold: 10000, currentRank: 'Emperor of the Taters' },
    { rankLevel: 14, xpThreshold: 12000, currentRank: 'Potato Overlord' },
    { rankLevel: 15, xpThreshold: 35000, currentRank: 'The Ultimate Potato' },
    { rankLevel: 16, xpThreshold: 45000, currentRank: 'Potato Queen' },
  ];
  
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
        rankLevel: currentRankInfo.rankLevel + 1,
        xpThreshold: Infinity,
        currentRank: 'Max Rank Achieved',
      };
    }
  
    const xpForNextLevel = nextRankInfo.xpThreshold - xp;
  
    return {
      currentRank: currentRankInfo.currentRank,
      nextRank: nextRankInfo.currentRank,
      currentXp: xp,
      nextRankThreshold: nextRankInfo.xpThreshold,
      xpForNextLevel,
      currentRankThreshold: currentRankInfo.xpThreshold,
      rankLevel: currentRankInfo.rankLevel,
    };
  };
  
  export { rankThresholds };
  