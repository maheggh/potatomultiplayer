// File: components/assassination/SpecialItemSelection.jsx

import React from 'react';
import { FaGem } from 'react-icons/fa';
import { BOSS_ITEM_STATS } from './constants';

const SpecialItemSelection = ({
  uniqueBossItems,
  bossItems,
  selectedBossItemName,
  selectedBossItemInfo,
  isLoading,
  cooldown,
  handleSelectBossItem
}) => {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700 p-5">
      <h2 className="text-xl font-bold text-red-400 mb-4 flex items-center">
        <FaGem className="mr-2" /> Special Item (Optional)
      </h2>

      <select
        value={selectedBossItemName}
        onChange={handleSelectBossItem}
        className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-red-500 focus:ring focus:ring-red-500 focus:ring-opacity-50 mb-4"
        disabled={uniqueBossItems.length === 0 || isLoading || cooldown > 0}
      >
        <option value="">-- No Special Item --</option>
        {uniqueBossItems.length > 0 ? (
          uniqueBossItems.map((item, i) => {
            const ownedItem = bossItems.find(bi => bi.name === item.name);
            const quantity = ownedItem?.quantity || 0;
            const stats = BOSS_ITEM_STATS[item.name];

            return (
              <option key={item._id || i} value={item.name}>
                {item.name} [{stats?.rarity || 'Common'}] (Qty: {quantity})
              </option>
            );
          })
        ) : (
          <option disabled>No special items available</option>
        )}
      </select>

      {selectedBossItemInfo && (
        <div className="bg-gray-700/50 p-3 rounded-lg border border-gray-600 flex items-start gap-3">
          <img
            src={selectedBossItemInfo.image || '/assets/default-loot.png'}
            alt={selectedBossItemInfo.name}
            className="w-16 h-16 object-contain flex-shrink-0 bg-gray-800 p-1 rounded"
            loading="lazy"
          />
          <div className="flex-grow">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg">{selectedBossItemInfo.name}</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-700 ${selectedBossItemInfo.color}`}>
                {selectedBossItemInfo.rarity}
              </span>
            </div>
            <p className="text-gray-300 text-sm mt-1">{selectedBossItemInfo.description}</p>
            <p className="text-xs text-gray-400 mt-2">This item will be consumed after the assassination attempt.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialItemSelection;