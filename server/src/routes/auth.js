const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const cookieParser = require("cookie-parser");
const User = require("../models/user");
const { promisify } = require("util");
const router = express.Router();
router.use(cookieParser());

const JWT_EXP = "7d";
const REFRESH_TOKEN_EXP_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict",
  maxAge: REFRESH_TOKEN_EXP_MS,
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(email, token) {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"PackPlanner" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Please verify your email",
    html: `<p>Click to verify:</p><a href="${url}">${url}</a><p>Expires in 24h.</p>`,
  });
}

async function sendPasswordResetEmail(email, token) {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const expHrs = (Number(process.env.RESET_TOKEN_EXP) || 3600) / 3600;
  await transporter.sendMail({
    from: `"PackPlanner" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `<p>Click to reset:</p><a href="${url}">${url}</a><p>Expires in ${expHrs}h.</p>`,
  });
}

// Helpers
function issueTokens(user) {
  const accessToken = jwt.sign(
    { userId: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXP }
  );
  const refreshToken = crypto.randomBytes(40).toString("hex");
  user.refreshTokens.push(refreshToken);
  return { accessToken, refreshToken };
}

async function sendTokenResponse(res, user, { accessToken, refreshToken }) {
  await user.save();
  res.cookie("refreshToken", refreshToken, COOKIE_OPTS).json({ accessToken });
}

// middleware to verify JWT on the Authorization header
async function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or malformed token." });
  }
  const token = auth.split(" ")[1];
  try {
    // verify returns the payload { userId, email, iat, exp }
    const payload = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    // attach userId to req for downstream handlers
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

// --- Routes ---

// GET /auth/me — returns the current user’s public profile
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("email trailname"); // pick only the fields you want to expose
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not retrieve user." });
  }
});

// Forgot password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "Email not found." });

  const token = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + process.env.RESET_TOKEN_EXP * 1000;
  await user.save();

  await sendPasswordResetEmail(email, token);
  res.json({ message: "Password reset email sent." });
});

// Reset password
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user)
    return res.status(400).json({ message: "Invalid or expired token." });

  await user.setPassword(newPassword);
  user.resetPasswordToken = user.resetPasswordExpires = undefined;
  await user.save();
  res.json({ message: "Password has been reset." });
});

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, trailname, password } = req.body;
    if (!email || !trailname || !password) {
      return res
        .status(400)
        .json({ message: "Email, trailname & password are required." });
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({ message: "Email already in use." });
    }

    const user = new User({ email, trailname, isVerified: false });
    await user.setPassword(password);

    const verifyToken = crypto.randomBytes(20).toString("hex");
    user.verifyEmailToken = verifyToken;
    user.verifyEmailExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    await sendVerificationEmail(email, verifyToken);
    res.status(201).json({ message: "Registered! Check your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration error." });
  }
});

// Verify email (and issue tokens)
router.post("/verify-email", async (req, res) => {
  const { token } = req.body;
  const user = await User.findOne({
    verifyEmailToken: token,
    verifyEmailExpires: { $gt: Date.now() },
  });
  if (!user)
    return res.status(400).json({ message: "Invalid or expired token." });

  user.isVerified = true;
  user.verifyEmailToken = user.verifyEmailExpires = undefined;

  const tokens = issueTokens(user);
  await sendTokenResponse(res, user, tokens);
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email & password are required." });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.validatePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email first." });
    }

    const tokens = issueTokens(user);
    await sendTokenResponse(res, user, tokens);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login error." });
  }
});

// Refresh
router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) return res.status(401).end();

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) return res.status(403).end();

    // rotate
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    const tokens = issueTokens(user);
    await sendTokenResponse(res, user, tokens);
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (refreshToken) {
      await User.updateOne(
        { refreshTokens: refreshToken },
        { $pull: { refreshTokens: refreshToken } }
      );
    }
    // Clear the cookie without maxAge:
    res
      .clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      })
      .status(204)
      .end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

module.exports = router;
module.exports.authenticate = authenticate;
