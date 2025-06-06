// server/src/test/routes.gearLists.test.js

const mongoose = require("mongoose");
const request = require("supertest");

// A fixed, 24‐character hex string to satisfy an ObjectId.
// All mock auth requests will have req.userId = MOCK_USER_ID.
const MOCK_USER_ID = "bbbbbbbbbbbbbbbbbbbbbbbb";

jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.userId = MOCK_USER_ID;
    return next();
  };
});

const app = require("../app");
const GearList = require("../models/gearList");
const Category = require("../models/category");

describe("GearLists routes", () => {
  let existingListId;

  beforeAll(async () => {
    // Connect to in‐memory MongoDB (globalSetup has set process.env.MONGO_URI)
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Clear GearList and Category collections between tests
    await GearList.deleteMany({});
    await Category.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect when all tests are done
    await mongoose.disconnect();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Helper: create a GearList document with required fields.
  // Returns its string _id.
  // ────────────────────────────────────────────────────────────────────────────
  async function createGearList(title = "My List") {
    const gl = new GearList({
      _id: new mongoose.Types.ObjectId(),
      owner: MOCK_USER_ID,
      title: title,
    });
    await gl.save();
    return gl._id.toHexString();
  }

  // ============================================
  // 1) TEST: GET /api/lists
  // ============================================
  describe("GET /api/lists", () => {
    it("returns an empty array when this user has no lists", async () => {
      const res = await request(app).get("/api/lists").send();

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it("returns only this user’s lists", async () => {
      // Create one list for MOCK_USER_ID
      const listId1 = await createGearList("User List 1");
      // Simulate another user’s list directly in DB
      const otherId = new mongoose.Types.ObjectId().toHexString();
      await new GearList({
        _id: new mongoose.Types.ObjectId(),
        owner: otherId,
        title: "Other User List",
      }).save();

      const res = await request(app).get("/api/lists").send();

      expect(res.status).toBe(200);
      // Should return exactly one list, belonging to MOCK_USER_ID
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(listId1);
      expect(res.body[0].owner).toBe(MOCK_USER_ID);
      expect(res.body[0].title).toBe("User List 1");
    });
  });

  // ============================================
  // 2) TEST: POST /api/lists
  // ============================================
  describe("POST /api/lists", () => {
    it("returns 400 when title is missing", async () => {
      const res = await request(app).post("/api/lists").send({}); // no title

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Title is required." });
    });

    it("creates a new gear list and a sample category, then returns both", async () => {
      const payload = { title: "New Test List" };
      const res = await request(app).post("/api/lists").send(payload);

      expect(res.status).toBe(201);
      // Should return { list: <GearList>, categories: [<Category>] }
      expect(res.body).toHaveProperty("list");
      expect(res.body).toHaveProperty("categories");
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect(res.body.categories.length).toBe(1);

      const returnedList = res.body.list;
      const returnedCat = res.body.categories[0];

      // Verify the list fields
      expect(returnedList._id).toBeDefined();
      expect(returnedList.owner).toBe(MOCK_USER_ID);
      expect(returnedList.title).toBe("New Test List");

      // Verify the sample category fields
      expect(returnedCat._id).toBeDefined();
      expect(returnedCat.gearList).toBe(returnedList._id);
      expect(returnedCat.title).toBe("Sample Category");
      expect(returnedCat.position).toBe(0);

      // Confirm they exist in the database
      const dbList = await GearList.findById(returnedList._id);
      expect(dbList).not.toBeNull();
      expect(dbList.title).toBe("New Test List");

      const dbCat = await Category.findOne({ gearList: returnedList._id });
      expect(dbCat).not.toBeNull();
      expect(dbCat.title).toBe("Sample Category");
      expect(dbCat.position).toBe(0);

      // Store for later deletion tests
      existingListId = returnedList._id;
    });
  });

  // ============================================
  // 3) TEST: PATCH /api/lists/:listId
  // ============================================
  describe("PATCH /api/lists/:listId", () => {
    let listId;
    beforeEach(async () => {
      listId = await createGearList("Original Title");
    });

    it("returns 400 when title is missing", async () => {
      const res = await request(app).patch(`/api/lists/${listId}`).send({}); // no title

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Title is required." });
    });

    it("returns 404 if the list does not exist or is not owned by this user", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .patch(`/api/lists/${fakeListId}`)
        .send({ title: "Whatever" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "List not found." });
    });

    it("updates the title and returns the updated gear list", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}`)
        .send({ title: "Updated Title" });

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(listId);
      expect(res.body.owner).toBe(MOCK_USER_ID);
      expect(res.body.title).toBe("Updated Title");

      const dbList = await GearList.findById(listId);
      expect(dbList.title).toBe("Updated Title");
    });
  });

  // ============================================
  // 4) TEST: DELETE /api/lists/:listId
  // ============================================
  describe("DELETE /api/lists/:listId", () => {
    let listId;
    beforeEach(async () => {
      listId = await createGearList("ToBeDeleted List");
      // Also create a couple of categories tied to this list
      await Category.create({
        _id: new mongoose.Types.ObjectId(),
        gearList: listId,
        title: "Cat A",
        position: 0,
      });
      await Category.create({
        _id: new mongoose.Types.ObjectId(),
        gearList: listId,
        title: "Cat B",
        position: 1,
      });
    });

    it("returns 404 if the list does not exist", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app).delete(`/api/lists/${fakeListId}`).send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "List not found." });
    });

    it("deletes the list and its categories, then returns a success message", async () => {
      const res = await request(app).delete(`/api/lists/${listId}`).send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "List deleted." });

      // Verify the list is gone
      const dbList = await GearList.findById(listId);
      expect(dbList).toBeNull();

      // Verify categories for that list are also removed
      const remainingCats = await Category.find({ gearList: listId });
      expect(remainingCats.length).toBe(0);
    });
  });
});
