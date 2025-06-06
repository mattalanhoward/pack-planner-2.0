// server/src/test/globalTeardown.js

module.exports = async () => {
  const mongoServer = global.__MONGOINSTANCE__;
  if (mongoServer) {
    // 1) Stop the in-memory MongoDB instance
    await mongoServer.stop();
  }
};
