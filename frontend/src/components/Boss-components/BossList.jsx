import { FaCrown, FaSkull, FaDragon, FaUserSecret, FaAnchor,
  FaUtensils, FaSpaceShuttle, FaShieldAlt, FaCheckCircle,
  FaCoins } from 'react-icons/fa';

const BossList = ({ bosses, selectedTarget, onSelectBoss, className }) => {
  const getBossIcon = (bossName, isLocked) => {
    const color = isLocked ? "text-red-500" : 
      bossName.includes('President') ? "text-yellow-400" :
      bossName.includes('Dragon') ? "text-red-400" :
      bossName.includes('Don') ? "text-gray-200" :
      bossName.includes('Spy') ? "text-blue-400" :
      bossName.includes('Pirate') ? "text-cyan-500" :
      bossName.includes('Chef') ? "text-amber-300" :
      bossName.includes('Astronaut') ? "text-purple-400" :
      bossName.includes('Sheriff') ? "text-yellow-600" :
      "text-yellow-400";
      
    if (bossName.includes('President')) return <FaCrown className={color} />;
    if (bossName.includes('Dragon')) return <FaDragon className={color} />;
    if (bossName.includes('Don')) return <FaSkull className={color} />;
    if (bossName.includes('Spy')) return <FaUserSecret className={color} />;
    if (bossName.includes('Pirate')) return <FaAnchor className={color} />;
    if (bossName.includes('Chef')) return <FaUtensils className={color} />;
    if (bossName.includes('Astronaut')) return <FaSpaceShuttle className={color} />;
    if (bossName.includes('Sheriff')) return <FaShieldAlt className={color} />;
    return <FaSkull className={color} />;
  };
  
  const renderBossCard = (boss) => {
    const isSelected = selectedTarget === boss.name;
    const isLocked = boss.isLocked;

    return (
      <div
        key={boss.name}
        className={`relative cursor-pointer p-4 rounded-lg transition-all duration-300 ${
          isLocked 
            ? 'bg-gray-800/60 border border-red-900/50 opacity-70'
            : isSelected
              ? 'bg-yellow-900/50 border-2 border-yellow-500 shadow-lg shadow-yellow-500/20 transform scale-105'
              : 'bg-gray-800 border border-gray-700 hover:border-yellow-600/50 hover:bg-gray-700'
        }`}
        onClick={() => !isLocked && onSelectBoss(boss.name)}
      >
        <div className="flex items-center mb-2">
          <span className="text-xl mr-2">
            {getBossIcon(boss.name, isLocked)}
          </span>
          <h3 className={`font-bold ${isLocked ? 'text-gray-500' : 'text-yellow-400'}`}>{boss.name}</h3>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
          <span>Difficulty: {boss.difficulty}</span>
          <span className={isLocked ? "text-gray-500" : "text-green-400"}>+{boss.xpReward} XP</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-300 text-sm mb-1">
          <FaCoins className={isLocked ? "text-gray-500" : "text-yellow-400"} />
          <span>Reward: ${boss.moneyReward.toLocaleString()}</span>
        </div>

        {isLocked && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
            <div className="text-red-400 text-sm text-center px-2">
              {boss.levelMessage}
            </div>
          </div>
        )}

        {isSelected && !isLocked && (
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-black rounded-full p-1">
            <FaCheckCircle />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center">
          <FaSkull className="mr-2" /> Choose Your Target
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2">
          {bosses.map(renderBossCard)}
        </div>
      </div>
    </div>
  );
};

export default BossList;