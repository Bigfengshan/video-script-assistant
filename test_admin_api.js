// 测试管理员用户获取AI员工列表的API调用
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3002';

// 测试管理员登录并获取AI员工列表
async function testAdminAPI() {
  try {
    console.log('=== 开始测试管理员API调用 ===');
    
    // 1. 首先尝试管理员登录
    console.log('\n1. 尝试管理员登录...');
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'admin@test.com',
      password: 'admin123'
    });
    
    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    
    console.log('\n用户信息:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Role:', user.role);
    console.log('- Token:', token ? token.substring(0, 20) + '...' : 'null');
    
    // 2. 使用token获取AI员工列表
    console.log('\n2. 获取AI员工列表...');
    const agentsResponse = await axios.get(`${API_BASE_URL}/api/agents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('AI员工列表响应状态:', agentsResponse.status);
    console.log('AI员工列表响应数据:', JSON.stringify(agentsResponse.data, null, 2));
    
    const agents = agentsResponse.data.agents || [];
    console.log('\n获取到的AI员工数量:', agents.length);
    
    if (agents.length > 0) {
      console.log('\nAI员工详情:');
      agents.forEach((agent, index) => {
        console.log(`${index + 1}. ${agent.name}`);
        console.log(`   - ID: ${agent.id}`);
        console.log(`   - 描述: ${agent.description || '无'}`);
        console.log(`   - 集成类型: ${agent.integration_type || '未设置'}`);
        console.log(`   - 是否激活: ${agent.is_active ? '是' : '否'}`);
        console.log(`   - 所需计划: ${agent.required_plan}`);
        console.log(`   - Avatar URL: ${agent.avatar_url || '无'}`);
        console.log(`   - Chatbot URL: ${agent.chatbot_url || '无'}`);
        console.log('');
      });
    } else {
      console.log('\n⚠️  没有获取到任何AI员工数据！');
    }
    
    // 3. 测试健康检查端点
    console.log('\n3. 测试健康检查端点...');
    try {
      const healthResponse = await axios.get(`${API_BASE_URL}/api/health`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });
      console.log('健康检查响应:', healthResponse.status, healthResponse.data);
    } catch (healthError) {
      console.log('健康检查失败:', healthError.message);
    }
    
    console.log('\n=== 测试完成 ===');
    
  } catch (error) {
    console.error('\n❌ 测试过程中发生错误:');
    console.error('错误类型:', error.constructor.name);
    console.error('错误消息:', error.message);
    
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('请求失败，没有收到响应');
      console.error('请求详情:', error.request);
    }
    
    console.log('\n可能的原因:');
    console.log('1. 后端服务器未启动或端口不正确');
    console.log('2. 管理员用户不存在或密码错误');
    console.log('3. 数据库连接问题');
    console.log('4. 权限配置问题');
  }
}

// 运行测试
testAdminAPI();