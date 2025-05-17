const express = require('express');
const router = express.Router();
const jailController = require('../controllers/jailController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to jail status routes
router.get('/status', authMiddleware, jailController.getJailStatus);
router.post('/breakout', authMiddleware, jailController.attemptBreakout);
router.get('/history', authMiddleware, jailController.getJailHistory);

// Admin routes
router.post('/send', authMiddleware, jailController.sendToJail);
router.post('/release', authMiddleware, jailController.releaseFromJail);

module.exports = router;