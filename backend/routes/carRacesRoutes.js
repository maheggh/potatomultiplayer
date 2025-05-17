const express = require('express');
const router = express.Router();
const carRacesController = require('../controllers/carRacesController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Add a car to user's garage
router.post('/addCar', carRacesController.addCar);

// Remove a car from user's garage
router.post('/removeCar', carRacesController.removeCar);

// Race with a car
router.post('/race', carRacesController.raceWithCar);

// Get cooldown status
router.get('/cooldown', carRacesController.getCooldownStatus);

// Get available car models (admin/testing)
router.get('/available', carRacesController.getAvailableCars);

module.exports = router;