const express = require('express');
const router = express.Router();
const theftController = require('../controllers/theftController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all stolen items
router.get('/stolen-items', theftController.getStolenItems);

// Steal an item
router.post('/steal', theftController.stealItem);

// Sell an item
router.post('/sell', theftController.sellItem);

module.exports = router;
