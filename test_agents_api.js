// 使用内置的fetch API (Node.js 18+)

async function testAgentsAPI() {
  try {
    const response = await fetch('http://localhost:3001/api/agents', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmeGt2Y3Zta3Zteml0a3plYXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMxNjgyMywiZXhwIjoyMDcwODkyODIzfQ.IGHFu4T9GZ4AQyoNAuZLRJvnr51aNyoOqdp-Ol3ijbY',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('AI员工数据:');
      console.log(JSON.stringify(data, null, 2));
      
      // 特别检查iframe类型的员工
      const iframeAgents = data.agents?.filter(agent => agent.integration_type === 'iframe');
      if (iframeAgents && iframeAgents.length > 0) {
        console.log('\n=== iframe类型AI员工 ===');
        iframeAgents.forEach(agent => {
          console.log(`ID: ${agent.id}`);
          console.log(`名称: ${agent.name}`);
          console.log(`chatbot_url: ${agent.chatbot_url}`);
          console.log(`是否激活: ${agent.is_active}`);
          console.log('---');
        });
      }
    } else {
      console.error('API调用失败:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('错误详情:', errorText);
    }
  } catch (error) {
    console.error('请求失败:', error.message);
  }
}

testAgentsAPI();