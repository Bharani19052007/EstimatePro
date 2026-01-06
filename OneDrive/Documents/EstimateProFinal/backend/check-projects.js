const mongoose = require('mongoose');
require('dotenv').config();

async function checkProjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project-management');
    const Project = require('./models/Project');
    
    const projects = await Project.find({});
    console.log('All projects in database:');
    projects.forEach(p => {
      console.log(`ID: ${p._id}, Name: ${p.projectName}, User: ${p.userId}, Created: ${p.createdAt}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProjects();
