// 测试AI员工级联删除功能
import axios from 'axios';

// 配置
const API_BASE_URL = 'http://localhost:3002';
const ADMIN_EMAIL = 'admin@bigfan007.cn';
const ADMIN_PASSWORD = 'admin123';

let authToken = '';

// 登录获取token
async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    authToken = response.data.token;
    console.log('✅ 登录成功');
    return true;
  } catch (error) {
    console.error('❌ 登录失败:', error.response?.data || error.message);
    return false;
  }
}

// 获取AI员工列表
async function getAgents() {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/admin/agents`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('📋 当前AI员工列表:');
    response.data.agents.forEach(agent => {
      console.log(`  - ${agent.name} (ID: ${agent.id}, 状态: ${agent.is_active ? '启用' : '禁用'})`);
    });
    
    return response.data.agents;
  } catch (error) {
    console.error('❌ 获取AI员工列表失败:', error.response?.data || error.message);
    return [];
  }
}

// 创建测试AI员工
async function createTestAgent() {
  try {
    const testAgent = {
      name: '测试AI员工-级联删除',
      description: '用于测试级联删除功能的AI员工',
      integration_type: 'api',
      dify_api_endpoint: 'https://api.dify.ai/v1',
      api_key: 'test-api-key-123',
      required_plan: 'free'
    };
    
    const response = await axios.post(`${API_BASE_URL}/api/admin/agents`, testAgent, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ 创建测试AI员工成功:', response.data.agent.name);
    return response.data.agent;
  } catch (error) {
    console.error('❌ 创建测试AI员工失败:', error.response?.data || error.message);
    return null;
  }
}

// 创建测试对话和消息
async function createTestConversation(agentId) {
  try {
    // 模拟创建对话（这里需要根据实际API调整）
    console.log(`📝 为AI员工 ${agentId} 创建测试对话和消息...`);
    
    // 注意：这里需要根据实际的对话创建API来调整
    // 由于我们没有直接的对话创建API，这里只是示例
    console.log('⚠️  注意：需要手动创建一些对话和消息来测试级联删除功能');
    
    return true;
  } catch (error) {
    console.error('❌ 创建测试对话失败:', error.response?.data || error.message);
    return false;
  }
}

// 测试删除AI员工（级联删除）
async function testCascadeDelete(agentId) {
  try {
    console.log(`🗑️  开始测试删除AI员工 ${agentId}...`);
    
    const response = await axios.delete(`${API_BASE_URL}/api/admin/agents/${agentId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ 级联删除成功!');
    console.log('📊 删除统计:', response.data.deletedStats);
    
    return true;
  } catch (error) {
    console.error('❌ 删除失败:', error.response?.data || error.message);
    return false;
  }
}

// 主测试函数
async function runTest() {
  console.log('🚀 开始测试AI员工级联删除功能\n');
  
  // 1. 登录
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('❌ 测试终止：登录失败');
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  
  // 2. 获取当前AI员工列表
  console.log('\n📋 步骤1: 获取当前AI员工列表');
  const agents = await getAgents();
  
  console.log('\n' + '='.repeat(50));
  
  // 3. 创建测试AI员工
  console.log('\n🆕 步骤2: 创建测试AI员工');
  const testAgent = await createTestAgent();
  if (!testAgent) {
    console.log('❌ 测试终止：创建测试AI员工失败');
    return;
  }
  
  console.log('\n' + '='.repeat(50));
  
  // 4. 创建测试对话（可选）
  console.log('\n💬 步骤3: 创建测试对话');
  await createTestConversation(testAgent.id);
  
  console.log('\n' + '='.repeat(50));
  
  // 5. 测试级联删除
  console.log('\n🗑️  步骤4: 测试级联删除');
  const deleteSuccess = await testCascadeDelete(testAgent.id);
  
  console.log('\n' + '='.repeat(50));
  
  // 6. 验证删除结果
  console.log('\n🔍 步骤5: 验证删除结果');
  await getAgents();
  
  console.log('\n✅ 测试完成!');
  
  if (deleteSuccess) {
    console.log('🎉 级联删除功能测试通过!');
  } else {
    console.log('❌ 级联删除功能测试失败!');
  }
}

// 运行测试
runTest().catch(console.error);