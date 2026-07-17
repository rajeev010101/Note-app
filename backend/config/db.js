const mongoose = require('mongoose');

// Never queue model operations while MongoDB is unavailable. Requests should
// receive an immediate, useful error instead of timing out after buffering.
mongoose.set('bufferCommands', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/noteapp',
      { serverSelectionTimeoutMS: 10000 }
    );

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    return false;
  }
};

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

module.exports = { connectDB, isDatabaseConnected };
