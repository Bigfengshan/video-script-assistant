// Using built-in fetch in Node.js 18+

async function testAPIs() {
  const baseURL = 'http://localhost:3001';
  
  try {
    // Test register first
    console.log('Testing register...');
    const registerResponse = await fetch(`${baseURL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@bigfan007.cn',
        password: 'admin123',
        name: 'Admin User'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('Register response:', registerData);
    
    // Test login
    console.log('\nTesting login...');
    const loginResponse = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@bigfan007.cn',
    password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);
    
    if (loginData.token) {
      const token = loginData.token;
      
      // Test users API
      console.log('\nTesting users API...');
      const usersResponse = await fetch(`${baseURL}/api/permissions/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const usersData = await usersResponse.json();
      console.log('Users response:', usersData);
      
      // Test agents API
      console.log('\nTesting agents API...');
      const agentsResponse = await fetch(`${baseURL}/api/agents`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const agentsData = await agentsResponse.json();
      console.log('Agents response:', agentsData);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPIs();