#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Database connection templates
const connections = {
  'atlas': {
    name: 'MongoDB Atlas (Cloud)',
    template: 'MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/project-management?retryWrites=true&w=majority',
    instructions: [
      '1. Create a free MongoDB Atlas account at https://www.mongodb.com/atlas',
      '2. Create a new cluster',
      '3. Add your IP address to the whitelist',
      '4. Create a database user',
      '5. Replace username, password, and cluster in the connection string'
    ]
  },
  
  'local': {
    name: 'Local MongoDB',
    template: 'MONGO_URI=mongodb://localhost:27017/project-management',
    instructions: [
      '1. Install MongoDB locally',
      '2. Start MongoDB service',
      '3. No additional configuration needed'
    ]
  },
  
  'compass': {
    name: 'MongoDB Compass Local',
    template: 'MONGO_URI=mongodb://127.0.0.1:27017/project-management',
    instructions: [
      '1. Use 127.0.0.1 instead of localhost',
      '2. Works well with MongoDB Compass',
      '3. Good fallback option'
    ]
  },
  
  'docker': {
    name: 'Docker MongoDB',
    template: 'MONGO_URI=mongodb://host.docker.internal:27017/project-management',
    instructions: [
      '1. Run MongoDB in Docker container',
      '2. Use host.docker.internal for connection',
      '3. Ensure port 27017 is exposed'
    ]
  }
};

function setupDatabase(connectionType) {
  const connection = connections[connectionType];
  
  if (!connection) {
    console.error('❌ Invalid connection type. Available options:');
    Object.keys(connections).forEach(key => {
      console.log(`   - ${key}: ${connections[key].name}`);
    });
    process.exit(1);
  }
  
  console.log(`\n🔧 Setting up ${connection.name}\n`);
  
  // Show instructions
  console.log('📋 Instructions:');
  connection.instructions.forEach((instruction, index) => {
    console.log(`   ${index + 1}. ${instruction}`);
  });
  
  console.log('\n📝 Connection string:');
  console.log(`   ${connection.template}`);
  
  // Create .env file
  const envPath = path.join(__dirname, '../.env');
  const envContent = `
# MongoDB Connection
${connection.template}

# Server Configuration
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
`.trim();
  
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!');
    console.log(`📍 Location: ${envPath}`);
    console.log('\n⚠️  Remember to:');
    console.log('   1. Update the connection string with your actual credentials');
    console.log('   2. Change the JWT_SECRET to a secure value');
    console.log('   3. Restart the backend server');
    
  } catch (error) {
    console.error('❌ Failed to create .env file:', error.message);
  }
}

// Command line interface
const args = process.argv.slice(2);
const connectionType = args[0];

if (!connectionType) {
  console.log('🗄️  MongoDB Database Setup Helper\n');
  console.log('Usage: node setup-db.js <connection-type>\n');
  console.log('Available connection types:');
  Object.keys(connections).forEach(key => {
    console.log(`   ${key.padEnd(10)} - ${connections[key].name}`);
  });
  console.log('\nExamples:');
  console.log('   node setup-db.js atlas');
  console.log('   node setup-db.js local');
  console.log('   node setup-db.js compass');
  process.exit(0);
}

setupDatabase(connectionType);
