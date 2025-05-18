// backend/routes/carRoutes.js
const express = require('express');
const router = express.Router();
const carController = require('../controllers/carController');

// Get all cars
router.get('/', carController.getCarsInventory);

// Get a specific car by ID
router.get('/:id', carController.getCarById);

// Create a new car
router.post('/', carController.createCar);

// Update an existing car
router.put('/:id', carController.updateCar);

// Delete a car
router.delete('/:id', carController.deleteCar);

// Seed the database with predefined cars
router.post('/seed', carController.seedCars);

module.exports = router;