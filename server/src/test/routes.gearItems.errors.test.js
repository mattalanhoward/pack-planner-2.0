// server/src/test/routes.gearItems.errors.test.js

const mongoose = require("mongoose");
const request = require("supertest");
const GearList = require("../models/gearList");
const Category = require("../models/category");
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

describe("GearItems routes (forced DB errors)", () => {
  let listId, catId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await GearItem.deleteMany({});
    await Category.deleteMany({});
    await GearList.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Create a valid GearList and Category (owned by MOCK_USER_ID)
    const gl = new GearList({
      _id: new mongoose.Types.ObjectId(),
      owner: MOCK_USER_ID,
      title: "TestList",
    });
    await gl.save();
    listId = gl._id.toHexString();

    const cat = new Category({
      _id: new mongoose.Types.ObjectId(),
      gearList: listId,
      title: "TestCat",
      position: 0,
    });
    await cat.save();
    catId = cat._id.toHexString();
  });

  it("GET /items catches DB error on GearList.findOne", async () => {
    jest.spyOn(GearList, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app)
      .get(`/api/lists/${listId}/categories/${catId}/items`)
      .send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });

  it("POST /items catches DB error on GearList.findOne", async () => {
    jest.spyOn(GearList, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app)
      .post(`/api/lists/${listId}/categories/${catId}/items`)
      .send({
        globalItem: new mongoose.Types.ObjectId(),
        name: "Item",
        position: 0,
      });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });

  it("PATCH /items catches DB error on GearList.findOne", async () => {
    const fakeItemId = new mongoose.Types.ObjectId().toHexString();
    jest.spyOn(GearList, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app)
      .patch(`/api/lists/${listId}/categories/${catId}/items/${fakeItemId}`)
      .send({ position: 99 });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });

  it("DELETE /items catches DB error on GearList.findOne", async () => {
    const fakeItemId = new mongoose.Types.ObjectId().toHexString();
    jest.spyOn(GearList, "findOne").mockImplementation(() => {
      return Promise.reject(new Error("DB fail"));
    });

    const res = await request(app)
      .delete(`/api/lists/${listId}/categories/${catId}/items/${fakeItemId}`)
      .send();

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ message: "Server error" });
  });
});
