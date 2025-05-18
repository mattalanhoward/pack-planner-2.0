// server/src/app.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const gearListRoutes = require('./routes/gearLists');
const authMiddleware  = require('./middleware/auth');
const categoriesRoutes = require('./routes/categories');
const gearItemRoutes = require('./routes/gearItems');

// ... any other routes

const app = express();

app.use(express.json());

// Mount routers — each must be a function (router)
app.use('/api/auth', authRoutes);
app.use('/api/lists', gearListRoutes);
app.use('/api/lists/:listId/categories', categoriesRoutes);
app.use('/api/lists/:listId/categories/:catId/items', gearItemRoutes);



mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Mongo connection error:', err));

module.exports = app;
