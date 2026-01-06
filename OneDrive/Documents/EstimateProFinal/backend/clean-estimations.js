const mongoose = require('mongoose');
require('dotenv').config();

async function cleanEstimations() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project-management');
    const Estimation = require('./models/Estimation');
    
    // Delete estimations without proper project names
    const result = await Estimation.deleteMany({ 
      projectName: { $in: [null, undefined, ''] }
    });
    
    console.log(`✅ Deleted ${result.deletedCount} estimations without project names`);
    
    // Show remaining estimations
    const estimations = await Estimation.find({});
    console.log('\n📋 Remaining estimations:');
    estimations.forEach(e => {
      console.log(`ID: ${e._id}, Project: ${e.projectName}, Status: ${e.status}, Created: ${e.createdAt}`);
    });
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

cleanEstimations();
