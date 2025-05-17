const express = require('express');
const router = express.Router();
const bossesController = require('../controllers/bossesController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get all bosses data
router.get('/', bossesController.getBosses);

// Fight a boss
router.post('/fight', bossesController.fightBoss);

// Get boss items in inventory
router.get('/items', bossesController.getBossItems);

// Use a boss item for an activity
router.post('/use-item', bossesController.useBossItem);

module.exports = router;