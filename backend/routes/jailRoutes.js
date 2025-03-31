// backend/routes/jailRoutes.js
const express = require('express');
const jailController = require('../controllers/jailController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
router.get('/status', authMiddleware, jailController.getJailStatus);

module.exports = router;