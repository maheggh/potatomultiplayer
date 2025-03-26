const User = require('../models/User');
const { getRankForXp } = require('../utils/rankCalculator');

exports.stealItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemType } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.inJail) {
      return res.status(403).json({ message: 'You cannot steal while in jail!' });
    }

    const items = {
      Purse: [
        { name: 'Slim Purse', price: 50, baseChance: 40 },
        { name: 'Fat Purse', price: 200, baseChance: 25 }
      ],
      Jewelry: [
        { name: 'Diamond', price: 5000, baseChance: 10 },
        { name: 'Ruby', price: 3000, baseChance: 15 }
      ],
      ATM: [{ name: 'ATM Money', price: 1000, baseChance: 30 }],
      Bank: [{ name: 'Bank Money', price: 50000, baseChance: 5 }]
    };

    const availableItems = items[itemType];
    if (!availableItems) return res.status(400).json({ message: 'Invalid item type' });

    const selectedItem = availableItems[Math.floor(Math.random() * availableItems.length)];
    const stealChance = Math.min(selectedItem.baseChance + user.level * 5, 90);
    const roll = Math.floor(Math.random() * 100) + 1;

    if (roll <= stealChance) {
      user.stolenItems.push(selectedItem);
      user.xp += 100;
      user.rank = getRankForXp(user.xp).currentRank;

      await user.save();

      return res.status(200).json({
        message: `You successfully stole a ${selectedItem.name}!`,
        stolenItem: selectedItem,
        xp: user.xp,
        rank: user.rank,
      });
    } else {
      user.inJail = true;
      user.jailTimeEnd = Date.now() + 30000;
      await user.save();

      return res.status(403).json({
        message: 'You got caught and sent to jail!',
        inJail: true,
        jailTime: 30,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Server error during theft' });
  }
};

exports.sellItem = async (req, res) => {
  try {
    const { userId } = req.user;
    const { itemName } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const itemIndex = user.stolenItems.findIndex((item) => item.name === itemName);
    if (itemIndex === -1) return res.status(400).json({ message: 'Item not found in pocket' });

    const item = user.stolenItems[itemIndex];
    user.money += item.price;
    user.stolenItems.splice(itemIndex, 1);

    await user.save();

    return res.status(200).json({
      message: `You sold ${item.name} for $${item.price}`,
      money: user.money,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error during sale' });
  }
};

exports.getStolenItems = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.inJail && Date.now() >= user.jailTimeEnd) {
      user.inJail = false;
      user.jailTimeEnd = null;
      await user.save();
    }

    res.status(200).json({
      stolenItems: user.stolenItems,
      inJail: user.inJail,
      jailTime: user.inJail ? Math.ceil((user.jailTimeEnd - Date.now()) / 1000) : 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching stolen items' });
  }
};
