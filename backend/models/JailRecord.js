const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jailRecordSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  endTime: {
    type: Date,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  severity: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  breakoutAttempted: {
    type: Boolean,
    default: false
  },
  breakoutSuccessful: {
    type: Boolean,
    default: false
  },
  breakoutTime: {
    type: Date,
    default: null
  },
  released: {
    type: Boolean,
    default: false
  },
  releaseTime: {
    type: Date,
    default: null
  }
}, { timestamps: true });

jailRecordSchema.methods.isActive = function() {
  if (this.released || this.breakoutSuccessful) return false;
  
  const now = new Date();
  return now < this.endTime && now >= this.startTime;
};

jailRecordSchema.methods.getRemainingTime = function() {
  if (this.released || this.breakoutSuccessful) return 0;
  
  const now = new Date();
  if (now >= this.endTime) return 0;
  
  return Math.ceil((this.endTime.getTime() - now.getTime()) / 1000);
};

jailRecordSchema.methods.release = function() {
  this.released = true;
  this.releaseTime = new Date();
  return this.save();
};

jailRecordSchema.methods.attemptBreakout = function() {
  this.breakoutAttempted = true;
  return this.save();
};

jailRecordSchema.methods.breakout = function() {
  this.breakoutSuccessful = true;
  this.breakoutTime = new Date();
  return this.save();
};

jailRecordSchema.statics.findActiveForUser = async function(userId) {
  const now = new Date();
  return this.findOne({
    user: userId,
    released: false,
    breakoutSuccessful: false,
    startTime: { $lte: now },
    endTime: { $gt: now }
  }).sort({ endTime: -1 });
};

jailRecordSchema.statics.findLatestForUser = async function(userId) {
  return this.findOne({ user: userId }).sort({ createdAt: -1 });
};

jailRecordSchema.statics.getAllJailHistoryForUser = async function(userId, limit = 10) {
  return this.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('JailRecord', jailRecordSchema);