const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('your_mongodb_atlas_connection_string')) {
    console.warn('[MongoDB] Warning: MONGODB_URI is not set to a valid connection string in .env.');
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB] Connected to database: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
  }
};

module.exports = connectDB;
