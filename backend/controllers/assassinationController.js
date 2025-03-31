// backend/controllers/assassinationController.js
const User = require('../models/User');
const { getRankForXp } = require('../utils/rankCalculator'); // Removed unused xpThresholds

// Helper function to calculate success chance
const calculateSuccessChance = (attacker, target, weapon, bossItem, bulletsUsed) => {
    if (!weapon || !weapon.attributes || typeof weapon.attributes.accuracy !== 'number') return 0;

    // Base chance: More bullets increase chance relative to accuracy
    // Adjust this formula based on desired game balance. Higher accuracy = more effective bullets.
    let baseChance = (weapon.attributes.accuracy / 100) * Math.sqrt(bulletsUsed); // Example: sqrt scaling for bullets

    // Target level difference impact (example: harder to hit higher levels)
    const levelDiff = (target.level || 1) - (attacker.level || 1);
    baseChance *= Math.max(0.1, 1 - levelDiff * 0.05); // Reduce chance by 5% per level difference (capped)

    // Apply boss item buffs
    if (bossItem) {
        switch (bossItem.name) {
            case 'Mafia Ring': baseChance += 0.15; break; // Flat bonus
            case "Dragon's Hoard": baseChance += 0.10; break; // Smaller flat bonus?
            case 'Golden Spatula': baseChance += 0.20; break; // Significant bonus
            case 'Star Dust': baseChance += 0.25; break; // Accuracy boost
            case 'Presidential Medal': baseChance += 0.05; break; // Small bonus
            // 'Invisible Cloak' affects retaliation, not success chance
            // 'Pirate\'s Compass' affects XP, not success chance
            // 'Sheriff\'s Badge' affects retaliation, not success chance
        }
    }
    // Clamp chance between 5% and 95% (adjust min/max as needed)
    return Math.max(0.05, Math.min(baseChance, 0.95));
};

// Helper function to calculate XP reward
const calculateXpReward = (attacker, target, bossItem) => {
    // Base XP based on target level/rank/xp? Example using level:
    let baseXp = (target.level || 1) * 50 + (target.xp || 0) * 0.01; // Mix of level and XP

    if (bossItem) {
        switch (bossItem.name) {
            case 'Presidential Medal': baseXp *= 1.5; break; // 50% XP Bonus
            case 'Pirate\'s Compass': baseXp += 300; break; // Flat XP bonus
            case 'Star Dust': baseXp *= 1.25; break; // 25% XP Bonus
        }
    }
    // Ensure XP is reasonable, maybe cap it or ensure it's positive
    return Math.max(10, Math.floor(baseXp));
};

// Helper function to calculate retaliation chance
const calculateRetaliationChance = (attacker, target, bossItem) => {
    // Base chance for target to retaliate if assassination fails
    let retaliationChance = 0.30; // 30% base chance

    // Higher level target is more likely to retaliate?
    const levelDiff = (target.level || 1) - (attacker.level || 1);
    retaliationChance += levelDiff * 0.02; // Increase by 2% per level difference

    // Apply boss item effects
    if (bossItem) {
        switch (bossItem.name) {
            case 'Mafia Ring': retaliationChance -= 0.10; break; // Reduces chance
            case 'Sheriff\'s Badge': retaliationChance = 0; break; // Prevents retaliation completely
            case 'Invisible Cloak': retaliationChance = 0; break; // Prevents retaliation
        }
    }
    // Clamp chance (e.g., min 5%, max 75%)
    return Math.max(0.05, Math.min(retaliationChance, 0.75));
};

// Helper function to transfer assets (modifies target in place, returns loot info)
const transferAssets = (attacker, target, lootMultiplier = 1) => {
     const loot = { money: 0, cars: [], inventory: [] };

     loot.money = Math.floor((target.money || 0) * lootMultiplier);
     attacker.money += loot.money;
     target.money = 0; // Target loses all money

     // Transfer cars (simple transfer for now)
     if (target.cars && target.cars.length > 0) {
         loot.cars = [...target.cars]; // Copy cars to loot info
         attacker.cars = (attacker.cars || []).concat(target.cars);
         target.cars = [];
     }

     // Transfer inventory (simple transfer for now)
     if (target.inventory && target.inventory.length > 0) {
         loot.inventory = [...target.inventory]; // Copy inventory to loot info
         attacker.inventory = (attacker.inventory || []).concat(target.inventory);
         target.inventory = [];
     }

     // Target is marked as dead
     target.isAlive = false;
     target.xp = Math.floor(target.xp * 0.5); // Lose some XP on death? Optional penalty.
     target.rank = getRankForXp(target.xp).currentRank; // Update rank after XP loss

     return loot; // Return what was looted for the response message
};

exports.attemptAssassination = async (req, res, next) => { // Added next
  try {
    const attackerId = req.user.userId;
    const { targetId, weaponName, bossItemName, bulletsUsed } = req.body; // Removed lootPercentage, calculate based on item

    const bulletCostPerShot = 100;
    const requestedBullets = parseInt(bulletsUsed, 10) || 1;
    if (requestedBullets < 1 || requestedBullets > 10000) {
         return res.status(400).json({ success: false, message: 'Invalid number of bullets (1-10000).' });
    }
    const totalBulletCost = bulletCostPerShot * requestedBullets;

    // Fetch attacker and target simultaneously
    const [attacker, target] = await Promise.all([
        User.findById(attackerId),
        User.findById(targetId)
    ]);

    // --- Input Validations ---
    if (!attacker || !target) return res.status(404).json({ success: false, message: 'Attacker or Target not found.' });
    if (attackerId === targetId) return res.status(400).json({ success: false, message: 'Cannot attack yourself.' });
    if (!attacker.isAlive) return res.status(400).json({ success: false, message: 'You are dead.' });
    if (!target.isAlive) return res.status(400).json({ success: false, message: 'Target is already dead.' });

    // Find weapon in inventory
    const weapon = attacker.inventory.find(item => item.name === weaponName);
    if (!weapon || !weapon.attributes?.accuracy) return res.status(400).json({ success: false, message: 'Selected weapon not found or invalid.' });

    // Find boss item and check quantity
    let bossItem = null;
    let bossItemIndex = -1;
     if (bossItemName) {
        bossItemIndex = attacker.bossItems.findIndex(item => item.name === bossItemName);
        if (bossItemIndex > -1) {
            bossItem = attacker.bossItems[bossItemIndex];
            // Ensure quantity > 0 if tracking quantity matters, for now assume 1 use consumes it
        } else {
             // Optional: return error if named item not found, or just proceed without it
             // return res.status(400).json({ success: false, message: 'Selected boss item not found.' });
             console.warn(`Boss item ${bossItemName} selected but not found for user ${attackerId}`);
        }
     }

    // Calculate actual bullet cost based on boss item
    let actualBulletCost = totalBulletCost;
    if (bossItem && bossItem.name === 'Golden Spatula') {
      actualBulletCost = 0;
    }

    // Check funds AFTER potential discount
    if (attacker.money < actualBulletCost) {
      return res.status(400).json({ success: false, message: `Not enough money for bullets ($${actualBulletCost.toLocaleString()} needed).` });
    }

    // Deduct bullet cost immediately
    attacker.money -= actualBulletCost;

    // Calculate success chance
    const successChance = calculateSuccessChance(attacker, target, weapon, bossItem, requestedBullets);

    // Set last attempt time
    attacker.lastAssassinationAttempt = new Date();

    // Determine outcome
    if (Math.random() < successChance) {
      // --- SUCCESS ---
      attacker.kills = (attacker.kills || 0) + 1;

      // Determine loot multiplier from boss item
      const lootMultiplier = (bossItem && bossItem.name === "Dragon's Hoard") ? 1.5 : 1; // Example: 50% bonus loot

      // Transfer assets and mark target as dead
      const actualLoot = transferAssets(attacker, target, lootMultiplier); // Modifies attacker and target

      const xpGained = calculateXpReward(attacker, target, bossItem); // Calculate XP based on target and potentially item
      attacker.xp += xpGained;
      attacker.rank = getRankForXp(attacker.xp).currentRank; // Update rank

      // Consume the boss item if one was used and found
      if (bossItem && bossItemIndex > -1) {
           // Simple consumption: remove it entirely. Could also decrease quantity.
           attacker.bossItems.splice(bossItemIndex, 1);
           // Mark modified if using Mongoose < 5 pathways for arrays sometimes needed
           // attacker.markModified('bossItems');
      }

      // Save both users
      await Promise.all([attacker.save(), target.save()]);

      res.status(200).json({
        success: true,
        message: `Success! You assassinated ${target.username} and gained ${xpGained} XP.`,
        lootMoney: actualLoot.money,
        // Avoid sending full car/inventory arrays in response unless necessary
        // lootCarsCount: actualLoot.cars.length,
        // lootInventoryCount: actualLoot.inventory.length,
        updatedKills: attacker.kills,
        xpGained: xpGained,
        actualBulletCost: actualBulletCost,
        // Send back updated inventory/boss items if frontend needs it explicitly
        // updatedInventory: attacker.inventory,
        // updatedBossItems: attacker.bossItems
      });

    } else {
      // --- FAILURE ---
      const retaliationChance = calculateRetaliationChance(attacker, target, bossItem);
      let userDied = false;

      if (Math.random() < retaliationChance) {
        // Target retaliates successfully
        attacker.isAlive = false;
        userDied = true;
        // Optional: Lose money/items on death?
        attacker.money = Math.floor(attacker.money * 0.5); // Lose 50% money on death example
      }

      // Consume the boss item even on failure if one was used and found
       if (bossItem && bossItemIndex > -1) {
           attacker.bossItems.splice(bossItemIndex, 1);
           // attacker.markModified('bossItems');
       }

      // Save attacker state (money deducted, potentially dead, item consumed, last attempt updated)
      await attacker.save();

      res.status(200).json({ // Send 200 OK even for failure, but success: false
        success: false,
        message: userDied
            ? `Failed! ${target.username} fought back and killed you!`
            : `Failed! Your assassination attempt on ${target.username} was unsuccessful.`,
        userDied: userDied,
        actualBulletCost: actualBulletCost, // Inform user of cost
         // updatedBossItems: attacker.bossItems // Send updated list if item was consumed
      });
    }
  } catch (error) {
    next(error); // Pass to global error handler
  }
};