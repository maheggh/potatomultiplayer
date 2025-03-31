const User = require('../models/User');
const { getRankForXp } = require('../utils/rankCalculator');
const { startJailSentence } = require('./jailController');

const venues = {
  'Rich Potato Neighborhood': {
    cars: [
      { name: 'Luxury Spud Sedan', price: 120000, baseChance: 5, image: '/assets/luxury-spud-sedan.png' },
      { name: 'Sporty Tater Coupe', price: 40000, baseChance: 8, image: '/assets/sporty-tater-coupe.png' },
      { name: 'Potato Convertible', price: 30000, baseChance: 10, image: '/assets/potato-convertible.png' },
      { name: 'SUV Spud', price: 2000, baseChance: 20, image: '/assets/suv-spud.png' },
    ],
    baseStealChance: 5,
  },
  'Spudville Downtown': {
    cars: [
      { name: 'Hatchback Tuber', price: 1500, baseChance: 20, image: '/assets/hatchback-tuber.png' },
      { name: 'Sedan Yam', price: 20000, baseChance: 10, image: '/assets/sedan-yam.png' },
      { name: 'SUV Tater', price: 25000, baseChance: 8, image: '/assets/suv-tater.png' },
      { name: 'Spudnik Sports', price: 90000, baseChance: 4, image: '/assets/spudnik-sports.png' },
    ],
    baseStealChance: 10,
  },
  'Fries End Suburbs': {
    cars: [
      { name: 'Compact Fry', price: 10000, baseChance: 25, image: '/assets/compact-fry.png' },
      { name: 'Curly Coupe', price: 15000, baseChance: 20, image: '/assets/curly-coupe.png' },
      { name: 'Wedge Wagon', price: 20000, baseChance: 15, image: '/assets/wedge-wagon.png' },
      { name: 'Crispy Convertible', price: 110000, baseChance: 5, image: '/assets/crispy-convertible.png' },
    ],
    baseStealChance: 15,
  },
  'Mashy Meadows': {
    cars: [
      { name: 'Mashed Mini', price: 500, baseChance: 30, image: '/assets/mashed-mini.png' },
      { name: 'Buttery Buggy', price: 8000, baseChance: 20, image: '/assets/buttery-buggy.png' },
      { name: 'Gravy Sedan', price: 12000, baseChance: 15, image: '/assets/gravy-sedan.png' },
      { name: 'Peeler Pickup', price: 18000, baseChance: 5, image: '/assets/peeler-pickup.png' },
    ],
    baseStealChance: 20,
  },
  'Tuber Town': {
    cars: [
      { name: 'Root Roadster', price: 7000, baseChance: 30, image: '/assets/root-roadster.png' },
      { name: 'Bulb Buggy', price: 10000, baseChance: 25, image: '/assets/bulb-buggy.png' },
      { name: 'Starch Sedan', price: 15000, baseChance: 15, image: '/assets/starch-sedan.png' },
      { name: 'Tuber Truck', price: 60000, baseChance: 5, image: '/assets/tuber-truck.png' },
    ],
    baseStealChance: 25,
  },
};

const getRandomCar = (cars) => {
  let totalChance = cars.reduce((sum, car) => sum + car.baseChance, 0);
  let randomNum = Math.random() * totalChance;

  for (let car of cars) {
    if (randomNum < car.baseChance) {
      return car;
    }
    randomNum -= car.baseChance;
  }
  return cars[cars.length - 1];
};

exports.stealCar = async (req, res) => {
  const { venueName } = req.body;

  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.inJail) {
      return res.status(400).json({ success: false, message: 'You cannot steal cars while in jail!' });
    }

    const venue = venues[venueName];
    if (!venue) {
      return res.status(400).json({ success: false, message: 'Invalid venue' });
    }

    const stealChance = Math.min(venue.baseStealChance + (user.level || 1) * 2, 90); // Added default for level
    const stealRoll = Math.random() * 100;

    if (stealRoll <= stealChance) {
      const car = getRandomCar(venue.cars);
      user.cars.push(car);

      const xpGained = 200;
      user.xp += xpGained;
      const rankInfo = getRankForXp(user.xp);
      user.rank = rankInfo.currentRank;

      await user.save();

      res.status(200).json({
        success: true,
        message: `You successfully stole a ${car.name}!`,
        car: car,
        xp: user.xp,
        rank: user.rank,
      });
    } else {
      const jailDuration = 30; // Jail time in seconds
      await startJailSentence(user, jailDuration); // Use the helper function

      res.status(400).json({ // Use 400 for failed action leading to jail
        success: false,
        message: 'You got caught and sent to jail!',
        inJail: true,
        jailTimeEnd: user.jailTimeEnd, // Send the end time
      });
    }
  } catch (error) {
    console.error('Error during car theft:', error);
    res.status(500).json({ success: false, message: 'Failed to steal car', error: error.message });
  }
};

exports.sellCar = async (req, res) => {
  const { carIndex } = req.body;

  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (carIndex < 0 || carIndex >= user.cars.length) {
      return res.status(400).json({ success: false, message: 'Invalid car index' });
    }

    const car = user.cars[carIndex];
    user.money += car.price;
    user.cars.splice(carIndex, 1);

    await user.save();

    res.status(200).json({
      success: true,
      message: `You sold ${car.name} for $${car.price}`,
      money: user.money,
      cars: user.cars, // Return updated car list
    });
  } catch (error) {
    console.error('Error selling car:', error);
    res.status(500).json({ success: false, message: 'Failed to sell car', error: error.message });
  }
};