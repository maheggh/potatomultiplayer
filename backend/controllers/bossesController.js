const User = require('../models/User');
const { jailService } = require('../services/jailService');

// Significantly more challenging boss data with higher difficulties and multi-tier bosses
const bosses = {
  'Potato President': { 
    difficulty: 2000,  // 4x harder
    health: 150,       // More health
    damage: 25,        // Higher damage
    image: '/assets/potato-president.png',
    description: "The corrupt leader of the Potato Republic. Well-guarded with secret service spuds everywhere.",
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
    xpReward: 1500,
    moneyReward: 3000,
    minLevel: 5,          // Minimum level requirement
    hospitalTime: 300,    // Seconds in hospital if defeated
    moneyPenalty: 0.1     // 10% of player's money lost on defeat
  },
  'Potato Dragon': { 
    difficulty: 5000,     // 5x harder
    health: 300,          // Much higher health
    damage: 40,           // Very high damage
    image: '/assets/potato-dragon.png',
    description: "A mythical beast that breathes fire and hoards golden treasures. The most formidable opponent.",
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
    xpReward: 3500,
    moneyReward: 7500,
    minLevel: 20,         // High level requirement
    hospitalTime: 600,    // 10 minutes in hospital
    moneyPenalty: 0.2     // 20% money penalty
  },
  'Potato Don': { 
    difficulty: 3000,     // Much harder
    health: 200,
    damage: 30,
    image: '/assets/potato-boss.png',
    description: "The godfather of the Tuber Mafia. Always surrounded by loyal family members who'll take a bullet for him.",
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
    xpReward: 2200,
    moneyReward: 5000,
    minLevel: 10,
    hospitalTime: 450,   // 7.5 minutes
    moneyPenalty: 0.15
  },
  'Spud Spy': { 
    difficulty: 2800,    // 4x harder
    health: 180,
    damage: 35,
    image: '/assets/spud-spy.png',
    description: "Master of disguise and infiltration. You'll never see him coming, and he sees everything.",
    loot: { 
      name: 'Invisible Cloak', 
      image: '/assets/invisible-cloak.png', 
      description: 'Prevents Retaliation during assassinations',
      rarity: "Epic",
      effects: {
        preventRetaliation: true
      }
    }, 
    xpReward: 1800,
    moneyReward: 3500,
    minLevel: 8,
    hospitalTime: 360,
    moneyPenalty: 0.12
  },
  'Potato Pirate': { 
    difficulty: 1600,    // 4x harder
    health: 120,
    damage: 20,
    image: '/assets/potato-pirate.png',
    description: "The scourge of the Seven Seas. His crew of buccaneer spuds will make you walk the plank.",
    loot: { 
      name: "Pirate's Compass", 
      image: '/assets/pirate-compass.png', 
      description: '+300 Flat XP Bonus per criminal activity',
      rarity: "Uncommon",
      effects: {
        flatXpBonus: 300
      }
    }, 
    xpReward: 2200,
    moneyReward: 5000,
    minLevel: 3,
    hospitalTime: 240,
    moneyPenalty: 0.08
  },
  'Gourmet Chef Tater': { 
    difficulty: 1800,    // 4x harder
    health: 140,
    damage: 22,
    image: '/assets/gourmet-chef.png',
    description: "The culinary master with a temper as hot as his kitchen. His knife skills are unmatched.",
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
    xpReward: 2500,
    moneyReward: 4800,
    minLevel: 4,
    hospitalTime: 270,
    moneyPenalty: 0.09
  },
  'Astronaut Spudnik': { 
    difficulty: 2500,     // 4.1x harder
    health: 175,
    damage: 28,
    image: '/assets/potato-astronaut.png',
    description: "The first potato in space. His advanced tech and zero-gravity training make him a formidable opponent.",
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
    xpReward: 3000,
    moneyReward: 7000,
    minLevel: 12,
    hospitalTime: 480,
    moneyPenalty: 0.15
  },
  'Sheriff Tater': { 
    difficulty: 2200,     // 4x harder
    health: 160,
    damage: 25,
    image: '/assets/sheriff-tater.png',
    description: "The law of the Wild West. His quick-draw skills are legendary, and he never misses.",
    loot: { 
      name: "Sheriff's Badge", 
      image: '/assets/sheriffs-badge.png', 
      description: 'Prevents Retaliation during assassinations',
      rarity: "Rare",
      effects: {
        preventRetaliation: true
      }
    }, 
    xpReward: 2000,
    moneyReward: 4200,
    minLevel: 6,
    hospitalTime: 330,
    moneyPenalty: 0.1
  },
};

// Helper functions for level calculations
const calculateXpForLevel = (level) => {
  return Math.floor(100 * Math.pow(1.5, level - 1));
};

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
    // Add level requirements to front-end display
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Include level requirement info for each boss
    const bossesWithRequirements = Object.entries(bosses).map(([name, data]) => {
      const canFight = user.level >= data.minLevel;
      
      return {
        name,
        ...data,
        isLocked: !canFight,
        levelRequirement: data.minLevel,
        levelMessage: canFight ? 
          null : 
          `Requires level ${data.minLevel} (you are level ${user.level})`
      };
    });

    return res.status(200).json({
      success: true,
      bosses: bossesWithRequirements,
      playerLevel: user.level
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
    if (isNaN(bullets) || bullets < 100 || bullets > 10000) { // Increased minimum bullets to 100
      return res.status(400).json({
        success: false,
        message: 'Invalid bullets amount: must be between 100 and 10000'
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

    // Check if user meets level requirement
    const bossData = bosses[bossName];
    if (user.level < bossData.minLevel) {
      return res.status(403).json({
        success: false,
        message: `You need to be level ${bossData.minLevel} to fight ${bossName}. You are level ${user.level}.`
      });
    }

    // Check if user has enough money for bullets
    const bulletsCost = bullets * 100;
    if (user.money < bulletsCost) {
      return res.status(400).json({
        success: false,
        message: `Not enough money for ${bullets.toLocaleString()} bullets (cost: $${bulletsCost.toLocaleString()})`
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

    // Calculate success chance - now much harder
    const targetDifficulty = bossData.difficulty;
    const weaponAccuracy = weapon.attributes.accuracy;
    
    // Adjusted formula for more challenge
    const rawChance = (weaponAccuracy * bullets * 5) / targetDifficulty; // Only 5x bullets now, was 10x
    const successChance = Math.min(90, Math.max(2, Math.floor(rawChance))); // Lower max, lower min
    
    // Simulate battle with rounds
    const rounds = Math.min(10, Math.ceil(bullets / 15)); // More rounds for better simulation
    let bossHealth = bossData.health;
    let playerHealth = 100;
    
    // Battle log
    const battleLog = [];
    
    // Determine outcome based on chance
    const isSuccessful = Math.random() * 100 < successChance;
    
    // Simulate each round
    for (let i = 0; i < rounds && bossHealth > 0 && playerHealth > 0; i++) {
      // Player attacks - damage varies based on weapon and a random factor
      const basePlayerDamage = Math.floor((weaponAccuracy / 10) * (1 + (bullets / 1000)));
      const playerDamageMultiplier = 0.8 + (Math.random() * 0.4); // 0.8-1.2x damage
      const playerDamage = Math.floor(basePlayerDamage * playerDamageMultiplier);
      
      bossHealth = Math.max(0, bossHealth - playerDamage);
      
      battleLog.push({
        round: i + 1,
        action: `You hit ${bossName} for ${playerDamage} damage!`,
        bossHealth: Math.floor((bossHealth / bossData.health) * 100), // Convert to percentage
        playerHealth
      });
      
      // Check if boss is defeated
      if (bossHealth <= 0) break;
      
      // Boss attacks - damage based on boss stats and a random factor
      const baseBossDamage = bossData.damage;
      const bossDamageMultiplier = 0.9 + (Math.random() * 0.6); // 0.9-1.5x damage
      let bossDamage = Math.floor(baseBossDamage * bossDamageMultiplier);
      
      // Make boss hit harder if player is losing
      if (!isSuccessful && i > 1) {
        bossDamage = Math.floor(bossDamage * 1.2);
      }
      
      playerHealth = Math.max(0, playerHealth - bossDamage);
      
      battleLog.push({
        round: i + 1,
        action: `${bossName} strikes back for ${bossDamage} damage!`,
        bossHealth: Math.floor((bossHealth / bossData.health) * 100), // Convert to percentage 
        playerHealth
      });
      
      // Check if player is defeated
      if (playerHealth <= 0) break;
    }
    
    // Override the battle simulation if success chance dice already determined outcome
    // This ensures the battle log matches the predetermined outcome
    if (isSuccessful && playerHealth <= 0) {
      // If player was supposed to win but lost in simulation, give them 1 health and kill boss
      playerHealth = 1;
      bossHealth = 0;
      battleLog.push({
        round: battleLog.length / 2 + 1,
        action: `With your last breath, you land a critical hit on ${bossName}!`,
        bossHealth: 0,
        playerHealth: 1
      });
    } else if (!isSuccessful && bossHealth <= 0) {
      // If player was supposed to lose but won in simulation, give boss 1 health and kill player
      bossHealth = 1;
      playerHealth = 0;
      battleLog.push({
        round: battleLog.length / 2 + 1,
        action: `${bossName} catches you off guard with a devastating final attack!`,
        bossHealth: Math.ceil((bossHealth / bossData.health) * 100), // Convert to percentage
        playerHealth: 0
      });
    }
    
    // Deduct bullet cost 
    user.money -= bulletsCost;
    
    // Process based on final success determination
    if (isSuccessful) {
      // Boss defeated - give rewards
      const loot = bossData.loot;
      const xpGained = bossData.xpReward;
      const moneyGained = bossData.moneyReward;
      
      // Add boss loot to player's inventory
      if (!user.bossItems) {
        user.bossItems = [];
      }
      
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
        message: `Victory! You defeated ${bossName}!`,
        updatedMoney: user.money,
        updatedXp: user.xp,
        updatedRank: user.rank,
        updatedLevel: user.level,
        updatedBossItems: user.bossItems,
        loot: loot,
        xpGained,
        moneyGained,
        bulletsCost,
        battleLog,
        playerHealth,
        bossHealth: Math.floor((bossHealth / bossData.health) * 100) // Convert to percentage
      });
    } else {
      // Boss fight failed
      // Apply money penalty
      const moneyLost = Math.floor(user.money * bossData.moneyPenalty);
      user.money = Math.max(0, user.money - moneyLost);
      
      await user.save();
      
      return res.status(200).json({
        success: false,
        message: `You were brutally defeated by ${bossName}!`,
        updatedMoney: user.money,
        moneyLost,
        bulletsCost,
        battleLog,
        playerHealth,
        bossHealth: Math.floor((bossHealth / bossData.health) * 100), // Convert to percentage
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
    
    // Initialize bossItems if it doesn't exist
    if (!user.bossItems) {
      user.bossItems = [];
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

module.exports = exports;