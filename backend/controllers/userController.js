// backend/controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateRandomGangsterName, generateRandomPassword } = require('../utils/nameGenerator');
const { getRankForXp } = require('../utils/rankCalculator');

exports.registerUser = async (req, res, next) => {
  try {
    let { username } = req.body;
    let password = req.body.password; // Get potential user-provided password
    let generatedPassword = null; // Track if we generated one

    if (!username) {
      username = generateRandomGangsterName();
    }
    if (!password) {
      password = generateRandomPassword();
      generatedPassword = password; // Store the generated password to return it
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
        return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const rankInfo = getRankForXp(0);
    const newUser = new User({
      username, password: hashedPassword, isAlive: true, xp: 0,
      rank: rankInfo.currentRank, money: 0, cars: [], stolenItems: [],
      inventory: [], bossItems: [], kills: 0, level: 1,
    });

    await newUser.save();
    const token = jwt.sign({ userId: newUser._id.toString() }, process.env.TOKEN_SECRET, { expiresIn: '24h' });

    // Prepare response data
    const responseData = {
        success: true,
        token,
        userData: {
            userId: newUser._id.toString(),
            username: newUser.username, // Return the definite username
            // Basic stats are good here too
            money: newUser.money,
            isAlive: newUser.isAlive,
            xp: newUser.xp,
            rank: newUser.rank,
            kills: newUser.kills,
        },
    };

    // ** Conditionally add generatedPassword to the response **
    if (generatedPassword) {
        responseData.userData.generatedPassword = generatedPassword;
    }

    res.status(201).json(responseData);

  } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Username already exists.' });
    }
    next(error);
  }
};

// --- loginUser, getUserProfile, updateUserData, getTargets remain the same ---

exports.loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id.toString() }, process.env.TOKEN_SECRET, { expiresIn: '24h' });
    res.json({
      success: true, token,
      userData: {
        userId: user._id.toString(), username: user.username, money: user.money,
        xp: user.xp, rank: user.rank, isAlive: user.isAlive, kills: user.kills, level: user.level,
      },
    });
  } catch (error) {
     next(error);
  }
};

exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const rankInfo = getRankForXp(user.xp);
    res.json({
      success: true,
      userData: {
        userId: user._id.toString(), username: user.username, money: user.money,
        cars: user.cars || [], stolenItems: user.stolenItems || [],
        inventory: user.inventory || [], bossItems: user.bossItems || [],
        xp: user.xp, rank: rankInfo.currentRank, nextRank: rankInfo.nextRank,
        nextRankThreshold: rankInfo.nextRankThreshold, currentRankThreshold: rankInfo.currentRankThreshold,
        isAlive: user.isAlive, kills: user.kills, level: user.level,
        lastAssassinationAttempt: user.lastAssassinationAttempt,
      },
    });
  } catch (error) {
     next(error);
  }
};

exports.updateUserData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const updatedData = req.body;
    const allowedUpdates = [
        'money', 'xp', 'isAlive', 'kills', 'cars', 'stolenItems',
        'inventory', 'bossItems', 'lastAssassinationAttempt', 'level'
    ];
    const updates = {};
    let requiresRankUpdate = false;
    allowedUpdates.forEach((field) => {
      if (updatedData.hasOwnProperty(field)) {
        if (field === 'money' && (typeof updatedData[field] !== 'number' || updatedData[field] < 0)) return;
        if (field === 'xp' && (typeof updatedData[field] !== 'number' || updatedData[field] < 0)) return;
        if (field === 'level' && (typeof updatedData[field] !== 'number' || updatedData[field] < 1)) return;
        if (field === 'kills' && (typeof updatedData[field] !== 'number' || updatedData[field] < 0)) return;
        if (field === 'isAlive' && typeof updatedData[field] !== 'boolean') return;
        if ((field === 'cars' || field === 'stolenItems' || field === 'inventory' || field === 'bossItems') && !Array.isArray(updatedData[field])) return;
        updates[field] = updatedData[field];
        if (field === 'xp') requiresRankUpdate = true;
      }
    });
    if (requiresRankUpdate) {
        updates.rank = getRankForXp(updates.xp).currentRank;
    }
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ success: false, message: 'No valid fields provided for update.' });
    }
    const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const rankInfo = getRankForXp(user.xp);
    res.json({
        success: true,
        message: 'User data updated successfully',
        userData: {
            userId: user._id.toString(), username: user.username, money: user.money,
            cars: user.cars || [], stolenItems: user.stolenItems || [],
            inventory: user.inventory || [], bossItems: user.bossItems || [],
            xp: user.xp, rank: rankInfo.currentRank, nextRank: rankInfo.nextRank,
            nextRankThreshold: rankInfo.nextRankThreshold, currentRankThreshold: rankInfo.currentRankThreshold,
            isAlive: user.isAlive, kills: user.kills, level: user.level,
            lastAssassinationAttempt: user.lastAssassinationAttempt,
        }
    });
  } catch (error) {
     next(error);
  }
};

exports.getTargets = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const users = await User.find({ _id: { $ne: userId }, isAlive: true })
                            .select('username level xp rank _id');
    res.status(200).json({ success: true, targets: users || [] });
  } catch (error) {
     next(error);
  }
};