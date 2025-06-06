// server/src/test/routes.gearLists.errors.test.js

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

describe("GearLists routes (forced DB errors)", () => {
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

  it("GET /api/lists catches DB error", async () => {
    jest.spyOn(GearList, "find").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app).get("/api/lists").send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  it("POST /api/lists catches DB error when creating list", async () => {
    jest.spyOn(GearList, "create").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app).post("/api/lists").send({ title: "Test" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  it("PATCH /api/lists/:listId catches DB error on findOneAndUpdate", async () => {
    const fakeListId = new mongoose.Types.ObjectId().toHexString();
    jest.spyOn(GearList, "findOneAndUpdate").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app)
      .patch(`/api/lists/${fakeListId}`)
      .send({ title: "Updated" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: expect.any(String) });
  });

  it("DELETE /api/lists/:listId catches DB error on findOneAndDelete", async () => {
    const fakeListId = new mongoose.Types.ObjectId().toHexString();
    jest.spyOn(GearList, "findOneAndDelete").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app).delete(`/api/lists/${fakeListId}`).send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: expect.any(String) });
  });
});
