import { FaStar } from 'react-icons/fa';

const rarityColors = {
  "Common": "text-gray-300",
  "Uncommon": "text-green-400",
  "Rare": "text-blue-400",
  "Epic": "text-purple-400",
  "Legendary": "text-orange-400"
};

const BattleResultModal = ({
  showModal,
  onClose,
  fightStats,
  battleLog,
  bossHealth,
  playerHealth,
  selectedTarget,
  selectedWeapon,
  bulletsUsed,
  successLoot
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <div className="bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-yellow-600">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4">Boss Battle Report</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Your Health</p>
            <div className="w-full bg-red-900/30 rounded-full h-4 mt-1">
              <div
                className="bg-red-600 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${playerHealth}%` }}
              ></div>
            </div>
            <p className="text-lg font-bold mt-1">{playerHealth}%</p>
          </div>

          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">{selectedTarget}'s Health</p>
            <div className="w-full bg-yellow-900/30 rounded-full h-4 mt-1">
              <div
                className="bg-yellow-500 h-4 rounded-full transition-all duration-1000"
                style={{ width: `${bossHealth}%` }}
              ></div>
            </div>
            <p className="text-lg font-bold mt-1">{bossHealth}%</p>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Weapon</p>
            <p className="font-bold">{selectedWeapon}</p>
            <p className="text-xs">Accuracy: {fightStats.weaponAccuracy}%</p>
          </div>

          <div className="bg-gray-700 p-3 rounded">
            <p className="text-sm text-gray-400">Success Chance</p>
            <p className="font-bold text-green-400">{fightStats.successChance}%</p>
            <p className="text-xs">Bullets Used: {bulletsUsed.toLocaleString()}</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="font-bold text-lg mb-2">Battle Log</h3>
          <div className="bg-gray-900 p-3 rounded max-h-60 overflow-y-auto">
            {battleLog.length > 0 ? (
              battleLog.map((entry, index) => (
                <div key={index} className="mb-2 pb-2 border-b border-gray-700 last:border-0">
                  <p className="text-yellow-500 text-sm">Round {entry.round}</p>
                  <p className="text-sm">{entry.action}</p>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>Boss HP: {entry.bossHealth}%</span>
                    <span>Your HP: {entry.playerHealth}%</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-2">No battle log available</p>
            )}
          </div>
        </div>

        <div className="text-center mb-4">
          <h3 className="font-bold text-xl mb-2">
            {successLoot ? (
              <span className="text-green-400">Victory!</span>
            ) : (
              <span className="text-red-400">Defeat</span>
            )}
          </h3>

          {successLoot && (
            <div className="p-3 bg-green-900/30 rounded-lg border border-green-600/30 flex items-center justify-center">
              <img
                src={successLoot.image}
                alt={successLoot.name}
                className="w-16 h-16 object-contain mr-3"
                onError={(e) => { e.target.onerror = null; e.target.src='/assets/unknown-item.png'; }}
              />
              <div className="text-left">
                <p className={`font-bold ${rarityColors[successLoot.rarity]}`}>{successLoot.name}</p>
                <p className="text-sm text-gray-300">{successLoot.description}</p>
              </div>
            </div>
          )}

          {!successLoot && (
            <div>
              <p className="text-gray-400 mb-2">
                You were defeated by {selectedTarget}.
              </p>
              
              {/* Show financial loss information */}
              <div className="p-3 bg-red-900/30 rounded-lg border border-red-600/30 text-center mb-2">
                <p className="text-sm text-gray-300">
                  <span className="text-red-400 font-semibold">
                    ${fightStats.bulletsCost.toLocaleString()}
                  </span> spent on bullets
                  {fightStats.moneyLost > 0 && (
                    <> and lost an additional <span className="text-red-400 font-semibold">${fightStats.moneyLost.toLocaleString()}</span></>
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default BattleResultModal;