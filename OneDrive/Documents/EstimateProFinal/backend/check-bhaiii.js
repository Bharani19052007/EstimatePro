const mongoose = require('mongoose');
const Project = require('./models/Project');
const Estimation = require('./models/Estimation');
const User = require('./models/User');

const connectDatabase = require('./config/database').connectDatabase;

async function checkBhaiiiData() {
  try {
    await connectDatabase('compass');
    
    console.log('🔍 Checking bhaiii data...\n');
    
    // Find bhaiii user
    const bhaiii = await User.findOne({ email: 'name@gmail.com' });
    if (!bhaiii) {
      console.log('❌ User bhaiii not found!');
      return;
    }
    
    console.log(`✅ Found user: ${bhaiii.name} - ID: ${bhaiii._id}`);
    
    // Check bhaiii's projects
    const projects = await Project.find({ userId: bhaiii._id });
    console.log(`📁 Projects for bhaiii: ${projects.length}`);
    projects.forEach(project => {
      console.log(`  - ${project.projectName} (Status: ${project.status})`);
    });
    
    // Check bhaiii's estimations
    const estimations = await Estimation.find({ userId: bhaiii._id });
    console.log(`💰 Estimations for bhaiii: ${estimations.length}`);
    estimations.forEach(estimation => {
      console.log(`  - ${estimation.projectName} (Status: ${estimation.status})`);
    });
    
    // Test dashboard stats calculation
    const stats = {
      totalProjects: projects.length,
      totalEstimations: estimations.length,
      totalValue: estimations.reduce((sum, e) => sum + (e.finalCost || 0), 0),
      activeProjects: projects.filter(p => p.status === 'planning' || p.status === 'in_progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      activeEstimations: estimations.filter(e => e.status === 'draft' || e.status === 'in_progress').length,
      completedEstimations: estimations.filter(e => e.status === 'completed').length
    };
    
    console.log('\n📊 Dashboard Stats for bhaiii:');
    console.log(`  - Total Projects: ${stats.totalProjects}`);
    console.log(`  - Total Estimations: ${stats.totalEstimations}`);
    console.log(`  - Active Projects: ${stats.activeProjects}`);
    console.log(`  - Completed Projects: ${stats.completedProjects}`);
    console.log(`  - Active Estimations: ${stats.activeEstimations}`);
    console.log(`  - Completed Estimations: ${stats.completedEstimations}`);
    console.log(`  - Total Value: $${stats.totalValue}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkBhaiiiData();
