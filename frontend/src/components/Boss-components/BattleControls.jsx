import {
  FaInfoCircle, FaSpinner, FaCoins, FaStar, FaBomb
} from 'react-icons/fa';

const rarityColors = {
  "Common": "text-gray-300",
  "Uncommon": "text-green-400",
  "Rare": "text-blue-400",
  "Epic": "text-purple-400",
  "Legendary": "text-orange-400"
};

const BattleControls = ({
  selectedTarget,
  selectedWeapon,
  money,
  bulletsUsed,
  bulletInputValue,
  availableWeapons,
  bossDetails,
  isLoading,
  successLoot,
  handleSelectWeapon,
  handleBulletInputChange,
  handleBulletInputBlur,
  calculateSuccessChance,
  attemptBossFight,
  className
}) => {
  return (
    <div className={className}>
      <div className="bg-gray-800/80 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-gray-700">
        <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center">
          <FaBomb className="mr-2" /> Prepare for Battle
        </h2>

        <div className="mb-4">
          <label htmlFor="weapon-select" className="block mb-2 font-medium text-gray-300">Select Weapon:</label>
          <select
            id="weapon-select"
            value={selectedWeapon}
            className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:border-yellow-500 focus:ring focus:ring-yellow-500 focus:ring-opacity-50"
            onChange={handleSelectWeapon}
            disabled={availableWeapons.length === 0}
          >
            <option value="">-- Select a Weapon --</option>
            {availableWeapons.length > 0 ? (
               availableWeapons.map((w, i) => (
                 <option key={w._id || i} value={w.name}>{w.name} (Acc: {w.attributes.accuracy}%)</option>
               ))
              ) : (
               <option disabled>No weapons in inventory</option>
              )
            }
          </select>
        </div>

        <div className="mb-6">
          <label htmlFor="bullets-input" className="block mb-2 font-medium text-gray-300">Bullets (Cost: $100 each):</label>
          <input
            id="bullets-input"
            type="number"
            value={bulletInputValue}
            min="100"
            max="10000"
            onChange={handleBulletInputChange}
            onBlur={handleBulletInputBlur}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600 focus:border-yellow-500 focus:ring focus:ring-yellow-500 focus:ring-opacity-50"
          />
          <p className="text-sm text-gray-400 mt-1">Total Cost: ${(bulletsUsed * 100).toLocaleString()}</p>
        </div>

        {selectedTarget && selectedWeapon && bossDetails && (
          <div className="mb-6 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
            <h3 className="text-md font-semibold text-gray-300 mb-2 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-400" /> Battle Assessment
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Weapon Accuracy</p>
                <p className="font-semibold">
                  {availableWeapons.find(w => w.name === selectedWeapon)?.attributes?.accuracy || 0}%
                </p>
              </div>
              <div>
                <p className="text-gray-400">Boss Difficulty</p>
                <p className="font-semibold">{bossDetails?.difficulty || 0}</p>
              </div>
              <div>
                <p className="text-gray-400">Bullets</p>
                <p className="font-semibold">{bulletsUsed.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400">Success Chance</p>
                <p className={`font-semibold ${
                  calculateSuccessChance(
                    availableWeapons.find(w => w.name === selectedWeapon)?.attributes?.accuracy || 0,
                    bulletsUsed,
                    bossDetails?.difficulty || 0
                  ) < 30 ? 'text-red-400' : 'text-green-400'
                }`}>
                  {calculateSuccessChance(
                    availableWeapons.find(w => w.name === selectedWeapon)?.attributes?.accuracy || 0,
                    bulletsUsed,
                    bossDetails?.difficulty || 0
                  )}%
                </p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={attemptBossFight}
          disabled={isLoading || !selectedTarget || !selectedWeapon || bulletsUsed < 100}
          className={`w-full py-3 rounded-lg font-bold transition duration-200 ease-in-out flex items-center justify-center ${
            isLoading || !selectedTarget || !selectedWeapon || bulletsUsed < 100
              ? 'bg-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-600 to-red-600 hover:from-yellow-500 hover:to-red-500 text-white'
          }`}
        >
          {isLoading ? (
            <><FaSpinner className="animate-spin mr-2" /> Fighting...</>
          ) : (
            <>Start Boss Battle</>
          )}
        </button>

        <div className="mt-4 p-2 bg-gray-700/30 rounded-lg flex justify-between items-center">
          <span className="text-gray-400">Your Funds:</span>
          <span className="font-bold text-green-400">${money?.toLocaleString()}</span>
        </div>
      </div>

      {successLoot && (
        <div className="bg-green-900/20 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-green-700/50 animate-fade-in">
          <h3 className="text-xl font-bold text-green-400 mb-3 flex items-center">
            <FaStar className="mr-2 text-yellow-400" /> Battle Reward
          </h3>

          <div className="flex items-start">
            <img
              src={successLoot.image}
              alt={successLoot.name}
              className="w-20 h-20 object-contain bg-green-900/30 p-2 rounded flex-shrink-0 mr-4"
              onError={(e) => { e.target.onerror = null; e.target.src='/assets/unknown-item.png'; }}
            />
            <div>
              <p className={`text-lg font-bold mb-1 ${rarityColors[successLoot.rarity]}`}>
                {successLoot.name} <span className="text-xs font-normal">({successLoot.rarity})</span>
              </p>
              <p className="text-gray-300 text-sm">{successLoot.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BattleControls;