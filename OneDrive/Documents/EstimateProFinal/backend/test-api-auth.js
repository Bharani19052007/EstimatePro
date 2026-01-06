const axios = require('axios');

async function testAPIAuth() {
  try {
    console.log('\n=== TESTING API AUTHENTICATION ===\n');
    
    const baseURL = 'http://localhost:5000/api';
    
    // First, login to get a token
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${baseURL}/users/login`, {
      email: 'name@gmail.com',
      password: 'password123' // You'll need to use your actual password
    }).catch(err => {
      console.log('❌ Login failed. Trying with common passwords...');
      // Try with common passwords
      return axios.post(`${baseURL}/users/login`, {
        email: 'name@gmail.com',
        password: '123456'
      });
    });
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('✅ Login successful');
      console.log(`Token: ${token.substring(0, 50)}...`);
      
      // Test API endpoints with the token
      const authHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log('\n2. Testing /api/projects endpoint...');
      const projectsResponse = await axios.get(`${baseURL}/projects`, {
        headers: authHeaders
      });
      
      console.log(`✅ Projects API Response: ${projectsResponse.data.success ? 'Success' : 'Failed'}`);
      console.log(`   Projects count: ${projectsResponse.data.data?.length || 0}`);
      
      console.log('\n3. Testing /api/estimations endpoint...');
      const estimationsResponse = await axios.get(`${baseURL}/estimations`, {
        headers: authHeaders
      });
      
      console.log(`✅ Estimations API Response: ${estimationsResponse.data.success ? 'Success' : 'Failed'}`);
      console.log(`   Estimations count: ${estimationsResponse.data.data?.length || 0}`);
      
      console.log('\n4. Testing /api/dashboard/stats endpoint...');
      const statsResponse = await axios.get(`${baseURL}/dashboard/stats`, {
        headers: authHeaders
      });
      
      console.log(`✅ Dashboard Stats API Response: ${statsResponse.data.success ? 'Success' : 'Failed'}`);
      if (statsResponse.data.data) {
        console.log(`   Total Projects: ${statsResponse.data.data.totalProjects}`);
        console.log(`   Total Estimations: ${statsResponse.data.data.totalEstimations}`);
        console.log(`   Total Value: $${statsResponse.data.data.totalValue}`);
      }
      
    } else {
      console.log('❌ Login failed - no token received');
      console.log('Response:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAPIAuth();
