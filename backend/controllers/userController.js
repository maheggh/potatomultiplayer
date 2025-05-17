// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateRandomGangsterName, generateRandomPassword } = require('../utils/nameGenerator');
const { getRankForXp } = require('../utils/rankCalculator');

/**
 * Register a new user
 */
exports.registerUser = async (req, res, next) => {
  try {
    let { username } = req.body;
    let password = req.body.password;
    let generatedPassword = null;

    // Generate random username if not provided
    if (!username) {
      username = generateRandomGangsterName();
    }
    
    // Generate random password if not provided
    if (!password) {
      password = generateRandomPassword();
      generatedPassword = password;
    }

    // Check if username is taken
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Get initial rank
    const rankInfo = getRankForXp(0);
    
    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      isAlive: true,
      xp: 0,
      rank: rankInfo.currentRank,
      money: 0,
      level: 1,
      stats: {
        // Initialize all stats to 0
        theftsAttempted: 0,
        theftsSuccessful: 0,
        moneyStolen: 0,
        carTheftsAttempted: 0,
        carTheftsSuccessful: 0,
        carsStolen: 0,
        racesParticipated: 0,
        racesWon: 0,
        carsLost: 0,
        carsWon: 0,
        assassinationsAttempted: 0,
        assassinationsSuccessful: 0,
        retaliationsReceived: 0,
        bossesDefeated: 0,
        bossItemsAcquired: 0,
        gamblingWinnings: 0,
        gamblingLosses: 0
      }
    });

    await newUser.save();
    
    // Generate JWT
    const token = jwt.sign(
      { userId: newUser._id.toString() }, 
      process.env.TOKEN_SECRET, 
      { expiresIn: '24h' }
    );

    // Prepare response data
    const responseData = {
      success: true,
      token,
      userData: {
        userId: newUser._id.toString(),
        username: newUser.username,
        money: newUser.money,
        isAlive: newUser.isAlive,
        xp: newUser.xp,
        rank: newUser.rank,
        kills: newUser.kills,
        level: newUser.level
      }
    };

    // Add generated password to response if we created one
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

/**
 * Login user
 */
exports.loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials' });
    }
    
    // Generate JWT
    const token = jwt.sign(
      { userId: user._id.toString() }, 
      process.env.TOKEN_SECRET, 
      { expiresIn: '24h' }
    );
    
    // Update lastActive
    user.lastActive = new Date();
    await user.save();
    
    // Return user data
    res.json({
      success: true,
      token,
      userData: {
        userId: user._id.toString(),
        username: user.username,
        money: user.money,
        xp: user.xp,
        rank: user.rank,
        isAlive: user.isAlive,
        kills: user.kills,
        level: user.level
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 */
exports.getUserProfile = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Find user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    // Get rank info
    const rankInfo = getRankForXp(user.xp);
    
    // Check cooldowns
    const cooldowns = {
      assassination: user.isOnCooldown('assassination') ? user.getCooldownRemaining('assassination') : 0,
      race: user.isOnCooldown('race') ? user.getCooldownRemaining('race') : 0,
      gambling: user.isOnCooldown('gambling') ? user.getCooldownRemaining('gambling') : 0
    };
    
    // Check jail status
    const isInJail = user.isInJail;
    
    // Format response
    res.json({
      success: true,
      userData: {
        userId: user._id.toString(),
        username: user.username,
        money: user.money,
        cars: user.cars || [],
        stolenItems: user.stolenItems || [],
        inventory: user.inventory || [],
        bossItems: user.bossItems || [],
        xp: user.xp,
        rank: rankInfo.currentRank,
        nextRank: rankInfo.nextRank,
        nextRankThreshold: rankInfo.nextRankThreshold,
        currentRankThreshold: rankInfo.currentRankThreshold,
        isAlive: user.isAlive,
        kills: user.kills,
        level: user.level,
        cooldowns: cooldowns,
        isInJail: isInJail,
        jailTimeEnd: user.jailTimeEnd,
        stats: user.stats || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user data
 */
exports.updateUserData = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const updatedData = req.body;
    
    // Define allowed fields for update
    const allowedUpdates = [
      'money', 'xp', 'isAlive', 'kills', 'cars', 'stolenItems',
      'inventory', 'bossItems', 'level', 'stats',
      'assassinationCooldownEnd', 'raceCooldownEnd', 'gamblingCooldownEnd',
      'inJail', 'jailTimeEnd', 'currentJailRecord'
    ];
    
    const updates = {};
    let requiresRankUpdate = false;
    
    // Filter and validate updates
    allowedUpdates.forEach((field) => {
      if (updatedData.hasOwnProperty(field)) {
        // Validate numeric fields
        if (field === 'money' && (typeof updatedData[field] !== 'number' || updatedData[field] < 0)) return;
        if (field === 'xp' && (typeof updatedData[field] !== 'number' || updatedData[field] < 0)) return;
        if (field === 'level' && (typeof updatedData[field] !== 'number' || updatedData[field] < 1)) return;
        if (field === 'kills' && (typeof updatedData[field] !== 'number' || updatedData[field] < 0)) return;
        
        // Validate boolean fields
        if (field === 'isAlive' && typeof updatedData[field] !== 'boolean') return;
        
        // Validate array fields
        if ((field === 'cars' || field === 'stolenItems' || field === 'inventory' || field === 'bossItems') 
            && !Array.isArray(updatedData[field])) return;
            
        // Validate object fields
        if (field === 'stats' && typeof updatedData[field] !== 'object') return;
        
        // Set updates
        updates[field] = updatedData[field];
        
        // Track if XP changed for rank update
        if (field === 'xp') requiresRankUpdate = true;
      }
    });
    
    // Update rank if XP changed
    if (requiresRankUpdate) {
      updates.rank = getRankForXp(updates.xp).currentRank;
    }
    
    // Check if any valid updates
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No valid fields provided for update.' 
      });
    }
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId, 
      { $set: updates }, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get updated rank info
    const rankInfo = getRankForXp(user.xp);
    
    // Format response
    res.json({
      success: true,
      message: 'User data updated successfully',
      userData: {
        userId: user._id.toString(),
        username: user.username,
        money: user.money,
        cars: user.cars || [],
        stolenItems: user.stolenItems || [],
        inventory: user.inventory || [],
        bossItems: user.bossItems || [],
        xp: user.xp,
        rank: rankInfo.currentRank,
        nextRank: rankInfo.nextRank,
        nextRankThreshold: rankInfo.nextRankThreshold,
        currentRankThreshold: rankInfo.currentRankThreshold,
        isAlive: user.isAlive,
        kills: user.kills,
        level: user.level,
        stats: user.stats || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get potential assassination targets
 */
exports.getTargets = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Find alive users except current user
    const users = await User.find(
      { _id: { $ne: userId }, isAlive: true }
    ).select('username level xp rank _id');
    
    res.status(200).json({ 
      success: true, 
      targets: users || [] 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user statistics
 */
exports.getUserStats = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    // Find user
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    
    // Format stats for frontend
    const stats = {
      // Criminal activity stats
      criminal: {
        theftsAttempted: user.stats.theftsAttempted || 0,
        theftsSuccessful: user.stats.theftsSuccessful || 0,
        moneyStolen: user.stats.moneyStolen || 0,
        carTheftsAttempted: user.stats.carTheftsAttempted || 0,
        carTheftsSuccessful: user.stats.carTheftsSuccessful || 0,
        carsStolen: user.stats.carsStolen || 0
      },
      // Combat stats
      combat: {
        assassinationsAttempted: user.stats.assassinationsAttempted || 0,
        assassinationsSuccessful: user.stats.assassinationsSuccessful || 0,
        retaliationsReceived: user.stats.retaliationsReceived || 0,
        bossesDefeated: user.stats.bossesDefeated || 0,
        kills: user.kills || 0
      },
      // Racing stats
      racing: {
        racesParticipated: user.stats.racesParticipated || 0,
        racesWon: user.stats.racesWon || 0,
        carsLost: user.stats.carsLost || 0,
        carsWon: user.stats.carsWon || 0
      },
      // Gambling stats
      gambling: {
        gamblingWinnings: user.stats.gamblingWinnings || 0,
        gamblingLosses: user.stats.gamblingLosses || 0,
        netGamblingProfit: (user.stats.gamblingWinnings || 0) - (user.stats.gamblingLosses || 0)
      },
      // Jail stats
      jail: {
        timesSentToJail: user.jailStats.timesSentToJail || 0,
        successfulBreakouts: user.jailStats.successfulBreakouts || 0,
        failedBreakouts: user.jailStats.failedBreakouts || 0,
        timeServed: user.jailStats.timeServed || 0
      },
      // Collection stats
      collection: {
        totalCars: user.cars?.length || 0,
        totalWeapons: user.inventory?.filter(item => item.category === 'weapon')?.length || 0,
        totalStolenItems: user.stolenItems?.length || 0,
        totalBossItems: user.bossItems?.length || 0
      }
    };
    
    res.status(200).json({ 
      success: true, 
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get leaderboard
 */
exports.getLeaderboard = async (req, res, next) => {
  try {
    const { category = 'xp', limit = 10 } = req.query;
    
    // Define valid sorting options
    const validCategories = {
      xp: '-xp',
      money: '-money',
      kills: '-kills',
      level: '-level',
      thefts: '-stats.theftsSuccessful',
      car_thefts: '-stats.carTheftsSuccessful',
      races: '-stats.racesWon',
      assassinations: '-stats.assassinationsSuccessful',
      bosses: '-stats.bossesDefeated'
    };
    
    // Validate category
    const sortField = validCategories[category] || '-xp';
    
    // Get top users
    const topUsers = await User.find()
      .select('username xp money level rank kills stats')
      .sort(sortField)
      .limit(parseInt(limit, 10));
      
    // Format response
    const leaderboard = topUsers.map(user => ({
      userId: user._id,
      username: user.username,
      xp: user.xp,
      money: user.money,
      level: user.level,
      rank: user.rank,
      kills: user.kills,
      stats: {
        theftsSuccessful: user.stats?.theftsSuccessful || 0,
        carTheftsSuccessful: user.stats?.carTheftsSuccessful || 0,
        racesWon: user.stats?.racesWon || 0,
        assassinationsSuccessful: user.stats?.assassinationsSuccessful || 0,
        bossesDefeated: user.stats?.bossesDefeated || 0
      }
    }));
    
    res.status(200).json({
      success: true,
      leaderboard,
      category
    });
  } catch (error) {
    next(error);
  }
};