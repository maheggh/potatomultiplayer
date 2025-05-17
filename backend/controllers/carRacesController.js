// backend/controllers/carRaceController.js

const User = require('../models/User');
const { allCars } = require('../data/cars');

// Cooldown periods for different race outcomes (in seconds)
const COOLDOWNS = {
    WIN: 30,
    LOSS: 45,
    CRASH: 60
};

// Add a car to user's garage
exports.addCar = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { car } = req.body;

        if (!car || !car.name) {
            return res.status(400).json({
                success: false,
                message: 'Invalid car data'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is on cooldown
        if (user.raceCooldownEnd && new Date() < new Date(user.raceCooldownEnd)) {
            const remainingTime = Math.ceil((new Date(user.raceCooldownEnd) - new Date()) / 1000);
            return res.status(403).json({
                success: false,
                message: `You're on racing cooldown for ${remainingTime} more seconds`,
                cooldownRemaining: remainingTime
            });
        }

        // Find car in allCars if only name is provided
        let carToAdd = car;
        if (!car.price || !car.image) {
            const carTemplate = allCars.find(c => c.name === car.name);
            if (carTemplate) {
                carToAdd = { ...carTemplate };
            }
        }

        // Add the car to user's garage
        user.cars.push(carToAdd);
        await user.save();

        return res.status(200).json({
            success: true,
            message: `Added ${carToAdd.name} to your garage!`,
            cars: user.cars
        });
    } catch (error) {
        console.error('Error adding car:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error adding car'
        });
    }
};

// Remove a car from user's garage
exports.removeCar = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { carName, carIndex } = req.body;

        if (!carName && carIndex === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Must provide either carName or carIndex'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is on cooldown (only if it's not part of a race which already sets cooldown)
        if (req.query.race !== 'true' && user.raceCooldownEnd && new Date() < new Date(user.raceCooldownEnd)) {
            const remainingTime = Math.ceil((new Date(user.raceCooldownEnd) - new Date()) / 1000);
            return res.status(403).json({
                success: false,
                message: `You're on racing cooldown for ${remainingTime} more seconds`,
                cooldownRemaining: remainingTime
            });
        }

        let carRemoved = false;
        
        if (carName) {
            // Find car by name
            const carIndex = user.cars.findIndex(car => car.name === carName);
            if (carIndex !== -1) {
                user.cars.splice(carIndex, 1);
                carRemoved = true;
            }
        } else if (carIndex !== undefined) {
            // Remove car by index
            if (carIndex >= 0 && carIndex < user.cars.length) {
                user.cars.splice(carIndex, 1);
                carRemoved = true;
            }
        }

        if (!carRemoved) {
            return res.status(404).json({
                success: false,
                message: 'Car not found in your garage'
            });
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Car removed from your garage',
            cars: user.cars
        });
    } catch (error) {
        console.error('Error removing car:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error removing car'
        });
    }
};

// Handle a race
exports.raceWithCar = async (req, res) => {
  try {
      const userId = req.user.userId;
      const { carName } = req.body;

      if (!carName) {
          return res.status(400).json({
              success: false,
              message: 'You must select a car to race'
          });
      }

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found'
          });
      }

      // Check if user is on cooldown
      if (user.raceCooldownEnd && new Date() < new Date(user.raceCooldownEnd)) {
          const remainingTime = Math.ceil((new Date(user.raceCooldownEnd) - new Date()) / 1000);
          return res.status(403).json({
              success: false,
              message: `You're on racing cooldown for ${remainingTime} more seconds`,
              cooldownRemaining: remainingTime
          });
      }

      // Find the car in user's garage
      const carIndex = user.cars.findIndex(car => car.name === carName);
      if (carIndex === -1) {
          return res.status(404).json({
              success: false,
              message: 'Car not found in your garage'
          });
      }

      const playerCar = user.cars[carIndex];
      
      // Generate random opponent
      const opponentCar = allCars[Math.floor(Math.random() * allCars.length)];
      
      // Calculate race outcome
      const playerSpeed = (playerCar.price || 500) / 1000 + Math.random() * 20;
      const opponentSpeed = (opponentCar.price || 500) / 1000 + Math.random() * 20;
      const crashChance = 0.08; // 8% crash chance
      
      let result = {
          opponentCar,
          playerCar,
          message: '',
          outcome: '',
          cooldownDuration: 0
      };

      // Determine race outcome
      if (Math.random() < crashChance) {
          // Crash - lose car and get highest cooldown
          user.cars.splice(carIndex, 1);
          result.outcome = 'crash';
          result.message = `💥 DISASTER! Your ${playerCar.name} crashed and burned!`;
          result.cooldownDuration = COOLDOWNS.CRASH;
          result.lostCar = playerCar;
      } else if (playerSpeed > opponentSpeed) {
          // Win - get a new random car and standard cooldown
          const wonCar = allCars[Math.floor(Math.random() * allCars.length)];
          user.cars.push(wonCar);
          result.outcome = 'win';
          result.message = `🏆 VICTORY! You smoked the ${opponentCar.name} and won a ${wonCar.name}!`;
          result.cooldownDuration = COOLDOWNS.WIN;
          result.wonCar = wonCar;
      } else {
          // Lose - lose car and get moderate cooldown
          user.cars.splice(carIndex, 1);
          result.outcome = 'loss';
          result.message = `☠️ DEFEAT! The ${opponentCar.name} left your ${playerCar.name} in the dust! You lost your car.`;
          result.cooldownDuration = COOLDOWNS.LOSS;
          result.lostCar = playerCar;
      }

      // Set cooldown
      user.raceCooldownEnd = new Date(Date.now() + result.cooldownDuration * 1000);
      
      // Update XP
      if (result.outcome === 'win') {
          user.xp += 50; // Award XP for winning
      }
      
      await user.save();

      return res.status(200).json({
          success: true,
          result,
          cooldownEnd: user.raceCooldownEnd,
          cars: user.cars,
          xp: user.xp
      });
  } catch (error) {
      console.error('Error during car race:', error);
      return res.status(500).json({
          success: false,
          message: 'Server error during car race'
      });
  }
};

// Get cooldown status
exports.getCooldownStatus = async (req, res) => {
  try {
      const userId = req.user.userId;

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({
              success: false,
              message: 'User not found'
          });
      }

      if (user.raceCooldownEnd && new Date() < new Date(user.raceCooldownEnd)) {
          const remainingTime = Math.ceil((new Date(user.raceCooldownEnd) - new Date()) / 1000);
          return res.status(200).json({
              success: true,
              onCooldown: true,
              cooldownRemaining: remainingTime,
              cooldownEnd: user.raceCooldownEnd
          });
      } else {
          // Clear the cooldown if it's expired
          if (user.raceCooldownEnd) {
              user.raceCooldownEnd = null;
              await user.save();
          }
          
          return res.status(200).json({
              success: true,
              onCooldown: false
          });
      }
  } catch (error) {
      console.error('Error checking cooldown status:', error);
      return res.status(500).json({
          success: false,
          message: 'Server error checking cooldown status'
      });
  }
};

// Get available cars for racing (mainly for admin or testing)
exports.getAvailableCars = async (req, res) => {
  try {
      return res.status(200).json({
          success: true,
          cars: allCars
      });
  } catch (error) {
      console.error('Error fetching available cars:', error);
      return res.status(500).json({
          success: false,
          message: 'Server error fetching car data'
      });
  }
};

module.exports = exports;