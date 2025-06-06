// server/src/test/routes.auth.errors.test.js

const mongoose = require("mongoose");
const request = require("supertest");
const User = require("../models/user");

// Use a fixed, 24‐char hex string for all mocks (though auth routes don’t need it)
const MOCK_USER_ID = "eeeeeeeeeeeeeeeeeeeeeeee";

jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.userId = MOCK_USER_ID;
    return next();
  };
});

const app = require("../app");

describe("Auth routes (forced DB errors)", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("POST /api/auth/register catches and returns 500 on unexpected error", async () => {
    // Mock User.findOne to throw
    jest.spyOn(User, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB findOne fail"));
    });

    const res = await request(app).post("/api/auth/register").send({
      email: "err@example.com",
      trailname: "ErrUser",
      password: "whatever",
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error during registration." });
  });

  it("POST /api/auth/login catches and returns 500 on unexpected error", async () => {
    // Mock User.findOne to throw
    jest.spyOn(User, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB findOne fail"));
    });

    const res = await request(app).post("/api/auth/login").send({
      email: "err@example.com",
      password: "whatever",
    });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error during login." });
  });
});
