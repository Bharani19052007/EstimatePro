const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const ActivityLog = require('../models/ActivityLog');

const testDatabase = async () => {
  try {
    console.log('🔍 Testing database connection and data retrieval...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/project-management');
    console.log('✅ Connected to database');

    // Test Users
    const users = await User.find({});
    console.log(`\n👤 Users found: ${users.length}`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
    });

    // Test Projects
    const projects = await Project.find({}).populate('userId', 'name email');
    console.log(`\n📁 Projects found: ${projects.length}`);
    projects.forEach(project => {
      console.log(`   - ${project.projectName} - ${project.status} - $${project.estimatedBudget}`);
    });

    // Test Tasks
    const tasks = await Task.find({}).populate('projectId', 'projectName');
    console.log(`\n📋 Tasks found: ${tasks.length}`);
    tasks.forEach(task => {
      console.log(`   - ${task.taskName} - ${task.status} - ${task.estimatedHours}h`);
    });

    // Test Activities
    const activities = await Activity.find({}).populate('taskId', 'taskName');
    console.log(`\n🎯 Activities found: ${activities.length}`);
    activities.forEach(activity => {
      console.log(`   - ${activity.activityName} - ${activity.status} - ${activity.estimatedHours}h`);
    });

    // Test Activity Logs
    const logs = await ActivityLog.find({}).populate('userId', 'name email');
    console.log(`\n📝 Activity Logs found: ${logs.length}`);
    logs.forEach(log => {
      console.log(`   - ${log.action} by ${log.userId?.name} at ${log.timestamp.toLocaleDateString()}`);
    });

    console.log('\n✅ Database test completed successfully!');
    
    // Test API endpoints will work
    console.log('\n🌐 API Endpoints Ready:');
    console.log('   - POST /api/users/login (Login: alex@example.com / password123)');
    console.log('   - GET /api/projects/:userId (Get projects for user)');
    console.log('   - GET /api/tasks/project/:projectId (Get tasks for project)');
    console.log('   - GET /api/activities/task/:taskId (Get activities for task)');
    console.log('   - GET /api/activity-log/user/:userId (Get activity logs for user)');

  } catch (error) {
    console.error('❌ Database test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Run test
if (require.main === module) {
  testDatabase();
}

module.exports = testDatabase;
