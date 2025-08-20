import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

// 扩展Request接口，添加权限相关属性
declare global {
  namespace Express {
    interface Request {
      userPermissions?: string[]; // 用户可访问的AI员工ID列表
    }
  }
}

/**
 * 检查用户是否有权限访问特定AI员工
 * @param agentId AI员工ID
 */
export const checkAgentPermission = (agentId: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: '需要登录' });
      }

      const userId = req.user.id;

      // 检查用户是否有权限访问该AI员工
      const { data: permission, error } = await supabaseAdmin
        .from('user_agent_permissions')
        .select('*')
        .eq('user_id', userId)
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .single();

      if (error || !permission) {
        return res.status(403).json({ error: '没有权限访问该AI员工' });
      }

      next();
    } catch (error) {
      console.error('权限检查错误:', error);
      res.status(500).json({ error: '权限检查失败' });
    }
  };
};

/**
 * 获取用户可访问的AI员工列表中间件
 * 将用户权限信息添加到req.userPermissions中
 */
export const loadUserPermissions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      req.userPermissions = [];
      return next();
    }

    const userId = req.user.id;

    // 获取用户所有有效的AI员工权限
    const { data: permissions, error } = await supabaseAdmin
      .from('user_agent_permissions')
      .select('agent_id')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('获取用户权限失败:', error);
      req.userPermissions = [];
    } else {
      req.userPermissions = permissions.map(p => p.agent_id);
    }

    next();
  } catch (error) {
    console.error('加载用户权限错误:', error);
    req.userPermissions = [];
    next();
  }
};

/**
 * 检查用户是否为管理员
 */
export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: '需要登录' });
    }

    const userId = req.user.id;

    // 检查用户是否为管理员
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !user || user.role !== 'admin') {
      return res.status(403).json({ error: '需要管理员权限' });
    }

    next();
  } catch (error) {
    console.error('管理员权限检查错误:', error);
    res.status(500).json({ error: '权限检查失败' });
  }
};

/**
 * 记录权限操作审计日志
 */
export const logPermissionAction = async (
  userId: string,
  agentId: string,
  operatorId: string,
  action: 'grant' | 'revoke',
  details: string,
  req: Request
) => {
  try {
    const clientIp = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';

    await supabaseAdmin
      .from('permission_audit_logs')
      .insert({
        user_id: userId,
        agent_id: agentId,
        operator_id: operatorId,
        action,
        details,
        ip_address: clientIp,
        user_agent: userAgent
      });
  } catch (error) {
    console.error('记录审计日志失败:', error);
    // 不抛出错误，避免影响主要业务流程
  }
};