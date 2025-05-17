// Updated backend/controllers/carTheftController.js for consistency with reduced jail times

const User = require('../models/User');
const JailServiceFactory = require('../services/jailServiceFactory');
const { getRankForXp } = require('../utils/rankCalculator');
const { allCars, carTheftVenues } = require('../data/cars');

// Get the singleton instance of JailService
const jailService = JailServiceFactory.getInstance();

/**
 * Attempt to steal a car
 */
exports.stealCar = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { venueName } = req.body;
    
    if (!venueName || !carTheftVenues[venueName]) {
      return res.status(400).json({ success: false, message: 'Invalid venue' });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if in jail
    const jailStatus = await jailService.getJailStatus(userId);
    if (jailStatus.inJail) {
      return res.status(403).json({
        success: false,
        message: 'You are in jail!',
        inJail: true,
        timeRemaining: jailStatus.timeRemaining,
        jailRecord: jailStatus.jailRecord
      });
    }
    
    // Get venue
    const venue = carTheftVenues[venueName];
    
    // Get available cars for this venue
    const venueCars = venue.cars.map(carName => 
      allCars.find(car => car.name === carName)
    ).filter(car => car !== undefined);
    
    if (venueCars.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'No cars available at this venue' 
      });
    }
    
    // Select a random car from this venue
    const randomIndex = Math.floor(Math.random() * venueCars.length);
    const car = venueCars[randomIndex];
    
    // Calculate success chance based on car's difficulty and player's level
    let successChance = car.baseChance;
    
    // Bonus from level (each level adds 1.5%)
    const levelBonus = (user.level || 1) * 1.5;
    successChance += levelBonus;
    
    // Cap at 5-95%
    successChance = Math.max(5, Math.min(successChance, 95));
    
    // Roll for success
    const roll = Math.random() * 100;
    const isSuccess = roll <= successChance;
    
    // Initialize stats if they don't exist
    user.stats = user.stats || {};
    user.stats.carTheftsAttempted = (user.stats.carTheftsAttempted || 0) + 1;
    
    // If successful, add car to inventory
    if (isSuccess) {
      user.stats.carTheftsSuccessful = (user.stats.carTheftsSuccessful || 0) + 1;
      user.stats.carsStolen = (user.stats.carsStolen || 0) + 1;
      
      // Initialize cars array if it doesn't exist
      user.cars = user.cars || [];
      
      // Add car to user's cars
      user.cars.push({
        name: car.name,
        price: car.price,
        image: car.image,
        type: car.type,
        category: car.category
      });
      
      // Add XP for successful theft
      const xpReward = Math.max(5, car.price / 1000); // Min 5 XP, 1 XP per $1000 of car value
      user.xp = (user.xp || 0) + xpReward;
      const rankInfo = getRankForXp(user.xp);
      user.rank = rankInfo.currentRank;
      
      // Calculate level from XP (1 level per 100 XP)
      const newLevel = Math.floor(user.xp / 100) + 1;
      if (newLevel > (user.level || 0)) {
        user.level = newLevel;
      }
      
      await user.save();
      
      return res.json({
        success: true,
        message: `You successfully stole a ${car.name}!`,
        car: user.cars[user.cars.length - 1],
        xp: user.xp,
        level: user.level,
        rank: user.rank
      });
    } else {
      // Theft failed, check if caught and sent to jail
      const jailRoll = Math.random() * 100;
      const isCaught = jailRoll <= venue.jailChance;
      
      if (isCaught) {
        // Calculate reduced jail time based on player level
        let jailTime = venue.jailTime;
        
        // Newer players (levels 1-5) get additional jail time reduction
        if (user.level && user.level <= 5) {
          // 10% reduction per level for new players (up to 50%)
          jailTime = Math.round(jailTime * (1 - (user.level * 0.1)));
        }
        
        // Ensure minimum jail time of 15 seconds
        jailTime = Math.max(15, jailTime);
        
        // Send to jail with time reduction
        await jailService.jailUser(
          userId,
          jailTime,
          venue.jailReason,
          venue.difficulty === 'high' ? 3 : (venue.difficulty === 'medium' ? 2 : 1)
        );
        
        await user.save();
        
        // Get the updated jail status
        const updatedJailStatus = await jailService.getJailStatus(userId);
        
        // Calculate minutes and seconds for display
        const minutes = Math.floor(jailTime / 60);
        const seconds = jailTime % 60;
        const timeDisplay = minutes > 0 
          ? `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`
          : `${seconds} second${seconds !== 1 ? 's' : ''}`;
        
        return res.status(403).json({
          success: false,
          message: `You were caught trying to steal a car and got sent to jail for ${timeDisplay}!`,
          inJail: true,
          timeRemaining: updatedJailStatus.timeRemaining,
          jailRecord: updatedJailStatus.jailRecord
        });
      } else {
        // Just failed but not caught
        await user.save();
        
        return res.json({
          success: false,
          message: "You couldn't steal the car, but managed to escape before anyone noticed."
        });
      }
    }
  } catch (error) {
    console.error('Error in stealCar:', error);
    next(error);
  }
};

/**
 * Sell a car
 */
exports.sellCar = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { carIndex } = req.body;
    
    // Validate input
    if (carIndex === undefined) {
      return res.status(400).json({ success: false, message: 'Car index is required' });
    }
    
    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Check if in jail
    const jailStatus = await jailService.getJailStatus(userId);
    if (jailStatus.inJail) {
      return res.status(403).json({
        success: false,
        message: 'You are in jail!',
        inJail: true,
        timeRemaining: jailStatus.timeRemaining,
        jailRecord: jailStatus.jailRecord
      });
    }
    
    // Check if cars array exists
    if (!user.cars || !Array.isArray(user.cars)) {
      user.cars = [];
      await user.save();
      return res.status(404).json({ success: false, message: 'No cars in your garage' });
    }
    
    // Check if car exists
    if (carIndex >= user.cars.length) {
      return res.status(404).json({ success: false, message: 'Car not found in your garage' });
    }
    
    // Get car and calculate final price
    const car = user.cars[carIndex];
    
    // Calculate sell price (80-120% of base price)
    const priceMultiplier = 0.8 + (Math.random() * 0.4);
    const sellPrice = Math.round(car.price * priceMultiplier);
    
    // Add money to user
    user.money = (user.money || 0) + sellPrice;
    
    // Remove car from inventory
    user.cars.splice(carIndex, 1);
    
    await user.save();
    
    return res.json({
      success: true,
      message: `You sold the ${car.name} for $${sellPrice.toLocaleString()}!`,
      money: user.money,
      cars: user.cars
    });
  } catch (error) {
    console.error('Error in sellCar:', error);
    next(error);
  }
};

/**
 * Get all available venues with their car info
 */
exports.getVenues = async (req, res, next) => {
  try {
    // Create a response with detailed venue information
    const venues = {};
    
    Object.entries(carTheftVenues).forEach(([venueName, venue]) => {
      // Get full car details for each venue
      const venueCars = venue.cars
        .map(carName => allCars.find(car => car.name === carName))
        .filter(car => car !== undefined);
      
      venues[venueName] = {
        ...venue,
        cars: venueCars
      };
    });
    
    return res.status(200).json({
      success: true,
      venues
    });
  } catch (error) {
    console.error('Error fetching venue data:', error);
    next(error);
  }
};