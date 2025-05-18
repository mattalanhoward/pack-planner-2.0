const express  = require('express');
const jwt      = require('jsonwebtoken');
const User     = require('../models/user');

const router   = express.Router();
const JWT_EXP  = '7d';  // token validity

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, trailname, password } = req.body;
    if (!email || !trailname || !password) {
      return res.status(400).json({ message: 'Email, trailname and password are required.' });
    }

    // Check for existing user
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: 'Email already in use.' });
    }

    const user = new User({ email, trailname });
    await user.setPassword(password);
    await user.save();

    // Issue token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXP }
    );

    res.status(201).json({ token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXP }
    );

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

module.exports = router;
