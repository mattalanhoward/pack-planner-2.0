// server/src/test/globalSetup.js

const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async () => {
  // 1) Start up a brand‐new in‐memory MongoDB instance
  const mongoServer = await MongoMemoryServer.create();
  // 2) Tell our code (and thus mongoose.connect()) to use its URI:
  process.env.MONGO_URI = mongoServer.getUri();

  // 3) Save the server instance on a global so that we can stop it later in globalTeardown
  global.__MONGOINSTANCE__ = mongoServer;
};
