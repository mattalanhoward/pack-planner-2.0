// server/src/test/routes.globalItems.test.js

const mongoose = require("mongoose");
const request = require("supertest");
const jwt = require("jsonwebtoken");

// Use a fixed 24-hex-char string as our fake user ID
const MOCK_USER_ID = "dddddddddddddddddddddddd";

// Ensure JWT_SECRET is defined (for this test suite only)
process.env.JWT_SECRET = "test_jwt_secret";

jest.mock("../middleware/auth", () => {
  return (req, res, next) => {
    req.userId = MOCK_USER_ID;
    return next();
  };
});

const app = require("../app");
const GlobalItem = require("../models/globalItem");
const GearItem = require("../models/gearItem");

describe("GlobalItems routes", () => {
  let globalItemId;

  beforeAll(async () => {
    // Connect to in-memory MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Clear both collections between tests
    await GearItem.deleteMany({});
    await GlobalItem.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 1) GET /api/global/items
  // ────────────────────────────────────────────────────────────────────────────
  describe("GET /api/global/items", () => {
    it("returns an empty array when no global items exist", async () => {
      const res = await request(app).get("/api/global/items").send();

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(0);
    });

    it("returns only the authenticated user’s global items", async () => {
      // Create one item for MOCK_USER_ID
      const item1 = new GlobalItem({
        _id: new mongoose.Types.ObjectId(),
        owner: MOCK_USER_ID,
        name: "User Template",
      });
      await item1.save();

      // Create a global item for some other user
      const otherId = new mongoose.Types.ObjectId().toHexString();
      await new GlobalItem({
        _id: new mongoose.Types.ObjectId(),
        owner: otherId,
        name: "Other Template",
      }).save();

      const res = await request(app).get("/api/global/items").send();

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0]._id).toBe(item1._id.toHexString());
      expect(res.body[0].owner).toBe(MOCK_USER_ID);
      expect(res.body[0].name).toBe("User Template");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 2) POST /api/global/items
  // ────────────────────────────────────────────────────────────────────────────
  describe("POST /api/global/items", () => {
    it("returns 400 when name is missing", async () => {
      const res = await request(app).post("/api/global/items").send({}); // no name

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ message: "Name is required." });
    });

    it("creates a new global item and returns 201 + the created item", async () => {
      const payload = {
        category: "Camping",
        brand: "BrandY",
        itemType: "Tent",
        name: "One-Person Tent",
        description: "Lightweight tent",
        weight: 1200,
        price: 199.99,
        link: "http://example.com/tent",
        worn: false,
        consumable: false,
        quantity: 1,
      };
      const res = await request(app).post("/api/global/items").send(payload);

      expect(res.status).toBe(201);
      // Response body is the created globalItem
      expect(res.body._id).toBeDefined();
      expect(res.body.owner).toBe(MOCK_USER_ID);
      expect(res.body.name).toBe("One-Person Tent");
      expect(res.body.category).toBe("Camping");
      expect(res.body.brand).toBe("BrandY");

      // Confirm it saved in DB
      const dbItem = await GlobalItem.findById(res.body._id);
      expect(dbItem).not.toBeNull();
      expect(dbItem.owner.toHexString()).toBe(MOCK_USER_ID);
      expect(dbItem.name).toBe("One-Person Tent");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 3) PATCH /api/global/items/:id
  // ────────────────────────────────────────────────────────────────────────────
  describe("PATCH /api/global/items/:id", () => {
    let gearItem1, gearItem2;

    beforeEach(async () => {
      // Create a globalItem and two GearItem instances referencing it
      const gi = new GlobalItem({
        _id: new mongoose.Types.ObjectId(),
        owner: MOCK_USER_ID,
        category: "Hiking",
        brand: "BrandZ",
        name: "Hiking Boots",
        description: "Durable boots",
        weight: 1000,
        price: 129.99,
        link: "http://example.com/boots",
        worn: false,
        consumable: false,
        quantity: 1,
      });
      await gi.save();
      globalItemId = gi._id.toHexString();

      // Two gear items referencing that template
      gearItem1 = new GearItem({
        _id: new mongoose.Types.ObjectId(),
        globalItem: globalItemId,
        gearList: new mongoose.Types.ObjectId(),
        category: new mongoose.Types.ObjectId(),
        name: "Old Boots 1",
        position: 0,
      });
      gearItem2 = new GearItem({
        _id: new mongoose.Types.ObjectId(),
        globalItem: globalItemId,
        gearList: new mongoose.Types.ObjectId(),
        category: new mongoose.Types.ObjectId(),
        name: "Old Boots 2",
        position: 1,
      });
      await gearItem1.save();
      await gearItem2.save();
    });

    it("returns 404 if the globalItem does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId().toHexString();
      // Send some update so the route attempts findOneAndUpdate
      const res = await request(app)
        .patch(`/api/global/items/${fakeId}`)
        .send({ name: "New Name" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Global item not found." });
    });

    it("updates the template and cascades fields to its GearItem instances", async () => {
      const payload = {
        name: "Updated Boots",
        brand: "BrandZ-Updated",
        description: "Even more durable",
        weight: 1100,
        price: 139.99,
        link: "http://example.com/boots-updated",
      };
      const res = await request(app)
        .patch(`/api/global/items/${globalItemId}`)
        .send(payload);

      expect(res.status).toBe(200);
      // Response body is the updated template
      expect(res.body._id).toBe(globalItemId);
      expect(res.body.name).toBe("Updated Boots");
      expect(res.body.brand).toBe("BrandZ-Updated");
      expect(res.body.weight).toBe(1100);

      // Confirm cascade: both GearItems should now have updated name/brand/... fields
      const dbItem1 = await GearItem.findById(gearItem1._id);
      const dbItem2 = await GearItem.findById(gearItem2._id);
      expect(dbItem1.name).toBe("Updated Boots");
      expect(dbItem1.brand).toBe("BrandZ-Updated");
      expect(dbItem2.name).toBe("Updated Boots");
      expect(dbItem2.brand).toBe("BrandZ-Updated");
    });
  });

  // ────────────────────────────────────────────────────────────────────────────
  // 4) DELETE /api/global/items/:id
  // ────────────────────────────────────────────────────────────────────────────
  describe("DELETE /api/global/items/:id", () => {
    let gearItemA, gearItemB;

    beforeEach(async () => {
      // Create a globalItem and two GearItem instances referencing it
      const gi = new GlobalItem({
        _id: new mongoose.Types.ObjectId(),
        owner: MOCK_USER_ID,
        name: "ToDelete Boots",
        brand: "BrandX",
      });
      await gi.save();
      globalItemId = gi._id.toHexString();

      gearItemA = new GearItem({
        _id: new mongoose.Types.ObjectId(),
        globalItem: globalItemId,
        gearList: new mongoose.Types.ObjectId(),
        category: new mongoose.Types.ObjectId(),
        name: "DeleteMe 1",
        position: 0,
      });
      gearItemB = new GearItem({
        _id: new mongoose.Types.ObjectId(),
        globalItem: globalItemId,
        gearList: new mongoose.Types.ObjectId(),
        category: new mongoose.Types.ObjectId(),
        name: "DeleteMe 2",
        position: 1,
      });
      await gearItemA.save();
      await gearItemB.save();
    });

    it("returns 404 if the globalItem does not exist", async () => {
      const fakeId = new mongoose.Types.ObjectId().toHexString();
      const res = await request(app)
        .delete(`/api/global/items/${fakeId}`)
        .send();
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ message: "Global item not found." });
    });

    it("deletes the template and all its GearItem instances", async () => {
      const res = await request(app)
        .delete(`/api/global/items/${globalItemId}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        message: "Global item and its instances deleted.",
      });

      // Template should be gone
      const dbTemplate = await GlobalItem.findById(globalItemId);
      expect(dbTemplate).toBeNull();

      // Both GearItem instances should be gone
      const remaining = await GearItem.find({ globalItem: globalItemId });
      expect(remaining.length).toBe(0);
    });
  });
});
