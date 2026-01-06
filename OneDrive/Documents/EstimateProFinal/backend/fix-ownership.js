const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/estimation-pro')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get Alex Johnson's user ID
    const alexUser = await db.collection('users').findOne({ name: 'Alex Johnson' });
    if (!alexUser) {
      console.log('❌ Alex Johnson user not found, checking all users...');
      const allUsers = await db.collection('users').find({}).toArray();
      console.log('Available users:');
      allUsers.forEach(u => console.log(`- ${u.name} (${u.email}) - ID: ${u._id}`));
      process.exit(1);
    }
    
    console.log('✅ Found Alex Johnson:', alexUser._id);
    
    // Update all projects to Alex Johnson
    const projectResult = await db.collection('projects').updateMany(
      {}, 
      { $set: { userId: alexUser._id } }
    );
    console.log(`📁 Updated ${projectResult.modifiedCount} projects`);
    
    // Update all estimations to Alex Johnson
    const estimationResult = await db.collection('estimations').updateMany(
      {}, 
      { $set: { userId: alexUser._id } }
    );
    console.log(`💰 Updated ${estimationResult.modifiedCount} estimations`);
    
    console.log('✅ Data ownership updated successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
