const mongoose = require('mongoose');
const { connectDatabase } = require('./config/database');
const Project = require('./models/Project');
const Estimation = require('./models/Estimation');
const User = require('./models/User');

async function testDirectAPI() {
  try {
    await connectDatabase('local');
    
    console.log('\n=== TESTING API ENDPOINTS DIRECTLY ===\n');
    
    // Find your user
    const yourUser = await User.findOne({ email: 'name@gmail.com' });
    
    if (!yourUser) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Testing for user: ${yourUser.name} (ID: ${yourUser._id})`);
    
    // Test Project.find directly (same as API does)
    console.log('\n📊 Testing Project.find({ userId: yourUser._id })...');
    const projects = await Project.find({ userId: yourUser._id });
    console.log(`✅ Found ${projects.length} projects directly from database`);
    
    // Test Estimation.find directly
    console.log('\n📊 Testing Estimation.find({ userId: yourUser._id })...');
    const estimations = await Estimation.find({ userId: yourUser._id });
    console.log(`✅ Found ${estimations.length} estimations directly from database`);
    
    // Calculate stats
    const stats = {
      totalProjects: projects.length,
      totalEstimations: estimations.length,
      totalValue: estimations.reduce((sum, e) => sum + (e.finalCost || 0), 0),
      activeProjects: projects.filter(p => p.status === 'planning' || p.status === 'in_progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length
    };
    
    console.log('\n📈 Calculated Dashboard Stats:');
    console.log(`   Total Projects: ${stats.totalProjects}`);
    console.log(`   Total Estimations: ${stats.totalEstimations}`);
    console.log(`   Total Value: $${stats.totalValue}`);
    console.log(`   Active Projects: ${stats.activeProjects}`);
    console.log(`   Completed Projects: ${stats.completedProjects}`);
    
    console.log('\n🔍 ISSUE ANALYSIS:');
    console.log('If the frontend shows 0 but these values show data, the issue is:');
    console.log('1. Authentication token not being sent correctly');
    console.log('2. Backend auth middleware not recognizing the token');
    console.log('3. API endpoint not being called from frontend');
    console.log('4. Frontend not processing the response correctly');
    
    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Check browser console for API call logs');
    console.log('2. Verify token is stored in localStorage');
    console.log('3. Check if API requests include Authorization header');
    console.log('4. Verify backend auth middleware is working');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

testDirectAPI();
