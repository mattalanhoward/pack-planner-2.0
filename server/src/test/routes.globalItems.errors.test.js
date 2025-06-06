// server/src/test/routes.globalItems.errors.test.js

const mongoose = require("mongoose");
const request = require("supertest");
const GlobalItem = require("../models/globalItem");
const GearItem = require("../models/gearItem");

// Use a fixed, 24‐char hex string for all mocks
const MOCK_USER_ID = "eeeeeeeeeeeeeeeeeeeeeeee";

jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.userId = MOCK_USER_ID;
    return next();
  };
});

const app = require("../app");

describe("GlobalItems routes (forced DB errors)", () => {
  let globalItemId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await GlobalItem.deleteMany({});
    await GearItem.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Create a valid GlobalItem owned by MOCK_USER_ID
    const gi = new GlobalItem({
      _id: new mongoose.Types.ObjectId(),
      owner: MOCK_USER_ID,
      name: "Template",
    });
    await gi.save();
    globalItemId = gi._id.toHexString();
  });

  it("GET /api/global/items catches DB error", async () => {
    jest.spyOn(GlobalItem, "find").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app).get("/api/global/items").send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  it("POST /api/global/items catches DB error", async () => {
    jest.spyOn(GlobalItem, "create").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app)
      .post("/api/global/items")
      .send({ name: "NewItem" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  it("PATCH /api/global/items/:id catches DB error on findOneAndUpdate", async () => {
    jest.spyOn(GlobalItem, "findOneAndUpdate").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app)
      .patch(`/api/global/items/${globalItemId}`)
      .send({ name: "Updated" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  it("DELETE /api/global/items/:id catches DB error on findOneAndDelete", async () => {
    jest.spyOn(GlobalItem, "findOneAndDelete").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app)
      .delete(`/api/global/items/${globalItemId}`)
      .send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: expect.any(String) });
  });
});
