const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/estimation-pro')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Check all projects and estimations with user details
    console.log('\n=== DETAILED ANALYSIS ===');
    
    const projects = await db.collection('projects').find({}).toArray();
    const estimations = await db.collection('estimations').find({}).toArray();
    const users = await db.collection('users').find({}).toArray();
    
    // Create user lookup map
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });
    
    console.log('\n--- PROJECTS WITH USER INFO ---');
    projects.forEach((p, i) => {
      const user = userMap[p.userId?.toString()];
      console.log(`Project ${i+1}: ${p.projectName}`);
      console.log(`  User: ${user?.name || 'Unknown'} (${user?.email || 'No email'})`);
      console.log(`  User ID: ${p.userId}`);
      console.log(`  Status: ${p.status}`);
      console.log(`  Created: ${p.createdAt}`);
      console.log('');
    });
    
    console.log('\n--- ESTIMATIONS WITH USER INFO ---');
    estimations.forEach((e, i) => {
      const user = userMap[e.userId?.toString()];
      console.log(`Estimation ${i+1}: ${e.projectName}`);
      console.log(`  User: ${user?.name || 'Unknown'} (${user?.email || 'No email'})`);
      console.log(`  User ID: ${e.userId}`);
      console.log(`  Final Cost: $${e.finalCost || 0}`);
      console.log(`  Status: ${e.status}`);
      console.log(`  Created: ${e.createdAt}`);
      console.log('');
    });
    
    // Check if there are any projects/estimations for different users
    const userProjects = {};
    const userEstimations = {};
    
    projects.forEach(p => {
      const userId = p.userId?.toString();
      if (userId) {
        userProjects[userId] = (userProjects[userId] || 0) + 1;
      }
    });
    
    estimations.forEach(e => {
      const userId = e.userId?.toString();
      if (userId) {
        userEstimations[userId] = (userEstimations[userId] || 0) + 1;
      }
    });
    
    console.log('\n--- SUMMARY BY USER ---');
    Object.keys(userProjects).forEach(userId => {
      const user = userMap[userId];
      console.log(`${user?.name || 'Unknown'} (${user?.email || 'No email'}):`);
      console.log(`  Projects: ${userProjects[userId]}`);
      console.log(`  Estimations: ${userEstimations[userId] || 0}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
