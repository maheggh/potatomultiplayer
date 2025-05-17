const mongoose = require('mongoose');

// Enhanced Boss Item Schema with improved properties
const bossItemSchema = new mongoose.Schema({
    name: String,
    quantity: { type: Number, default: 1 },
    image: String,
    description: String,
    rarity: { 
        type: String, 
        enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
        default: 'Common'
    },
    effects: mongoose.Schema.Types.Mixed // Store effects data for game mechanics
});

// Enhanced Inventory Item Schema
const inventoryItemSchema = new mongoose.Schema({
    name: String,
    quantity: { type: Number, default: 1 },
    price: Number,
    attributes: mongoose.Schema.Types.Mixed, // For weapon accuracy, armor defense, etc.
    image: String,
    category: { 
        type: String, 
        enum: ['weapon', 'armor', 'consumable', 'special', 'material'],
        default: 'weapon'
    }
});

// Car Schema
const carSchema = new mongoose.Schema({
    name: String,
    price: Number,
    baseChance: Number,
    image: String,
    category: { 
        type: String, 
        enum: ['standard', 'luxury', 'sports', 'suv', 'truck'],
        default: 'standard'
    }
});

// Stolen Item Schema
const stolenItemSchema = new mongoose.Schema({
    name: String,
    price: Number,
    image: String,
    location: String, // Where it was stolen from
    timestamp: { type: Date, default: Date.now }
});

// Define userSchema
const userSchema = new mongoose.Schema({
    // Basic user data
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // Player progression
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    rank: { type: String, default: 'Homeless Potato' },
    money: { type: Number, default: 0 },
    
    // Player status
    isAlive: { type: Boolean, default: true },
    kills: { type: Number, default: 0 },
    
    // Inventories
    bossItems: [bossItemSchema],
    inventory: [inventoryItemSchema],
    cars: [carSchema],
    stolenItems: [stolenItemSchema],
    
    // Activity tracking
    crimesPerformed: { type: Number, default: 0 },
    missionsCompleted: { type: Number, default: 0 },
    
    // Jail system
    currentJailRecord: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JailRecord',
        default: null
    },
    jailStats: {
        timesSentToJail: { type: Number, default: 0 },
        successfulBreakouts: { type: Number, default: 0 },
        failedBreakouts: { type: Number, default: 0 },
        timeServed: { type: Number, default: 0 }
    },
    
    // Legacy jail fields (for backward compatibility)
    inJail: { type: Boolean, default: false },
    jailTimeEnd: { type: Date, default: null },
    breakoutAttempted: { type: Boolean, default: false },
    
    // Cooldown system for activities
    assassinationCooldownEnd: { type: Date, default: null },
    raceCooldownEnd: { type: Date, default: null },
    gamblingCooldownEnd: { type: Date, default: null },
    
    // Legacy fields (can be deprecated later)
    lastAssassinationAttempt: { type: Date, default: null },
    
    // Statistics
    stats: {
        // Theft stats
        theftsAttempted: { type: Number, default: 0 },
        theftsSuccessful: { type: Number, default: 0 },
        moneyStolen: { type: Number, default: 0 },
        
        // Car theft stats
        carTheftsAttempted: { type: Number, default: 0 },
        carTheftsSuccessful: { type: Number, default: 0 },
        carsStolen: { type: Number, default: 0 },
        
        // Race stats
        racesParticipated: { type: Number, default: 0 },
        racesWon: { type: Number, default: 0 },
        carsLost: { type: Number, default: 0 },
        carsWon: { type: Number, default: 0 },
        
        // Assassination stats
        assassinationsAttempted: { type: Number, default: 0 },
        assassinationsSuccessful: { type: Number, default: 0 },
        retaliationsReceived: { type: Number, default: 0 },
        
        // Boss battle stats
        bossesDefeated: { type: Number, default: 0 },
        bossItemsAcquired: { type: Number, default: 0 },
        
        // Gambling stats
        gamblingWinnings: { type: Number, default: 0 },
        gamblingLosses: { type: Number, default: 0 }
    },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    lastActive: { type: Date, default: Date.now }
}, { timestamps: true });

// Virtual to check if user is in jail
userSchema.virtual('isInJail').get(function() {
    return this.inJail || !!this.currentJailRecord;
});

// Method to update jail stats
userSchema.methods.updateJailStats = async function(timeServed, breakoutSuccess) {
    if (timeServed) {
        this.jailStats.timeServed += timeServed;
    }
    
    if (breakoutSuccess === true) {
        this.jailStats.successfulBreakouts += 1;
    } else if (breakoutSuccess === false) {
        this.jailStats.failedBreakouts += 1;
    }
    
    return this.save();
};

// Static method to find users currently in jail
userSchema.statics.findUsersInJail = function() {
    return this.find({ 
        $or: [
            { inJail: true },
            { currentJailRecord: { $ne: null } }
        ]
    })
    .populate('currentJailRecord')
    .exec();
};

// Cooldown-related methods
userSchema.methods.isOnCooldown = function(activityType) {
    const cooldownField = `${activityType}CooldownEnd`;
    if (!this[cooldownField]) return false;
    
    return new Date() < new Date(this[cooldownField]);
};

userSchema.methods.getCooldownRemaining = function(activityType) {
    const cooldownField = `${activityType}CooldownEnd`;
    if (!this[cooldownField]) return 0;
    
    const remainingMs = new Date(this[cooldownField]) - new Date();
    return Math.max(0, Math.ceil(remainingMs / 1000)); // Return seconds remaining
};

userSchema.methods.setCooldown = function(activityType, durationInSeconds) {
    const cooldownField = `${activityType}CooldownEnd`;
    this[cooldownField] = new Date(Date.now() + durationInSeconds * 1000);
};

userSchema.methods.clearCooldown = function(activityType) {
    const cooldownField = `${activityType}CooldownEnd`;
    this[cooldownField] = null;
};

// Activity tracking methods
userSchema.methods.recordTheft = function(success, moneyAmount = 0) {
    this.stats.theftsAttempted += 1;
    if (success) {
        this.stats.theftsSuccessful += 1;
        this.stats.moneyStolen += moneyAmount;
    }
};

userSchema.methods.recordCarTheft = function(success) {
    this.stats.carTheftsAttempted += 1;
    if (success) {
        this.stats.carTheftsSuccessful += 1;
        this.stats.carsStolen += 1;
    }
};

userSchema.methods.recordRace = function(won, carWon = null, carLost = null) {
    this.stats.racesParticipated += 1;
    if (won) {
        this.stats.racesWon += 1;
        if (carWon) this.stats.carsWon += 1;
    } else {
        if (carLost) this.stats.carsLost += 1;
    }
};

userSchema.methods.recordAssassination = function(success, retaliated = false) {
    this.stats.assassinationsAttempted += 1;
    if (success) {
        this.stats.assassinationsSuccessful += 1;
    }
    if (retaliated) {
        this.stats.retaliationsReceived += 1;
    }
};

userSchema.methods.recordBossBattle = function(success, itemAcquired = false) {
    if (success) {
        this.stats.bossesDefeated += 1;
        if (itemAcquired) this.stats.bossItemsAcquired += 1;
    }
};

userSchema.methods.recordGambling = function(winnings) {
    if (winnings > 0) {
        this.stats.gamblingWinnings += winnings;
    } else {
        this.stats.gamblingLosses += Math.abs(winnings);
    }
};

module.exports = mongoose.model('User', userSchema);