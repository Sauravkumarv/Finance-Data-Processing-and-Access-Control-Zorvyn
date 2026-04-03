const mongoose = require('mongoose');
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is missing. Please set it in your .env file.');
  }

  try {
    await mongoose.connect(uri, {
      dbName: process.env.DB_NAME || 'finance_dashboard',
    });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Rethrow so the server can exit on startup failure
    throw err;
  }
};

module.exports = connectDB;