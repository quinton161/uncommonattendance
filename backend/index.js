const app = require('./app');
const { connectToDatabase } = require('./db');
require('dotenv').config();

// Connect to database
connectToDatabase().catch(console.error);

// Export the app for Vercel
module.exports = app;
