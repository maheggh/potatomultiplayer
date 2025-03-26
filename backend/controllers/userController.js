// controllers/userController.js

const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateRandomGangsterName, generateRandomPassword } = require('../utils/nameGenerator');
const { getRankForXp } = require('../utils/rankCalculator');

exports.registerUser = async (req, res) => {
  try {
    let { username, password } = req.body;

    if (!username) {
      username = generateRandomGangsterName();
    }
    if (!password) {
      password = generateRandomPassword();
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      isAlive: true,
      xp: 0,
      rank: 'Homeless Potato',
      money: 0, 
      cars: [],
      stolenItems: [],
      inventory: [],
      bossItems: [],
      kills: 0,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id.toString() }, process.env.TOKEN_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      success: true,
      token,
      userData: {
        userId: newUser._id.toString(),
        username: newUser.username,
        money: newUser.money,       // <-- Important: Include money here
        isAlive: newUser.isAlive,   // also recommended
        xp: newUser.xp,             // recommended
        rank: newUser.rank,         // recommended
        kills: newUser.kills,       // recommended
        password,
        message: 'User registered successfully',
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Failed to register user' });
  }
};


exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }

    // Convert ObjectId to string when generating token
    const token = jwt.sign({ userId: user._id.toString() }, process.env.TOKEN_SECRET, {
      expiresIn: '1h',
    });

    res.json({
      success: true,
      token,
      userData: {
        userId: user._id.toString(),
        username: user.username,
        money: user.money,
        cars: user.cars,
        stolenItems: user.stolenItems,
        inventory: user.inventory,
        bossItems: user.bossItems,
        xp: user.xp,
        rank: user.rank,
        isAlive: user.isAlive,
        kills: user.kills,
      },
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ success: false, message: 'Failed to login user' });
  }
};

exports.getUserData = async (req, res) => {
  try {
    const userId = req.user.userId; // Access userId from req.user
    const user = await User.findById(userId).select('-password'); // Exclude password
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate the rank and next rank details
    const rankInfo = getRankForXp(user.xp);

    res.json({
      success: true,
      userData: {
        userId: user._id.toString(),
        username: user.username,
        money: user.money,
        cars: user.cars,
        stolenItems: user.stolenItems,
        inventory: user.inventory,
        bossItems: user.bossItems,
        xp: user.xp,
        rank: rankInfo.currentRank,
        nextRank: rankInfo.nextRank,
        nextRankThreshold: rankInfo.nextRankThreshold,
        currentRankThreshold: rankInfo.currentRankThreshold,
        isAlive: user.isAlive,
        kills: user.kills,
      },
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
};

exports.updateUserData = async (req, res) => {
  try {
    const userId = req.user.userId;
    const updatedData = req.body;

    // Validate and sanitize updatedData as needed
    const allowedUpdates = ['money', 'inJail', 'jailTimeEnd', 'xp', 'rank', 'isAlive', 'kills', 'cars', 'stolenItems', 'inventory', 'bossItems'];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (field in updatedData) {
        updates[field] = updatedData[field];
      }
    });

    // Update the user data
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User data updated', user });
  } catch (error) {
    console.error('Error updating user data:', error);
    res.status(500).json({ success: false, message: 'Failed to update user data', error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Calculate the rank and next rank details
    const rankInfo = getRankForXp(user.xp);

    res.json({
      success: true,
      userData: {
        userId: user._id.toString(),
        username: user.username,
        money: user.money,
        cars: user.cars,
        stolenItems: user.stolenItems,
        inventory: user.inventory,
        bossItems: user.bossItems,
        xp: user.xp,
        rank: getRankForXp(user.xp).currentRank,
        kills: user.kills,
        nextRank: rankInfo.nextRank,
        nextRankThreshold: rankInfo.nextRankThreshold,
        currentRankThreshold: rankInfo.currentRankThreshold,
        isAlive: user.isAlive,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user data' });
  }
};

exports.startJailTime = async (user, jailDurationInSeconds) => {
  user.inJail = true;
  const jailTimeEnd = Date.now() + jailDurationInSeconds * 1000; // Store the future release time in milliseconds
  user.jailTimeEnd = jailTimeEnd;
  await user.save();
};

exports.getJailTime = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.inJail) {
      return res.status(200).json({ inJail: false, message: 'User is not in jail' });
    }

    const jailTimeLeft = Math.max(0, user.jailTimeEnd - Date.now());
    if (jailTimeLeft > 0) {
      return res.status(200).json({
        inJail: true,
        jailTime: Math.ceil(jailTimeLeft / 1000), // Return time in seconds
      });
    } else {
      // Release user if jail time is up
      user.inJail = false;
      user.jailTimeEnd = null;
      await user.save();
      return res.status(200).json({ inJail: false, message: 'User has been released from jail' });
    }
  } catch (error) {
    console.error('Error fetching jail time:', error.message);
    return res.status(500).json({
      message: 'Server error fetching jail time',
      error: error.message,
    });
  }
};

exports.updateMoney = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { money } = req.body;

    const user = await User.findById(userId);

    if (money < 0) {
      return res.status(400).json({ success: false, message: 'Money cannot be negative.' });
    }

    user.money = money;
    await user.save();

    res.status(200).json({ success: true, money: user.money });
  } catch (error) {
    console.error('Error updating money:', error);
    res.status(500).json({ success: false, message: 'Server error updating money' });
  }
};

exports.getTargets = async (req, res) => {
  try {
    const userId = req.user.userId;
    const users = await User.find({ _id: { $ne: userId }, isAlive: true }).select('username level xp _id');

    if (!users || users.length === 0) {
      return res.status(200).json({ success: true, targets: [], message: 'No valid targets available.' });
    }

    res.status(200).json({ success: true, targets: users });
  } catch (error) {
    console.error('Error fetching targets:', error);
    res.status(500).json({ success: false, message: 'Error fetching targets' });
  }
};


exports.updateBossItems = async (req, res) => {
  const { bossItems } = req.body;

  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's boss items
    user.bossItems = bossItems;

    // Save the user data
    await user.save();

    res.json({ message: 'Boss items updated successfully', bossItems: user.bossItems });
  } catch (error) {
    console.error('Error updating boss items:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateXP = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { xp } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.xp = xp;
    // Optionally update rank based on XP
    user.rank = getRankForXp(xp).currentRank;

    await user.save();
    res.status(200).json({ message: 'XP updated successfully', xp: user.xp, rank: user.rank });
  } catch (error) {
    console.error('Error updating XP:', error);
    res.status(500).json({ message: 'Server error updating XP' });
  }
};
