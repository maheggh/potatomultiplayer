const express = require('express');
const router = express.Router();
const assassinationController = require('../controllers/assassinationController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get potential assassination targets
router.get('/targets', assassinationController.getTargets);

// Check cooldown status
router.get('/cooldown', assassinationController.checkCooldown);

// Attempt assassination
router.post('/attempt', assassinationController.attemptAssassination);

module.exports = router;