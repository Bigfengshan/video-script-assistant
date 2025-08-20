// 直接通过Supabase客户端查询iframe类型AI员工数据
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tfxkvcvmkvmzitkzeatty.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmeGt2Y3Zta3Zteml0a3plYXR5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTMxNjgyMywiZXhwIjoyMDcwODkyODIzfQ.IGHFu4T9GZ4AQyoNAuZLRJvnr51aNyoOqdp-Ol3ijbY'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkIframeAgents() {
  try {
    console.log('正在查询iframe类型的AI员工...')
    
    const { data: agents, error } = await supabase
      .from('ai_agents')
      .select('id, name, integration_type, chatbot_url, is_active, created_at')
      .eq('integration_type', 'iframe')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('查询失败:', error)
      return
    }
    
    console.log(`找到 ${agents.length} 个iframe类型的AI员工:`)
    console.log('\n详细信息:')
    
    agents.forEach((agent, index) => {
      console.log(`\n${index + 1}. ${agent.name}`)
      console.log(`   ID: ${agent.id}`)
      console.log(`   类型: ${agent.integration_type}`)
      console.log(`   聊天机器人URL: ${agent.chatbot_url}`)
      console.log(`   状态: ${agent.is_active ? '激活' : '未激活'}`)
      console.log(`   创建时间: ${agent.created_at}`)
      
      // 检查URL有效性
      if (!agent.chatbot_url) {
        console.log('   ⚠️  警告: chatbot_url为空')
      } else if (agent.chatbot_url.includes('example.com')) {
        console.log('   ❌ 问题: chatbot_url指向example.com（无效URL）')
      } else {
        console.log('   ✅ chatbot_url看起来正常')
      }
    })
    
    // 检查是否有问题的URL
    const problematicAgents = agents.filter(agent => 
      !agent.chatbot_url || agent.chatbot_url.includes('example.com')
    )
    
    if (problematicAgents.length > 0) {
      console.log(`\n🔍 发现 ${problematicAgents.length} 个有问题的AI员工需要修复`)
    } else {
      console.log('\n✅ 所有iframe类型AI员工的URL都正常')
    }
    
  } catch (error) {
    console.error('执行失败:', error)
  }
}

checkIframeAgents()