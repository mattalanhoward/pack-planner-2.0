// server/src/test/routes.categories.test.js

const mongoose = require("mongoose");
const request = require("supertest");

// A fixed, 24-character hex string to satisfy an ObjectId.
// We’ll pretend this is the userId for every request.
const MOCK_USER_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

jest.mock("../middleware/auth", () => {
  // Every incoming request will have req.userId = MOCK_USER_ID
  return (req, res, next) => {
    req.userId = MOCK_USER_ID;
    return next();
  };
});

const app = require("../app");
const GearList = require("../models/gearList");
const Category = require("../models/category");

describe("Categories routes", () => {
  let listId; // We'll assign this in each test via createGearList()

  beforeAll(async () => {
    // Connect to the in-memory MongoDB (globalSetup has set process.env.MONGO_URI)
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Clear out everything so tests stay isolated
    await GearList.deleteMany({});
    await Category.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect once all tests are finished
    await mongoose.disconnect();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Helper: create a GearList document with exactly the required fields:
  //   - owner (ObjectId)    ← must match MOCK_USER_ID
  //   - title (String)      ← required by gearListSchema
  // If you ever add more "required" fields to gearListSchema, add them here.
  // Returns the new list’s string ID.
  // ────────────────────────────────────────────────────────────────────────────
  async function createGearList() {
    const gl = new GearList({
      _id: new mongoose.Types.ObjectId(),
      owner: MOCK_USER_ID,
      title: "Test List", // required by gearListSchema
      // timestamps (createdAt/updatedAt) will be auto-set
    });
    await gl.save();
    return gl._id.toHexString();
  }

  // ============================================
  // 1) TEST: GET /api/lists/:listId/categories
  // ============================================
  describe("GET  /api/lists/:listId/categories", () => {
    it("returns 404 if the GearList does not exist or is not owned by this user", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();

      const res = await request(app)
        .get(`/api/lists/${fakeListId}/categories`)
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Gear list not found." });
    });

    it("returns an empty array when there are no categories", async () => {
      listId = await createGearList();

      const res = await request(app)
        .get(`/api/lists/${listId}/categories`)
        .send();

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it("returns existing categories sorted by position", async () => {
      listId = await createGearList();

      // Create two categories “out of order” by position
      const cat1 = new Category({
        _id: new mongoose.Types.ObjectId(),
        gearList: listId,
        title: "Second",
        position: 2,
      });
      const cat2 = new Category({
        _id: new mongoose.Types.ObjectId(),
        gearList: listId,
        title: "First",
        position: 1,
      });
      await cat1.save();
      await cat2.save();

      const res = await request(app)
        .get(`/api/lists/${listId}/categories`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      // Should come back in ascending order of “position”
      expect(res.body[0].title).toBe("First");
      expect(res.body[1].title).toBe("Second");
    });
  });

  // ==============================================
  // 2) TEST: POST /api/lists/:listId/categories
  // ==============================================
  describe("POST /api/lists/:listId/categories", () => {
    it("returns 400 when title or position is missing", async () => {
      listId = await createGearList();

      // Missing both title & position
      let res = await request(app)
        .post(`/api/lists/${listId}/categories`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Title and position are required." });

      // Missing title only
      res = await request(app)
        .post(`/api/lists/${listId}/categories`)
        .send({ position: 1 });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Title and position are required." });

      // Missing position only
      res = await request(app)
        .post(`/api/lists/${listId}/categories`)
        .send({ title: "New Cat" });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Title and position are required." });
    });

    it("returns 404 if the GearList does not exist", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .post(`/api/lists/${fakeListId}/categories`)
        .send({ title: "Foo", position: 0 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Gear list not found." });
    });

    it("creates a new category and returns 201 + the created object", async () => {
      listId = await createGearList();

      const payload = { title: "Camping", position: 3 };
      const res = await request(app)
        .post(`/api/lists/${listId}/categories`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        gearList: listId,
        title: "Camping",
        position: 3,
      });
      // Mongoose auto-adds _id and __v
      expect(res.body._id).toBeDefined();
      expect(res.body.__v).toBeDefined();

      // Verify it actually saved to the database
      const dbCat = await Category.findById(res.body._id);
      expect(dbCat).not.toBeNull();
      expect(dbCat.title).toBe("Camping");
      expect(dbCat.position).toBe(3);
    });
  });

  // ===================================================================
  // 3) TEST: PATCH /api/lists/:listId/categories/:catId  (update fields)
  // ===================================================================
  describe("PATCH /api/lists/:listId/categories/:catId", () => {
    let catId;

    beforeEach(async () => {
      listId = await createGearList();
      const cat = new Category({
        _id: new mongoose.Types.ObjectId(),
        gearList: listId,
        title: "Original",
        position: 5,
      });
      await cat.save();
      catId = cat._id.toHexString();
    });

    it("returns 400 if neither title nor position is provided", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Nothing to update." });
    });

    it("returns 404 if the GearList does not exist", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .patch(`/api/lists/${fakeListId}/categories/${catId}`)
        .send({ title: "Whatever" });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Gear list not found." });
    });

    it("returns 404 if the Category does not exist under that list", async () => {
      const fakeCatId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${fakeCatId}`)
        .send({ title: "New title" });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Category not found." });
    });

    it("updates title only and returns the updated document", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}`)
        .send({ title: "Changed Title" });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("Changed Title");
      expect(res.body.position).toBe(5); // unchanged

      const dbCat = await Category.findById(catId);
      expect(dbCat.title).toBe("Changed Title");
      expect(dbCat.position).toBe(5);
    });

    it("updates position only and returns the updated document", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}`)
        .send({ position: 99 });

      expect(res.status).toBe(200);
      expect(res.body.position).toBe(99);
      expect(res.body.title).toBe("Original"); // unchanged

      const dbCat = await Category.findById(catId);
      expect(dbCat.position).toBe(99);
      expect(dbCat.title).toBe("Original");
    });

    it("updates both title and position at once", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}`)
        .send({ title: "New", position: 42 });

      expect(res.status).toBe(200);
      expect(res.body.title).toBe("New");
      expect(res.body.position).toBe(42);

      const dbCat = await Category.findById(catId);
      expect(dbCat.title).toBe("New");
      expect(dbCat.position).toBe(42);
    });
  });

  // ==============================================================
  // 4) TEST: PATCH /api/lists/:listId/categories/:catId/position
  // ==============================================================
  describe("PATCH /api/lists/:listId/categories/:catId/position", () => {
    let catId;

    beforeEach(async () => {
      listId = await createGearList();
      const cat = new Category({
        _id: new mongoose.Types.ObjectId(),
        gearList: listId,
        title: "PosTest",
        position: 10,
      });
      await cat.save();
      catId = cat._id.toHexString();
    });

    it("returns 400 if position is not provided", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}/position`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Position is required." });
    });

    it("returns 404 if the GearList does not exist", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .patch(`/api/lists/${fakeListId}/categories/${catId}/position`)
        .send({ position: 7 });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Gear list not found." });
    });

    it("returns 404 if the Category is not found under that list", async () => {
      const fakeCatId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${fakeCatId}/position`)
        .send({ position: 7 });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Category not found." });
    });

    it("updates position and returns the updated category", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}/position`)
        .send({ position: 123 });

      expect(res.status).toBe(200);
      expect(res.body.position).toBe(123);
      expect(res.body.title).toBe("PosTest");

      const dbCat = await Category.findById(catId);
      expect(dbCat.position).toBe(123);
      expect(dbCat.title).toBe("PosTest");
    });
  });

  // ==============================================================
  // 5) TEST: DELETE /api/lists/:listId/categories/:catId
  // ==============================================================
  describe("DELETE /api/lists/:listId/categories/:catId", () => {
    let catId;

    beforeEach(async () => {
      listId = await createGearList();
      const cat = new Category({
        _id: new mongoose.Types.ObjectId(),
        gearList: listId,
        title: "ToBeDeleted",
        position: 42,
      });
      await cat.save();
      catId = cat._id.toHexString();
    });

    it("returns 404 if the GearList does not exist", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .delete(`/api/lists/${fakeListId}/categories/${catId}`)
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Gear list not found." });
    });

    it("returns 404 if the Category is not found under that list", async () => {
      const fakeCatId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .delete(`/api/lists/${listId}/categories/${fakeCatId}`)
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Category not found." });
    });

    it("deletes the category and returns a success message", async () => {
      const res = await request(app)
        .delete(`/api/lists/${listId}/categories/${catId}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Category deleted." });

      const dbCat = await Category.findById(catId);
      expect(dbCat).toBeNull();
    });
  });
});
