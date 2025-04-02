const User = require('../models/User');
const { getRankForXp } = require('../utils/rankCalculator');

// --- Helper Functions ---

// Calculate Success Chance (incorporating level difference)
const calculateSuccessChance = (attacker, target, weapon, bossItem, bulletsUsed) => {
    if (!weapon || !weapon.attributes || typeof weapon.attributes.accuracy !== 'number') return 0;

    // Base chance: Weapon accuracy scaled by bullets (sqrt scaling - more bullets help, but diminishing returns)
    let baseChance = (weapon.attributes.accuracy / 100) * Math.sqrt(bulletsUsed);

    // Target level difference impact: Harder to hit significantly higher levels, easier to hit lower levels
    // Using attacker.level and target.level (make sure these exist or default to 1)
    const attackerLevel = attacker.level || 1;
    const targetLevel = target.level || 1;
    const levelDiff = targetLevel - attackerLevel;

    // Apply modifier: -3% chance per level target is higher, +2% chance per level attacker is higher (adjust %)
    let levelModifier = 1.0;
    if (levelDiff > 0) {
        levelModifier = Math.max(0.1, 1.0 - levelDiff * 0.03); // Cap minimum effect
    } else if (levelDiff < 0) {
        levelModifier = 1.0 - levelDiff * 0.02; // levelDiff is negative, so this increases chance
    }
    baseChance *= levelModifier;


    // Apply boss item buffs (additive bonuses often simpler to balance)
    if (bossItem) {
        switch (bossItem.name) {
            case 'Presidential Medal': baseChance += 0.05; break;
            case "Dragon's Hoard": baseChance += 0.10; break;
            case 'Mafia Ring': baseChance += 0.15; break;
            case 'Golden Spatula': baseChance += 0.20; break;
            case 'Star Dust': baseChance += 0.25; break;
            // Items affecting retaliation/XP/loot don't directly change base hit chance here
        }
    }

    // Clamp final chance (e.g., between 5% and 95%)
    return Math.max(0.05, Math.min(baseChance, 0.95));
};

// Calculate XP Reward
const calculateXpReward = (attacker, target, bossItem) => {
    const attackerLevel = attacker.level || 1;
    const targetLevel = target.level || 1;

    // Base XP: More XP for higher level targets, reduced if target is much lower level
    let baseXp = (targetLevel * 50) + (target.xp || 0) * 0.005; // Base on target level and small bit of their XP
    const levelDiffFactor = Math.max(0.1, 1.0 - (attackerLevel - targetLevel) * 0.05); // Reduce XP if attacker is much higher level
    baseXp *= levelDiffFactor;

    // Apply boss item XP buffs
    if (bossItem) {
        switch (bossItem.name) {
            case 'Presidential Medal': baseXp *= 1.50; break; // 50% bonus
            case 'Pirate\'s Compass': baseXp += 300; break;  // Flat bonus
            case 'Star Dust': baseXp *= 1.25; break; // 25% bonus
        }
    }

    return Math.max(10, Math.floor(baseXp)); // Ensure minimum XP
};

// Calculate Retaliation Chance
const calculateRetaliationChance = (attacker, target, bossItem) => {
    let retaliationChance = 0.30; // Base 30% chance

    const attackerLevel = attacker.level || 1;
    const targetLevel = target.level || 1;
    const levelDiff = targetLevel - attackerLevel;

    // Higher level target more likely to retaliate, lower level less likely
    retaliationChance += levelDiff * 0.02; // +/- 2% per level difference

    // Apply boss item effects
    if (bossItem) {
        switch (bossItem.name) {
            case 'Mafia Ring': retaliationChance -= 0.10; break; // Reduce chance
            case 'Sheriff\'s Badge': retaliationChance = 0; break; // Prevent retaliation
            case 'Invisible Cloak': retaliationChance = 0; break; // Prevent retaliation
        }
    }

    // Clamp chance (e.g., min 5%, max 80%)
    return Math.max(0.05, Math.min(retaliationChance, 0.80));
};

// Transfer Assets (modifies attacker and target IN PLACE)
const transferAssets = (attacker, target, lootMultiplier = 1) => {
     const loot = { money: 0 }; // We only really need to track money looted for the message

     // Loot Money
     const moneyToLoot = Math.floor((target.money || 0) * lootMultiplier);
     loot.money = moneyToLoot;
     attacker.money = (attacker.money || 0) + moneyToLoot;
     target.money = 0; // Target loses all money

     // Transfer Cars (simple transfer all)
     if (target.cars && target.cars.length > 0) {
         attacker.cars = (attacker.cars || []).concat(target.cars);
         target.cars = [];
     }

     // Transfer Inventory (simple transfer all)
     if (target.inventory && target.inventory.length > 0) {
         attacker.inventory = (attacker.inventory || []).concat(target.inventory);
         target.inventory = [];
     }

     // Mark target as dead and apply penalties (e.g., lose 50% XP)
     target.isAlive = false;
     target.xp = Math.floor((target.xp || 0) * 0.5);
     target.rank = getRankForXp(target.xp).currentRank; // Update rank based on new XP
     // Reset kills/deaths? Optional game rule
     // target.kills = 0;
     // target.deaths = (target.deaths || 0) + 1;

     return loot; // Return looted money amount
};


// --- Main Controller Function ---

exports.attemptAssassination = async (req, res, next) => {
  try {
    const attackerId = req.user.userId;
    const { targetId, weaponName, bossItemName, bulletsUsed } = req.body;

    const bulletCostPerShot = 100;
    const requestedBullets = parseInt(bulletsUsed, 10);

    if (isNaN(requestedBullets) || requestedBullets < 1 || requestedBullets > 10000) {
         return res.status(400).json({ success: false, message: 'Invalid number of bullets (1-10000).' });
    }

    // Fetch attacker and target simultaneously
    const [attacker, target] = await Promise.all([
        User.findById(attackerId).populate('inventory').populate('cars').populate('bossItems'), // Populate if needed, or rely on full doc fetch
        User.findById(targetId).populate('inventory').populate('cars').populate('bossItems')
    ]);

    // --- Validations ---
    if (!attacker) return res.status(404).json({ success: false, message: 'Attacker not found.' });
    if (!target) return res.status(404).json({ success: false, message: 'Target not found.' });
    if (attackerId === targetId) return res.status(400).json({ success: false, message: 'Cannot attack yourself.' });
    if (!attacker.isAlive) return res.status(400).json({ success: false, message: 'You are dead.' });
    if (!target.isAlive) return res.status(400).json({ success: false, message: 'Target is already dead.' });

    // Find weapon
    const weapon = attacker.inventory.find(item => item.name === weaponName);
    if (!weapon || !weapon.attributes?.accuracy) return res.status(400).json({ success: false, message: 'Selected weapon not found or invalid.' });

    // Find boss item and its index (if used)
    let bossItem = null;
    let bossItemIndex = -1;
     if (bossItemName) {
        bossItemIndex = attacker.bossItems.findIndex(item => item.name === bossItemName && (item.quantity || 0) > 0); // Check quantity too if relevant
        if (bossItemIndex > -1) {
            bossItem = attacker.bossItems[bossItemIndex];
        } else {
             console.warn(`Boss item ${bossItemName} selected but not found or quantity 0 for user ${attackerId}`);
             // Proceed without item, or return error:
             // return res.status(400).json({ success: false, message: `Selected boss item '${bossItemName}' not found or you have none left.` });
        }
     }

    // Calculate bullet cost (potentially modified by item)
    let actualBulletCost = bulletCostPerShot * requestedBullets;
    if (bossItem && bossItem.name === 'Golden Spatula') {
      actualBulletCost = 0; // Free bullets
    }

    // Check funds AFTER potential discount
    if (attacker.money < actualBulletCost) {
      return res.status(400).json({ success: false, message: `Not enough money for bullets ($${actualBulletCost.toLocaleString()} needed).` });
    }

    // Deduct bullet cost immediately
    attacker.money -= actualBulletCost;

    // Set cooldown timestamp
    attacker.lastAssassinationAttempt = new Date();

    // Calculate success chance using the helper
    const successChance = calculateSuccessChance(attacker, target, weapon, bossItem, requestedBullets);
    const didSucceed = Math.random() < successChance;

    // --- Handle Outcome ---
    if (didSucceed) {
      // --- SUCCESS ---
      attacker.kills = (attacker.kills || 0) + 1;

      // Determine loot multiplier from boss item
      const lootMultiplier = (bossItem && bossItem.name === "Dragon's Hoard") ? 1.5 : 1.0; // 50% bonus loot

      // Transfer assets (modifies attacker and target objects)
      const actualLoot = transferAssets(attacker, target, lootMultiplier);

      // Calculate XP reward
      const xpGained = calculateXpReward(attacker, target, bossItem);
      attacker.xp = (attacker.xp || 0) + xpGained;
      attacker.rank = getRankForXp(attacker.xp).currentRank; // Update rank

      // Consume boss item (decrease quantity or remove)
      if (bossItem && bossItemIndex > -1) {
           // Example: Decrease quantity if it exists, otherwise remove
           if (typeof attacker.bossItems[bossItemIndex].quantity === 'number' && attacker.bossItems[bossItemIndex].quantity > 1) {
                attacker.bossItems[bossItemIndex].quantity -= 1;
           } else {
                attacker.bossItems.splice(bossItemIndex, 1);
           }
           attacker.markModified('bossItems'); // Important for array modifications
      }

      // Save changes to both users
      await Promise.all([attacker.save(), target.save()]);

      // Send success response
      res.status(200).json({
        success: true,
        message: `Success! You assassinated ${target.username} and gained ${xpGained} XP.`,
        lootMoney: actualLoot.money, // Send looted amount
        updatedKills: attacker.kills,
        updatedXp: attacker.xp,
        updatedMoney: attacker.money,
        updatedRank: attacker.rank,
        updatedBossItems: attacker.bossItems, // Send updated list
        // updatedInventory: attacker.inventory, // Optionally send if needed
        actualBulletCost: actualBulletCost,
      });

    } else {
      // --- FAILURE ---
      const retaliationChance = calculateRetaliationChance(attacker, target, bossItem);
      let userDied = false;

      if (Math.random() < retaliationChance) {
        // Target retaliates successfully
        attacker.isAlive = false;
        attacker.deaths = (attacker.deaths || 0) + 1; // Track deaths
        userDied = true;
        // Apply death penalties (e.g., lose 50% current money)
        attacker.money = Math.floor(attacker.money * 0.5);
        // Reset kills streak? Optional.
        // attacker.killStreak = 0;
      }

      // Consume boss item even on failure
      if (bossItem && bossItemIndex > -1) {
           if (typeof attacker.bossItems[bossItemIndex].quantity === 'number' && attacker.bossItems[bossItemIndex].quantity > 1) {
                attacker.bossItems[bossItemIndex].quantity -= 1;
           } else {
                attacker.bossItems.splice(bossItemIndex, 1);
           }
           attacker.markModified('bossItems');
      }

      // Save attacker state (money deducted, maybe dead, item consumed, cooldown set)
      await attacker.save();

      // Send failure response
      res.status(200).json({ // Still 200 OK, but success: false
        success: false,
        message: userDied
            ? `Failed! ${target.username} fought back and killed you!`
            : `Failed! Your assassination attempt on ${target.username} was unsuccessful.`,
        userDied: userDied,
        updatedMoney: attacker.money, // Send updated money after cost/death penalty
        updatedBossItems: attacker.bossItems, // Send updated list if item was consumed
        actualBulletCost: actualBulletCost, // Inform user of cost
      });
    }
  } catch (error) {
    console.error('Error during assassination attempt:', error);
    // Pass error to the global error handler (if you have one set up in app.js/server.js)
    next(error);
    // Fallback response if no global handler
    // res.status(500).json({ success: false, message: 'Server error during assassination.' });
  }
};