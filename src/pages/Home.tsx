import React from 'react'
import { Button, Card, Row, Col, Typography, Space, Dropdown } from 'antd'
import { RocketOutlined, TeamOutlined, CrownOutlined, SafetyOutlined, StarOutlined, ThunderboltOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Avatar from '../components/Avatar'

const { Title, Paragraph } = Typography

const Home: React.FC = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const handleStartCreating = () => {
    if (user) {
      navigate('/workspace')
    } else {
      navigate('/login')
    }
  }

  const features = [
    {
      icon: <RocketOutlined className="text-4xl text-blue-600" />,
      title: '智能AI员工',
      description: '6位专业AI员工，涵盖人设定位、选题策划、文案创作等全流程服务'
    },
    {
      icon: <TeamOutlined className="text-4xl text-blue-600" />,
      title: '协作工作台',
      description: '统一工作台管理所有AI员工，实现高效协作和任务分配'
    },
    {
      icon: <CrownOutlined className="text-4xl text-blue-600" />,
      title: '灵活订阅',
      description: '多种订阅计划，满足不同用户需求，按需付费更经济'
    },
    {
      icon: <SafetyOutlined className="text-4xl text-blue-600" />,
      title: '安全可靠',
      description: '企业级安全保障，数据加密存储，保护您的创作内容'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* 现代化导航栏 */}
      <nav className="glass-effect backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold gradient-text">创作之旅</div>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Button 
                    className="modern-button-primary" 
                    onClick={() => navigate('/workspace')}
                  >进入工作台</Button>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'profile',
                          label: '个人资料',
                          icon: <UserOutlined />,
                          onClick: () => navigate('/profile')
                        },
                        {
                          key: 'logout',
                          label: '退出登录',
                          icon: <LogoutOutlined />,
                          onClick: logout
                        }
                      ]
                    }}
                    trigger={['click']}
                  >
                    <div className="flex items-center space-x-2 cursor-pointer hover:bg-white/10 rounded-lg px-3 py-2 transition-colors">
                      <Avatar src={user.avatar_url} name={user.name} size="sm" />
                      <span className="text-gray-700 font-medium">{user.name}</span>
                    </div>
                  </Dropdown>
                </>
              ) : (
                <Button className="modern-button-primary" onClick={handleStartCreating}>
                  开始创作
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 现代化英雄区域 */}
      <div className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center fade-in">
            <div className="inline-block mb-4">
              <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium text-gray-700 border border-white/30">
                一个简单又强大的创作助手
              </span>
            </div>
            <Title level={1} className="text-6xl font-bold text-gray-800 mb-6 leading-tight">
              创作之旅，伴你同行。
            </Title>
            <Paragraph className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              专业AI团队助力内容创作，从灵感到成品，让每一次创作都充满惊喜
            </Paragraph>
            <div className="flex justify-center items-center space-x-6">
              <Button 
                className="modern-button-primary h-14 px-10 text-lg font-medium rounded-full"
                onClick={handleStartCreating}
              >
                开始创作
              </Button>
              <Button 
                className="modern-button h-14 px-10 text-lg font-medium rounded-full"
                onClick={() => navigate('/subscription')}
              >了解定价</Button>
            </div>
          </div>
        </div>
      </div>

      {/* 现代化功能特性 */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 slide-up">
            <Title level={2} className="text-4xl font-bold text-gray-800 mb-6">
              为什么选择我们？
            </Title>
            <Paragraph className="text-xl text-gray-600 max-w-2xl mx-auto">
              专业的AI团队，完整的创作流程，让您的短视频内容脱颖而出
            </Paragraph>
          </div>
          
          <Row gutter={[32, 32]}>
            {features.map((feature, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                <div className="modern-card h-full text-center p-8 fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                  <div className="mb-6 flex justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-lg border border-gray-100 flex items-center justify-center text-2xl">
                      {feature.icon}
                    </div>
                  </div>
                  <Title level={4} className="mb-4 text-gray-800">{feature.title}</Title>
                  <Paragraph className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* 现代化AI员工介绍 */}
      <div className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 slide-up">
            <Title level={2} className="text-4xl font-bold text-gray-800 mb-6">
              专业AI员工团队
            </Title>
            <Paragraph className="text-xl text-gray-600 max-w-2xl mx-auto">
              6位专业AI员工，各司其职，为您提供全方位的创作支持
            </Paragraph>
          </div>
          
          <Row gutter={[32, 32]}>
            {[
              { name: '人设定位师', desc: '精准定位目标用户，打造独特人设', icon: <StarOutlined /> },
              { name: '选题策划师', desc: '热点追踪，创意选题，内容策划', icon: <ThunderboltOutlined /> },
              { name: '金牌文案', desc: '专业文案创作，吸引眼球的标题', icon: <CrownOutlined /> },
              { name: '脚本大师', desc: '完整视频脚本，结构清晰逻辑强', icon: <RocketOutlined /> },
              { name: '互动专家', desc: '用户互动策略，提升参与度', icon: <TeamOutlined /> },
              { name: '数据分析师', desc: '内容数据分析，优化创作方向', icon: <SafetyOutlined /> }
            ].map((agent, index) => (
              <Col xs={24} sm={12} lg={8} key={index}>
                <div className="modern-card text-center p-8 h-full fade-in" style={{animationDelay: `${index * 0.15}s`}}>
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center mx-auto mb-6 text-white text-3xl">
                    {agent.icon}
                  </div>
                  <Title level={4} className="mb-4 text-gray-800">{agent.name}</Title>
                  <Paragraph className="text-gray-600 leading-relaxed">{agent.desc}</Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      {/* 现代化CTA区域 */}
      <div className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-10"></div>
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="modern-card p-16 fade-in">
            <Title level={2} className="text-4xl font-bold text-gray-800 mb-6">
              准备好开始您的AI创作之旅了吗？
            </Title>
            <Paragraph className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              立即注册，免费体验专业AI员工服务，让创作更轻松
            </Paragraph>
            <Button 
              className="modern-button-secondary h-16 px-12 text-xl font-medium rounded-full"
              onClick={handleStartCreating}
            >
              立即免费注册
            </Button>
          </div>
        </div>
      </div>

      {/* 现代化页脚 */}
      <footer className="glass-effect border-t border-white/20 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-3xl font-bold gradient-text mb-6">创作之旅</div>
            <Paragraph className="text-gray-600 text-lg">© 2025 创作之旅团队. 保留所有权利.</Paragraph>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home