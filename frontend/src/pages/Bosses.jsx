// Bosses.jsx - Main boss battles page
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { FaSpinner } from 'react-icons/fa';


import BossList from '../components/Boss-components/BossList';
import BossDetails from '../components/boss-components/BossDetails';
import BattleControls from '../components/boss-components/BattleControls';
import BattleResultModal from '../components/boss-components/BattleResultModal';
import StatusMessages from '../components/boss-components/StatusMessages';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const Bosses = () => {
  const { user, money, inventory, bossItems, xp, level, rank, updateUserData } = useContext(AuthContext);

  const [bosses, setBosses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [selectedWeapon, setSelectedWeapon] = useState('');
  const [bulletsUsed, setBulletsUsed] = useState(100);
  const [bulletInputValue, setBulletInputValue] = useState('100');
  const [bossImage, setBossImage] = useState('/assets/bossbattle.png');
  const [successMessage, setSuccessMessage] = useState('');
  const [successLoot, setSuccessLoot] = useState(null);
  const [failureMessage, setFailureMessage] = useState('');

  const [bossDetails, setBossDetails] = useState(null);
  const [showBossModal, setShowBossModal] = useState(false);
  const [fightStats, setFightStats] = useState(null);
  const [bossHealth, setBossHealth] = useState(100);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [battleLog, setBattleLog] = useState([]);

  const availableWeapons = inventory.filter(item => item.attributes?.accuracy > 0);

  // Fetch bosses data from server
  useEffect(() => {
    const fetchBossesData = async () => {
      try {
        setIsInitialLoading(true);
        const response = await axios.get(`${API_URL}/bosses`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.data.success && response.data.bosses) {
          setBosses(response.data.bosses);
          
          // If there are bosses, select the first non-locked one by default
          const availableBoss = response.data.bosses.find(boss => !boss.isLocked);
          if (availableBoss) {
            handleSelectBoss(availableBoss.name);
          }
        }
      } catch (error) {
        console.error('Failed to fetch boss data:', error);
        setFailureMessage('Failed to load boss data. Please try again later.');
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchBossesData();
  }, []);

  const handleSelectBoss = (bossName) => {
    const selectedBoss = bosses.find(boss => boss.name === bossName);
    if (!selectedBoss) return;

    setSelectedTarget(bossName);
    setBossImage(selectedBoss.image || '/assets/bossbattle.png');
    setBossDetails(selectedBoss);
    setSuccessMessage('');
    setSuccessLoot(null);
    setFailureMessage('');
    setFightStats(null);
    setBossHealth(100);
    setPlayerHealth(100);
  };

  const handleSelectWeapon = (e) => {
    setSelectedWeapon(e.target.value);
  };

  const handleBulletInputChange = (e) => {
    setBulletInputValue(e.target.value);
  };

  const handleBulletInputBlur = () => {
    const parsedValue = parseInt(bulletInputValue, 10);
    let validValue = 100; // Increased default minimum for more challenge
    if (!isNaN(parsedValue)) {
      if (parsedValue > 10000) {
        validValue = 10000;
      } else if (parsedValue >= 100) {
        validValue = parsedValue;
      }
    }
    setBulletsUsed(validValue);
    setBulletInputValue(validValue.toString());
  };

  const calculateSuccessChance = (weaponAccuracy, bulletsUsed, targetDifficulty) => {
    if (!targetDifficulty) return 0;
    
    // Use the backend formula for consistency
    const rawChance = (weaponAccuracy * bulletsUsed * 5) / targetDifficulty;
    return Math.min(90, Math.max(2, Math.floor(rawChance)));
  };

  const attemptBossFight = async () => {
    if (isLoading || bulletsUsed < 100) return;

    setIsLoading(true);
    setSuccessMessage('');
    setSuccessLoot(null);
    setFailureMessage('');
    setFightStats(null);
    setBattleLog([]);

    const weaponItem = availableWeapons.find(item => item.name === selectedWeapon);

    if (!weaponItem || !weaponItem.attributes?.accuracy) {
      setFailureMessage("Select a valid weapon from your inventory.");
      setIsLoading(false);
      return;
    }
    
    if (!selectedTarget) {
      setFailureMessage('Select a boss to fight.');
      setIsLoading(false);
      return;
    }

    const bulletsCost = bulletsUsed * 100;
    if (money < bulletsCost) {
      setFailureMessage(`Not enough money for ${bulletsUsed.toLocaleString()} bullets (cost: $${bulletsCost.toLocaleString()}).`);
      setIsLoading(false);
      return;
    }

    // Use the backend API for boss fights
    try {
      const response = await axios.post(
        `${API_URL}/bosses/fight`,
        {
          bossName: selectedTarget,
          weaponName: selectedWeapon,
          bulletsUsed: bulletsUsed
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      // Process battle results from the server
      if (response.data) {
        // Set battle stats
        const bossHp = response.data.bossHealth || 0;
        const playerHp = response.data.playerHealth || 0;
        setBossHealth(bossHp);
        setPlayerHealth(playerHp);
        setBattleLog(response.data.battleLog || []);
        
        // Success case
        if (response.data.success) {
          setSuccessMessage(`Victory! Defeated ${selectedTarget} and gained ${response.data.xpGained.toLocaleString()} XP and $${response.data.moneyGained.toLocaleString()}!`);
          setSuccessLoot(response.data.loot);
          
          // Update user data in context
          updateUserData({
            money: response.data.updatedMoney,
            xp: response.data.updatedXp,
            bossItems: response.data.updatedBossItems,
            level: response.data.updatedLevel,
            rank: response.data.updatedRank
          });
        } 
        // Failure case
        else {
          setFailureMessage(response.data.message || `Failed to defeat ${selectedTarget}.`);
          
          // Update money in context
          updateUserData({ 
            money: response.data.updatedMoney 
          });
        }
        
        // Set fight stats for modal
        setFightStats({
          bulletsCost: response.data.bulletsCost,
          successChance: calculateSuccessChance(
            weaponItem.attributes.accuracy,
            bulletsUsed,
            bossDetails.difficulty
          ),
          weaponAccuracy: weaponItem.attributes.accuracy,
          moneyLost: response.data.moneyLost || 0
        });
        
        setShowBossModal(true);
      }
    } catch (error) {
      console.error('Error during boss fight:', error);
      setFailureMessage(error.response?.data?.message || 'Server error during boss fight. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const closeBattleModal = () => {
    setShowBossModal(false);
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-yellow-900/20 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading boss data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-yellow-900/20 to-gray-900 text-white py-10 md:py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Boss Battles</h1>
          <p className="text-gray-400 max-w-3xl mx-auto">
            Challenge legendary bosses for unique treasures and massive rewards. Choose your weapon wisely and bring enough bullets!
          </p>
        </div>

        <StatusMessages 
          successMessage={successMessage} 
          failureMessage={failureMessage} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <BossList 
            bosses={bosses}
            selectedTarget={selectedTarget}
            onSelectBoss={handleSelectBoss}
            className="lg:col-span-2 space-y-6 order-2 lg:order-1"
          />

          <BossDetails 
            bossDetails={bossDetails}
            bossImage={bossImage}
            selectedTarget={selectedTarget}
            level={level}
            className="lg:col-span-1 space-y-6 order-1 lg:order-2"
          />

          <BattleControls 
            selectedTarget={selectedTarget}
            selectedWeapon={selectedWeapon}
            money={money}
            bulletsUsed={bulletsUsed}
            bulletInputValue={bulletInputValue}
            availableWeapons={availableWeapons}
            bossDetails={bossDetails}
            isLoading={isLoading}
            successLoot={successLoot}
            handleSelectWeapon={handleSelectWeapon}
            handleBulletInputChange={handleBulletInputChange}
            handleBulletInputBlur={handleBulletInputBlur}
            calculateSuccessChance={calculateSuccessChance}
            attemptBossFight={attemptBossFight}
            className="lg:col-span-2 space-y-6 order-3"
          />
        </div>
      </div>

      {showBossModal && fightStats && (
        <BattleResultModal
          showModal={showBossModal}
          onClose={closeBattleModal}
          fightStats={fightStats}
          battleLog={battleLog}
          bossHealth={bossHealth}
          playerHealth={playerHealth}
          selectedTarget={selectedTarget}
          selectedWeapon={selectedWeapon}
          bulletsUsed={bulletsUsed}
          successLoot={successLoot}
        />
      )}
    </div>
  );
};

export default Bosses;