const axios = require('axios');

// 配置
const API_BASE_URL = 'http://localhost:3002';
const token = 'your_token_here'; // 需要替换为实际的token

async function debugIframeIssue() {
  console.log('🔍 开始调试iframe加载问题...');
  
  try {
    // 1. 检查后端健康状态
    console.log('\n1. 检查后端服务状态...');
    const healthResponse = await axios.get(`${API_BASE_URL}/api/health`);
    console.log('✅ 后端服务正常:', healthResponse.data);
    
    // 2. 获取AI员工列表
    console.log('\n2. 获取AI员工列表...');
    const agentsResponse = await axios.get(`${API_BASE_URL}/api/agents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const agents = agentsResponse.data.agents;
    console.log(`✅ 获取到 ${agents.length} 个AI员工`);
    
    // 3. 检查每个AI员工的详细信息
    console.log('\n3. 检查AI员工详细信息...');
    for (const agent of agents) {
      console.log(`\n--- AI员工: ${agent.name} (ID: ${agent.id}) ---`);
      console.log(`集成类型: ${agent.integration_type}`);
      console.log(`是否激活: ${agent.is_active}`);
      console.log(`chatbot_url: ${agent.chatbot_url || '未设置'}`);
      
      // 如果是api类型，测试iframe-url端点
      if (agent.integration_type === 'api') {
        try {
          console.log('\n测试iframe-url端点...');
          const iframeResponse = await axios.get(`${API_BASE_URL}/api/agents/${agent.id}/iframe-url`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          console.log('✅ iframe URL获取成功:', iframeResponse.data.iframe_url);
        } catch (error) {
          console.log('❌ iframe URL获取失败:', error.response?.data || error.message);
        }
      } else if (agent.integration_type === 'iframe') {
        console.log('iframe类型，直接使用chatbot_url');
      }
    }
    
    // 4. 检查数据库中的原始数据
    console.log('\n4. 建议检查的数据库查询:');
    console.log('SELECT id, name, integration_type, chatbot_url, is_active FROM ai_agents WHERE is_active = true;');
    
  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 提示: 请确保token有效，可以通过以下方式获取:');
      console.log('1. 在浏览器开发者工具中查看localStorage中的token');
      console.log('2. 或者重新登录获取新的token');
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  console.log('请先设置正确的token，然后运行: node debug_iframe_issue.js');
  console.log('或者在代码中替换token变量的值');
}

module.exports = { debugIframeIssue };