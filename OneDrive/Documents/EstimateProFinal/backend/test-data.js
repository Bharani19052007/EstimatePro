const mongoose = require('mongoose');
const { connectDatabase } = require('./config/database');
const Project = require('./models/Project');
const Estimation = require('./models/Estimation');
const User = require('./models/User');

async function testDataCheck() {
  try {
    // Connect to database
    await connectDatabase('local');
    
    console.log('\n=== DATABASE DATA CHECK ===\n');
    
    // Check all collections
    const users = await User.find({});
    const projects = await Project.find({});
    const estimations = await Estimation.find({});
    
    console.log(`📊 Total Users: ${users.length}`);
    console.log(`📊 Total Projects: ${projects.length}`);
    console.log(`📊 Total Estimations: ${estimations.length}`);
    
    console.log('\n=== USERS ===');
    users.forEach(user => {
      console.log(`ID: ${user._id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    console.log('\n=== PROJECTS ===');
    projects.forEach(project => {
      console.log(`ID: ${project._id}`);
      console.log(`Name: ${project.projectName}`);
      console.log(`User ID: ${project.userId}`);
      console.log(`Status: ${project.status}`);
      console.log(`Created: ${project.createdAt}`);
      console.log('---');
    });
    
    console.log('\n=== ESTIMATIONS ===');
    estimations.forEach(estimation => {
      console.log(`ID: ${estimation._id}`);
      console.log(`Project: ${estimation.projectName}`);
      console.log(`User ID: ${estimation.userId}`);
      console.log(`Project ID: ${estimation.projectId}`);
      console.log(`Status: ${estimation.status}`);
      console.log(`Total Cost: $${estimation.finalCost}`);
      console.log(`Created: ${estimation.createdAt}`);
      console.log('---');
    });
    
    // Test specific user queries
    if (users.length > 0) {
      const firstUser = users[0];
      console.log(`\n=== TESTING USER QUERIES FOR: ${firstUser.name} ===`);
      
      const userProjects = await Project.find({ userId: firstUser._id });
      const userEstimations = await Estimation.find({ userId: firstUser._id });
      
      console.log(`Projects for user ${firstUser.name}: ${userProjects.length}`);
      userProjects.forEach(project => {
        console.log(`  - ${project.projectName} (${project.status})`);
      });
      
      console.log(`Estimations for user ${firstUser.name}: ${userEstimations.length}`);
      userEstimations.forEach(estimation => {
        console.log(`  - ${estimation.projectName} ($${estimation.finalCost})`);
      });
    }
    
    console.log('\n=== DATA CHECK COMPLETE ===\n');
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

testDataCheck();
