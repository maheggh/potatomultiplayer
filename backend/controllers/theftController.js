const User = require('../models/User');
const { getRankForXp } = require('../utils/rankCalculator');
const { startJailSentence } = require('./jailController');

// theftData structure remains the same as previous version
const theftData = {
  'Purse': {
    baseTheftChance: 60, xpRewardBase: 5, jailDurationBase: 15, // BASE jail duration
    possibleLoot: [ /* ... loot items ... */
      { name: 'Slim Purse', price: 50, rarityChance: 40, image: '/assets/slim-purse.png' },
      { name: 'Regular Purse', price: 100, rarityChance: 30, image: '/assets/regular-purse.png' },
      { name: 'Fat Purse', price: 200, rarityChance: 25, image: '/assets/fat-purse.png' },
      { name: 'Empty Purse', price: 10, rarityChance: 5, image: '/assets/empty-purse.png' }
    ]
  },
  'ATM': {
    baseTheftChance: 40, xpRewardBase: 15, jailDurationBase: 30,
    possibleLoot: [{ name: 'ATM Cash Bundle', price: 1500, rarityChance: 100, image: '/assets/atm-cash-bundle.png' }]
  },
  'Jewelry Store': {
    baseTheftChance: 30, xpRewardBase: 25, jailDurationBase: 45,
    possibleLoot: [ /* ... loot items ... */
      { name: 'Sapphire', price: 2500, rarityChance: 30, image: '/assets/sapphire.png' },
      { name: 'Emerald', price: 3500, rarityChance: 25, image: '/assets/emerald.png' },
      { name: 'Ruby', price: 4500, rarityChance: 20, image: '/assets/ruby.png' },
      { name: 'Diamond', price: 7000, rarityChance: 15, image: '/assets/diamond.png' },
      { name: 'Fake Gem', price: 50, rarityChance: 10, image: '/assets/fake-gem.png'}
    ]
  },
  'Bank': {
    baseTheftChance: 5, xpRewardBase: 100, jailDurationBase: 120,
    possibleLoot: [{ name: 'Bag of Cash', price: 25000, rarityChance: 100, image: '/assets/bag-of-cash.png' }]
  }
};

// getRandomItem helper remains the same
const getRandomItem = (possibleLoot) => {
    if (!possibleLoot || possibleLoot.length === 0) return null;
    let totalChance = possibleLoot.reduce((sum, item) => sum + (item.rarityChance || 0), 0);
    if (totalChance <= 0) return { ...possibleLoot[0] }; // Return copy
    let randomNum = Math.random() * totalChance;
    for (let item of possibleLoot) {
      if (randomNum < (item.rarityChance || 0)) { return { ...item }; }
      randomNum -= (item.rarityChance || 0);
    }
    return { ...possibleLoot[possibleLoot.length - 1] }; // Return copy
};


exports.stealItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemType } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.inJail && user.jailTimeEnd && new Date() < new Date(user.jailTimeEnd)) {
        return res.status(400).json({ success: false, message: 'You cannot steal while in jail!', inJail: true, jailTimeEnd: user.jailTimeEnd });
    }

    const categoryData = theftData[itemType];
    if (!categoryData) return res.status(400).json({ success: false, message: 'Invalid theft category' });

    const userLevel = user.level || 1;
    const levelBonus = userLevel * 1.5;
    const calculatedChance = categoryData.baseTheftChance + levelBonus;
    const finalTheftChance = Math.max(5, Math.min(calculatedChance, 95));
    const roll = Math.random() * 100;

    console.log(`User Level: ${userLevel}, Category: ${itemType}, Base Chance: ${categoryData.baseTheftChance}, Bonus: ${levelBonus.toFixed(1)}, Final Chance: ${finalTheftChance.toFixed(1)}%, Roll: ${roll.toFixed(1)}`);

    if (roll <= finalTheftChance) {
      // --- SUCCESS --- (Logic remains the same)
      const stolenItemData = getRandomItem(categoryData.possibleLoot);
      if (!stolenItemData) {
           console.error(`No loot item selected for category ${itemType} despite successful roll.`);
           return res.status(200).json({ success: true, message: `You managed the theft, but came away empty-handed this time!`, xp: user.xp, rank: user.rank, stolenItem: null });
      }
      const newItem = { name: stolenItemData.name, price: stolenItemData.price, image: stolenItemData.image || `/assets/${stolenItemData.name?.toLowerCase().replace(/\s+/g, '-')}.png` || '/assets/default-loot.png' };
      user.stolenItems.push(newItem);
      const xpGained = Math.max(1, Math.floor(categoryData.xpRewardBase + (userLevel * 0.2)));
      user.xp += xpGained;
      const rankInfo = getRankForXp(user.xp);
      user.rank = rankInfo.currentRank;
      user.level = rankInfo.rankLevel;
      await user.save();
      return res.status(200).json({ success: true, message: `Success! You pilfered: ${newItem.name} and gained ${xpGained} XP!`, stolenItem: newItem, xp: user.xp, rank: user.rank });

    } else {
      // --- FAILED ATTEMPT ---
      // --- Calculate Scaled Jail Duration ---
      // Example: Base + 0.5 seconds per level, minimum 15 seconds
      const scaledJailDuration = Math.max(15, Math.floor(categoryData.jailDurationBase + (userLevel * 0.5)));

      // Call startJailSentence and CHECK the result
      const jailEndTime = await startJailSentence(user, scaledJailDuration);

      // --- Handle potential failure from startJailSentence ---
      if (!jailEndTime) {
          console.error(`Controller Error: Failed to set jail time for user ${userId} after failed theft, startJailSentence returned null.`);
          // Send a generic server error, as jailing failed unexpectedly
          return res.status(500).json({ success: false, message: 'Theft failed, and an error occurred while processing the jail sentence.' });
      }

      // --- If jail sentence was set successfully ---
      return res.status(400).json({
        success: false,
        message: `Oops! A witness saw you! Jailed for ${scaledJailDuration} seconds.`, // Use calculated duration
        inJail: true,
        jailTimeEnd: jailEndTime, // Use the returned end time
      });
    }
  } catch (error) {
    console.error(`Server error during theft for user ${req.user?.userId}:`, error);
    return res.status(500).json({ success: false, message: 'An unexpected server error occurred during the theft.' });
  }
};

// sellItem and getStolenItems remain the same as previous version
exports.sellItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemIndex } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.inJail && user.jailTimeEnd && new Date() < new Date(user.jailTimeEnd)) { return res.status(400).json({ success: false, message: 'Cannot sell items from jail!' }); }
    if (itemIndex === undefined || itemIndex < 0 || !user.stolenItems || itemIndex >= user.stolenItems.length) { return res.status(400).json({ success: false, message: 'Invalid item index.' }); }
    const item = user.stolenItems[itemIndex];
    const sellPrice = item.price || 0;
    user.money = (user.money || 0) + sellPrice;
    user.stolenItems.splice(itemIndex, 1);
    await user.save();
    return res.status(200).json({ success: true, message: `You sold ${item.name || 'the item'} for $${sellPrice.toLocaleString()}`, money: user.money, stolenItems: user.stolenItems });
  } catch (error) {
    console.error(`Server error during item sale for user ${req.user?.userId}:`, error);
    return res.status(500).json({ success: false, message: 'Server error during item sale.' });
  }
};

exports.getStolenItems = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).select('stolenItems');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, stolenItems: user.stolenItems || [] });
  } catch (error) {
    console.error(`Server error fetching stolen items for user ${req.user?.userId}:`, error);
    res.status(500).json({ success: false, message: 'Server error fetching stolen items.' });
  }
};