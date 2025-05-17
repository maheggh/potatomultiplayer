// Full Updated JailService.js (continued)

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
      
      // Apply jail time reduction based on player level and severity
      // This makes the system more forgiving for new players
      duration = this.calculateReducedJailTime(duration, user.level || 1, severity);
      
      await this.checkAndCloseActiveRecords(userId);
      
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + (duration * 1000));
      
      const jailRecord = await JailRecord.create({
        user: userId,
        startTime,
        endTime,
        reason,
        severity
      });
      
      user.currentJailRecord = jailRecord._id;
      // Initialize jailStats if it doesn't exist
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
  
  // Method to calculate reduced jail time based on player level
  calculateReducedJailTime(baseDuration, playerLevel, severity) {
    // Base reduction for new players (-20% per severity level below 5)
    const newPlayerFactor = Math.max(0, 1 - (Math.min(5, playerLevel) * 0.04));
    
    // Higher level players get less time reduction
    const levelFactor = playerLevel <= 10 ? 1 - (playerLevel * 0.02) : 0.8;
    
    // Cap minimum jail time at 15 seconds
    return Math.max(15, Math.round(baseDuration * levelFactor * newPlayerFactor));
  }
  
  async checkAndCloseActiveRecords(userId) {
    try {
      // Add error handling for case where findActiveForUser is undefined
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
            // Create a new jail record for legacy data
            const jailRecord = await JailRecord.create({
              user: userId,
              startTime: new Date(user.jailTimeEnd.getTime() - (60 * 60 * 1000)),
              endTime: user.jailTimeEnd,
              reason: 'Legacy jail sentence',
              breakoutAttempted: user.breakoutAttempted || false
            });
            
            user.currentJailRecord = jailRecord._id;
            await user.save();
            
            return {
              inJail: true,
              jailRecord: jailRecord,
              timeRemaining: this.calculateTimeRemaining(jailRecord),
              breakoutAttempted: jailRecord.breakoutAttempted
            };
          } else {
            // User should be released from jail
            user.inJail = false;
            user.jailTimeEnd = null;
            user.breakoutAttempted = false;
            await user.save();
          }
        }
        
        return { inJail: false };
      }
      
      let jailRecord = user.currentJailRecord;
      
      // Ensure isActive method is properly defined
      if (!jailRecord.isActive || typeof jailRecord.isActive !== 'function') {
        jailRecord.isActive = function() {
          // If already marked as released or broke out, definitely not active
          if (this.released || this.breakoutSuccessful) {
            return false;
          }
          
          const now = new Date();
          const endTime = new Date(this.endTime);
          
          // Validate dates
          if (isNaN(now.getTime()) || isNaN(endTime.getTime())) {
            console.error('Invalid date in isActive calculation');
            return false;
          }
          
          // Still active if current time is before end time
          return now < endTime;
        };
      }
      
      // Check if the jail record is still active
      if (!jailRecord.isActive()) {
        if (!jailRecord.released && !jailRecord.breakoutSuccessful) {
          // Release the user from jail
          if (typeof jailRecord.release === 'function') {
            await jailRecord.release();
          } else {
            // Fallback for missing release method
            jailRecord.released = true;
            jailRecord.releaseTime = new Date();
            await jailRecord.save();
          }
        }
        
        // Calculate time served
        const startTime = jailRecord.startTime.getTime();
        const endTime = (jailRecord.releaseTime || jailRecord.breakoutTime || jailRecord.endTime).getTime();
        const timeServed = Math.floor((endTime - startTime) / 1000);
        
        // Update user's jail stats
        if (typeof user.updateJailStats === 'function') {
          await user.updateJailStats(timeServed);
        } else {
          // Fallback for missing updateJailStats method
          user.jailStats = user.jailStats || {
            timesSentToJail: 0,
            successfulBreakouts: 0,
            failedBreakouts: 0,
            timeServed: 0
          };
          user.jailStats.timeServed += timeServed;
        }
        
        // Clear jail data
        user.currentJailRecord = null;
        user.inJail = false;
        user.jailTimeEnd = null;
        user.breakoutAttempted = false;
        
        await user.save();
        
        return {
          inJail: false,
          released: true,
          timeServed
        };
      }
      
      // Ensure the getRemainingTime method is properly defined
      if (!jailRecord.getRemainingTime || typeof jailRecord.getRemainingTime !== 'function') {
        jailRecord.getRemainingTime = function() {
          // If already released or broke out, return 0
          if (this.released || this.breakoutSuccessful) {
            return 0;
          }
          
          const now = new Date();
          const endTime = new Date(this.endTime);
          
          // Validate dates to avoid NaN results
          if (isNaN(now.getTime()) || isNaN(endTime.getTime())) {
            console.error('Invalid date in getRemainingTime calculation');
            // Return a default value of 1 minute to avoid 0:00 display issues
            return 60;
          }
          
          // Calculate time remaining in seconds, ensure it's non-negative
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
          return remaining;
        };
      } else {
        // Patch the existing getRemainingTime function to ensure it never returns negative values
        const originalGetRemainingTime = jailRecord.getRemainingTime;
        jailRecord.getRemainingTime = function() {
          try {
            const result = originalGetRemainingTime.call(this);
            // Ensure result is a valid number and non-negative
            return isNaN(result) ? 60 : Math.max(0, result);
          } catch (error) {
            console.error('Error in getRemainingTime:', error);
            return 60; // Default to 1 minute on error
          }
        };
      }
      
      // Helper method to calculate time remaining
      const timeRemaining = this.calculateTimeRemaining(jailRecord);
      
      return {
        inJail: true,
        jailRecord,
        timeRemaining,
        breakoutAttempted: jailRecord.breakoutAttempted
      };
    } catch (error) {
      console.error('Error in getJailStatus:', error);
      throw error;
    }
  }
  
  // Helper method to calculate time remaining with error handling
  calculateTimeRemaining(jailRecord) {
    if (!jailRecord) return 0;
    
    try {
      // Check if the record has a getRemainingTime method
      if (typeof jailRecord.getRemainingTime === 'function') {
        const remaining = jailRecord.getRemainingTime();
        return isNaN(remaining) ? 60 : Math.max(0, remaining);
      }
      
      // Manual calculation if method not available
      if (jailRecord.released || jailRecord.breakoutSuccessful) {
        return 0;
      }
      
      const now = new Date();
      const endTime = new Date(jailRecord.endTime);
      
      if (isNaN(endTime.getTime())) {
        console.error('Invalid end time in jail record:', jailRecord.endTime);
        return 60; // Default to 1 minute
      }
      
      return Math.max(0, Math.floor((endTime - now) / 1000));
    } catch (error) {
      console.error('Error calculating time remaining:', error);
      return 60; // Default to 1 minute on error
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
      
      // Release the user from jail
      if (typeof jailRecord.release === 'function') {
        await jailRecord.release();
      } else {
        // Fallback implementation
        jailRecord.released = true;
        jailRecord.releaseTime = new Date();
        await jailRecord.save();
      }
      
      // Calculate time served
      const startTime = jailRecord.startTime.getTime();
      const endTime = jailRecord.releaseTime.getTime();
      const timeServed = Math.floor((endTime - startTime) / 1000);
      
      // Update jail stats
      if (typeof user.updateJailStats === 'function') {
        await user.updateJailStats(timeServed);
      } else {
        // Fallback implementation
        user.jailStats = user.jailStats || {
          timesSentToJail: 0,
          successfulBreakouts: 0,
          failedBreakouts: 0,
          timeServed: 0
        };
        user.jailStats.timeServed += timeServed;
      }
      
      // Clear jail data
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
      
      // Record breakout attempt
      if (typeof jailRecord.attemptBreakout === 'function') {
        await jailRecord.attemptBreakout();
      } else {
        // Fallback implementation
        jailRecord.breakoutAttempted = true;
        await jailRecord.save();
      }
      
      user.breakoutAttempted = true;
      await user.save();
      
      // Improved success chance calculation - more forgiving for new players
      let baseSuccessChance = 0.6; // Increased from 0.5
      
      if (user.level) {
        // Higher level = slightly better chance (+1.5% per level)
        baseSuccessChance += (user.level * 0.015);
      }
      
      // Less penalty for high security
      baseSuccessChance -= (jailRecord.severity * 0.03); // Reduced from 0.05
      
      // Higher minimum success chance (more player-friendly)
      const successChance = Math.max(0.25, Math.min(0.9, baseSuccessChance));
      
      // Determine if breakout is successful
      const random = this.chanceService ? this.chanceService.random() : Math.random();
      const isSuccessful = random < successChance;
      
      if (isSuccessful) {
        // Record successful breakout
        if (typeof jailRecord.breakout === 'function') {
          await jailRecord.breakout();
        } else {
          // Fallback implementation
          jailRecord.breakoutSuccessful = true;
          jailRecord.breakoutTime = new Date();
          await jailRecord.save();
        }
        
        // Calculate time served
        const startTime = jailRecord.startTime.getTime();
        const endTime = jailRecord.breakoutTime.getTime();
        const timeServed = Math.floor((endTime - startTime) / 1000);
        
        // Update jail stats
        if (typeof user.updateJailStats === 'function') {
          await user.updateJailStats(timeServed, true);
        } else {
          // Fallback implementation
          user.jailStats = user.jailStats || {
            timesSentToJail: 0,
            successfulBreakouts: 0,
            failedBreakouts: 0,
            timeServed: 0
          };
          user.jailStats.timeServed += timeServed;
          user.jailStats.successfulBreakouts += 1;
        }
        
        // Clear jail data
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
        // Update jail stats for failed breakout
        if (typeof user.updateJailStats === 'function') {
          await user.updateJailStats(0, false);
        } else {
          // Fallback implementation
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
      // Check if getAllJailHistoryForUser exists
      if (typeof JailRecord.getAllJailHistoryForUser === 'function') {
        return await JailRecord.getAllJailHistoryForUser(userId, limit);
      } else {
        // Fallback implementation
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

// Create a singleton instance to export
const jailService = new JailService();

module.exports = { jailService, JailService, eventEmitter };