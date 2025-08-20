import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { supabaseAdmin } from '../lib/supabase'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// 配置multer用于头像上传
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB限制
  },
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(null, false)
    }
  }
})

// 确保uploads目录存在
const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 管理员权限检查中间件
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user?.id
    
    // 检查用户是否为管理员（这里简单检查，实际应该有专门的管理员表）
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', userId)
      .single()
    
    if (error || !user) {
      return res.status(403).json({ error: '权限不足' })
    }
    
    // 简单的管理员检查（实际应该有更严格的权限系统）
    const adminEmails = ['admin@example.com', 'weichengyu@example.com', 'admin@test.com'] // 添加测试管理员账号
    if (!adminEmails.includes(user.email)) {
      return res.status(403).json({ error: '需要管理员权限' })
    }
    
    next()
  } catch (error) {
    console.error('权限检查失败:', error)
    res.status(500).json({ error: '权限检查失败' })
  }
}

// 获取系统统计信息
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 获取用户统计
    const { count: totalUsers } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    // 获取活跃订阅统计
    const { count: activeSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    // 获取本月新用户
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    
    const { count: newUsersThisMonth } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startOfMonth.toISOString())
    
    // 获取总收入（已完成的订单）
    const { data: completedOrders } = await supabaseAdmin
      .from('orders')
      .select('amount')
      .eq('status', 'completed')
    
    const totalRevenue = completedOrders?.reduce((sum, order) => sum + order.amount, 0) || 0
    
    // 获取对话统计
    const { count: totalConversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true })
    
    const { count: totalMessages } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
    
    res.json({
      stats: {
        totalUsers: totalUsers || 0,
        activeSubscriptions: activeSubscriptions || 0,
        newUsersThisMonth: newUsersThisMonth || 0,
        totalRevenue,
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0
      }
    })
  } catch (error) {
    console.error('获取统计信息失败:', error)
    res.status(500).json({ error: '获取统计信息失败' })
  }
})

// 获取用户列表
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    
    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        subscriptions (
          plan_type,
          status,
          usage_count,
          usage_limit,
          start_date,
          end_date
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)
    
    if (search) {
      query = query.ilike('email', `%${search}%`)
    }
    
    const { data: users, error, count } = await query
    
    if (error) {
      console.error('获取用户列表失败:', error)
      return res.status(500).json({ error: '获取用户列表失败' })
    }
    
    res.json({
      users: users || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    })
  } catch (error) {
    console.error('获取用户列表失败:', error)
    res.status(500).json({ error: '获取用户列表失败' })
  }
})

// 获取订单列表
router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = '' } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        users (
          email
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data: orders, error, count } = await query
    
    if (error) {
      console.error('获取订单列表失败:', error)
      return res.status(500).json({ error: '获取订单列表失败' })
    }
    
    res.json({
      orders: orders || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    })
  } catch (error) {
    console.error('获取订单列表失败:', error)
    res.status(500).json({ error: '获取订单列表失败' })
  }
})

// 更新用户订阅
router.put('/users/:userId/subscription', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    const { plan_type, status, usage_limit } = req.body
    
    const updateData: any = {}
    if (plan_type) updateData.plan_type = plan_type
    if (status) updateData.status = status
    if (usage_limit) updateData.usage_limit = usage_limit
    
    if (plan_type && plan_type !== 'free') {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)
      updateData.start_date = startDate.toISOString()
      updateData.end_date = endDate.toISOString()
    }
    
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update(updateData)
      .eq('user_id', userId)
    
    if (error) {
      console.error('更新用户订阅失败:', error)
      return res.status(500).json({ error: '更新用户订阅失败' })
    }
    
    res.json({ message: '用户订阅已更新' })
  } catch (error) {
    console.error('更新用户订阅失败:', error)
    res.status(500).json({ error: '更新用户订阅失败' })
  }
})

// 删除用户
router.delete('/users/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params
    
    // 统计删除的数据量
    let deletedStats = {
      messages: 0,
      conversations: 0,
      orders: 0,
      subscriptions: 0,
      permissions: 0,
      auditLogs: 0,
      user: 0
    }
    
    console.log(`开始删除用户 ${userId} 及其相关数据...`)
    
    // 1. 删除用户权限记录
    const { count: deletedPermissionsCount, error: permissionsError } = await supabaseAdmin
      .from('user_agent_permissions')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
    
    if (permissionsError) {
      console.error('删除用户权限记录失败:', permissionsError)
      return res.status(500).json({ error: '删除用户权限记录失败' })
    }
    
    deletedStats.permissions = deletedPermissionsCount || 0
    console.log(`删除了 ${deletedStats.permissions} 条用户权限记录`)
    
    // 2. 删除权限审计日志记录
    const { count: deletedAuditLogsCount, error: auditLogsError } = await supabaseAdmin
      .from('permission_audit_logs')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
    
    if (auditLogsError) {
      console.error('删除权限审计日志失败:', auditLogsError)
      return res.status(500).json({ error: '删除权限审计日志失败' })
    }
    
    deletedStats.auditLogs = deletedAuditLogsCount || 0
    console.log(`删除了 ${deletedStats.auditLogs} 条权限审计日志记录`)
    
    // 3. 首先获取用户的所有对话ID
    const { data: userConversations, error: getUserConversationsError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('user_id', userId)
    
    if (getUserConversationsError) {
      console.error('获取用户对话列表失败:', getUserConversationsError)
      return res.status(500).json({ error: '获取用户对话列表失败' })
    }
    
    const userConversationIds = userConversations?.map(c => c.id) || []
    console.log(`找到 ${userConversationIds.length} 个用户对话`)
    
    // 4. 删除消息记录（通过conversation_id）
    let deletedMessagesCount = 0
    if (userConversationIds.length > 0) {
      const { count, error: messagesError } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' })
        .in('conversation_id', userConversationIds)
      
      if (messagesError) {
        console.error('删除消息记录失败:', messagesError)
        return res.status(500).json({ error: '删除消息记录失败' })
      }
      
      deletedMessagesCount = count || 0
    }
    
    deletedStats.messages = deletedMessagesCount
    console.log(`删除了 ${deletedStats.messages} 条消息记录`)
    
    // 5. 删除对话记录
    const { count: deletedConversationsCount, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
    
    if (conversationsError) {
      console.error('删除对话记录失败:', conversationsError)
      return res.status(500).json({ error: '删除对话记录失败' })
    }
    
    deletedStats.conversations = deletedConversationsCount || 0
    console.log(`删除了 ${deletedStats.conversations} 个对话记录`)
    
    // 6. 删除订单记录
    const { count: deletedOrdersCount, error: ordersError } = await supabaseAdmin
      .from('orders')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
    
    if (ordersError) {
      console.error('删除订单记录失败:', ordersError)
      return res.status(500).json({ error: '删除订单记录失败' })
    }
    
    deletedStats.orders = deletedOrdersCount || 0
    console.log(`删除了 ${deletedStats.orders} 个订单记录`)
    
    // 7. 删除订阅记录
    const { count: deletedSubscriptionsCount, error: subscriptionsError } = await supabaseAdmin
      .from('subscriptions')
      .delete({ count: 'exact' })
      .eq('user_id', userId)
    
    if (subscriptionsError) {
      console.error('删除订阅记录失败:', subscriptionsError)
      return res.status(500).json({ error: '删除订阅记录失败' })
    }
    
    deletedStats.subscriptions = deletedSubscriptionsCount || 0
    console.log(`删除了 ${deletedStats.subscriptions} 个订阅记录`)
    
    // 8. 最后删除用户本身
    const { count: deletedUserCount, error: userError } = await supabaseAdmin
      .from('users')
      .delete({ count: 'exact' })
      .eq('id', userId)
    
    if (userError) {
      console.error('删除用户失败:', userError)
      return res.status(500).json({ error: '删除用户失败' })
    }
    
    deletedStats.user = deletedUserCount || 0
    
    if (deletedStats.user === 0) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    console.log('用户删除完成:', deletedStats)
    
    res.json({ 
      message: '用户及相关数据删除成功',
      deletedStats: {
        user: deletedStats.user,
        conversations: deletedStats.conversations,
        messages: deletedStats.messages,
        orders: deletedStats.orders,
        subscriptions: deletedStats.subscriptions,
        permissions: deletedStats.permissions,
        auditLogs: deletedStats.auditLogs,
        total: deletedStats.user + deletedStats.conversations + deletedStats.messages + deletedStats.orders + deletedStats.subscriptions + deletedStats.permissions + deletedStats.auditLogs
      }
    })
  } catch (error) {
    console.error('删除用户失败:', error)
    res.status(500).json({ error: '删除用户失败' })
  }
})

// ===== 文件上传 API =====

// 头像上传
router.post('/upload/avatar', authenticateToken, requireAdmin, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '没有上传文件' })
    }

    // 生成唯一文件名
    const fileExtension = path.extname(req.file.originalname)
    const fileName = `avatar_${Date.now()}_${Math.random().toString(36).substring(2)}${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // 保存文件到本地
    fs.writeFileSync(filePath, req.file.buffer)

    // 返回文件URL
    const fileUrl = `/uploads/avatars/${fileName}`
    
    res.json({
      success: true,
      url: fileUrl,
      message: '头像上传成功'
    })
  } catch (error) {
    console.error('头像上传失败:', error)
    res.status(500).json({ error: '头像上传失败' })
  }
})

// ===== AI员工管理 API =====

// 获取AI员工列表
router.get('/agents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '', status = '' } = req.query
    const offset = (Number(page) - 1) * Number(limit)
    
    let query = supabaseAdmin
      .from('ai_agents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1)
    
    if (search) {
      query = query.ilike('name', `%${search}%`)
    }
    
    if (status !== '') {
      query = query.eq('is_active', status === 'active')
    }
    
    const { data: agents, error, count } = await query
    
    if (error) {
      console.error('获取AI员工列表失败:', error)
      return res.status(500).json({ error: '获取AI员工列表失败' })
    }
    
    res.json({
      agents: agents || [],
      total: count || 0,
      page: Number(page),
      limit: Number(limit)
    })
  } catch (error) {
    console.error('获取AI员工列表失败:', error)
    res.status(500).json({ error: '获取AI员工列表失败' })
  }
})

// 创建AI员工
router.post('/agents', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      avatar_url, 
      integration_type = 'api',
      dify_api_endpoint, 
      api_key, 
      chatbot_url,
      required_plan = 'free' 
    } = req.body
    
    // 验证必填字段
    if (!name) {
      return res.status(400).json({ error: '名称为必填项' })
    }
    
    // 根据集成模式验证必填字段
    if (integration_type === 'api') {
      if (!dify_api_endpoint || !api_key) {
        return res.status(400).json({ error: 'API模式下，Dify API地址和API密钥为必填项' })
      }
    } else if (integration_type === 'iframe') {
      if (!chatbot_url) {
        return res.status(400).json({ error: 'iframe模式下，聊天机器人URL为必填项' })
      }
    } else if (integration_type === 'deepseek') {
      if (!req.body.deepseek_api_key) {
        return res.status(400).json({ error: 'DeepSeek模式下，API密钥为必填项' })
      }
    } else {
      return res.status(400).json({ error: '无效的集成模式' })
    }
    
    // 验证required_plan值
    const validPlans = ['free', 'professional', 'team']
    if (!validPlans.includes(required_plan)) {
      return res.status(400).json({ error: '无效的订阅计划类型' })
    }
    
    const insertData: any = {
      name,
      description,
      avatar_url,
      integration_type,
      required_plan,
      is_active: true
    }
    
    // 根据集成模式添加相应字段
    if (integration_type === 'api') {
      insertData.dify_api_endpoint = dify_api_endpoint
      insertData.api_key = api_key
    } else if (integration_type === 'iframe') {
      insertData.chatbot_url = chatbot_url
    } else if (integration_type === 'deepseek') {
      insertData.deepseek_api_key = req.body.deepseek_api_key
      insertData.deepseek_system_prompt = req.body.deepseek_system_prompt || '你是一个有用的AI助手。'
    }
    
    const { data: agent, error } = await supabaseAdmin
      .from('ai_agents')
      .insert(insertData)
      .select()
      .single()
    
    if (error) {
      console.error('创建AI员工失败:', error)
      return res.status(500).json({ error: '创建AI员工失败' })
    }
    
    res.status(201).json({ agent, message: 'AI员工创建成功' })
  } catch (error) {
    console.error('创建AI员工失败:', error)
    res.status(500).json({ error: '创建AI员工失败' })
  }
})

// 更新AI员工
router.put('/agents/:agentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { agentId } = req.params
    const { 
      name, 
      description, 
      avatar_url, 
      integration_type,
      dify_api_endpoint, 
      api_key, 
      chatbot_url,
      deepseek_api_key,
      deepseek_system_prompt,
      required_plan, 
      is_active 
    } = req.body
    
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (avatar_url !== undefined) updateData.avatar_url = avatar_url
    if (integration_type !== undefined) {
      if (!['api', 'iframe', 'deepseek'].includes(integration_type)) {
        return res.status(400).json({ error: '无效的集成模式' })
      }
      updateData.integration_type = integration_type
    }
    if (dify_api_endpoint !== undefined) updateData.dify_api_endpoint = dify_api_endpoint
    if (api_key !== undefined) updateData.api_key = api_key
    if (chatbot_url !== undefined) updateData.chatbot_url = chatbot_url
    if (deepseek_api_key !== undefined) updateData.deepseek_api_key = deepseek_api_key
    if (deepseek_system_prompt !== undefined) updateData.deepseek_system_prompt = deepseek_system_prompt
    if (required_plan !== undefined) {
      const validPlans = ['free', 'professional', 'team']
      if (!validPlans.includes(required_plan)) {
        return res.status(400).json({ error: '无效的订阅计划类型' })
      }
      updateData.required_plan = required_plan
    }
    if (is_active !== undefined) updateData.is_active = is_active
    
    const { data: agent, error } = await supabaseAdmin
      .from('ai_agents')
      .update(updateData)
      .eq('id', agentId)
      .select()
      .single()
    
    if (error) {
      console.error('更新AI员工失败:', error)
      return res.status(500).json({ error: '更新AI员工失败' })
    }
    
    if (!agent) {
      return res.status(404).json({ error: 'AI员工不存在' })
    }
    
    res.json({ agent, message: 'AI员工更新成功' })
  } catch (error) {
    console.error('更新AI员工失败:', error)
    res.status(500).json({ error: '更新AI员工失败' })
  }
})

// 删除AI员工（级联删除相关数据）
router.delete('/agents/:agentId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { agentId } = req.params
    
    // 统计删除的数据量
    let deletedStats = {
      messages: 0,
      conversations: 0,
      permissions: 0,
      auditLogs: 0,
      agent: 0
    }
    
    // 开始级联删除过程
    console.log(`开始删除AI员工 ${agentId} 及其相关数据...`)
    
    // 1. 首先获取所有相关的对话ID
    const { data: conversations, error: conversationsError } = await supabaseAdmin
      .from('conversations')
      .select('id')
      .eq('agent_id', agentId)
    
    if (conversationsError) {
      console.error('获取对话列表失败:', conversationsError)
      return res.status(500).json({ error: '获取对话列表失败' })
    }
    
    const conversationIds = conversations?.map(c => c.id) || []
    console.log(`找到 ${conversationIds.length} 个相关对话`)
    
    // 2. 删除所有相关的消息记录
    if (conversationIds.length > 0) {
      const { count: deletedMessagesCount, error: messagesError } = await supabaseAdmin
        .from('messages')
        .delete({ count: 'exact' })
        .in('conversation_id', conversationIds)
      
      if (messagesError) {
        console.error('删除消息记录失败:', messagesError)
        return res.status(500).json({ error: '删除消息记录失败' })
      }
      
      deletedStats.messages = deletedMessagesCount || 0
      console.log(`删除了 ${deletedStats.messages} 条消息记录`)
    }
    
    // 3. 删除所有相关的对话记录
    const { count: deletedConversationsCount, error: deleteConversationsError } = await supabaseAdmin
      .from('conversations')
      .delete({ count: 'exact' })
      .eq('agent_id', agentId)
    
    if (deleteConversationsError) {
      console.error('删除对话记录失败:', deleteConversationsError)
      return res.status(500).json({ error: '删除对话记录失败' })
    }
    
    deletedStats.conversations = deletedConversationsCount || 0
    console.log(`删除了 ${deletedStats.conversations} 个对话记录`)
    
    // 4. 删除用户权限记录
    const { count: deletedPermissionsCount, error: permissionsError } = await supabaseAdmin
      .from('user_agent_permissions')
      .delete({ count: 'exact' })
      .eq('agent_id', agentId)
    
    if (permissionsError) {
      console.error('删除权限记录失败:', permissionsError)
      return res.status(500).json({ error: '删除权限记录失败' })
    }
    
    deletedStats.permissions = deletedPermissionsCount || 0
    console.log(`删除了 ${deletedStats.permissions} 条权限记录`)
    
    // 5. 删除审计日志记录
    const { count: deletedAuditLogsCount, error: auditLogsError } = await supabaseAdmin
      .from('permission_audit_logs')
      .delete({ count: 'exact' })
      .eq('agent_id', agentId)
    
    if (auditLogsError) {
      console.error('删除审计日志失败:', auditLogsError)
      return res.status(500).json({ error: '删除审计日志失败' })
    }
    
    deletedStats.auditLogs = deletedAuditLogsCount || 0
    console.log(`删除了 ${deletedStats.auditLogs} 条审计日志记录`)
    
    // 6. 最后删除AI员工本身
    const { count: deletedAgentCount, error: agentError } = await supabaseAdmin
      .from('ai_agents')
      .delete({ count: 'exact' })
      .eq('id', agentId)
    
    if (agentError) {
      console.error('删除AI员工失败:', agentError)
      return res.status(500).json({ error: '删除AI员工失败' })
    }
    
    deletedStats.agent = deletedAgentCount || 0
    
    if (deletedStats.agent === 0) {
      return res.status(404).json({ error: 'AI员工不存在' })
    }
    
    console.log('AI员工删除完成:', deletedStats)
    
    res.json({ 
      message: 'AI员工及相关数据删除成功',
      deletedStats: {
        agent: deletedStats.agent,
        conversations: deletedStats.conversations,
        messages: deletedStats.messages,
        permissions: deletedStats.permissions,
        auditLogs: deletedStats.auditLogs,
        total: deletedStats.agent + deletedStats.conversations + deletedStats.messages + deletedStats.permissions + deletedStats.auditLogs
      }
    })
  } catch (error) {
    console.error('删除AI员工失败:', error)
    res.status(500).json({ error: '删除AI员工失败' })
  }
})

// 切换AI员工状态
router.patch('/agents/:agentId/toggle', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { agentId } = req.params
    const { is_active } = req.body
    
    // 验证参数
    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: '状态参数无效' })
    }
    
    // 更新状态
    const { data: agent, error } = await supabaseAdmin
      .from('ai_agents')
      .update({ is_active })
      .eq('id', agentId)
      .select()
      .single()
    
    if (error) {
      console.error('切换AI员工状态失败:', error)
      return res.status(500).json({ error: '切换AI员工状态失败' })
    }
    
    res.json({ 
      agent, 
      message: `AI员工已${agent.is_active ? '启用' : '禁用'}` 
    })
  } catch (error) {
    console.error('切换AI员工状态失败:', error)
    res.status(500).json({ error: '切换AI员工状态失败' })
  }
})

// 获取AI员工使用统计
router.get('/agents/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { data: agents } = await supabaseAdmin
      .from('ai_agents')
      .select('id, name, is_active')
    
    const agentStats = []
    
    for (const agent of agents || []) {
      const { count: conversationCount } = await supabaseAdmin
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agent.id)
      
      // 通过conversations表关联获取消息数量
      const { data: conversations } = await supabaseAdmin
        .from('conversations')
        .select('id')
        .eq('agent_id', agent.id)
      
      let messageCount = 0
      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id)
        const { count } = await supabaseAdmin
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .in('conversation_id', conversationIds)
        messageCount = count || 0
      }
      
      agentStats.push({
        id: agent.id,
        name: agent.name,
        is_active: agent.is_active,
        conversationCount: conversationCount || 0,
        messageCount
      })
    }
    
    res.json({ agentStats })
  } catch (error) {
    console.error('获取AI员工统计失败:', error)
    res.status(500).json({ error: '获取AI员工统计失败' })
  }
})

export default router