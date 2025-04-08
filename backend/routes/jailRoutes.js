// backend/routes/jailRoutes.js
const express = require('express');
const jailController = require('../controllers/jailController');
const authMiddleware = require('../middleware/authMiddleware'); // Assuming this verifies req.user

const router = express.Router();

router.get('/status', authMiddleware, jailController.getJailStatus);
router.post('/breakout', authMiddleware, jailController.attemptBreakout); 

module.exports = router;