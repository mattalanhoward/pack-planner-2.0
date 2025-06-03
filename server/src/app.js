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


const app = express();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true
  })
);

app.use(express.json());

// Mount routers — each must be a function (router)
app.use('/api/auth', authRoutes);
app.use('/api/lists', gearListRoutes);
app.use('/api/lists/:listId/categories', categoriesRoutes);
app.use('/api/lists/:listId/categories/:catId/items', gearItemRoutes);
app.use('/api/global/items', globalItemsRoutes);

// Make sure you read the URI exactly from process.env:
const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  console.error("❌ No MONGODB_URI defined in environment!");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ Mongo connection error:', err));


module.exports = app;
