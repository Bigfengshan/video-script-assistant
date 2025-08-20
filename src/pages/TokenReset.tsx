import React from 'react'
import { Button, Card, Typography, Space, message } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const { Title, Paragraph } = Typography

const TokenReset: React.FC = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleClearToken = () => {
    // 清除所有本地存储的认证信息
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('subscription')
    
    // 调用logout函数清除context状态
    logout()
    
    message.success('Token已清除，请重新登录')
    
    // 跳转到登录页面
    setTimeout(() => {
      navigate('/login')
    }, 1000)
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card 
        style={{ 
          width: 500, 
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          borderRadius: '12px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Title level={2} style={{ color: '#1890ff', marginBottom: 24 }}>
            🔧 Token 重置工具
          </Title>
          
          <Paragraph style={{ fontSize: '16px', marginBottom: 24 }}>
            检测到您的登录令牌可能已过期或无效。
            <br />
            这通常发生在系统更新后，需要重新登录。
          </Paragraph>
          
          <Paragraph type="secondary" style={{ marginBottom: 32 }}>
            点击下方按钮将清除本地存储的认证信息，然后跳转到登录页面。
          </Paragraph>
          
          <Space size="large">
            <Button 
              type="primary" 
              size="large"
              onClick={handleClearToken}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '8px',
                height: '48px',
                padding: '0 32px'
              }}
            >
              清除Token并重新登录
            </Button>
            
            <Button 
              size="large"
              onClick={handleGoBack}
              style={{
                borderRadius: '8px',
                height: '48px',
                padding: '0 32px'
              }}
            >
              返回上一页
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  )
}

export default TokenReset