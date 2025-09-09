const mongoose = require('mongoose');

const botCodeSchema = new mongoose.Schema({
  botId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  code: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

botCodeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('BotCode', botCodeSchema);