const mongoose = require('mongoose');

const environmentVariableSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  value: {
    type: String,
    default: ''
  },
  isSecret: {
    type: Boolean,
    default: false
  }
});

const botEnvironmentVariableSchema = new mongoose.Schema({
  botId: {
    type: String,
    required: true,
    index: true
  },
  environmentVariables: [environmentVariableSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

botEnvironmentVariableSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('BotEnvironmentVariable', botEnvironmentVariableSchema);