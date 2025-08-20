import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { supabaseAdmin } from '../lib/supabase'
import { sendVerificationCode, verifyCode } from '../services/emailService'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// 邮箱域名验证函数
const validateEmailDomain = (email: string): boolean => {
  // 支持的邮箱域名列表，包含测试域名 test.com 用于管理员账号
  const supportedDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    '163.com', '126.com', 'qq.com', 'sina.com',
    'bigfan007.cn', // 腾讯企业邮箱域名
    'test.com' // 测试域名用于管理员账号
  ]
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return false
  }
  
  const domain = email.split('@')[1]
  return supportedDomains.includes(domain)
}

// 发送验证码
router.post('/send-verification-code', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: '邮箱是必填项' })
    }

    // 验证邮箱域名
    if (!validateEmailDomain(email)) {
      return res.status(400).json({ error: '请使用支持的邮箱域名' })
    }

    // 检查用户是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' })
    }

    // 发送验证码
    const result = await sendVerificationCode(email)
    
    if (result.success) {
      res.json({ message: '验证码已发送到您的邮箱，请查收' })
    } else {
      res.status(500).json({ error: result.message })
    }
  } catch (error) {
    console.error('发送验证码错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 注册 - 临时禁用邮件验证码功能
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, verificationCode } = req.body

    // 临时修改：不再要求验证码
    if (!email || !password || !name) {
      return res.status(400).json({ error: '邮箱、密码和姓名都是必填项' })
    }

    // 验证邮箱域名
    if (!validateEmailDomain(email)) {
      return res.status(400).json({ error: '请使用支持的邮箱域名' })
    }

    // 临时禁用：跳过验证码验证
    // const isValidCode = await verifyCode(email, verificationCode)
    // if (!isValidCode) {
    //   return res.status(400).json({ error: '验证码无效或已过期' })
    // }

    // 检查用户是否已存在
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' })
    }

    // 加密密码
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    // 创建用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        email_verified: true,
        email_verified_at: new Date().toISOString()
      })
      .select('id, email, name, created_at')
      .single()

    if (error) {
      console.error('创建用户失败:', error)
      return res.status(500).json({ error: '创建用户失败' })
    }

    // 创建免费订阅
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_type: 'free',
        usage_count: 0,
        usage_limit: 10
      })

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: '注册成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      token
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 登录
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: '邮箱和密码都是必填项' })
    }

    // 验证邮箱域名
    if (!validateEmailDomain(email)) {
      return res.status(400).json({ error: '请使用支持的邮箱域名（包括企业邮箱@bigfan007.cn）' })
    }

    // 查找用户
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, password_hash, created_at')
      .eq('email', email)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: '登录成功',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      },
      token
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({ error: '服务器内部错误' })
  }
})

// 登出
router.post('/logout', async (req, res) => {
  // 客户端需要删除存储的token
  res.json({ message: '登出成功' })
})

// 获取当前用户信息
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    const userId = decoded.userId

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, avatar_url, created_at')
      .eq('id', userId)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: '用户不存在' })
    }

    // 获取用户订阅信息
    const { data: subscription } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    res.json({
      user,
      subscription
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(401).json({ error: '无效的认证token' })
  }
})

export default router