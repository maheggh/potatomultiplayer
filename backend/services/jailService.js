const JailRecord = require('../models/JailRecord');
const User = require('../models/User');
const EventEmitter = require('events');

const eventEmitter = new EventEmitter();

class JailService {
  constructor(chanceService = null) {
    this.chanceService = chanceService;
  }
  
  async jailUser(userId, duration, reason, severity = 1) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');
      
      duration = this.calculateReducedJailTime(duration, user.level || 1, severity);
      
      await this.checkAndCloseActiveRecords(userId);
      
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (duration * 1000));
      
      const jailRecord = await JailRecord.create({
        user: userId,
        startTime,
        endTime,
        reason,
        severity,
        breakoutAttempted: false,
        breakoutSuccessful: false
      });
      
      user.currentJailRecord = jailRecord._id;
      user.jailStats = user.jailStats || {
        timesSentToJail: 0,
        successfulBreakouts: 0,
        failedBreakouts: 0,
        timeServed: 0
      };
      user.jailStats.timesSentToJail += 1;
      
      user.inJail = true;
      user.jailTimeEnd = endTime;
      user.breakoutAttempted = false;
      
      await user.save();
      
      eventEmitter.emit('user.jailed', {
        userId,
        jailRecordId: jailRecord._id,
        duration,
        reason
      });
      
      return jailRecord;
    } catch (error) {
      console.error('Error in jailUser:', error);
      throw error;
    }
  }
  
  calculateReducedJailTime(baseDuration, playerLevel, severity) {
    const newPlayerFactor = Math.max(0, 1 - (Math.min(5, playerLevel) * 0.04));
    const levelFactor = playerLevel <= 10 ? 1 - (playerLevel * 0.02) : 0.8;
    return Math.max(15, Math.round(baseDuration * levelFactor * newPlayerFactor));
  }
  
  async checkAndCloseActiveRecords(userId) {
    try {
      const findActive = typeof JailRecord.findActiveForUser === 'function' 
        ? JailRecord.findActiveForUser 
        : async () => null;
        
      const activeRecord = await findActive(userId);
      if (activeRecord) {
        activeRecord.released = true;
        activeRecord.releaseTime = new Date();
        await activeRecord.save();
      }
    } catch (error) {
      console.error('Error in checkAndCloseActiveRecords:', error);
    }
  }
  
  async getJailStatus(userId) {
    try {
      const user = await User.findById(userId).populate('currentJailRecord');
      if (!user) throw new Error('User not found');
      
      if (!user.currentJailRecord) {
        if (user.inJail && user.jailTimeEnd) {
          const now = new Date();
          if (now < user.jailTimeEnd) {
            const jailRecord = await JailRecord.create({
              user: userId,
              startTime: new Date(user.jailTimeEnd.getTime() - (60 * 60 * 1000)),
              endTime: user.jailTimeEnd,
              reason: 'Legacy jail sentence',
              breakoutAttempted: user.breakoutAttempted || false,
              breakoutSuccessful: false
            });
            
            user.currentJailRecord = jailRecord._id;
            await user.save();
            
            return {
              inJail: true,
              jailRecord: jailRecord,
              timeRemaining: this.calculateTimeRemaining(jailRecord),
              breakoutAttempted: jailRecord.breakoutAttempted,
              breakoutSuccessful: false
            };
          } else {
            user.inJail = false;
            user.jailTimeEnd = null;
            user.breakoutAttempted = false;
            await user.save();
          }
        }
        
        return { 
          inJail: false,
          breakoutSuccessful: false
        };
      }
      
      let jailRecord = user.currentJailRecord;
      
      if (!jailRecord.isActive()) {
        if (!jailRecord.released && !jailRecord.breakoutSuccessful) {
          if (typeof jailRecord.release === 'function') {
            await jailRecord.release();
          } else {
            jailRecord.released = true;
            jailRecord.releaseTime = new Date();
            await jailRecord.save();
          }
        }
        
        const startTime = jailRecord.startTime.getTime();
        const endTime = (jailRecord.releaseTime || jailRecord.breakoutTime || jailRecord.endTime).getTime();
        const timeServed = Math.floor((endTime - startTime) / 1000);
        
        if (typeof user.updateJailStats === 'function') {
          await user.updateJailStats(timeServed);
        } else {
          user.jailStats = user.jailStats || {
            timesSentToJail: 0,
            successfulBreakouts: 0,
            failedBreakouts: 0,
            timeServed: 0
          };
          user.jailStats.timeServed += timeServed;
        }
        
        user.currentJailRecord = null;
        user.inJail = false;
        user.jailTimeEnd = null;
        user.breakoutAttempted = false;
        
        await user.save();
        
        return {
          inJail: false,
          released: true,
          timeServed,
          breakoutSuccessful: jailRecord.breakoutSuccessful || false
        };
      }
      
      const timeRemaining = this.calculateTimeRemaining(jailRecord);
      
      return {
        inJail: true,
        jailRecord,
        timeRemaining,
        breakoutAttempted: jailRecord.breakoutAttempted || false,
        breakoutSuccessful: jailRecord.breakoutSuccessful || false
      };
    } catch (error) {
      console.error('Error in getJailStatus:', error);
      throw error;
    }
  }
  
  calculateTimeRemaining(jailRecord) {
    if (!jailRecord) return 0;
    
    try {
      if (typeof jailRecord.getRemainingTime === 'function') {
        const remaining = jailRecord.getRemainingTime();
        return isNaN(remaining) ? 60 : Math.max(0, remaining);
      }
      
      if (jailRecord.released || jailRecord.breakoutSuccessful) {
        return 0;
      }
      
      const now = new Date();
      const endTime = new Date(jailRecord.endTime);
      
      if (isNaN(endTime.getTime())) {
        console.error('Invalid end time in jail record:', jailRecord.endTime);
        return 60;
      }
      
      return Math.max(0, Math.floor((endTime - now) / 1000));
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return 60;
    }
  }
  
  async releaseUser(userId) {
    try {
      const user = await User.findById(userId).populate('currentJailRecord');
      if (!user) throw new Error('User not found');
      
      if (!user.currentJailRecord) {
        if (user.inJail) {
          user.inJail = false;
          user.jailTimeEnd = null;
          user.breakoutAttempted = false;
          await user.save();
          
          return { released: true };
        }
        
        return { released: false, message: 'User is not in jail' };
      }
      
      let jailRecord = user.currentJailRecord;
      
      if (jailRecord.released || jailRecord.breakoutSuccessful) {
        return { released: false, message: 'User is already released' };
      }
      
      if (typeof jailRecord.release === 'function') {
        await jailRecord.release();
      } else {
        jailRecord.released = true;
        jailRecord.releaseTime = new Date();
        await jailRecord.save();
      }
      
      const startTime = jailRecord.startTime.getTime();
      const endTime = jailRecord.releaseTime.getTime();
      const timeServed = Math.floor((endTime - startTime) / 1000);
      
      if (typeof user.updateJailStats === 'function') {
        await user.updateJailStats(timeServed);
      } else {
        user.jailStats = user.jailStats || {
          timesSentToJail: 0,
          successfulBreakouts: 0,
          failedBreakouts: 0,
          timeServed: 0
        };
        user.jailStats.timeServed += timeServed;
      }
      
      user.currentJailRecord = null;
      user.inJail = false;
      user.jailTimeEnd = null;
      user.breakoutAttempted = false;
      
      await user.save();
      
      eventEmitter.emit('user.released', {
        userId,
        jailRecordId: jailRecord._id,
        timeServed
      });
      
      return { released: true, timeServed };
    } catch (error) {
      console.error('Error in releaseUser:', error);
      throw error;
    }
  }
  
  async attemptBreakout(userId) {
    try {
      const user = await User.findById(userId).populate('currentJailRecord');
      if (!user) throw new Error('User not found');
      
      if (!user.currentJailRecord) {
        return { success: false, message: 'User is not in jail' };
      }
      
      let jailRecord = user.currentJailRecord;
      
      if (jailRecord.breakoutAttempted) {
        return { success: false, message: 'Breakout already attempted' };
      }
      
      if (typeof jailRecord.attemptBreakout === 'function') {
        await jailRecord.attemptBreakout();
      } else {
        jailRecord.breakoutAttempted = true;
        await jailRecord.save();
      }
      
      user.breakoutAttempted = true;
      await user.save();
      
      let baseSuccessChance = 0.6;
      
      if (user.level) {
        baseSuccessChance += (user.level * 0.015);
      }
      
      baseSuccessChance -= (jailRecord.severity * 0.03);
      
      const successChance = Math.max(0.25, Math.min(0.9, baseSuccessChance));
      
      const random = this.chanceService ? this.chanceService.random() : Math.random();
      const isSuccessful = random < successChance;
      
      if (isSuccessful) {
        if (typeof jailRecord.breakout === 'function') {
          await jailRecord.breakout();
        } else {
          jailRecord.breakoutSuccessful = true;
          jailRecord.breakoutTime = new Date();
          await jailRecord.save();
        }
        
        const startTime = jailRecord.startTime.getTime();
        const endTime = jailRecord.breakoutTime.getTime();
        const timeServed = Math.floor((endTime - startTime) / 1000);
        
        if (typeof user.updateJailStats === 'function') {
          await user.updateJailStats(timeServed, true);
        } else {
          user.jailStats = user.jailStats || {
            timesSentToJail: 0,
            successfulBreakouts: 0,
            failedBreakouts: 0,
            timeServed: 0
          };
          user.jailStats.timeServed += timeServed;
          user.jailStats.successfulBreakouts += 1;
        }
        
        user.currentJailRecord = null;
        user.inJail = false;
        user.jailTimeEnd = null;
        
        await user.save();
        
        eventEmitter.emit('user.breakout.success', {
          userId,
          jailRecordId: jailRecord._id,
          timeServed
        });
        
        return {
          success: true,
          breakoutSuccessful: true,
          message: "Breakout successful! You're free!",
          timeServed
        };
      } else {
        if (typeof user.updateJailStats === 'function') {
          await user.updateJailStats(0, false);
        } else {
          user.jailStats = user.jailStats || {
            timesSentToJail: 0,
            successfulBreakouts: 0,
            failedBreakouts: 0,
            timeServed: 0
          };
          user.jailStats.failedBreakouts += 1;
        }
        
        eventEmitter.emit('user.breakout.failed', {
          userId,
          jailRecordId: jailRecord._id
        });
        
        return {
          success: true,
          breakoutSuccessful: false,
          message: "Breakout attempt failed! Serve your time."
        };
      }
    } catch (error) {
      console.error('Error in attemptBreakout:', error);
      throw error;
    }
  }
  
  async getJailHistory(userId, limit = 10) {
    try {
      if (typeof JailRecord.getAllJailHistoryForUser === 'function') {
        return await JailRecord.getAllJailHistoryForUser(userId, limit);
      } else {
        return await JailRecord.find({ user: userId })
          .sort({ startTime: -1 })
          .limit(limit);
      }
    } catch (error) {
      console.error('Error in getJailHistory:', error);
      throw error;
    }
  }
}

const jailService = new JailService();

module.exports = { jailService, JailService, eventEmitter };