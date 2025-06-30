const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

const router = express.Router();
const JWT_EXP = "7d"; // token validity

const nodemailer = require("nodemailer");
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true, // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(userEmail, token) {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"PackPlanner" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: "Please verify your email",
    html: `
      <p>Hi—thanks for registering! Click below to verify:</p>
      <a href="${verifyUrl}">Verify your email</a>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

async function sendPasswordResetEmail(userEmail, token) {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const RESET_EXP = Number(process.env.RESET_TOKEN_EXP) || 3600;
  await transporter.sendMail({
    from: `"PackPlanner" <${process.env.SMTP_USER}>`,
    to: userEmail,
    subject: "Reset your PackPlanner password",
    html: `
      <p>We received a request to reset your password.</p>
      <p><a href="${resetUrl}">Click here to choose a new password</a>.</p>
      <p>This link will expire in ${RESET_EXP / 3600} hour(s).</p>
      <p>If you didn’t request this, you can safely ignore this email.</p>
    `,
  });
}

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).send({ message: "Email not found." });

  // 1) Generate a token & expiry
  const token = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + process.env.RESET_TOKEN_EXP * 1000;
  await user.save();

  // 2) Send the reset email
  await sendPasswordResetEmail(user.email, token);

  res.send({ message: "Password reset email sent. Check your inbox." });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user)
    return res.status(400).json({ message: "Invalid or expired token." });

  await user.setPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: "Password has been reset." });
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, trailname, password } = req.body;
    if (!email || !trailname || !password)
      return res
        .status(400)
        .json({ message: "Email, trailname and password are required." });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email already in use." });

    // 1) Create user unverified
    const user = new User({ email, trailname, isVerified: false });
    await user.setPassword(password);

    // 2) Generate & store verify token
    const verifyToken = crypto.randomBytes(20).toString("hex");
    user.verifyEmailToken = verifyToken;
    user.verifyEmailExpires = Date.now() + 24 * 60 * 60 * 1000; // 24h
    await user.save();

    // 3) Email the link
    await sendVerificationEmail(user.email, verifyToken);

    // 4) Tell the client to check their email
    return res
      .status(201)
      .json({ message: "Registered! Check your email to verify." });
  } catch (err) {
    console.error("Register error:", err);
    return res
      .status(500)
      .json({ message: "Server error during registration." });
  }
});

// 2) The verification-consume endpoint
router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({
    verifyEmailToken: token,
    verifyEmailExpires: { $gt: Date.now() },
  });
  if (!user)
    return res.status(400).json({ message: "Invalid or expired token." });

  user.isVerified = true;
  user.verifyEmailToken = undefined;
  user.verifyEmailExpires = undefined;
  await user.save();

  // Now that they're verified, issue the JWT:
  const jwtToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXP }
  );
  return res.json({
    message: "Email verified—thank you!",
    token: jwtToken,
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email before logging in." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: JWT_EXP }
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
});

module.exports = router;
