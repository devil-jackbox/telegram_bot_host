const mongoose = require('mongoose');

const botLogSchema = new mongoose.Schema({
  botId: {
    type: String,
    required: true,
    index: true
  },
  level: {
    type: String,
    required: true,
    enum: ['info', 'warn', 'error', 'debug']
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

botLogSchema.index({ botId: 1, timestamp: -1 });
botLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('BotLog', botLogSchema);