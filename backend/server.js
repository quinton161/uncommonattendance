const app = require('./app');
const mongoose = require('mongoose');
const { connectToDatabase } = require('./db');
require('dotenv').config();

(async () => {
  try {
    await connectToDatabase();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
})();

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});
