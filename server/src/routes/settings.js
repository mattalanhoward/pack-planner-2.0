// server/routes/settings.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");
const { authenticate } = require("./auth"); // import your JWT middleware

// All /settings routes require a valid Bearer token
router.use(authenticate);

/**
 * GET /api/settings
 *   Returns the current user’s settings
 */
router.get("/", async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // Pull only the fields the client needs:
    const {
      email,
      trailname,
      viewMode,
      timezone,
      locale,
      currency,
      theme,
      weightUnit,
      language,
      region,
    } = user;

    res.json({
      email,
      trailname,
      viewMode,
      timezone,
      locale,
      currency,
      theme: theme || "desert",
      weightUnit: weightUnit || "g",
      language: language || "en",
      region: region || "eu",
    });
  } catch (err) {
    console.error("GET /settings error:", err);
    res.status(500).json({ message: "Could not load settings." });
  }
});

/**
 * PATCH /api/settings
 *   Updates only the fields sent in req.body
 */
router.patch("/", async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    // If they’re changing password, handle separately
    if (updates.password) {
      if (!updates.currentPassword) {
        return res
          .status(400)
          .json({ message: "Current password required to change password." });
      }
      const ok = await user.validatePassword(updates.currentPassword);
      if (!ok) {
        return res.status(403).json({ message: "Wrong current password." });
      }
      await user.setPassword(updates.password);
      delete updates.password;
      delete updates.currentPassword;
    }

    // Whitelist what can be updated:
    const editable = [
      "email",
      "trailname",
      "viewMode",
      "timezone",
      "locale",
      "currency",
      "theme",
      "weightUnit", // <-- new
      "language", // <-- new
      "region", // <-- new
    ];
    editable.forEach((key) => {
      if (updates[key] !== undefined) {
        user[key] = updates[key];
      }
    });

    await user.save();
    res.json({ message: "Settings updated." });
  } catch (err) {
    console.error("PATCH /settings error:", err);
    res.status(500).json({ message: "Could not update settings." });
  }
});

module.exports = router;
