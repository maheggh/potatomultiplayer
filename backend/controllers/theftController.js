const User = require('../models/User');
const { getRankForXp } = require('../utils/rankCalculator');
const { startJailSentence } = require('./jailController');

exports.stealItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemType } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.inJail) {
      return res.status(400).json({ success: false, message: 'You cannot steal while in jail!' });
    }

    const items = {
        'Purse': [
            { name: 'Slim Purse', price: 50, baseChance: 40, image: '/assets/slim-purse.png' },
            { name: 'Regular Purse', price: 100, baseChance: 30, image: '/assets/regular-purse.png' },
            { name: 'Fat Purse', price: 200, baseChance: 25, image: '/assets/fat-purse.png' },
            { name: 'Empty Purse', price: 10, baseChance: 5, image: '/assets/empty-purse.png' } // Added Empty purse
          ],
        'Jewelry Store': [
            { name: 'Diamond', price: 5000, baseChance: 10, image: '/assets/diamond.png' },
            { name: 'Ruby', price: 3000, baseChance: 15, image: '/assets/ruby.png' },
            { name: 'Emerald', price: 2000, baseChance: 20, image: '/assets/emerald.png' },
            { name: 'Sapphire', price: 2500, baseChance: 18, image: '/assets/sapphire.png' }
          ],
        'ATM': [{ name: 'ATM Money', price: 1000, baseChance: 30, image: '/assets/atm_heist.png' }], // Corrected image name assumption
        'Bank': [{ name: 'Bank Money', price: 50000, baseChance: 5, image: '/assets/bank_heist.png' }] // Corrected image name assumption
    };

    const availableItems = items[itemType];
    if (!availableItems) return res.status(400).json({ success: false, message: 'Invalid item type' });

    // Select item based on its individual baseChance (more realistic)
    let totalChance = availableItems.reduce((sum, item) => sum + item.baseChance, 0);
    let randomNum = Math.random() * totalChance;
    let selectedItem = availableItems[availableItems.length - 1]; // Default to last if loop fails
    for (let item of availableItems) {
        if (randomNum < item.baseChance) {
            selectedItem = item;
            break;
        }
        randomNum -= item.baseChance;
    }

    // Steal success calculation (example: base 50% + level bonus, capped)
    const baseSuccessRate = 50; // Base % chance to succeed *before* item rarity/difficulty
    const successChance = Math.min(baseSuccessRate + (user.level || 1) * 5 - (100 / (selectedItem.baseChance || 10)), 90); // Harder items reduce chance
    const roll = Math.random() * 100;

    if (roll <= successChance) {
      user.stolenItems.push({
        name: selectedItem.name,
        price: selectedItem.price,
        image: selectedItem.image || '/assets/default-loot.png' // Add default image
      });
      const xpGained = 50; // Adjust XP gain
      user.xp += xpGained;
      user.rank = getRankForXp(user.xp).currentRank;

      await user.save();

      return res.status(200).json({
        success: true,
        message: `You successfully stole: ${selectedItem.name}!`,
        stolenItem: selectedItem,
        xp: user.xp,
        rank: user.rank,
      });
    } else {
      const jailDuration = 30; // Jail time in seconds
      await startJailSentence(user, jailDuration); // Use the helper function

      return res.status(400).json({ // Use 400 for failed action
        success: false,
        message: 'You got caught and sent to jail!',
        inJail: true,
        jailTimeEnd: user.jailTimeEnd, // Send the end time
      });
    }
  } catch (error) {
    console.error('Server error during theft:', error);
    return res.status(500).json({ success: false, message: 'Server error during theft', error: error.message });
  }
};

exports.sellItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemIndex } = req.body; // Changed to use index for reliability

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Validate index
    if (itemIndex === undefined || itemIndex < 0 || itemIndex >= user.stolenItems.length) {
        return res.status(400).json({ success: false, message: 'Invalid item index provided.' });
    }

    const item = user.stolenItems[itemIndex];

    user.money += item.price;
    user.stolenItems.splice(itemIndex, 1); // Remove item by index

    await user.save();

    return res.status(200).json({
      success: true,
      message: `You sold ${item.name} for $${item.price}`,
      money: user.money,
      stolenItems: user.stolenItems // Return updated items list
    });
  } catch (error) {
    console.error('Server error during sale:', error);
    return res.status(500).json({ success: false, message: 'Server error during sale', error: error.message });
  }
};

exports.getStolenItems = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).select('stolenItems'); // Only select necessary field
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Jail status check is handled by the dedicated /api/jail/status endpoint now
    // No need to check/update jail status here

    res.status(200).json({
        success: true,
        stolenItems: user.stolenItems,
    });
  } catch (error) {
    console.error('Server error fetching stolen items:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stolen items', error: error.message });
  }
};