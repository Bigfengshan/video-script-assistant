import { Router, Request, Response } from 'express';
import { supabase } from '../lib/supabase.js';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// 获取用户权限列表
router.get('/users/:userId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.id;
    const userRole = req.user?.role;
    
    // 只有管理员或用户本人可以查看权限
    if (userRole !== 'admin' && currentUserId !== userId) {
      return res.status(403).json({ error: '无权限查看该用户权限' });
    }

    const { data, error } = await supabase
      .from('user_agent_permissions')
      .select(`
        id,
        user_id,
        agent_id,
        granted_at,
        granted_by,
        is_active,
        ai_agents (
          id,
          name,
          description,
          avatar_url,
          integration_type
        ),
        granted_by_user:users!granted_by (
          id,
          name,
          email
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('获取用户权限失败:', error);
      return res.status(500).json({ error: '获取用户权限失败' });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('获取用户权限异常:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 分配用户权限
router.post('/assign', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { userId, agentIds, operation } = req.body;
    const operatedBy = req.user?.id;
    const userRole = req.user?.role;
    
    // 只有管理员可以分配权限
    if (userRole !== 'admin') {
      return res.status(403).json({ error: '无权限执行此操作' });
    }

    if (!userId || !agentIds || !Array.isArray(agentIds) || !operation) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    if (!['grant', 'revoke'].includes(operation)) {
      return res.status(400).json({ error: '无效的操作类型' });
    }

    // 验证用户存在
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    // 验证AI员工存在并获取所需计划信息
    const { data: agents, error: agentsError } = await supabase
      .from('ai_agents')
      .select('id, name, required_plan')
      .in('id', agentIds);

    if (agentsError || !agents || agents.length !== agentIds.length) {
      return res.status(404).json({ error: '部分AI员工不存在' });
    }

    // 获取用户的订阅信息
    const { data: userSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('获取用户订阅信息失败:', subscriptionError);
      return res.status(500).json({ error: '获取用户订阅信息失败' });
    }

    const userPlan = userSubscription?.plan_type || 'free';
    const planLevels = { free: 0, professional: 1, team: 2 };
    const userLevel = planLevels[userPlan as keyof typeof planLevels] || 0;

    const results = [];
    const auditLogs = [];

    for (const agentId of agentIds) {
      const agent = agents.find(a => a.id === agentId);
      
      if (operation === 'grant') {
        // 检查用户订阅计划是否满足AI员工要求
        const requiredLevel = planLevels[agent?.required_plan as keyof typeof planLevels] || 0;
        if (userLevel < requiredLevel) {
          const planNames = { free: '免费版', professional: '专业版', team: '团队版' };
          const requiredPlanName = planNames[agent?.required_plan as keyof typeof planNames] || agent?.required_plan;
          const userPlanName = planNames[userPlan as keyof typeof planNames] || userPlan;
          results.push({ 
            agentId, 
            status: 'plan_insufficient', 
            message: `${agent?.name}需要${requiredPlanName}计划，用户当前为${userPlanName}计划` 
          });
          continue;
        }

        // 检查是否已有权限
        const { data: existingPermission } = await supabase
          .from('user_agent_permissions')
          .select('id, is_active')
          .eq('user_id', userId)
          .eq('agent_id', agentId)
          .eq('is_active', true)
          .single();

        if (existingPermission) {
          results.push({ agentId, status: 'already_granted', message: `用户已拥有${agent?.name}的权限` });
          continue;
        }

        // 分配权限
        const { error: grantError } = await supabase
          .from('user_agent_permissions')
          .insert({
            user_id: userId,
            agent_id: agentId,
            granted_by: operatedBy,
            is_active: true
          });

        if (grantError) {
          console.error('分配权限失败:', grantError);
          results.push({ agentId, status: 'error', message: '分配权限失败' });
        } else {
          results.push({ agentId, status: 'granted', message: `成功分配${agent?.name}权限` });
        }
      } else if (operation === 'revoke') {
        // 撤销权限
        const { error: revokeError } = await supabase
          .from('user_agent_permissions')
          .update({ 
            is_active: false, 
            revoked_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .eq('agent_id', agentId)
          .eq('is_active', true);

        if (revokeError) {
          console.error('撤销权限失败:', revokeError);
          results.push({ agentId, status: 'error', message: '撤销权限失败' });
        } else {
          results.push({ agentId, status: 'revoked', message: `成功撤销${agent?.name}权限` });
        }
      }

      // 记录审计日志
      auditLogs.push({
        user_id: userId,
        agent_id: agentId,
        operated_by: operatedBy,
        operation_type: agentIds.length > 1 ? `batch_${operation}` : operation,
        operation_details: {
          agent_name: agent?.name,
          user_name: user.name,
          user_email: user.email
        },
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      });
    }

    // 批量插入审计日志
    if (auditLogs.length > 0) {
      const { error: auditError } = await supabase
        .from('permission_audit_logs')
        .insert(auditLogs);

      if (auditError) {
        console.error('记录审计日志失败:', auditError);
      }
    }

    const successCount = results.filter(r => ['granted', 'revoked'].includes(r.status)).length;
    const planInsufficientCount = results.filter(r => r.status === 'plan_insufficient').length;
    
    let message = '';
    if (operation === 'grant') {
      message = `成功分配 ${successCount} 个AI员工权限`;
      if (planInsufficientCount > 0) {
        message += `，${planInsufficientCount} 个因订阅计划不足被拒绝`;
      }
    } else {
      message = `成功撤销 ${successCount} 个AI员工权限`;
    }

    res.json({ 
      success: true, 
      message,
      results 
    });
  } catch (error) {
    console.error('权限操作异常:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取用户可访问的AI员工
router.get('/user-agents', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ error: '用户未认证' });
    }

    // 管理员可以访问所有AI员工
    if (userRole === 'admin') {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取AI员工失败:', error);
        return res.status(500).json({ error: '获取AI员工失败' });
      }

      return res.json({ success: true, data });
    }

    // 普通用户只能访问有权限的AI员工
    const { data, error } = await supabase
      .from('user_agent_permissions')
      .select(`
        ai_agents (
          id,
          name,
          description,
          avatar_url,
          integration_type,
          dify_api_key,
          dify_base_url,
          chatbot_url,
          deepseek_api_key,
          system_prompt,
          is_active,
          created_at
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('ai_agents.is_active', true)
      .order('granted_at', { ascending: false });

    if (error) {
      console.error('获取用户可访问AI员工失败:', error);
      return res.status(500).json({ error: '获取AI员工失败' });
    }

    const agents = data?.map(item => item.ai_agents).filter(Boolean) || [];
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error('获取用户可访问AI员工异常:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取权限审计日志
router.get('/audit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    // 只有管理员可以查看审计日志
    if (userRole !== 'admin') {
      return res.status(403).json({ error: '无权限查看审计日志' });
    }

    const { 
      page = 1, 
      limit = 20, 
      userId, 
      startDate, 
      endDate,
      operationType 
    } = req.query;

    let query = supabase
      .from('permission_audit_logs')
      .select(`
        id,
        operation_type,
        operation_details,
        ip_address,
        created_at,
        user:users!user_id (
          id,
          name,
          email
        ),
        agent:ai_agents!agent_id (
          id,
          name
        ),
        operator:users!operated_by (
          id,
          name,
          email
        )
      `);

    // 添加筛选条件
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (operationType) {
      query = query.eq('operation_type', operationType);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('获取审计日志失败:', error);
      return res.status(500).json({ error: '获取审计日志失败' });
    }

    res.json({ 
      success: true, 
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取审计日志异常:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取所有用户列表（用于权限管理）
router.get('/users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    // 只有管理员可以查看用户列表
    if (userRole !== 'admin') {
      return res.status(403).json({ error: '无权限查看用户列表' });
    }

    const { search, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('users')
      .select('id, name, email, role, created_at', { count: 'exact' })
      .neq('role', 'admin'); // 不显示管理员账户

    // 搜索功能
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('获取用户列表失败:', error);
      return res.status(500).json({ error: '获取用户列表失败' });
    }

    res.json({ 
      success: true, 
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取用户列表异常:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 获取所有权限关系（用于权限管理页面）
router.get('/list', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = req.user?.role;
    
    // 只有管理员可以查看所有权限关系
    if (userRole !== 'admin') {
      return res.status(403).json({ error: '无权限查看权限列表' });
    }

    const { page = 1, limit = 20, userId, agentId } = req.query;

    let query = supabase
      .from('user_agent_permissions')
      .select(`
        id,
        user_id,
        agent_id,
        granted_at,
        is_active,
        user:users!user_id (
          id,
          name,
          email
        ),
        agent:ai_agents!agent_id (
          id,
          name,
          description
        ),
        granted_by_user:users!granted_by (
          id,
          name,
          email
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    // 添加筛选条件
    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (agentId) {
      query = query.eq('agent_id', agentId);
    }

    // 分页
    const offset = (Number(page) - 1) * Number(limit);
    query = query
      .order('granted_at', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('获取权限列表失败:', error);
      return res.status(500).json({ error: '获取权限列表失败' });
    }

    res.json({ 
      success: true, 
      data,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('获取权限列表异常:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

export default router;