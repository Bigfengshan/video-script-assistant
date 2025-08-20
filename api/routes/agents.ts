import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase.js'
import { authenticateToken } from '../middleware/auth.js'
import { loadUserPermissions, checkAgentPermission } from '../middleware/permissions.js'

const router = Router()

// 获取AI员工列表（管理员可访问所有，普通用户基于权限过滤）
router.get('/', authenticateToken, loadUserPermissions, async (req, res) => {
  try {
    const userPermissions = req.userPermissions || [];
    const userRole = req.user?.role;
    
    // 如果是管理员，返回所有活跃的AI员工
    if (userRole === 'admin') {
      const { data: agents, error } = await supabaseAdmin
        .from('ai_agents')
        .select('id, name, description, avatar_url, integration_type, dify_api_endpoint, api_key, chatbot_url, deepseek_api_key, deepseek_model, system_prompt, temperature, max_tokens, required_plan, is_active, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('获取AI员工列表失败:', error)
        return res.status(500).json({ error: '获取AI员工列表失败' })
      }

      return res.json({ agents })
    }
    
    // 普通用户：如果没有任何权限，返回空列表
    if (userPermissions.length === 0) {
      return res.json({ agents: [] });
    }

    const { data: agents, error } = await supabaseAdmin
      .from('ai_agents')
      .select('id, name, description, avatar_url, integration_type, dify_api_endpoint, api_key, chatbot_url, deepseek_api_key, deepseek_model, system_prompt, temperature, max_tokens, required_plan, is_active, created_at')
      .in('id', userPermissions)
      .eq('is_active', true)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('获取AI员工列表失败:', error)
      return res.status(500).json({ error: '获取AI员工列表失败' })
    }

    res.json({ agents })
  } catch (error) {
    console.error('获取AI员工列表错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 获取单个AI员工详情（管理员可访问所有，普通用户需要权限验证）
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: '需要登录' });
    }

    // 如果是管理员，直接获取AI员工信息
    if (userRole === 'admin') {
      const { data: agent, error } = await supabaseAdmin
        .from('ai_agents')
        .select('id, name, description, avatar_url, integration_type, dify_api_endpoint, api_key, chatbot_url, deepseek_api_key, deepseek_model, system_prompt, temperature, max_tokens, required_plan, is_active, created_at')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error || !agent) {
        return res.status(404).json({ error: 'AI员工不存在' })
      }

      return res.json({ agent })
    }

    // 普通用户：检查用户是否有权限访问该AI员工
    const { data: permission, error: permError } = await supabaseAdmin
      .from('user_agent_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', id)
      .eq('is_active', true)
      .single();

    if (permError || !permission) {
      return res.status(403).json({ error: '没有权限访问该AI员工' });
    }

    const { data: agent, error } = await supabaseAdmin
      .from('ai_agents')
      .select('id, name, description, avatar_url, integration_type, dify_api_endpoint, api_key, chatbot_url, deepseek_api_key, deepseek_model, system_prompt, temperature, max_tokens, required_plan, is_active, created_at')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !agent) {
      return res.status(404).json({ error: 'AI员工不存在' })
    }

    res.json({ agent })
  } catch (error) {
    console.error('获取AI员工详情错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 获取AI员工的iframe URL（需要权限验证）
router.get('/:id/iframe-url', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ error: '需要登录' });
    }

    // 如果是管理员，直接获取chatbot_url
    if (userRole === 'admin') {
      const { data: agent, error } = await supabaseAdmin
        .from('ai_agents')
        .select('chatbot_url, integration_type')
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error || !agent) {
        return res.status(404).json({ error: 'AI员工不存在' })
      }

      // 检查AI员工是否支持iframe模式
      if ((agent.integration_type === 'api' || agent.integration_type === 'iframe') && agent.chatbot_url) {
        return res.json({ url: agent.chatbot_url })
      } else {
        return res.status(400).json({ error: '该AI员工不支持iframe模式或未配置chatbot_url' })
      }
    }

    // 普通用户：检查用户是否有权限访问该AI员工
    const { data: permission, error: permError } = await supabaseAdmin
      .from('user_agent_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('agent_id', id)
      .eq('is_active', true)
      .single();

    if (permError || !permission) {
      return res.status(403).json({ error: '没有权限访问该AI员工' });
    }

    const { data: agent, error } = await supabaseAdmin
      .from('ai_agents')
      .select('chatbot_url, integration_type')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !agent) {
      return res.status(404).json({ error: 'AI员工不存在' })
    }

    // 检查AI员工是否支持iframe模式
    if ((agent.integration_type === 'api' || agent.integration_type === 'iframe') && agent.chatbot_url) {
      return res.json({ url: agent.chatbot_url })
    } else {
      return res.status(400).json({ error: '该AI员工不支持iframe模式或未配置chatbot_url' })
    }
  } catch (error) {
    console.error('获取iframe URL错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

export default router