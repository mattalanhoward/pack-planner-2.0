// server/src/test/routes.categories.errors.test.js

const mongoose = require("mongoose");
const request = require("supertest");
const GearList = require("../models/gearList");
const Category = require("../models/category");

// Use a fixed, 24‐char hex string for all mocks
const MOCK_USER_ID = "eeeeeeeeeeeeeeeeeeeeeeee";

jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.userId = MOCK_USER_ID;
    return next();
  };
});

const app = require("../app");

describe("Categories routes (forced DB errors)", () => {
  let listId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await GearList.deleteMany({});
    await Category.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Create a valid GearList owned by MOCK_USER_ID so that routes can proceed
    const gl = new GearList({
      _id: new mongoose.Types.ObjectId(),
      owner: MOCK_USER_ID,
      title: "TestList",
    });
    await gl.save();
    listId = gl._id.toHexString();
  });

  it("GET /api/lists/:listId/categories catches DB error", async () => {
    jest.spyOn(GearList, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB findOne fail"));
    });

    const res = await request(app)
      .get(`/api/lists/${listId}/categories`)
      .send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });

  it("POST /api/lists/:listId/categories catches DB error", async () => {
    jest.spyOn(GearList, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB findOne fail"));
    });

    const res = await request(app)
      .post(`/api/lists/${listId}/categories`)
      .send({ title: "TestCat", position: 0 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });

  it("PATCH /api/lists/:listId/categories/:catId catches DB error on findOne", async () => {
    const fakeCatId = new mongoose.Types.ObjectId().toHexString();
    jest.spyOn(GearList, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB findOne fail"));
    });

    const res = await request(app)
      .patch(`/api/lists/${listId}/categories/${fakeCatId}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });

  it("DELETE /api/lists/:listId/categories/:catId catches DB error", async () => {
    const fakeCatId = new mongoose.Types.ObjectId().toHexString();
    jest.spyOn(GearList, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB findOne fail"));
    });

    const res = await request(app)
      .delete(`/api/lists/${listId}/categories/${fakeCatId}`)
      .send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });
});
