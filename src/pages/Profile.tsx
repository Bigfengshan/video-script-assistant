import React, { useState, useEffect } from 'react'
import { Card, Descriptions, Button, Avatar, Tag, Space, Divider, Row, Col, Statistic, message } from 'antd'
import { UserOutlined, MailOutlined, CalendarOutlined, SettingOutlined, LogoutOutlined, RobotOutlined, MessageOutlined, CrownOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

const Profile: React.FC = () => {
  const { user, subscription, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    refreshUser()
  }, [])

  const handleLogout = async () => {
    try {
      setLoading(true)
      await logout()
      message.success('退出登录成功')
      navigate('/login')
    } catch (error) {
      message.error('退出登录失败')
    } finally {
      setLoading(false)
    }
  }

  const getSubscriptionStatus = () => {
    if (!subscription) return { text: '未知', color: 'default' }
    
    switch (subscription.status) {
      case 'active':
        return { text: '活跃', color: 'success' }
      case 'cancelled':
        return { text: '已取消', color: 'red' }
      case 'inactive':
        return { text: '已过期', color: 'orange' }
      default:
        return { text: '未知', color: 'default' }
    }
  }

  const getPlanName = () => {
    if (!subscription) return '未知'
    
    switch (subscription.plan) {
      case 'free':
        return '免费版'
      case 'basic':
        return '基础版'
      case 'pro':
        return '专业版'
      case 'enterprise':
        return '企业版'
      default:
        return '未知'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  const subscriptionStatus = getSubscriptionStatus()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 现代化导航栏 */}
      <nav className="glass-effect backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold gradient-text">创作之旅</div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                className="modern-button mr-3"
                icon={<CrownOutlined />}
                onClick={() => navigate('/subscription')}
              >
                管理订阅
              </Button>
              
              {/* 管理员入口 */}
              {user?.email === 'admin@test.com' || user?.email === 'weichengyu@example.com' ? (
                <Button 
                  className="modern-button mr-3"
                  icon={<SettingOutlined />}
                  onClick={() => navigate('/admin')}
                >
                  管理后台
                </Button>
              ) : null}
              <Button 
                className="modern-button-primary mr-3"
                icon={<SettingOutlined />}
                onClick={() => navigate('/workspace')}
              >
                返回工作台
              </Button>
              <Button 
                className="modern-button-secondary"
                icon={<LogoutOutlined />}
                loading={loading}
                onClick={handleLogout}
              >
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">个人中心</h1>
          <p className="text-gray-600 mt-2">管理您的账户信息和订阅状态</p>
        </div>

        <Row gutter={[24, 24]}>
          {/* 用户信息卡片 */}
          <Col xs={24} lg={12}>
            <Card 
              title="个人信息" 
              extra={<Button icon={<SettingOutlined />} type="text">编辑</Button>}
              className="h-full"
            >
              <div className="text-center mb-6">
                <Avatar size={80} icon={<UserOutlined />} className="mb-4" />
                <h3 className="text-xl font-semibold">{user?.email}</h3>
                <p className="text-gray-500">用户ID: {user?.id?.slice(0, 8)}...</p>
              </div>
              
              <Descriptions column={1} size="small">
                <Descriptions.Item label="邮箱">{user?.email}</Descriptions.Item>
                <Descriptions.Item label="注册时间">
                  {user?.created_at ? formatDate(user.created_at) : '未知'}
                </Descriptions.Item>
                <Descriptions.Item label="最后登录">
                  {user?.updated_at ? formatDate(user.updated_at) : '未知'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* 订阅信息卡片 */}
          <Col xs={24} lg={12}>
            <Card 
              title="订阅信息" 
              extra={<Button type="primary">升级订阅</Button>}
              className="h-full"
            >
              <div className="text-center mb-6">
                <CrownOutlined className="text-4xl text-yellow-500 mb-2" />
                <h3 className="text-xl font-semibold">{getPlanName()}</h3>
                <Tag color={subscriptionStatus.color} className="mt-2">
                  {subscriptionStatus.text}
                </Tag>
              </div>
              
              <Descriptions column={1} size="small">
                <Descriptions.Item label="当前计划">{getPlanName()}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={subscriptionStatus.color}>{subscriptionStatus.text}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="开始时间">
                  {subscription?.created_at ? formatDate(subscription.created_at) : '未知'}
                </Descriptions.Item>
                <Descriptions.Item label="到期时间">
                  {subscription?.expires_at ? formatDate(subscription.expires_at) : '永久'}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>

          {/* 使用统计 */}
          <Col xs={24}>
            <Card title="使用统计">
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Statistic 
                    title="总对话数" 
                    value={0} 
                    prefix={<CalendarOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic 
                    title="本月对话" 
                    value={0} 
                    prefix={<CalendarOutlined />}
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic 
                    title="使用的AI员工" 
                    value={0} 
                    suffix="/ 6"
                  />
                </Col>
                <Col xs={12} sm={6}>
                  <Statistic 
                    title="剩余额度" 
                    value={subscription?.plan === 'free' ? 10 : 999} 
                    suffix="次"
                  />
                </Col>
              </Row>
            </Card>
          </Col>

          {/* 快速操作 */}
          <Col xs={24}>
            <Card title="快速操作">
              <Space wrap>
                <Button 
                  type="primary" 
                  onClick={() => navigate('/workspace')}
                >
                  进入工作台
                </Button>
                <Button onClick={() => message.info('功能开发中')}>升级订阅</Button>
                <Button onClick={() => message.info('功能开发中')}>下载数据</Button>
                <Button onClick={() => message.info('功能开发中')}>账户设置</Button>
                <Button onClick={() => message.info('功能开发中')}>帮助中心</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default Profile