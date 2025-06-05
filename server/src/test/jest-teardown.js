// server/src/test/jest-teardown.js

/**
 * After each individual test file runs, we clear out ALL data
 * in every collection, ensuring tests remain isolated.
 */

const mongoose = require("mongoose");

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
