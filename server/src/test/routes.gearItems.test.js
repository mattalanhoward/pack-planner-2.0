// server/src/test/routes.gearItems.test.js

const mongoose = require("mongoose");
const request = require("supertest");

// A fixed, 24-character hex string for our fake user ID
const MOCK_USER_ID = "cccccccccccccccccccccccc";

jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.userId = MOCK_USER_ID;
    return next();
  };
});

const app = require("../app");
const GearList = require("../models/gearList");
const Category = require("../models/category");
const GearItem = require("../models/gearItem");

describe("GearItems routes", () => {
  let listId;
  let catId;

  beforeAll(async () => {
    // Connect to in-memory MongoDB (globalSetup has set process.env.MONGO_URI)
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Clear all relevant collections between tests
    await GearItem.deleteMany({});
    await Category.deleteMany({});
    await GearList.deleteMany({});
  });

  afterAll(async () => {
    // Disconnect once all tests finish
    await mongoose.disconnect();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // Helper: create a GearList, then a Category under that list.
  // Returns { newListId, newCatId } as strings.
  // ────────────────────────────────────────────────────────────────────────────
  async function createListAndCategory() {
    const gl = new GearList({
      _id: new mongoose.Types.ObjectId(),
      owner: MOCK_USER_ID,
      title: "List for Items",
    });
    await gl.save();
    const newListId = gl._id.toHexString();

    const cat = new Category({
      _id: new mongoose.Types.ObjectId(),
      gearList: newListId,
      title: "Category A",
      position: 0,
    });
    await cat.save();
    const newCatId = cat._id.toHexString();

    return { newListId, newCatId };
  }

  // ============================================
  // 1) TEST: GET /api/lists/:listId/categories/:catId/items
  // ============================================
  describe("GET /api/lists/:listId/categories/:catId/items", () => {
    it("returns 404 if the GearList does not exist", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();
      const fakeCatId = new mongoose.Types.ObjectId().toHexString();

      const res = await request(app)
        .get(`/api/lists/${fakeListId}/categories/${fakeCatId}/items`)
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Gear list not found." });
    });

    it("returns 404 if the Category does not exist under that list", async () => {
      const { newListId } = await createListAndCategory();
      const fakeCatId = new mongoose.Types.ObjectId().toHexString();

      const res = await request(app)
        .get(`/api/lists/${newListId}/categories/${fakeCatId}/items`)
        .send();

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Category not found." });
    });

    it("returns an empty array when no items exist", async () => {
      const data = await createListAndCategory();
      listId = data.newListId;
      catId = data.newCatId;

      const res = await request(app)
        .get(`/api/lists/${listId}/categories/${catId}/items`)
        .send();

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it("returns items sorted by position", async () => {
      const data = await createListAndCategory();
      listId = data.newListId;
      catId = data.newCatId;

      // Create two items out of order
      const item1 = new GearItem({
        _id: new mongoose.Types.ObjectId(),
        globalItem: new mongoose.Types.ObjectId(),
        gearList: listId,
        category: catId,
        name: "Second Item",
        position: 2,
      });
      const item2 = new GearItem({
        _id: new mongoose.Types.ObjectId(),
        globalItem: new mongoose.Types.ObjectId(),
        gearList: listId,
        category: catId,
        name: "First Item",
        position: 1,
      });
      await item1.save();
      await item2.save();

      const res = await request(app)
        .get(`/api/lists/${listId}/categories/${catId}/items`)
        .send();

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      // Should sort by ascending position
      expect(res.body[0].name).toBe("First Item");
      expect(res.body[1].name).toBe("Second Item");
    });
  });

  // ============================================
  // 2) TEST: POST /api/lists/:listId/categories/:catId/items
  // ============================================
  describe("POST /api/lists/:listId/categories/:catId/items", () => {
    beforeEach(async () => {
      const data = await createListAndCategory();
      listId = data.newListId;
      catId = data.newCatId;
    });

    it("returns 400 when required fields are missing", async () => {
      // Missing globalItem, name, and position
      let res = await request(app)
        .post(`/api/lists/${listId}/categories/${catId}/items`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Required fields: globalItem, name, position",
      });

      // Missing name
      res = await request(app)
        .post(`/api/lists/${listId}/categories/${catId}/items`)
        .send({ globalItem: new mongoose.Types.ObjectId(), position: 0 });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Required fields: globalItem, name, position",
      });

      // Missing position
      res = await request(app)
        .post(`/api/lists/${listId}/categories/${catId}/items`)
        .send({ globalItem: new mongoose.Types.ObjectId(), name: "Test" });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        message: "Required fields: globalItem, name, position",
      });
    });

    it("returns 404 if the GearList does not exist", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();

      const res = await request(app)
        .post(`/api/lists/${fakeListId}/categories/${catId}/items`)
        .send({
          globalItem: new mongoose.Types.ObjectId(),
          name: "Item Name",
          position: 0,
        });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Gear list not found." });
    });

    it("returns 404 if the Category does not exist under that list", async () => {
      const fakeCatId = new mongoose.Types.ObjectId().toHexString();

      const res = await request(app)
        .post(`/api/lists/${listId}/categories/${fakeCatId}/items`)
        .send({
          globalItem: new mongoose.Types.ObjectId(),
          name: "Item Name",
          position: 0,
        });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Category not found." });
    });

    it("creates a new item and returns 201 + the created item", async () => {
      const payload = {
        globalItem: new mongoose.Types.ObjectId(),
        name: "New Item",
        position: 5,
        brand: "BrandX",
        itemType: "TypeX",
        description: "Desc",
        weight: 100,
        price: 9.99,
        link: "http://example.com",
        worn: true,
        consumable: false,
        quantity: 2,
      };
      const res = await request(app)
        .post(`/api/lists/${listId}/categories/${catId}/items`)
        .send(payload);

      expect(res.status).toBe(201);
      // The response body is the new item
      expect(res.body._id).toBeDefined();
      expect(res.body.gearList).toBe(listId);
      expect(res.body.category).toBe(catId);
      expect(res.body.name).toBe("New Item");
      expect(res.body.position).toBe(5);
      expect(res.body.brand).toBe("BrandX");
      expect(res.body.worn).toBe(true);
      expect(res.body.consumable).toBe(false);
      expect(res.body.quantity).toBe(2);

      // Verify it saved to the database
      const dbItem = await GearItem.findById(res.body._id);
      expect(dbItem).not.toBeNull();
      expect(dbItem.name).toBe("New Item");
      expect(dbItem.position).toBe(5);
    });
  });

  // ============================================
  // 3) TEST: PATCH /api/lists/:listId/categories/:catId/items/:itemId
  // ============================================
  describe("PATCH /api/lists/:listId/categories/:catId/items/:itemId", () => {
    let itemId;
    let otherCatId;

    beforeEach(async () => {
      const data = await createListAndCategory();
      listId = data.newListId;
      catId = data.newCatId;

      // Create an item in catId
      const item = new GearItem({
        _id: new mongoose.Types.ObjectId(),
        globalItem: new mongoose.Types.ObjectId(),
        gearList: listId,
        category: catId,
        name: "Initial Item",
        position: 1,
      });
      await item.save();
      itemId = item._id.toHexString();

      // Create another category under the same list for move tests
      const otherCat = new Category({
        _id: new mongoose.Types.ObjectId(),
        gearList: listId,
        title: "Other Category",
        position: 1,
      });
      await otherCat.save();
      otherCatId = otherCat._id.toHexString();
    });

    it("returns 400 if no valid fields are provided", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}/items/${itemId}`)
        .send({}); // no updatable fields
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "No valid fields to update." });
    });

    it("returns 404 if the GearList does not exist", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();
      // Send a valid update field so code skips the “no valid fields” check
      const res = await request(app)
        .patch(`/api/lists/${fakeListId}/categories/${catId}/items/${itemId}`)
        .send({ position: 99 });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Gear list not found." });
    });

    it("returns 404 if the old Category does not exist under that list", async () => {
      const fakeCatId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${fakeCatId}/items/${itemId}`)
        .send({ position: 99 });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Category not found." });
    });

    it("returns 400 if trying to move to a non-existent category", async () => {
      const fakeNewCatId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}/items/${itemId}`)
        .send({ category: fakeNewCatId });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Target category not found." });
    });

    it("returns 404 if the item does not exist under that category", async () => {
      const fakeItemId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}/items/${fakeItemId}`)
        .send({ position: 99 });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Item not found." });
    });

    it("updates inline fields (e.g., position, quantity) and returns updated item", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}/items/${itemId}`)
        .send({ position: 10, quantity: 3 });

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(itemId);
      expect(res.body.position).toBe(10);
      expect(res.body.quantity).toBe(3);

      const dbItem = await GearItem.findById(itemId);
      expect(dbItem.position).toBe(10);
      expect(dbItem.quantity).toBe(3);
    });

    it("moves the item to a new category when category field is provided", async () => {
      const res = await request(app)
        .patch(`/api/lists/${listId}/categories/${catId}/items/${itemId}`)
        .send({ category: otherCatId });

      expect(res.status).toBe(200);
      expect(res.body._id).toBe(itemId);
      expect(res.body.category).toBe(otherCatId);

      const dbItem = await GearItem.findById(itemId);
      expect(dbItem.category.toHexString()).toBe(otherCatId);
    });
  });

  // ============================================
  // 4) TEST: DELETE /api/lists/:listId/categories/:catId/items/:itemId
  // ============================================
  describe("DELETE /api/lists/:listId/categories/:catId/items/:itemId", () => {
    let itemId;

    beforeEach(async () => {
      const data = await createListAndCategory();
      listId = data.newListId;
      catId = data.newCatId;

      // Create one item
      const item = new GearItem({
        _id: new mongoose.Types.ObjectId(),
        globalItem: new mongoose.Types.ObjectId(),
        gearList: listId,
        category: catId,
        name: "To Delete",
        position: 0,
      });
      await item.save();
      itemId = item._id.toHexString();
    });

    it("returns 404 if the GearList does not exist", async () => {
      const fakeListId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .delete(`/api/lists/${fakeListId}/categories/${catId}/items/${itemId}`)
        .send();
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Gear list not found." });
    });

    it("returns 404 if the Category does not exist under that list", async () => {
      const fakeCatId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .delete(`/api/lists/${listId}/categories/${fakeCatId}/items/${itemId}`)
        .send();
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Category not found." });
    });

    it("returns 404 if the item does not exist under that category", async () => {
      const fakeItemId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .delete(`/api/lists/${listId}/categories/${catId}/items/${fakeItemId}`)
        .send();
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Item not found." });
    });

    it("deletes the item and returns a success message", async () => {
      const res = await request(app)
        .delete(`/api/lists/${listId}/categories/${catId}/items/${itemId}`)
        .send();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Item deleted." });

      const dbItem = await GearItem.findById(itemId);
      expect(dbItem).toBeNull();
    });
  });
});
