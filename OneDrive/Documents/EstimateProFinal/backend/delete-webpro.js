const mongoose = require('mongoose');
require('dotenv').config();

async function deleteWebProProject() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project-management');
    const Project = require('./models/Project');
    
    // Find and delete the WebPro project
    const deletedProject = await Project.findOneAndDelete({ projectName: 'WebPro' });
    
    if (deletedProject) {
      console.log('✅ Successfully deleted WebPro project:');
      console.log(`   ID: ${deletedProject._id}`);
      console.log(`   Name: ${deletedProject.projectName}`);
      console.log(`   Created: ${deletedProject.createdAt}`);
    } else {
      console.log('❌ WebPro project not found');
    }
    
    // Show remaining projects
    const remainingProjects = await Project.find({});
    console.log('\n📁 Remaining projects:');
    remainingProjects.forEach(p => {
      console.log(`   - ${p.projectName} (Created: ${p.createdAt})`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

deleteWebProProject();
