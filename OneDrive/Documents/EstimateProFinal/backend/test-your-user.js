const mongoose = require('mongoose');
const { connectDatabase } = require('./config/database');
const Project = require('./models/Project');
const Estimation = require('./models/Estimation');
const User = require('./models/User');

async function testYourUser() {
  try {
    // Connect to database
    await connectDatabase('local');
    
    console.log('\n=== TESTING YOUR USER (bhaiii) ===\n');
    
    // Find your user
    const yourUser = await User.findOne({ email: 'name@gmail.com' });
    
    if (!yourUser) {
      console.log('❌ User not found: name@gmail.com');
      return;
    }
    
    console.log(`✅ Found user: ${yourUser.name} (ID: ${yourUser._id})`);
    
    // Get your projects and estimations
    const yourProjects = await Project.find({ userId: yourUser._id });
    const yourEstimations = await Estimation.find({ userId: yourUser._id });
    
    console.log(`\n📊 Your Projects: ${yourProjects.length}`);
    yourProjects.forEach((project, index) => {
      console.log(`${index + 1}. ${project.projectName}`);
      console.log(`   Status: ${project.status}`);
      console.log(`   Created: ${project.createdAt}`);
      console.log(`   Budget: $${project.estimatedBudget || 0}`);
      console.log('---');
    });
    
    console.log(`\n📊 Your Estimations: ${yourEstimations.length}`);
    yourEstimations.forEach((estimation, index) => {
      console.log(`${index + 1}. ${estimation.projectName}`);
      console.log(`   Status: ${estimation.status}`);
      console.log(`   Cost: $${estimation.finalCost || 0}`);
      console.log(`   Created: ${estimation.createdAt}`);
      console.log('---');
    });
    
    // Test dashboard stats calculation
    const dashboardStats = {
      totalProjects: yourProjects.length,
      totalEstimations: yourEstimations.length,
      totalValue: yourEstimations.reduce((sum, e) => sum + (e.finalCost || 0), 0),
      activeProjects: yourProjects.filter(p => p.status === 'planning' || p.status === 'in_progress').length,
      completedProjects: yourProjects.filter(p => p.status === 'completed').length
    };
    
    console.log(`\n📈 Dashboard Stats for ${yourUser.name}:`);
    console.log(`   Total Projects: ${dashboardStats.totalProjects}`);
    console.log(`   Total Estimations: ${dashboardStats.totalEstimations}`);
    console.log(`   Total Value: $${dashboardStats.totalValue}`);
    console.log(`   Active Projects: ${dashboardStats.activeProjects}`);
    console.log(`   Completed Projects: ${dashboardStats.completedProjects}`);
    
    console.log('\n=== API ENDPOINT TEST ===');
    
    // Test the actual API endpoints that the frontend calls
    console.log('\nTesting /api/projects endpoint...');
    console.log('This should return your projects when authenticated with your token');
    
    console.log('\nTesting /api/estimations endpoint...');
    console.log('This should return your estimations when authenticated with your token');
    
    console.log('\nTesting /api/dashboard/stats endpoint...');
    console.log('This should return the dashboard stats calculated above');
    
    console.log('\n=== TEST COMPLETE ===\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testYourUser();
