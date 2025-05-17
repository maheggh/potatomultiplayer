const { jailService } = require('../services/jailService');

exports.getJailStatus = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const status = await jailService.getJailStatus(userId);
    res.json({ success: true, ...status });
  } catch (error) {
    console.error('Error getting jail status:', error);
    next(error);
  }
};

exports.attemptBreakout = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    
    const result = await jailService.attemptBreakout(userId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Error attempting breakout:', error);
    next(error);
  }
};

exports.getJailHistory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    
    const history = await jailService.getJailHistory(userId, limit);
    res.json({ success: true, history });
  } catch (error) {
    console.error('Error getting jail history:', error);
    next(error);
  }
};

exports.sendToJail = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    
    const { userId, duration, reason, severity } = req.body;
    
    if (!userId || !duration) {
      return res.status(400).json({ success: false, message: 'userId and duration are required' });
    }
    
    const jailRecord = await jailService.jailUser(
      userId, 
      duration, 
      reason || 'Administrative action',
      severity || 1
    );
    
    res.json({
      success: true,
      message: 'User sent to jail successfully',
      jailRecord
    });
  } catch (error) {
    console.error('Error sending user to jail:', error);
    next(error);
  }
};

exports.releaseFromJail = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }
    
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }
    
    const result = await jailService.releaseUser(userId);
    
    res.json({
      success: true,
      message: result.released ? 'User released from jail successfully' : result.message,
      ...result
    });
  } catch (error) {
    console.error('Error releasing user from jail:', error);
    next(error);
  }
};