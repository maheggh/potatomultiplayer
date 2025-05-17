const User = require('../models/User');

// Boss data with difficulties and rewards
const bosses = {
  'Potato President': { 
    difficulty: 500,
    loot: { 
      name: 'Presidential Medal', 
      image: '/assets/presidential-medal.png', 
      description: '+5% Success Chance, +50% XP Gain',
      rarity: "Uncommon",
      effects: {
        successChanceBonus: 5,
        xpGainMultiplier: 1.5
      }
    }, 
    xpReward: 1000,
    moneyReward: 2500
  },
  'Potato Dragon': { 
    difficulty: 1000,
    loot: { 
      name: "Dragon's Hoard", 
      image: '/assets/dragon-hoard.png', 
      description: '+10% Success Chance, +50% Loot Multiplier',
      rarity: "Legendary",
      effects: {
        successChanceBonus: 10,
        lootMultiplier: 1.5
      }
    }, 
    xpReward: 2000,
    moneyReward: 5000
  },
  'Potato Don': { 
    difficulty: 700,
    loot: { 
      name: 'Mafia Ring', 
      image: '/assets/mafia-fortune.png', 
      description: '+15% Success Chance, -10% Retaliation Chance',
      rarity: "Rare",
      effects: {
        successChanceBonus: 15,
        retaliationReduction: 0.1
      }
    }, 
    xpReward: 1500,
    moneyReward: 3500
  },
  'Spud Spy': { 
    difficulty: 700,
    loot: { 
      name: 'Invisible Cloak', 
      image: '/assets/invisible-cloak.png', 
      description: 'Prevents Retaliation during assassinations',
      rarity: "Epic",
      effects: {
        preventRetaliation: true
      }
    }, 
    xpReward: 1200,
    moneyReward: 2200
  },
  'Potato Pirate': { 
    difficulty: 400,
    loot: { 
      name: "Pirate's Compass", 
      image: '/assets/pirate-compass.png', 
      description: '+300 Flat XP Bonus per criminal activity',
      rarity: "Uncommon",
      effects: {
        flatXpBonus: 300
      }
    }, 
    xpReward: 1800,
    moneyReward: 4000
  },
  'Gourmet Chef Tater': { 
    difficulty: 450,
    loot: { 
      name: 'Golden Spatula', 
      image: '/assets/golden-spatula.png', 
      description: '+20% Success Chance, Bullets Cost $0',
      rarity: "Epic",
      effects: {
        successChanceBonus: 20,
        freeBullets: true
      }
    }, 
    xpReward: 1700,
    moneyReward: 3200
  },
  'Astronaut Spudnik': { 
    difficulty: 600,
    loot: { 
      name: 'Star Dust', 
      image: '/assets/star-dust.png', 
      description: '+25% Success Chance, +25% XP Gain',
      rarity: "Legendary",
      effects: {
        successChanceBonus: 25,
        xpGainMultiplier: 1.25
      }
    }, 
    xpReward: 2500,
    moneyReward: 6000
  },
  'Sheriff Tater': { 
    difficulty: 550,
    loot: { 
      name: "Sheriff's Badge", 
      image: '/assets/sheriffs-badge.png', 
      description: 'Prevents Retaliation during assassinations',
      rarity: "Rare",
      effects: {
        preventRetaliation: true
      }
    }, 
    xpReward: 1400,
    moneyReward: 2800
  },
};

// Calculate XP requirements for leveling up
const calculateXpForLevel = (level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

// Calculate rank based on level
const calculateRank = (level) => {
  if (level < 2) return 'Homeless Potato';
  if (level < 5) return 'Street Spud';
  if (level < 10) return 'Tuber Thug';
  if (level < 15) return 'Starch Soldier';
  if (level < 20) return 'Fry Guy';
  if (level < 25) return 'Mashed Master';
  if (level < 30) return 'Potato Prince';
  if (level < 40) return 'Spud Sovereign';
  return 'Potato Godfather';
};

// Check and update player level and rank
const checkAndUpdateLevel = (user) => {
  let updated = false;
  let level = user.level || 1;
  
  // Check if XP is enough for next level
  while (user.xp >= calculateXpForLevel(level + 1)) {
    level++;
    updated = true;
  }
  
  if (updated) {
    user.level = level;
    user.rank = calculateRank(level);
  }
  
  return updated;
};

// Get boss data
exports.getBosses = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      bosses: Object.entries(bosses).map(([name, data]) => ({
        name,
        ...data
      }))
    });
  } catch (error) {
    console.error('Error getting bosses data:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving bosses data'
    });
  }
};

// Attempt boss fight
exports.fightBoss = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { bossName, weaponName, bulletsUsed } = req.body;

    // Validate input
    if (!bossName || !weaponName || !bulletsUsed) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: bossName, weaponName, bulletsUsed'
      });
    }

    // Check if boss exists
    if (!bosses[bossName]) {
      return res.status(404).json({
        success: false,
        message: 'Boss not found'
      });
    }

    // Parse bullets to ensure it's a valid number
    const bullets = parseInt(bulletsUsed, 10);
    if (isNaN(bullets) || bullets < 1 || bullets > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Invalid bullets amount: must be between 1 and 10000'
      });
    }

    // Get user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has enough money for bullets
    const bulletsCost = bullets * 100;
    if (user.money < bulletsCost) {
      return res.status(400).json({
        success: false,
        message: `Not enough money for ${bullets} bullets (cost: $${bulletsCost.toLocaleString()})`
      });
    }

    // Find the weapon in user's inventory
    const weapon = user.inventory.find(item => item.name === weaponName && item.attributes?.accuracy);
    if (!weapon) {
      return res.status(404).json({
        success: false,
        message: 'Weapon not found in inventory'
      });
    }

    // Calculate success chance
    const bossData = bosses[bossName];
    const targetDifficulty = bossData.difficulty;
    const weaponAccuracy = weapon.attributes.accuracy;
    
    const rawChance = (weaponAccuracy * bullets * 10) / targetDifficulty;
    const successChance = Math.min(95, Math.max(5, Math.floor(rawChance)));
    
    // Determine outcome
    const isSuccessful = Math.random() * 100 < successChance;
    
    // Deduct bullet cost
    user.money -= bulletsCost;
    
    if (isSuccessful) {
      // Boss defeated - give rewards
      const loot = bossData.loot;
      const xpGained = bossData.xpReward;
      const moneyGained = bossData.moneyReward;
      
      // Add boss loot to player's inventory
      const existingLootIndex = user.bossItems.findIndex(item => item.name === loot.name);
      if (existingLootIndex > -1) {
        // Increment quantity if already owned
        user.bossItems[existingLootIndex].quantity = (user.bossItems[existingLootIndex].quantity || 1) + 1;
      } else {
        // Add new item
        user.bossItems.push({
          name: loot.name,
          quantity: 1,
          image: loot.image,
          description: loot.description,
          rarity: loot.rarity,
          effects: loot.effects
        });
      }
      
      // Add rewards
      user.xp += xpGained;
      user.money += moneyGained;
      
      // Check for level up
      checkAndUpdateLevel(user);
      
      // Save user data
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: `You defeated ${bossName}!`,
        updatedMoney: user.money,
        updatedXp: user.xp,
        updatedRank: user.rank,
        updatedLevel: user.level,
        updatedBossItems: user.bossItems,
        loot: loot,
        xpGained,
        moneyGained,
        bulletsCost
      });
    } else {
      // Boss fight failed
      await user.save();
      
      return res.status(200).json({
        success: false,
        message: `Failed to defeat ${bossName}.`,
        updatedMoney: user.money,
        bulletsCost
      });
    }
  } catch (error) {
    console.error('Error during boss fight:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during boss fight'
    });
  }
};

// Get boss items in inventory
exports.getBossItems = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      bossItems: user.bossItems || []
    });
  } catch (error) {
    console.error('Error getting boss items:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error retrieving boss items'
    });
  }
};

// Use boss item for activity
exports.useBossItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { itemName, activityType } = req.body;
    
    if (!itemName || !activityType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: itemName, activityType'
      });
    }
    
    const validActivityTypes = ['theft', 'carTheft', 'assassination', 'race'];
    if (!validActivityTypes.includes(activityType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid activity type. Must be one of: ${validActivityTypes.join(', ')}`
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Find the boss item
    const itemIndex = user.bossItems.findIndex(item => item.name === itemName);
    if (itemIndex === -1 || !user.bossItems[itemIndex].quantity || user.bossItems[itemIndex].quantity < 1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in inventory or quantity is 0'
      });
    }
    
    // Get item effects
    const itemEffects = user.bossItems[itemIndex].effects || {};
    
    // Reduce quantity by 1
    user.bossItems[itemIndex].quantity -= 1;
    
    // If quantity is 0, remove item from inventory
    if (user.bossItems[itemIndex].quantity <= 0) {
      user.bossItems.splice(itemIndex, 1);
    }
    
    // Save changes
    await user.save();
    
    return res.status(200).json({
      success: true,
      message: `${itemName} used for ${activityType}`,
      updatedBossItems: user.bossItems,
      effects: itemEffects
    });
  } catch (error) {
    console.error('Error using boss item:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error using boss item'
    });
  }
};