// backend/routes/carTheftRoutes.js

const express = require('express');
const router = express.Router();
const carTheftController = require('../controllers/carTheftController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get available venues with car details
router.get('/venues', carTheftController.getVenues);

// Steal a car
router.post('/steal', carTheftController.stealCar);

// Sell a car
router.post('/sell', carTheftController.sellCar);

module.exports = router;