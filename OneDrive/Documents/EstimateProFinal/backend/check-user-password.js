const mongoose = require('mongoose');
const { connectDatabase } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function checkUserPassword() {
  try {
    await connectDatabase('local');
    
    console.log('\n=== CHECKING USER PASSWORD ===\n');
    
    const user = await User.findOne({ email: 'name@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log(`✅ Found user: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`User ID: ${user._id}`);
    console.log(`Password Hash: ${user.password.substring(0, 30)}...`);
    
    // Test common passwords
    const commonPasswords = ['password123', '123456', 'password', 'admin', '12345678'];
    
    console.log('\n=== TESTING PASSWORDS ===');
    
    for (const password of commonPasswords) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (isMatch) {
        console.log(`✅ CORRECT PASSWORD FOUND: "${password}"`);
        
        // Test login with correct password
        const axios = require('axios');
        console.log('\n=== TESTING LOGIN WITH CORRECT PASSWORD ===');
        
        try {
          const loginResponse = await axios.post('http://localhost:5000/api/users/login', {
            email: 'name@gmail.com',
            password: password
          });
          
          if (loginResponse.data.success && loginResponse.data.token) {
            const token = loginResponse.data.token;
            console.log('✅ Login successful!');
            console.log(`Token: ${token.substring(0, 50)}...`);
            
            // Test API endpoints
            const authHeaders = {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            };
            
            console.log('\n=== TESTING API ENDPOINTS ===');
            
            // Test projects
            const projectsResponse = await axios.get('http://localhost:5000/api/projects', {
              headers: authHeaders
            });
            console.log(`✅ Projects: ${projectsResponse.data.data?.length || 0} found`);
            
            // Test estimations
            const estimationsResponse = await axios.get('http://localhost:5000/api/estimations', {
              headers: authHeaders
            });
            console.log(`✅ Estimations: ${estimationsResponse.data.data?.length || 0} found`);
            
            // Test dashboard stats
            const statsResponse = await axios.get('http://localhost:5000/api/dashboard/stats', {
              headers: authHeaders
            });
            console.log(`✅ Dashboard Stats:`);
            console.log(`   Total Projects: ${statsResponse.data.data?.totalProjects || 0}`);
            console.log(`   Total Estimations: ${statsResponse.data.data?.totalEstimations || 0}`);
            console.log(`   Total Value: $${statsResponse.data.data?.totalValue || 0}`);
            
          }
        } catch (error) {
          console.error('❌ Login test failed:', error.message);
        }
        
        return;
      } else {
        console.log(`❌ "${password}" - Incorrect`);
      }
    }
    
    console.log('\n❌ No common password matched. You may need to use your actual password.');
    console.log('To fix this issue, you can:');
    console.log('1. Use your actual password in the frontend');
    console.log('2. Or reset your password');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkUserPassword();
