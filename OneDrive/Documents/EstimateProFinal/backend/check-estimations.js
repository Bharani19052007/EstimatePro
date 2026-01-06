const mongoose = require('mongoose');
require('dotenv').config();

async function checkEstimations() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project-management');
    const Estimation = require('./models/Estimation');
    
    const estimations = await Estimation.find({});
    console.log('Current estimations in database:');
    estimations.forEach(e => {
      console.log(`ID: ${e._id}, Project: ${e.projectName || 'N/A'}, Status: ${e.status}, Created: ${e.createdAt}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkEstimations();
