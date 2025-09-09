const mongoose = require('mongoose');

const botErrorSchema = new mongoose.Schema({
  botId: {
    type: String,
    required: true,
    index: true
  },
  error: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

botErrorSchema.index({ botId: 1, timestamp: -1 });
botErrorSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7 * 24 * 60 * 60 });

module.exports = mongoose.model('BotError', botErrorSchema);