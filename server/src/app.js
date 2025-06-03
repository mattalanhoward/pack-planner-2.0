// server/src/app.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const gearListRoutes = require('./routes/gearLists');
const authMiddleware  = require('./middleware/auth');
const categoriesRoutes = require('./routes/categories');
const gearItemRoutes = require('./routes/gearItems');
const globalItemsRoutes = require('./routes/globalItems');


// ... any other routes

const app = express();

// Enable CORS for your frontend origin
app.use(cors({
  origin: 'http://localhost:5173',   // allow only your Vite dev server
  credentials: true                  // if you ever use cookies
}));

app.use(express.json());

// Mount routers — each must be a function (router)
app.use('/api/auth', authRoutes);
app.use('/api/lists', gearListRoutes);
app.use('/api/lists/:listId/categories', categoriesRoutes);
app.use('/api/lists/:listId/categories/:catId/items', gearItemRoutes);
app.use('/api/global/items', globalItemsRoutes);

// Make sure you read the URI exactly from process.env:
const mongoURI = process.env.MONGODB_URI;
if (!mongoURI) {
  console.error("❌ No MONGODB_URI defined in environment!");
  process.exit(1);
}

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ Mongo connected");
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🎉 Back-end listening on port ${port}`);
    });
  })
  .catch(err => {
    console.error("Mongo connection error:", err);
    process.exit(1);
  });


module.exports = app;
