// backend/routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);

router.get('/profile', authMiddleware, userController.getUserProfile);
router.post('/update', authMiddleware, userController.updateUserData);
router.get('/targets', authMiddleware, userController.getTargets);


module.exports = router;