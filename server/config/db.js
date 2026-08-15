const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoMemoryServer = null;

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/splitwise';
    console.log(`Connecting to MongoDB at: ${connStr}...`);
    
    // Set connection timeout short so we can fall back to memory server if local Mongo is not running
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.warn(`Local MongoDB connection failed (${err.message}). Falling back to MongoDB Memory Server...`);
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`MongoDB Memory Server Connected: ${uri}`);
    } catch (memErr) {
      console.error('Failed to start MongoDB Memory Server:', memErr);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
