// server/src/test/routes.auth.test.js

const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "test_jwt_secret";

const app = require("../app");
const User = require("../models/user");

describe("Auth routes", () => {
  beforeAll(async () => {
    // Connect to in-memory MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Clear the User collection between tests
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1) POST /api/auth/register
  // ────────────────────────────────────────────────────────────────────────────
  describe("POST /api/auth/register", () => {
    it("returns 400 when required fields are missing", async () => {
      // Missing all three
      let res = await request(app).post("/api/auth/register").send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Email, trailname and password are required.",
      });

      // Missing password
      res = await request(app)
        .post("/api/auth/register")
        .send({ email: "test@example.com", trailname: "hiker" });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Email, trailname and password are required.",
      });
    });

    it("returns 409 when email is already in use", async () => {
      // Create a user manually
      const existing = new User({
        email: "duplicate@example.com",
        trailname: "trailblazer",
        passwordHash: "irrelevant", // we only care about uniqueness
      });
      await existing.save();

      const res = await request(app).post("/api/auth/register").send({
        email: "duplicate@example.com",
        trailname: "newname",
        password: "password123",
      });

      expect(res.status).toBe(409);
      expect(res.body).toEqual({ message: "Email already in use." });
    });

    it("creates a new user and returns 201 + a JWT token", async () => {
      const payload = {
        email: "newuser@example.com",
        trailname: "mountaineer",
        password: "securePassword",
      };
      const res = await request(app).post("/api/auth/register").send(payload);

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();

      // Verify the token’s payload
      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty("userId");
      expect(decoded).toHaveProperty("email", "newuser@example.com");

      // Confirm user exists in DB
      const dbUser = await User.findOne({ email: "newuser@example.com" });
      expect(dbUser).not.toBeNull();
      expect(dbUser.trailname).toBe("mountaineer");
      // Ensure the passwordHash was set (not raw password)
      expect(dbUser.passwordHash).not.toBe("securePassword");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2) POST /api/auth/login
  // ────────────────────────────────────────────────────────────────────────────
  describe("POST /api/auth/login", () => {
    beforeEach(async () => {
      // Create a user with a known password
      const user = new User({
        email: "loginuser@example.com",
        trailname: "logintrail",
      });
      await user.setPassword("rightPassword");
      await user.save();
    });

    it("returns 400 when email or password is missing", async () => {
      // Missing both
      let res = await request(app).post("/api/auth/login").send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email and password are required." });

      // Missing password
      res = await request(app)
        .post("/api/auth/login")
        .send({ email: "loginuser@example.com" });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Email and password are required." });
    });

    it("returns 401 when credentials are invalid", async () => {
      // Wrong email
      let res = await request(app)
        .post("/api/auth/login")
        .send({ email: "wrong@example.com", password: "rightPassword" });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Invalid email or password." });

      // Wrong password
      res = await request(app)
        .post("/api/auth/login")
        .send({ email: "loginuser@example.com", password: "wrongPassword" });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ message: "Invalid email or password." });
    });

    it("logs in with valid credentials and returns a token", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "loginuser@example.com", password: "rightPassword" });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();

      const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
      expect(decoded).toHaveProperty("userId");
      expect(decoded).toHaveProperty("email", "loginuser@example.com");
    });
  });
});
