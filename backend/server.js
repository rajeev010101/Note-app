const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { connectDB, isDatabaseConnected } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const noteRoutes = require('./routes/noteRoutes');
const shareRoutes = require('./routes/shareRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// CLIENT_URL can be a single Vercel URL or a comma-separated list of allowed
// frontend origins. Local Vite is kept available for development.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '1mb' }));

// Connect to MongoDB
connectDB();

// This route intentionally does not require MongoDB, so Render can use it for
// health checks while the database is reconnecting.
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: isDatabaseConnected() ? 'connected' : 'unavailable'
  });
});

// Do not let requests wait in Mongoose's operation buffer when Atlas/local
// MongoDB is unreachable. This also prevents a database outage being reported
// to clients as an authentication failure.
app.use('/api', (req, res, next) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message: 'Database unavailable. Check MONGODB_URI and MongoDB Atlas Network Access.'
    });
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/share', shareRoutes);

app.get('/', (req, res) => {
  res.json({
    message: 'Note Taking API is running',
    status: mongoose.connection.readyState === 1 ? 'ok' : 'database-unavailable'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(res.statusCode >= 400 ? res.statusCode : 500).json({
    message: err.message || 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
