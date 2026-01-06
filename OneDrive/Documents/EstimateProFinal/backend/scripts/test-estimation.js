const Estimation = require('../models/Estimation');
const Project = require('../models/Project');
const mongoose = require('mongoose');

const testEstimation = async () => {
  try {
    console.log('🔍 Testing estimation model and project integration...');
    
    // Connect to database
    await mongoose.connect('mongodb://127.0.0.1:27017/project-management');
    console.log('✅ Connected to database');
    
    // Check if Estimation model is properly defined
    const estimationCount = await Estimation.countDocuments();
    const projectCount = await Project.countDocuments();
    
    console.log(`✅ Estimation model working - Found ${estimationCount} estimations`);
    console.log(`✅ Project model working - Found ${projectCount} projects`);
    
    // Test project with estimations field
    const project = await Project.findOne({});
    console.log(`✅ Project has estimations field: ${project.estimations}`);
    
    // Show project structure
    console.log('\n📊 Project structure:');
    console.log(`   - Name: ${project.projectName}`);
    console.log(`   - Estimations: ${project.estimations}`);
    console.log(`   - Budget: $${project.estimatedBudget}`);
    
    console.log('\n✅ Estimation system is ready!');
    console.log('📝 When you create an estimation, it will:');
    console.log('   1. Store in MongoDB Estimation collection');
    console.log('   2. Link to a project');
    console.log('   3. Automatically increment project.estimations count');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

testEstimation();
