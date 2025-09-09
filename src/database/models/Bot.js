const mongoose = require('mongoose');

const botSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  token: {
    type: String,
    required: true
  },
  language: {
    type: String,
    default: 'javascript',
    enum: ['javascript']
  },
  status: {
    type: String,
    default: 'stopped',
    enum: ['running', 'stopped', 'starting', 'stopping', 'error']
  },
  autoStart: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

botSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Bot', botSchema);