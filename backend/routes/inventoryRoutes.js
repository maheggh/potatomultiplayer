// routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Get inventory
router.get('/', authMiddleware, inventoryController.getInventory);

// Update inventory
router.post('/update', authMiddleware, inventoryController.updateInventory);

// Add item to inventory
router.post('/add', authMiddleware, inventoryController.addItem);

// Remove item from inventory
router.post('/remove', authMiddleware, inventoryController.removeItem);

// Collect loot
router.post('/loot/collect', authMiddleware, inventoryController.collectLoot);

module.exports = router;