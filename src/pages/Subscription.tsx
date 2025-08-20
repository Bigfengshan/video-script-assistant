import React, { useState, useEffect } from 'react'
import { Card, Button, Typography, Space, Row, Col, Badge, message, Modal, Spin } from 'antd'
import { CheckOutlined, CrownOutlined, TeamOutlined, StarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const { Title, Text, Paragraph } = Typography

interface Plan {
  id: string
  name: string
  price: number
  usage_limit: number
  features: string[]
  popular: boolean
}

interface Order {
  id: string
  plan_type: string
  amount: number
  status: string
  payment_url?: string
}

const Subscription: React.FC = () => {
  const { user, subscription, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans`)
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans || [])
      }
    } catch (error) {
      console.error('获取订阅计划失败:', error)
      message.error('获取订阅计划失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planType: string) => {
    if (!user) return
    
    console.log('开始升级订阅，planType:', planType)
    console.log('发送的请求体:', { plan_type: planType })
    
    setUpgrading(true)
    setSelectedPlan(planType)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan_type: planType })
      })
      
      console.log('API响应状态:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API响应数据:', data)
        
        // 模拟支付成功
        Modal.confirm({
          title: '确认支付',
          content: `您将支付 ¥${data.order.amount} 升级到${planType === 'professional' ? '专业版' : '团队版'}`,
          onOk: async () => {
            // 模拟支付回调
            await fetch(`${API_BASE_URL}/api/subscriptions/payment/callback`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                order_id: data.order.id,
                status: 'success'
              })
            })
            
            message.success('支付成功，订阅已升级！')
            await refreshUser()
          }
        })
      } else {
        const errorData = await response.json()
        console.error('订单创建失败 - 状态码:', response.status)
        console.error('订单创建失败 - 错误数据:', errorData)
        console.error('订单创建失败 - 请求体:', JSON.stringify({ plan_type: planType }))
        
        // 特别处理订阅类型错误
        if (errorData.error && errorData.error.includes('订阅')) {
          message.error(`订阅类型验证失败: ${errorData.error}\n发送的plan_type: ${planType}`)
        } else {
          message.error(errorData.error || '升级失败，请重试')
        }
      }
    } catch (error) {
      console.error('升级订阅失败:', error)
      message.error('升级订阅失败')
    } finally {
      setUpgrading(false)
      setSelectedPlan(null)
    }
  }

  const handleCancelSubscription = async () => {
    Modal.confirm({
      title: '确认取消订阅',
      content: '取消订阅后，您将失去当前计划的所有权益，确定要继续吗？',
      okText: '确认取消',
      cancelText: '保留订阅',
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/subscriptions/cancel`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            message.success('订阅已取消')
            await refreshUser()
          } else {
            message.error('取消订阅失败')
          }
        } catch (error) {
          console.error('取消订阅失败:', error)
          message.error('取消订阅失败')
        }
      }
    })
  }

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return <StarOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
      case 'professional':
        return <CrownOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
      case 'team':
        return <TeamOutlined style={{ fontSize: '24px', color: '#722ed1' }} />
      default:
        return <StarOutlined style={{ fontSize: '24px' }} />
    }
  }

  const isCurrentPlan = (planId: string) => {
    return subscription?.plan_type === planId
  }

  const canUpgrade = (planId: string) => {
    if (!subscription) return false
    const planLevels = { free: 0, professional: 1, team: 2 }
    const currentLevel = planLevels[subscription.plan_type as keyof typeof planLevels] || 0
    const targetLevel = planLevels[planId as keyof typeof planLevels] || 0
    return targetLevel > currentLevel
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Title level={2}>选择您的订阅计划</Title>
        <Paragraph style={{ fontSize: '16px', color: '#666' }}>
          升级您的账户，解锁更多AI员工和功能
        </Paragraph>
      </div>

      {/* 当前订阅状态 */}
      {subscription && (
        <Card style={{ marginBottom: '32px', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                当前订阅：{plans.find(p => p.id === subscription.plan_type)?.name}
              </Title>
              <Text style={{ color: '#666' }}>
                使用情况：{subscription.usage_count} / {subscription.usage_limit} 次
              </Text>
              {subscription.end_date && (
                <Text style={{ color: '#666', marginLeft: '16px' }}>
                  到期时间：{new Date(subscription.end_date).toLocaleDateString()}
                </Text>
              )}
            </div>
            {subscription.plan_type !== 'free' && subscription.status === 'active' && (
              <Button danger onClick={handleCancelSubscription}>
                取消订阅
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* 订阅计划 */}
      <Row gutter={[24, 24]}>
        {plans.map(plan => (
          <Col xs={24} md={8} key={plan.id}>
            <Card
              style={{
                height: '100%',
                position: 'relative',
                border: plan.popular ? '2px solid #1890ff' : '1px solid #d9d9d9',
                boxShadow: plan.popular ? '0 4px 12px rgba(24, 144, 255, 0.15)' : undefined
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-1px',
                    right: '24px',
                    background: '#1890ff',
                    color: '#fff',
                    padding: '4px 12px',
                    borderRadius: '0 0 8px 8px',
                    fontSize: '12px'
                  }}
                >
                  推荐
                </div>
              )}
              
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                {getPlanIcon(plan.id)}
                <Title level={3} style={{ margin: '16px 0 8px' }}>
                  {plan.name}
                </Title>
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}>
                    ¥{plan.price}
                  </span>
                  {plan.price > 0 && (
                    <span style={{ color: '#666' }}>/月</span>
                  )}
                </div>
                <Text style={{ color: '#666' }}>
                  每月 {plan.usage_limit} 次对话
                </Text>
              </div>

              <Space direction="vertical" style={{ width: '100%' }} size="small">
                {plan.features.map((feature, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                    <CheckOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    <Text>{feature}</Text>
                  </div>
                ))}
              </Space>

              <div style={{ marginTop: '32px', textAlign: 'center' }}>
                {isCurrentPlan(plan.id) ? (
                  <Badge.Ribbon text="当前计划" color="green">
                    <Button size="large" style={{ width: '100%' }} disabled>
                      当前使用中
                    </Button>
                  </Badge.Ribbon>
                ) : canUpgrade(plan.id) ? (
                  <Button
                    type="primary"
                    size="large"
                    style={{ width: '100%' }}
                    loading={upgrading && selectedPlan === plan.id}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    升级到{plan.name}
                  </Button>
                ) : (
                  <Button size="large" style={{ width: '100%' }} disabled>
                    {plan.id === 'free' ? '免费使用' : '已拥有更高级计划'}
                  </Button>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <div style={{ textAlign: 'center', marginTop: '48px' }}>
        <Space>
          <Button onClick={() => navigate('/workspace')}>
            返回工作台
          </Button>
          <Button 
            type="dashed" 
            onClick={async () => {
              console.log('=== 调试测试开始 ===')
              try {
                // 测试获取计划
                const plansRes = await fetch(`${API_BASE_URL}/api/subscriptions/plans`)
                const plansData = await plansRes.json()
                console.log('获取到的计划:', plansData)
                
                // 测试创建professional订单
                const orderRes = await fetch(`${API_BASE_URL}/api/subscriptions/orders`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ plan_type: 'professional' })
                })
                
                console.log('订单API响应状态:', orderRes.status)
                const orderData = await orderRes.json()
                console.log('订单API响应数据:', orderData)
                
                if (orderRes.ok) {
                  message.success('测试成功！查看控制台日志')
                } else {
                  message.error(`测试失败: ${orderData.error}`)
                }
              } catch (error) {
                console.error('测试错误:', error)
                message.error('测试出错，查看控制台')
              }
            }}
          >
            调试测试API
          </Button>
        </Space>
      </div>
    </div>
  )
}

export default Subscription