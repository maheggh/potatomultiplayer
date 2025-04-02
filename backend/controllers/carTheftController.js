const User = require('../models/User');
const { getRankForXp } = require('../utils/rankCalculator');
const { startJailSentence } = require('./jailController');

// venues structure remains the same as previous version
const venues = {
  'Rich Potato Neighborhood': {
    baseStealChance: 10, xpRewardBase: 50, jailDurationBase: 90, // BASE jail duration
    cars: [ /* ... car items ... */
        { name: 'Luxury Spud Sedan', price: 120000, rarityChance: 10, image: '/assets/luxury-spud-sedan.png' },
        { name: 'Sporty Tater Coupe', price: 90000, rarityChance: 20, image: '/assets/sporty-tater-coupe.png' },
        { name: 'Potato Convertible', price: 75000, rarityChance: 30, image: '/assets/potato-convertible.png' },
        { name: 'SUV Spud', price: 40000, rarityChance: 40, image: '/assets/suv-spud.png' },
    ]
  },
  'Spudville Downtown': {
    baseStealChance: 20, xpRewardBase: 35, jailDurationBase: 60,
    cars: [ /* ... car items ... */
        { name: 'Sedan Yam', price: 50000, rarityChance: 25, image: '/assets/sedan-yam.png' },
        { name: 'SUV Tater', price: 55000, rarityChance: 25, image: '/assets/suv-tater.png' },
        { name: 'Hatchback Tuber', price: 30000, rarityChance: 30, image: '/assets/hatchback-tuber.png' },
        { name: 'Spudnik Sports', price: 110000, rarityChance: 20, image: '/assets/spudnik-sports.png' },
    ]
  },
  'Fries End Suburbs': {
    baseStealChance: 25, xpRewardBase: 25, jailDurationBase: 45,
    cars: [ /* ... car items ... */
        { name: 'Compact Fry', price: 18000, rarityChance: 30, image: '/assets/compact-fry.png' },
        { name: 'Curly Coupe', price: 25000, rarityChance: 30, image: '/assets/curly-coupe.png' },
        { name: 'Wedge Wagon', price: 30000, rarityChance: 25, image: '/assets/wedge-wagon.png' },
        { name: 'Crispy Convertible', price: 60000, rarityChance: 15, image: '/assets/crispy-convertible.png' },
    ]
  },
  'Mashy Meadows': {
    baseStealChance: 35, xpRewardBase: 15, jailDurationBase: 30,
    cars: [ /* ... car items ... */
        { name: 'Mashed Mini', price: 8000, rarityChance: 35, image: '/assets/mashed-mini.png' },
        { name: 'Buttery Buggy', price: 12000, rarityChance: 30, image: '/assets/buttery-buggy.png' },
        { name: 'Gravy Sedan', price: 15000, rarityChance: 25, image: '/assets/gravy-sedan.png' },
        { name: 'Peeler Pickup', price: 22000, rarityChance: 10, image: '/assets/peeler-pickup.png' },
    ]
  },
  'Tuber Town': {
    baseStealChance: 40, xpRewardBase: 10, jailDurationBase: 20, // Shortest base duration
    cars: [ /* ... car items ... */
        { name: 'Root Roadster', price: 10000, rarityChance: 35, image: '/assets/root-roadster.png' },
        { name: 'Bulb Buggy', price: 13000, rarityChance: 30, image: '/assets/bulb-buggy.png' },
        { name: 'Starch Sedan', price: 16000, rarityChance: 25, image: '/assets/starch-sedan.png' },
        { name: 'Tuber Truck', price: 25000, rarityChance: 10, image: '/assets/tuber-truck.png' },
    ]
  },
};

// getRandomCar helper remains the same
const getRandomCar = (cars) => {
    if (!cars || cars.length === 0) return null;
    let totalChance = cars.reduce((sum, car) => sum + (car.rarityChance || 0), 0);
    if (totalChance <= 0) return { ...cars[0] }; // Return copy
    let randomNum = Math.random() * totalChance;
    for (let car of cars) {
        if (randomNum < (car.rarityChance || 0)) { return { ...car }; } // Return copy
        randomNum -= (car.rarityChance || 0);
    }
    return { ...cars[cars.length - 1] }; // Return copy
};

exports.stealCar = async (req, res) => {
  const { venueName } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user.inJail && user.jailTimeEnd && new Date() < new Date(user.jailTimeEnd)) {
      return res.status(400).json({ success: false, message: 'You cannot steal cars while in jail!', inJail: true, jailTimeEnd: user.jailTimeEnd });
    }

    const venue = venues[venueName];
    if (!venue) return res.status(400).json({ success: false, message: 'Invalid venue' });

    const userLevel = user.level || 1;
    const levelBonus = userLevel * 1.5;
    const calculatedChance = venue.baseStealChance + levelBonus;
    const finalStealChance = Math.max(5, Math.min(calculatedChance, 95));
    const stealRoll = Math.random() * 100;

    console.log(`User Level: ${userLevel}, Venue: ${venueName}, Base Chance: ${venue.baseStealChance}, Bonus: ${levelBonus.toFixed(1)}, Final Chance: ${finalStealChance.toFixed(1)}%, Roll: ${stealRoll.toFixed(1)}`);

    if (stealRoll <= finalStealChance) {
      // --- SUCCESS --- (Logic remains the same)
      const stolenCar = getRandomCar(venue.cars);
      if (!stolenCar) {
           console.error(`No car selected for venue ${venueName} despite successful roll.`);
           return res.status(200).json({ success: true, message: `You broke in, but couldn't find a car worth taking!`, xp: user.xp, rank: user.rank, car: null });
      }
      user.cars.push(stolenCar);
      const xpGained = Math.max(5, Math.floor(venue.xpRewardBase + (userLevel * 0.5)));
      user.xp += xpGained;
      const rankInfo = getRankForXp(user.xp);
      user.rank = rankInfo.currentRank;
      user.level = rankInfo.rankLevel;
      await user.save();
      return res.status(200).json({ success: true, message: `Success! You hotwired a ${stolenCar.name} and gained ${xpGained} XP!`, car: stolenCar, xp: user.xp, rank: user.rank });

    } else {
      // --- FAILURE ---
      // --- Calculate Scaled Jail Duration ---
      // Example: Base + 0.5 seconds per level, minimum 15 seconds
      const scaledJailDuration = Math.max(15, Math.floor(venue.jailDurationBase + (userLevel * 0.5))); // Use level multiplier

      // Call startJailSentence and CHECK the result
      const jailEndTime = await startJailSentence(user, scaledJailDuration);

      // --- Handle potential failure from startJailSentence ---
      if (!jailEndTime) {
          console.error(`Controller Error: Failed to set jail time for user ${userId} after failed car theft, startJailSentence returned null.`);
          return res.status(500).json({ success: false, message: 'Theft failed, and an error occurred while processing the jail sentence.' });
      }

      // --- If jail sentence was set successfully ---
      return res.status(400).json({
        success: false,
        message: `Busted! You failed the heist and got sent to jail for ${scaledJailDuration} seconds.`, // Use calculated duration
        inJail: true,
        jailTimeEnd: jailEndTime, // Use the returned end time
      });
    }
  } catch (error) {
    console.error(`Error during car theft for user ${userId}:`, error);
    return res.status(500).json({ success: false, message: 'An unexpected server error occurred during the theft attempt.' });
  }
};

// sellCar remains the same as previous version
exports.sellCar = async (req, res) => {
  const { carIndex } = req.body;
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.inJail && user.jailTimeEnd && new Date() < new Date(user.jailTimeEnd)) { return res.status(400).json({ success: false, message: 'Cannot sell cars from jail!' }); }
    if (!user.cars || carIndex < 0 || carIndex >= user.cars.length) { return res.status(400).json({ success: false, message: 'Invalid car index or no cars available' }); }
    const car = user.cars[carIndex];
    const sellPrice = car.price || 0;
    user.money = (user.money || 0) + sellPrice;
    user.cars.splice(carIndex, 1);
    await user.save();
    return res.status(200).json({ success: true, message: `You sold the ${car.name} for $${sellPrice.toLocaleString()}`, money: user.money, cars: user.cars });
  } catch (error) {
    console.error(`Error selling car for user ${userId}:`, error);
    return res.status(500).json({ success: false, message: 'An unexpected server error occurred while selling the car.' });
  }
};