// controllers/assassinationController.js
const User = require('../models/User');

// Cooldown durations in seconds
const COOLDOWNS = {
  STANDARD: 60, // 1 minute
  SUCCESS: 120,  // Success: 2 minutes (increased from 30 seconds)
  FAILURE: 180,  // Failure: 3 minutes (increased from 1.5 minutes)
  RETALIATION: 300 // Player gets hurt: 5 minutes (increased from 2 minutes)
};

// Get assassination targets
exports.getTargets = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get the current user's level
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const currentLevel = currentUser.level || 1;
    
    // Find targets within a reasonable level range: lower bound 1, upper bound currentLevel + 5
    // Order by recent activity to prioritize active players
    const targets = await User.find({
      _id: { $ne: userId },
      isAlive: true,
      level: { $gte: 1, $lte: currentLevel + 5 }
    })
    .select('username level rank lastActive')
    .sort({ lastActive: -1 })
    .limit(10);
    
    return res.status(200).json({
      success: true,
      targets
    });
  } catch (error) {
    console.error('Error getting assassination targets:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error getting assassination targets'
    });
  }
};

// Check cooldown status
exports.checkCooldown = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check assassination cooldown
    if (user.assassinationCooldownEnd && new Date() < new Date(user.assassinationCooldownEnd)) {
      const remainingTime = Math.ceil((new Date(user.assassinationCooldownEnd) - new Date()) / 1000);
      return res.status(200).json({
        success: true,
        onCooldown: true,
        cooldownRemaining: remainingTime,
        cooldownEnd: user.assassinationCooldownEnd
      });
    } else {
      // Clear the cooldown if it's expired
      if (user.assassinationCooldownEnd) {
        user.assassinationCooldownEnd = null;
        await user.save();
      }
      
      return res.status(200).json({
        success: true,
        onCooldown: false
      });
    }
  } catch (error) {
    console.error('Error checking assassination cooldown:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error checking cooldown status'
    });
  }
};

// Attempt assassination
exports.attemptAssassination = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { targetId, weaponName, bossItemName, bulletsUsed } = req.body;
    
    // Validation
    if (!targetId || !weaponName) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: targetId, weaponName'
      });
    }
    
    // Parse bullets to ensure it's a valid number
    const bullets = parseInt(bulletsUsed, 10) || 1;
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
    
    // Check if user is alive
    if (!user.isAlive) {
      return res.status(400).json({
        success: false,
        message: 'You are dead and cannot perform assassinations'
      });
    }
    
    // Check cooldown
    if (user.assassinationCooldownEnd && new Date() < new Date(user.assassinationCooldownEnd)) {
      const remainingTime = Math.ceil((new Date(user.assassinationCooldownEnd) - new Date()) / 1000);
      return res.status(400).json({
        success: false,
        message: `Assassination is on cooldown for ${remainingTime} more seconds`,
        cooldownRemaining: remainingTime
      });
    }
    
    // Get target data
    const target = await User.findById(targetId);
    if (!target) {
      return res.status(404).json({
        success: false,
        message: 'Target not found'
      });
    }
    
    // Check if target is alive
    if (!target.isAlive) {
      return res.status(400).json({
        success: false,
        message: 'Target is already dead'
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
    
    // Check boss item if provided
    let bossItem = null;
    if (bossItemName) {
      const itemIndex = user.bossItems.findIndex(item => item.name === bossItemName);
      if (itemIndex >= 0 && user.bossItems[itemIndex].quantity > 0) {
        bossItem = user.bossItems[itemIndex];
      }
    }
    
    // Calculate bullet cost (unless free bullets from boss item)
    const freeBullets = bossItem?.effects?.freeBullets || 
                       (bossItemName === 'Golden Spatula') || 
                       false;
    const bulletCost = freeBullets ? 0 : bullets * 100;
    
    // Check if user has enough money
    if (user.money < bulletCost) {
      return res.status(400).json({
        success: false,
        message: `Not enough money for ${bullets} bullets (cost: $${bulletCost})`
      });
    }
    
    // Calculate base success chance - IMPROVED FORMULA
    // Start with weapon accuracy (as a percentage of 1)
    let baseAccuracy = weapon.attributes.accuracy / 100;
    
    // Apply diminishing returns formula for bullets
    // First 10 bullets have high impact, then diminishing returns
    let bulletBonus = 0;
    if (bullets <= 10) {
      // Linear bonus for first 10 bullets (each bullet adds 3% up to 30%)
      bulletBonus = (bullets * 0.03);
    } else {
      // Base 30% from first 10 bullets
      // Additional bullets follow logarithmic scaling: ln(bullets - 9) * factor
      // This ensures meaningful but diminishing returns
      bulletBonus = 0.3 + (Math.log(bullets - 9) * 0.05);
    }
    
    // Cap bullet bonus at 60% (prevents trivial wins with massive bullet counts)
    bulletBonus = Math.min(0.6, bulletBonus);
    
    // Apply target difficulty based on level difference
    const levelDifference = target.level - user.level;
    
    // Make higher level targets MUCH harder (increased difficulty)
    let targetDifficulty = 1;
    if (levelDifference > 0) {
      // Each level above now gives 15% penalty (was 10%)
      targetDifficulty = 1 + (levelDifference * 0.15);
    } else if (levelDifference < 0) {
      // Each level below gives 5% bonus (unchanged)
      targetDifficulty = Math.max(0.5, 1 + (levelDifference * 0.05));
    }
    
    // Calculate success chance including bulletBonus
    // This formula ensures bulletBonus has a significant effect
    let successChance = (baseAccuracy + bulletBonus) / targetDifficulty;
    
    // Apply boss item effects
    if (bossItem) {
      let successChanceBonus = 0;
      
      // Map boss item benefits based on name
      if (bossItemName === 'Presidential Medal') successChanceBonus = 0.05;
      else if (bossItemName === "Dragon's Hoard") successChanceBonus = 0.10;
      else if (bossItemName === 'Mafia Ring') successChanceBonus = 0.15;
      else if (bossItemName === 'Golden Spatula') successChanceBonus = 0.20;
      else if (bossItemName === 'Star Dust') successChanceBonus = 0.25;
      else if (bossItem.effects?.successChanceBonus) {
        successChanceBonus = bossItem.effects.successChanceBonus / 100;
      }
      
      // Add boss item bonus
      successChance += successChanceBonus;
    }
    
    // Randomness factor: Add/subtract up to 5% to make it a bit unpredictable
    const randomnessFactor = (Math.random() * 0.1) - 0.05;
    successChance += randomnessFactor;
    
    // Cap success chance between 5% and 85% (lowered max from 95% to make it harder)
    successChance = Math.min(0.85, Math.max(0.05, successChance));
    
    // Deduct bullet cost
    user.money -= bulletCost;
    
    // Update assassination stats
    user.stats = user.stats || {};
    user.stats.assassinationsAttempted = (user.stats.assassinationsAttempted || 0) + 1;
    
    // Determine hit success
    const rollSuccess = Math.random();
    const isSuccessful = rollSuccess < successChance;
    
    // Set appropriate cooldown
    let cooldownDuration;
    
    // Use boss item if provided, then remove it
    if (bossItem) {
      const itemIndex = user.bossItems.findIndex(item => item.name === bossItemName);
      user.bossItems[itemIndex].quantity -= 1;
      
      // Remove item if quantity reaches 0
      if (user.bossItems[itemIndex].quantity <= 0) {
        user.bossItems.splice(itemIndex, 1);
      }
    }
    
    if (isSuccessful) {
      // Target is killed
      target.isAlive = false;
      await target.save();
      
      // Update assassination stats
      user.stats.assassinationsSuccessful = (user.stats.assassinationsSuccessful || 0) + 1;
      
      // Calculate loot and rewards
      const targetValue = target.level * 1000 + target.money * 0.25; // Base value depends on level
      
      // Calculate loot (25-30% of target's value)
      const lootPercentage = 0.25 + (Math.random() * 0.05);
      const baseLoot = Math.floor(targetValue * lootPercentage);
      
      // Apply loot multiplier from boss item if any
      const lootMultiplier = bossItem?.effects?.lootMultiplier || 
                            (bossItemName === "Dragon's Hoard" ? 1.5 : 1);
      const lootMoney = Math.floor(baseLoot * lootMultiplier);
      
      // Calculate XP gain - Scale with target level and difficulty
      let xpGain = 100 + (target.level * 25); // Increased XP per level
      
      // Add XP bonus for taking down higher level targets
      if (levelDifference > 0) {
        // Bonus XP for killing higher level targets
        xpGain += levelDifference * 50;
      }
      
      // Apply XP multiplier from boss item if any
      const xpMultiplier = bossItem?.effects?.xpGainMultiplier || 
                          (bossItemName === 'Presidential Medal' ? 1.5 : 
                           bossItemName === 'Star Dust' ? 1.25 : 1);
      
      const flatXpBonus = bossItem?.effects?.flatXpBonus || 
                         (bossItemName === "Pirate's Compass" ? 300 : 0);
                         
      const totalXpGain = Math.floor((xpGain * xpMultiplier) + flatXpBonus);
      
      // Update user progress
      user.kills = (user.kills || 0) + 1;
      user.xp += totalXpGain;
      user.money += lootMoney;
      
      // Check for level up
      const newLevel = Math.floor(user.xp / 100) + 1;
      if (newLevel > user.level) {
        user.level = newLevel;
      }
      
      // Set cooldown for success
      cooldownDuration = COOLDOWNS.SUCCESS;
      user.assassinationCooldownEnd = new Date(Date.now() + (cooldownDuration * 1000));
      
      await user.save();
      
      return res.status(200).json({
        success: true,
        message: `Successfully assassinated ${target.username}!`,
        updatedMoney: user.money,
        updatedKills: user.kills,
        updatedXp: user.xp,
        updatedRank: user.rank,
        updatedLevel: user.level,
        updatedInventory: user.inventory,
        updatedBossItems: user.bossItems,
        lootMoney,
        xpGained: totalXpGain,
        cooldownDuration,
        cooldownEnd: user.assassinationCooldownEnd
      });
    } else {
      // Failed assassination attempt
      
      // Determine if there's retaliation from target
      let userDied = false;
      
      // Base retaliation chance is significantly higher (50% → 60%)
      let retaliationChance = 0.6;
      
      // Apply retaliation reduction from boss item if any
      const retaliationReduction = bossItem?.effects?.retaliationReduction || 
                                  (bossItemName === 'Mafia Ring' ? 0.1 : 0);
                                  
      // Check if the boss item prevents retaliation entirely
      const preventRetaliation = bossItem?.effects?.preventRetaliation || 
                               (bossItemName === 'Invisible Cloak' || bossItemName === "Sheriff's Badge");
      
      if (preventRetaliation) {
        retaliationChance = 0;
      } else {
        retaliationChance -= retaliationReduction;
        
        // Increase retaliation chance based on target level difference
        // Higher level targets are more likely to retaliate
        if (levelDifference > 0) {
          retaliationChance += levelDifference * 0.07; // Increased from 0.05
        }
        
        // Targets are more likely to retaliate when more bullets are used
        // (they hear the commotion!)
        if (bullets > 10) {
          retaliationChance += Math.min(0.1, (bullets - 10) * 0.001); // Up to 10% more
        }
      }
      
      // Cap between 0% and 85% (higher than before)
      retaliationChance = Math.min(0.85, Math.max(0, retaliationChance));
      
      // Roll for retaliation
      const rollRetaliation = Math.random();
      const isRetaliation = rollRetaliation < retaliationChance;
      
      if (isRetaliation) {
        // Target retaliates - user gets killed
        user.isAlive = false;
        userDied = true;
        user.stats.retaliationsReceived = (user.stats.retaliationsReceived || 0) + 1;
        
        // Set longer cooldown due to death
        cooldownDuration = COOLDOWNS.RETALIATION;
      } else {
        // No retaliation, but still failure
        cooldownDuration = COOLDOWNS.FAILURE;
      }
      
      // Set cooldown
      user.assassinationCooldownEnd = new Date(Date.now() + (cooldownDuration * 1000));
      
      await user.save();
      
      return res.status(200).json({
        success: false,
        message: userDied ? 
          `Your assassination attempt on ${target.username} failed and they killed you in retaliation!` : 
          `Failed to assassinate ${target.username}. They spotted you and got away.`,
        userDied,
        updatedMoney: user.money,
        updatedBossItems: user.bossItems,
        cooldownDuration,
        cooldownEnd: user.assassinationCooldownEnd
      });
    }
  } catch (error) {
    console.error('Error during assassination attempt:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during assassination attempt'
    });
  }
};