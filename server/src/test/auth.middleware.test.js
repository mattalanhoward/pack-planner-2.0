// server/src/test/auth.middleware.test.js
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");
const mongoose = require("mongoose");
// Make sure JWT_SECRET is defined
process.env.JWT_SECRET = "test_jwt_secret";

describe("Auth middleware (unmocked)", () => {
  let token;
  beforeAll(async () => {
    // Connect to the same in‐memory MongoDB your other tests use:
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Create a dummy user in the database:
    const userId = new mongoose.Types.ObjectId();
    // Directly create a token for that user
    token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "1h" });
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("400–401 if no Authorization header", async () => {
    const res = await request(app).get("/api/lists");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Missing Authorization header" });
  });

  it("401 if malformed Authorization header", async () => {
    const res = await request(app)
      .get("/api/lists")
      .set("Authorization", "NotBearer abc.def.ghi")
      .send();
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid Authorization format" });
  });

  it("401 if invalid/expired token", async () => {
    const res = await request(app)
      .get("/api/lists")
      .set("Authorization", "Bearer invalid.token.here")
      .send();
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Invalid or expired token" });
  });

  it("passes through when token is valid", async () => {
    // Here we aren’t testing /api/lists deeply, just that auth middleware allows it.
    // Hit GET /api/lists with a valid token—even if there are no lists, we should get 200 [].
    const res = await request(app)
      .get("/api/lists")
      .set("Authorization", `Bearer ${token}`)
      .send();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
