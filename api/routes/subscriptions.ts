import { Router } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { authenticateToken } from '../middleware/auth'

const router = Router()

// 获取订阅计划列表
router.get('/plans', async (req, res) => {
  try {
    const plans = [
      {
        id: 'free',
        name: '免费版',
        price: 0,
        usage_limit: 10,
        features: [
          '每月10次对话',
          '基础AI员工',
          '标准客服支持'
        ],
        popular: false
      },
      {
        id: 'professional',
        name: '专业版',
        price: 99,
        usage_limit: 500,
        features: [
          '每月500次对话',
          '全部AI员工',
          '优先客服支持',
          '数据导出功能'
        ],
        popular: true
      },
      {
        id: 'team',
        name: '团队版',
        price: 299,
        usage_limit: 2000,
        features: [
          '每月2000次对话',
          '全部AI员工',
          '24/7专属客服',
          '数据导出功能',
          '团队协作功能',
          '自定义AI员工'
        ],
        popular: false
      }
    ]
    
    res.json({ plans })
  } catch (error) {
    console.error('获取订阅计划失败:', error)
    res.status(500).json({ error: '获取订阅计划失败' })
  }
})

// 获取用户当前订阅
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) {
      return res.status(404).json({ error: '未找到订阅信息' })
    }
    
    res.json({ subscription })
  } catch (error) {
    console.error('获取订阅信息失败:', error)
    res.status(500).json({ error: '获取订阅信息失败' })
  }
})

// 创建订单
router.post('/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    const { plan_type } = req.body
    
    if (!plan_type || !['professional', 'team'].includes(plan_type)) {
      return res.status(400).json({ error: '无效的订阅计划' })
    }
    
    // 获取计划价格
    const planPrices = {
      professional: 99,
      team: 299
    }
    
    const amount = planPrices[plan_type as keyof typeof planPrices]
    
    // 创建订单
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        plan_type,
        amount,
        status: 'pending',
        payment_method: 'alipay' // 默认支付宝
      })
      .select()
      .single()
    
    if (error) {
      console.error('创建订单失败:', error)
      return res.status(500).json({ error: '创建订单失败' })
    }
    
    // 这里应该调用支付接口生成支付链接
    // 暂时返回模拟的支付链接
    const paymentUrl = `https://example.com/pay?order_id=${order.id}&amount=${amount}`
    
    res.json({ 
      order,
      payment_url: paymentUrl
    })
  } catch (error) {
    console.error('创建订单失败:', error)
    res.status(500).json({ error: '创建订单失败' })
  }
})

// 处理支付回调（模拟）
router.post('/payment/callback', async (req, res) => {
  try {
    const { order_id, status } = req.body
    
    if (status === 'success') {
      // 更新订单状态
      const { data: order, error: orderError } = await supabaseAdmin
        .from('orders')
        .update({ status: 'completed', paid_at: new Date().toISOString() })
        .eq('id', order_id)
        .select()
        .single()
      
      if (orderError) {
        console.error('更新订单状态失败:', orderError)
        return res.status(500).json({ error: '更新订单状态失败' })
      }
      
      // 更新用户订阅
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1) // 一个月后到期
      
      const usageLimits = {
        professional: 500,
        team: 2000
      }
      
      const { error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_type: order.plan_type,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          usage_limit: usageLimits[order.plan_type as keyof typeof usageLimits],
          usage_count: 0
        })
        .eq('user_id', order.user_id)
      
      if (subscriptionError) {
        console.error('更新订阅失败:', subscriptionError)
        return res.status(500).json({ error: '更新订阅失败' })
      }
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('处理支付回调失败:', error)
    res.status(500).json({ error: '处理支付回调失败' })
  }
})

// 取消订阅
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id
    
    const { error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'cancelled',
        end_date: new Date().toISOString()
      })
      .eq('user_id', userId)
    
    if (error) {
      console.error('取消订阅失败:', error)
      return res.status(500).json({ error: '取消订阅失败' })
    }
    
    res.json({ message: '订阅已取消' })
  } catch (error) {
    console.error('取消订阅失败:', error)
    res.status(500).json({ error: '取消订阅失败' })
  }
})

export default router