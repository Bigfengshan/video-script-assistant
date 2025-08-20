const { createClient } = require('@supabase/supabase-js')

// 从环境变量获取Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSubscriptionConstraints() {
  console.log('=== 测试订阅表约束 ===')
  
  try {
    // 测试插入有效的plan_type
    console.log('\n1. 测试插入有效的plan_type (professional):')
    const { data: validData, error: validError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000000', // 测试用UUID
        plan_type: 'professional',
        usage_limit: 500
      })
      .select()
    
    if (validError) {
      console.log('有效plan_type插入失败:', validError.message)
    } else {
      console.log('有效plan_type插入成功:', validData)
      
      // 清理测试数据
      await supabase
        .from('subscriptions')
        .delete()
        .eq('user_id', '00000000-0000-0000-0000-000000000000')
    }
    
    // 测试插入无效的plan_type
    console.log('\n2. 测试插入无效的plan_type (专业版):')
    const { data: invalidData, error: invalidError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000001', // 测试用UUID
        plan_type: '专业版', // 中文值
        usage_limit: 500
      })
      .select()
    
    if (invalidError) {
      console.log('无效plan_type插入失败 (预期):', invalidError.message)
      console.log('错误代码:', invalidError.code)
      console.log('错误详情:', invalidError.details)
    } else {
      console.log('无效plan_type插入成功 (意外):', invalidData)
    }
    
    // 测试插入另一个无效的plan_type
    console.log('\n3. 测试插入无效的plan_type (invalid_plan):')
    const { data: invalidData2, error: invalidError2 } = await supabase
      .from('subscriptions')
      .insert({
        user_id: '00000000-0000-0000-0000-000000000002', // 测试用UUID
        plan_type: 'invalid_plan',
        usage_limit: 500
      })
      .select()
    
    if (invalidError2) {
      console.log('无效plan_type插入失败 (预期):', invalidError2.message)
      console.log('错误代码:', invalidError2.code)
    } else {
      console.log('无效plan_type插入成功 (意外):', invalidData2)
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
}

// 检查环境变量
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('请设置环境变量:')
  console.log('export SUPABASE_URL="your-supabase-url"')
  console.log('export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"')
  process.exit(1)
}

testSubscriptionConstraints()