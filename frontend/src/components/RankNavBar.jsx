// RankNavbar.jsx
import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import styles from './RankNavBar.module.css';

const RankNavbar = () => {
  const { xp, rank, rankInfo } = useContext(AuthContext);
  const [collapsed, setCollapsed] = useState(true);

  const progressToNextRank = rankInfo.nextRankThreshold !== Infinity
    ? ((xp - rankInfo.currentRankThreshold) / (rankInfo.nextRankThreshold - rankInfo.currentRankThreshold)) * 100
    : 100;

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className={`${styles.navbar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.toggleButton} onClick={toggleCollapse}>
        {collapsed ? 'Show Rank' : 'Hide Rank'}
      </div>
      {!collapsed && (
        <div className={styles.rankInfo}>
          <p>Your Rank: {rank}</p>
          <p>
            XP: {xp}/{rankInfo.nextRankThreshold !== Infinity ? rankInfo.nextRankThreshold : 'Max'} (
            {rankInfo.nextRankThreshold !== Infinity ? `${rankInfo.xpForNextLevel} XP to next rank` : 'Max Rank'})
          </p>
          <div className={styles.progressBar}>
            <div className={styles.progress} style={{ width: `${progressToNextRank}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RankNavbar;
