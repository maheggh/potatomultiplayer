const express = require('express');
const router = express.Router();
const weaponController = require('../controllers/weaponController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', weaponController.getAllWeapons);
router.get('/:weaponId', weaponController.getWeaponDetails);

// Protected routes
router.post('/buy', authMiddleware, weaponController.buyWeapon);
router.post('/sell', authMiddleware, weaponController.sellWeapon);

module.exports = router;