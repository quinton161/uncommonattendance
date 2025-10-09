const mongoose = require('mongoose');
require('dotenv').config();

console.log('🔍 Testing MongoDB Connection...');
console.log('📍 Connection String:', process.env.MONGODB_URI ? 'Found in .env' : 'NOT FOUND in .env');

if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file!');
  console.log('💡 Please run setup-env.bat to create the .env file');
  process.exit(1);
}

// Hide password in logs
const safeUri = process.env.MONGODB_URI.replace(/:([^:@]{1,}@)/, ':****@');
console.log('🔗 Connecting to:', safeUri);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🏠 Host:', mongoose.connection.host);
    console.log('🔌 Ready state:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('ConnectionTest', testSchema);
    
    return TestModel.create({ test: 'Connection successful!' });
  })
  .then((doc) => {
    console.log('✅ Database write test successful!');
    console.log('📝 Test document created:', doc._id);
    
    // Clean up test document
    return mongoose.model('ConnectionTest').deleteOne({ _id: doc._id });
  })
  .then(() => {
    console.log('🧹 Test document cleaned up');
    console.log('🎉 All tests passed! Your MongoDB connection is working perfectly.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed!');
    console.error('🔍 Error details:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('💡 Tip: Check your username and password in the connection string');
    } else if (error.message.includes('network')) {
      console.log('💡 Tip: Check your internet connection and MongoDB Atlas network access');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Tip: Check the cluster URL in your connection string');
    }
    
    process.exit(1);
  });
