// File: components/assassination/AssassinationPage.jsx

import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import {
  FaUserSecret, FaSkull, FaCrosshairs, FaSpinner, 
  FaCheckCircle, FaTimesCircle, FaClock
} from 'react-icons/fa';

import TargetSelection from '../components/assassination/TargetSelection';
import WeaponSelection from '../components/assassination/WeaponSelection';
import SpecialItemSelection from '../components/assassination/SpecialItemSelection';
import AmmunitionSection from '../components/assassination/AmmunitionSelection';
import AssassinationZone from '../components/assassination/AssassinationZone';
import DeadView from '../components/assassination/DeadView';
import { BOSS_ITEM_STATS } from '../components/assassination/constants';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const AssassinationPage = () => {
  const { user, money, inventory, bossItems, xp, kills, isAlive, updateUserData } = useContext(AuthContext);

  // State variables
  const [targets, setTargets] = useState([]);
  const [selectedTargetId, setSelectedTargetId] = useState('');
  const [selectedTargetInfo, setSelectedTargetInfo] = useState(null);
  const [selectedWeaponName, setSelectedWeaponName] = useState('');
  const [selectedWeaponInfo, setSelectedWeaponInfo] = useState(null);
  const [selectedBossItemName, setSelectedBossItemName] = useState('');
  const [selectedBossItemInfo, setSelectedBossItemInfo] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scenarioImage, setScenarioImage] = useState('/assets/assassination.png');
  const [bulletsUsed, setBulletsUsed] = useState(1);
  const [bulletInputValue, setBulletInputValue] = useState('1');
  const [cooldown, setCooldown] = useState(0);
  const [successChance, setSuccessChance] = useState(0);
  const [retaliationChance, setRetaliationChance] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [animationState, setAnimationState] = useState('idle');

  const COOLDOWN_TIME_MS = 60 * 1000;
  const availableWeapons = inventory.filter(item => item.attributes?.accuracy > 0);
  const uniqueBossItems = bossItems.reduce((acc, current) => {
    if (!acc.find(item => item.name === current.name)) {
      acc.push(current);
    }
    return acc;
  }, []);

  useEffect(() => {
    const fetchTargets = async () => {
      setIsLoading(true);
      setErrorMessage('');
      const token = localStorage.getItem('token');
      if (!token) {
        setErrorMessage("Not logged in.");
        setIsLoading(false);
        return;
      }
      try {
        const response = await axios.get(`${API_URL}/assassination/targets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setTargets(response.data.targets || []);
          if (!response.data.targets || response.data.targets.length === 0) {
            setErrorMessage('No valid targets are currently available.');
          }
        } else {
          setErrorMessage(response.data.message || 'Failed to fetch targets.');
        }
      } catch (error) {
        console.error("Error fetching targets:", error)
        setErrorMessage(error.response?.data?.message || 'Server error occurred while fetching targets.');
      } finally {
        setIsLoading(false);
      }
    };

    const checkCooldown = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${API_URL}/assassination/cooldown`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.data.success && response.data.onCooldown) {
          setCooldown(response.data.cooldownRemaining * 1000);
        }
      } catch (error) {
        console.error("Error checking cooldown:", error);
      }
    };

    if (isAlive) {
      fetchTargets();
      checkCooldown();
    } else {
      setIsLoading(false);
    }
  }, [isAlive]);

  useEffect(() => {
    let intervalId = null;

    if (cooldown > 0) {
      intervalId = setInterval(() => {
        setCooldown(prev => {
          const newCooldown = prev - 1000;
          if (newCooldown <= 0) {
            clearInterval(intervalId);
            return 0;
          }
          return newCooldown;
        });
      }, 1000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [cooldown]);

  useEffect(() => {
    let timer;
    if (errorMessage || resultMessage) {
      timer = setTimeout(() => {
        if (errorMessage) setErrorMessage('');
        if (resultMessage) setResultMessage('');
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [errorMessage, resultMessage]);

  useEffect(() => {
    if (selectedTargetId) {
      const target = targets.find(t => t._id === selectedTargetId);
      if (target) {
        setSelectedTargetInfo(target);
      } else {
        setSelectedTargetInfo(null);
      }
    } else {
      setSelectedTargetInfo(null);
    }
  }, [selectedTargetId, targets]);

  useEffect(() => {
    if (selectedWeaponName) {
      const weapon = availableWeapons.find(w => w.name === selectedWeaponName);
      if (weapon) {
        setSelectedWeaponInfo(weapon);
      } else {
        setSelectedWeaponInfo(null);
      }
    } else {
      setSelectedWeaponInfo(null);
    }
  }, [selectedWeaponName, availableWeapons]);

  // Success and retaliation chance calculation
  useEffect(() => {
    if (selectedWeaponInfo && selectedTargetInfo) {
      // Get weapon base accuracy (as a percentage of 1)
      const baseAccuracy = selectedWeaponInfo.attributes.accuracy / 100;
      
      // Calculate bullet bonus with diminishing returns
      let bulletBonus = 0;
      if (bulletsUsed <= 10) {
        // Linear bonus for first 10 bullets (each bullet adds 3% up to 30%)
        bulletBonus = (bulletsUsed * 0.03);
      } else {
        // Base 30% from first 10 bullets
        // Additional bullets follow logarithmic scaling
        bulletBonus = 0.3 + (Math.log(bulletsUsed - 9) * 0.05);
      }
      
      // Cap bullet bonus at 60%
      bulletBonus = Math.min(0.6, bulletBonus);
      
      // Apply target difficulty based on level difference
      const targetLevel = selectedTargetInfo.level || 1;
      const userLevel = user?.level || 1;
      const levelDifference = targetLevel - userLevel;
      
      // Calculate target difficulty
      let targetDifficulty = 1;
      if (levelDifference > 0) {
        // Each level above gives 15% penalty
        targetDifficulty = 1 + (levelDifference * 0.15);
      } else if (levelDifference < 0) {
        // Each level below gives 5% bonus
        targetDifficulty = Math.max(0.5, 1 + (levelDifference * 0.05));
      }
      
      // Calculate success chance including bulletBonus
      let calculatedSuccessChance = (baseAccuracy + bulletBonus) / targetDifficulty;
      
      // Apply boss item bonus effects
      let bossItemBonus = 0;
      if (selectedBossItemInfo) {
        if (selectedBossItemInfo.name === 'Presidential Medal') bossItemBonus = 0.05;
        else if (selectedBossItemInfo.name === "Dragon's Hoard") bossItemBonus = 0.10;
        else if (selectedBossItemInfo.name === 'Mafia Ring') bossItemBonus = 0.15;
        else if (selectedBossItemInfo.name === 'Golden Spatula') bossItemBonus = 0.20;
        else if (selectedBossItemInfo.name === 'Star Dust') bossItemBonus = 0.25;
      }
      
      // Add boss item bonus
      calculatedSuccessChance += bossItemBonus;
      
      // Cap success chance between 5% and 85%
      calculatedSuccessChance = Math.min(0.85, Math.max(0.05, calculatedSuccessChance));
      
      // Convert to percentage for display
      setSuccessChance(Math.round(calculatedSuccessChance * 100));
      
      // Calculate retaliation chance for display
      let calculatedRetaliationChance = 0.6; // 60% base
      
      // Apply retaliation reduction from boss item
      const retaliationReduction = selectedBossItemInfo?.name === 'Mafia Ring' ? 0.1 : 0;
      
      // Check if boss item prevents retaliation
      const preventRetaliation = selectedBossItemInfo?.name === 'Invisible Cloak' || 
                               selectedBossItemInfo?.name === "Sheriff's Badge";
      
      if (preventRetaliation) {
        calculatedRetaliationChance = 0;
      } else {
        calculatedRetaliationChance -= retaliationReduction;
        
        // Increase chance based on target level
        if (levelDifference > 0) {
          calculatedRetaliationChance += levelDifference * 0.07;
        }
        
        // Add bullet noise factor
        if (bulletsUsed > 10) {
          calculatedRetaliationChance += Math.min(0.1, (bulletsUsed - 10) * 0.001);
        }
      }
      
      // Cap between 0% and 85%
      calculatedRetaliationChance = Math.min(0.85, Math.max(0, calculatedRetaliationChance));
      
      // Convert to percentage for display
      setRetaliationChance(Math.round(calculatedRetaliationChance * 100));
    } else {
      setSuccessChance(0);
      setRetaliationChance(0);
    }
  }, [selectedWeaponInfo, selectedTargetInfo, bulletsUsed, selectedBossItemInfo, user]);

  const handleSelectTarget = (e) => {
    setSelectedTargetId(e.target.value);
  };

  const handleSelectWeapon = (e) => {
    setSelectedWeaponName(e.target.value);
  };

  const handleSelectBossItem = (e) => {
    const itemName = e.target.value;
    setSelectedBossItemName(itemName);

    if (itemName && BOSS_ITEM_STATS[itemName]) {
      setSelectedBossItemInfo({
        name: itemName,
        ...BOSS_ITEM_STATS[itemName]
      });
    } else {
      setSelectedBossItemInfo(null);
    }
  };

  const handleBulletInputChange = (e) => {
    setBulletInputValue(e.target.value);
  };

  const handleBulletInputBlur = () => {
    const parsedValue = parseInt(bulletInputValue, 10);
    let validValue = 1;

    if (!isNaN(parsedValue)) {
      if (parsedValue > 10000) {
        validValue = 10000;
      } else if (parsedValue >= 1) {
        validValue = parsedValue;
      }
    }

    setBulletsUsed(validValue);
    setBulletInputValue(validValue.toString());
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getBulletCost = () => {
    if (selectedBossItemName === 'Golden Spatula') {
      return 0;
    }
    return bulletsUsed * 100;
  };

  const playAssassinationAnimation = async (success) => {
    setAnimationState('aiming');
    await new Promise(resolve => setTimeout(resolve, 1000));

    setAnimationState('shooting');
    await new Promise(resolve => setTimeout(resolve, 1500));

    setAnimationState(success ? 'success' : 'failure');
    setShowResults(true);
  };

  const attemptAssassination = async () => {
    if (isLoading || cooldown > 0 || !isAlive || bulletsUsed < 1 || bulletsUsed > 10000) return;

    setResultMessage('');
    setErrorMessage('');
    setScenarioImage('/assets/assassination.png');
    setShowResults(false);
    setAnimationState('idle');

    if (!selectedTargetId) {
      setErrorMessage('You must select a target.');
      return;
    }

    if (!selectedWeaponName) {
      setErrorMessage('You must select a weapon.');
      return;
    }

    const bulletCost = getBulletCost();
    if (money < bulletCost) {
      setErrorMessage(`Not enough money for ${bulletsUsed} bullets. Cost: $${bulletCost.toLocaleString()}`);
      return;
    }

    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      setAnimationState('preparing');

      const response = await axios.post(`${API_URL}/assassination/attempt`, {
        targetId: selectedTargetId,
        weaponName: selectedWeaponName,
        bossItemName: selectedBossItemName || null,
        bulletsUsed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;

      await playAssassinationAnimation(data.success);

      if (data.success) {
        updateUserData({
          money: data.updatedMoney,
          kills: data.updatedKills,
          xp: data.updatedXp,
          inventory: data.updatedInventory || inventory,
          bossItems: data.updatedBossItems || bossItems,
          rank: data.updatedRank
        });

        setResultMessage(data.message + (data.lootMoney > 0 ? ` You looted $${data.lootMoney.toLocaleString()}.` : ''));
        setScenarioImage('/assets/success.png');

        if (data.cooldownDuration) {
          setCooldown(data.cooldownDuration * 1000);
        } else {
          setCooldown(COOLDOWN_TIME_MS);
        }
      } else {
        setErrorMessage(data.message || 'Assassination attempt failed.');
        setScenarioImage(data.userDied ? '/assets/dead.png' : '/assets/failure.png');

        if (data.userDied) {
          updateUserData({
            isAlive: false,
            money: data.updatedMoney
          });
        } else {
          updateUserData({
            money: data.updatedMoney,
            bossItems: data.updatedBossItems || bossItems
          });
        }

        if (data.cooldownDuration) {
          setCooldown(data.cooldownDuration * 1000);
        } else {
          setCooldown(COOLDOWN_TIME_MS);
        }
      }
    } catch (error) {
      console.error("Error during assassination:", error);
      const errorMsg = error.response?.data?.message || 'Server error occurred during assassination.';
      setErrorMessage(errorMsg);
      setScenarioImage('/assets/error.png');
      setAnimationState('error');
    } finally {
      setIsLoading(false);
      setSelectedBossItemName('');
      setSelectedBossItemInfo(null);
    }
  };

  if (!isAlive) {
    return <DeadView />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-red-900/10 to-gray-900 py-10 md:py-20 text-white px-4 sm:px-6 lg:px-8">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <FaUserSecret className="text-red-500 text-5xl mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-400 mb-2">
            Assassination Contracts
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            One shot, one kill. Choose your target wisely, equip the right weapon, and take aim. But be careful - your targets might fight back.
          </p>
        </div>

        <div className="h-16 mb-6 max-w-3xl mx-auto text-center">
          {errorMessage && (
            <div className="p-3 bg-red-900/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in">
              <FaTimesCircle className="mr-2 flex-shrink-0" /> {errorMessage}
            </div>
          )}
          {resultMessage && (
            <div className="p-3 bg-green-900/80 text-white rounded-lg shadow-md flex items-center justify-center animate-fade-in">
              <FaCheckCircle className="mr-2 flex-shrink-0" /> {resultMessage}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-5">
            <TargetSelection 
              targets={targets}
              selectedTargetId={selectedTargetId}
              selectedTargetInfo={selectedTargetInfo}
              user={user}
              isLoading={isLoading}
              cooldown={cooldown}
              handleSelectTarget={handleSelectTarget}
            />

            <WeaponSelection 
              availableWeapons={availableWeapons}
              selectedWeaponName={selectedWeaponName}
              selectedWeaponInfo={selectedWeaponInfo}
              isLoading={isLoading}
              cooldown={cooldown}
              handleSelectWeapon={handleSelectWeapon}
            />

            <SpecialItemSelection 
              uniqueBossItems={uniqueBossItems}
              bossItems={bossItems}
              selectedBossItemName={selectedBossItemName}
              selectedBossItemInfo={selectedBossItemInfo}
              isLoading={isLoading}
              cooldown={cooldown}
              handleSelectBossItem={handleSelectBossItem}
            />

            <AmmunitionSection 
              bulletsUsed={bulletsUsed}
              bulletInputValue={bulletInputValue}
              isLoading={isLoading}
              cooldown={cooldown}
              money={money}
              successChance={successChance}
              retaliationChance={retaliationChance}
              handleBulletInputChange={handleBulletInputChange}
              handleBulletInputBlur={handleBulletInputBlur}
              getBulletCost={getBulletCost}
            />
          </div>

          <AssassinationZone 
            cooldown={cooldown}
            formatTime={formatTime}
            scenarioImage={scenarioImage}
            animationState={animationState}
            showResults={showResults}
            isLoading={isLoading}
            selectedTargetId={selectedTargetId}
            selectedWeaponName={selectedWeaponName}
            isAlive={isAlive}
            bulletsUsed={bulletsUsed}
            money={money}
            getBulletCost={getBulletCost}
            attemptAssassination={attemptAssassination}
            user={user}
            kills={kills}
            xp={xp}
          />
        </div>
      </div>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        Potato Underworld © {new Date().getFullYear()}. All rights reserved.
      </footer>
    </div>
  );
};

export default AssassinationPage;