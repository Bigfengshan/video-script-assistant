import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 扩展Request接口，添加user属性
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        name: string
        role: string
      }
    }
  }
}

// 认证中间件
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: '访问被拒绝，需要认证token' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    // 从数据库获取用户信息
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: '无效的认证token' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('认证错误:', error)
    res.status(403).json({ error: '无效的认证token' })
  }
}

// 可选认证中间件（不强制要求登录）
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      const userId = decoded.userId

      const { data: user } = await supabaseAdmin
        .from('users')
        .select('id, email, name, role')
        .eq('id', userId)
        .single()

      if (user) {
        req.user = user
      }
    }

    next()
  } catch (error) {
    // 忽略认证错误，继续处理请求
    next()
  }
}