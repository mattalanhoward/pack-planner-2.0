const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type:     String,
    required: true,
    unique:   true,
    lowercase: true,
    trim:     true,
  },
  trailname: {
    type:     String,
    required: true,
    trim:     true,
  },
  passwordHash: {
    type:     String,
    required: true,
  },
}, {
  timestamps: true,
});

// Helper to set the password
userSchema.methods.setPassword = async function(plainText) {
  const saltRounds = 10;
  this.passwordHash = await bcrypt.hash(plainText, saltRounds);
};

// Helper to check the password
userSchema.methods.validatePassword = async function(plainText) {
  return bcrypt.compare(plainText, this.passwordHash);
};

module.exports = mongoose.model('User', userSchema);
