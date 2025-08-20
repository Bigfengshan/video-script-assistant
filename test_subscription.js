// 测试订阅API的脚本
const API_BASE_URL = 'http://localhost:3002'

// 模拟用户token（需要替换为实际的token）
const token = 'your_token_here'

async function testSubscriptionAPI() {
  console.log('=== 测试订阅计划获取 ===')
  
  try {
    // 1. 获取订阅计划
    const plansResponse = await fetch(`${API_BASE_URL}/api/subscriptions/plans`)
    const plansData = await plansResponse.json()
    console.log('订阅计划:', JSON.stringify(plansData, null, 2))
    
    // 2. 测试创建订单 - 使用professional
    console.log('\n=== 测试创建professional订单 ===')
    const professionalResponse = await fetch(`${API_BASE_URL}/api/subscriptions/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plan_type: 'professional' })
    })
    
    console.log('Professional订单响应状态:', professionalResponse.status)
    const professionalData = await professionalResponse.json()
    console.log('Professional订单响应:', JSON.stringify(professionalData, null, 2))
    
    // 3. 测试创建订单 - 使用team
    console.log('\n=== 测试创建team订单 ===')
    const teamResponse = await fetch(`${API_BASE_URL}/api/subscriptions/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plan_type: 'team' })
    })
    
    console.log('Team订单响应状态:', teamResponse.status)
    const teamData = await teamResponse.json()
    console.log('Team订单响应:', JSON.stringify(teamData, null, 2))
    
    // 4. 测试无效的订阅类型
    console.log('\n=== 测试无效订阅类型 ===')
    const invalidResponse = await fetch(`${API_BASE_URL}/api/subscriptions/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plan_type: '专业版' })
    })
    
    console.log('无效订阅类型响应状态:', invalidResponse.status)
    const invalidData = await invalidResponse.json()
    console.log('无效订阅类型响应:', JSON.stringify(invalidData, null, 2))
    
  } catch (error) {
    console.error('测试失败:', error)
  }
}

// 如果没有token，先提示用户
if (token === 'your_token_here') {
  console.log('请先在浏览器中登录，然后从localStorage获取token并替换脚本中的token变量')
  console.log('在浏览器控制台中运行: localStorage.getItem("token")')
} else {
  testSubscriptionAPI()
}