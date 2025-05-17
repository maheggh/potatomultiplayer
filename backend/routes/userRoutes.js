// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes (no authentication required)
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

// Protected routes (authentication required)
router.get('/me', authMiddleware, userController.getUserProfile);
router.post('/update', authMiddleware, userController.updateUserData);
router.get('/targets', authMiddleware, userController.getTargets);
router.get('/stats', authMiddleware, userController.getUserStats);

// Leaderboard
router.get('/leaderboard', userController.getLeaderboard);

module.exports = router;