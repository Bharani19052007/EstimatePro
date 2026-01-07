const mongoose = require('mongoose');

const databaseConfig = {
  // MongoDB Atlas (Cloud) - Recommended for production
  atlas: {
    uri: 'mongodb+srv://username:password@cluster.mongodb.net/project-management?retryWrites=true&w=majority',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  
  // Local MongoDB - Good for development
  local: {
    uri: 'mongodb://localhost:27017/project-management',
    options: {}
  },
  
  // MongoDB with authentication
  authenticated: {
    uri: 'mongodb://username:password@localhost:27017/project-management',
    options: {
      authSource: 'admin',
    }
  },
  
  // Docker MongoDB
  docker: {
    uri: 'mongodb://host.docker.internal:27017/project-management',
    options: {}
  },
  
  // MongoDB Compass connection string format
  compass: {
    uri: 'mongodb://127.0.0.1:27017/project-management',
    options: {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 20000,
      connectTimeoutMS: 10000
    }
  }
};

const connectDatabase = async (connectionType = 'local') => {
  try {
    const config = databaseConfig[connectionType];
    if (!config) {
      throw new Error(`Invalid connection type: ${connectionType}`);
    }
    
    // Use environment variable if available, otherwise use config
    const mongoUri = process.env.MONGO_URI || config.uri;
    const options = { ...config.options };
    
    await mongoose.connect(mongoUri, options);
    
    console.log(`✅ MongoDB Connected (${connectionType}): ${mongoUri}`);
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB Disconnected');
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB Reconnected');
    });
    
    return mongoose.connection;
    
  } catch (error) {
    console.error(`❌ Failed to connect to MongoDB (${connectionType}):`, error.message);
    
    // Try fallback connection
    if (connectionType !== 'compass') {
      console.log('🔄 Trying fallback connection...');
      return connectDatabase('compass');
    }
    
    throw error;
  }
};

module.exports = {
  connectDatabase,
  databaseConfig
};
