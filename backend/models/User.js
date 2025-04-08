// models/User.js
const mongoose = require('mongoose');

// Define inventoryItemSchema
const inventoryItemSchema = new mongoose.Schema({
    name: String,
    quantity: { type: Number, default: 1 },
    price: Number,
    attributes: mongoose.Schema.Types.Mixed,
    image: String,
});

const bossItemSchema = new mongoose.Schema({
    name: String,
    quantity: { type: Number, default: 1 },
    image: String,
});

// Define userSchema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    level: { type: Number, default: 1 },
    xp: { type: Number, default: 0 },
    rank: { type: String, default: 'Homeless Potato' },
    money: { type: Number, default: 0 },
    isAlive: { type: Boolean, default: true },
    kills: { type: Number, default: 0 },
    bossItems: [bossItemSchema],
    lastAssassinationAttempt: { type: Date, default: null },
    cars: [
        {
            name: String,
            price: Number,
            baseChance: Number,
            image: String,
        },
    ],
    crimesPerformed: { type: Number, default: 0 },
    inventory: [inventoryItemSchema], // Use inventoryItemSchema here
    missionsCompleted: { type: Number, default: 0 },
    stolenItems: [
        {
            name: String,
            price: Number,
            image: String,
        },
    ],
    inJail: { type: Boolean, default: false },
    jailTimeEnd: { type: Date, default: null },
    breakoutAttempted: { type: Boolean, default: false }, 
});

module.exports = mongoose.model('User', userSchema);