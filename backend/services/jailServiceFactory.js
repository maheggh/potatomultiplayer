// backend/services/jailServiceFactory.js

const { JailService } = require('./jailService');

/**
 * Factory for creating JailService instances
 */
class JailServiceFactory {
  /**
   * Create a JailService instance with optional dependencies
   * @param {Object} options - Options for creating the service
   * @param {Object} options.chanceService - Optional service for randomization (useful for testing)
   * @returns {JailService} - A JailService instance
   */
  static createJailService(options = {}) {
    return new JailService(options.chanceService);
  }
  
  /**
   * Get a singleton instance of JailService
   * @returns {JailService} - The singleton JailService instance
   */
  static getInstance() {
    if (!JailServiceFactory.instance) {
      JailServiceFactory.instance = new JailService();
    }
    return JailServiceFactory.instance;
  }
}

module.exports = JailServiceFactory;