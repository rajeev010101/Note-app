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

// Allowed Origins
const allowedOrigins = (
  process.env.CLIENT_URL ||
  'http://localhost:5173,https://note-app-nu-tawny.vercel.app'
)
  .split(',')
  .map(origin => origin.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow Postman, mobile apps, curl, etc.
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked Origin:", origin);

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: '1mb' }));

// Connect MongoDB
connectDB();

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    database: isDatabaseConnected() ? 'connected' : 'unavailable'
  });
});

// Database Check Middleware
app.use('/api', (req, res, next) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      message:
        'Database unavailable. Check MONGODB_URI and MongoDB Atlas Network Access.'
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
    status:
      mongoose.connection.readyState === 1
        ? 'ok'
        : 'database-unavailable'
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    success: false,
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;