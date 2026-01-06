// Simple test to call the API without authentication
const testAPI = async () => {
  try {
    console.log('🧪 Testing API without authentication...');
    
    const response = await fetch('http://localhost:5000/api/test/dashboard-test');
    const data = await response.json();
    
    console.log('✅ API Response:', data);
    
    if (data.success) {
      console.log(`📊 Found ${data.data.projects.length} projects`);
      console.log(`📊 Found ${data.data.estimations.length} estimations`);
      console.log(`📊 Stats:`, data.data.stats);
      
      alert(`✅ API Working!\nProjects: ${data.data.projects.length}\nEstimations: ${data.data.estimations.length}\nTotal Value: $${data.data.stats.totalValue}`);
    } else {
      console.error('❌ API returned error:', data.error);
      alert('❌ API Error: ' + data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    alert('❌ Test Failed: ' + error.message);
  }
};

// Auto-run the test when the script loads
testAPI();
