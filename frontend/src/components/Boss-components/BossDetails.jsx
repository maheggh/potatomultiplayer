import { FaHeartBroken } from 'react-icons/fa';

const rarityColors = {
  "Common": "text-gray-300",
  "Uncommon": "text-green-400",
  "Rare": "text-blue-400",
  "Epic": "text-purple-400",
  "Legendary": "text-orange-400"
};

const BossDetails = ({ bossDetails, bossImage, selectedTarget, level, className }) => {
  if (!bossDetails) {
    return (
      <div className={className}>
        <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center">
          <img
            src="/assets/bossbattle.png"
            className="max-w-full h-auto object-contain rounded-lg mb-4 max-h-[300px]"
            alt="Boss Battle Arena"
          />
          <p className="text-gray-400 text-center">Select a boss to view details</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="bg-gray-800/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-700 flex flex-col items-center">
        <img
          src={bossImage}
          className="max-w-full h-auto object-contain rounded-lg mb-4 max-h-[300px]"
          alt={selectedTarget || "Boss Battle Arena"}
          onError={(e) => { e.target.onerror = null; e.target.src='/assets/bossbattle.png'; }}
        />

        <div className="w-full mt-2">
          <h3 className="text-xl font-bold text-yellow-400 mb-1">{selectedTarget}</h3>
          <p className="text-gray-300 text-sm mb-3">{bossDetails.description || "A formidable opponent awaits..."}</p>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-700/50 p-2 rounded">
              <span className="block text-xs text-gray-400">Difficulty</span>
              <span className="font-semibold">{bossDetails.difficulty}</span>
            </div>
            <div className="bg-gray-700/50 p-2 rounded">
              <span className="block text-xs text-gray-400">XP Reward</span>
              <span className="font-semibold text-green-400">+{bossDetails.xpReward}</span>
            </div>
            <div className="bg-gray-700/50 p-2 rounded">
              <span className="block text-xs text-gray-400">Money Reward</span>
              <span className="font-semibold text-yellow-400">${bossDetails.moneyReward.toLocaleString()}</span>
            </div>
            <div className="bg-gray-700/50 p-2 rounded">
              <span className="block text-xs text-gray-400">Min Level</span>
              <span className={`font-semibold ${level >= bossDetails.minLevel ? 'text-green-400' : 'text-red-400'}`}>
                {bossDetails.minLevel}
              </span>
            </div>
          </div>

          <div className="mt-3 p-2 bg-yellow-900/30 border border-yellow-700/30 rounded flex items-center">
            <img
              src={bossDetails.loot.image}
              className="w-10 h-10 object-contain mr-2"
              alt={bossDetails.loot.name}
              onError={(e) => { e.target.onerror = null; e.target.src='/assets/unknown-item.png'; }}
            />
            <div>
              <p className={`font-semibold ${rarityColors[bossDetails.loot.rarity]}`}>{bossDetails.loot.name}</p>
              <p className="text-xs text-gray-400">{bossDetails.loot.description}</p>
            </div>
          </div>
          
          {/* Display penalties */}
          <div className="mt-3 p-2 bg-red-900/20 border border-red-700/30 rounded">
            <h4 className="text-sm font-semibold text-red-400 mb-1 flex items-center">
              <FaHeartBroken className="mr-1" /> Defeat Penalties
            </h4>
            <ul className="text-xs text-gray-400">
              <li>• Lose {(bossDetails.moneyPenalty || 0.1) * 100}% of your money</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BossDetails;