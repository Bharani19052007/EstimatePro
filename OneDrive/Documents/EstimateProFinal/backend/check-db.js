const mongoose = require('mongoose');
const Project = require('./models/Project');
const Estimation = require('./models/Estimation');
const User = require('./models/User');

const connectDatabase = require('./config/database').connectDatabase;

async function checkDatabase() {
  try {
    // Connect to database
    await connectDatabase('compass');
    
    console.log('🔍 Checking database contents...\n');
    
    // Check users
    const users = await User.find({});
    console.log(`👥 Users found: ${users.length}`);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user._id}`);
    });
    
    // Check projects
    const projects = await Project.find({});
    console.log(`\n📁 Projects found: ${projects.length}`);
    projects.forEach(project => {
      console.log(`  - ${project.projectName} - User ID: ${project.userId} - ID: ${project._id}`);
    });
    
    // Check estimations
    const estimations = await Estimation.find({});
    console.log(`\n💰 Estimations found: ${estimations.length}`);
    estimations.forEach(estimation => {
      console.log(`  - ${estimation.projectName} - User ID: ${estimation.userId} - ID: ${estimation._id}`);
    });
    
    // Check specific user data (assuming first user)
    if (users.length > 0) {
      const firstUser = users[0];
      const userProjects = await Project.find({ userId: firstUser._id });
      const userEstimations = await Estimation.find({ userId: firstUser._id });
      
      console.log(`\n👤 Data for user: ${firstUser.name}`);
      console.log(`  - Projects: ${userProjects.length}`);
      console.log(`  - Estimations: ${userEstimations.length}`);
    }
    
  } catch (error) {
    console.error('❌ Database check error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkDatabase();
