import React, { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Typography, Space, Divider, message } from 'antd'
import { UserOutlined, MailOutlined, LockOutlined, SafetyOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const { Title, Text } = Typography

const Login: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { login, register } = useAuth()
  const navigate = useNavigate()

  // 自定义邮箱验证函数，支持腾讯企业邮箱
  const validateEmail = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('请输入邮箱地址'))
    }
    
    // 支持的邮箱域名列表，包含测试域名 test.com 用于管理员账号
    const supportedDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      '163.com', '126.com', 'qq.com', 'sina.com',
      'bigfan007.cn', // 腾讯企业邮箱域名
      'test.com' // 测试域名用于管理员账号
    ]
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return Promise.reject(new Error('请输入有效的邮箱地址'))
    }
    
    const domain = value.split('@')[1]
    if (!supportedDomains.includes(domain)) {
      return Promise.reject(new Error('请使用支持的邮箱域名（包括企业邮箱@bigfan007.cn）'))
    }
    
    return Promise.resolve()
  }

  // 发送验证码
  const sendVerificationCode = async () => {
    try {
      const email = form.getFieldValue('email')
      if (!email) {
        message.error('请先输入邮箱地址')
        return
      }
      
      // 验证邮箱格式
      await form.validateFields(['email'])
      
      setSendingCode(true)
      const response = await fetch('/api/auth/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        message.success('验证码已发送到您的邮箱')
        // 开始倒计时
        setCountdown(60)
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        message.error(data.message || '发送验证码失败')
      }
    } catch (error: any) {
      if (error.errorFields) {
        // 表单验证错误
        return
      }
      message.error('发送验证码失败，请稍后重试')
    } finally {
      setSendingCode(false)
    }
  }

  const handleSubmit = async (values: any) => {
    setLoading(true)
    try {
      let success = false
      
      if (isRegister) {
        // 临时禁用验证码验证 - 域名审核中
        success = await register(values.email, values.password, values.name)
      } else {
        success = await login(values.email, values.password)
      }
      
      if (success) {
        navigate('/workspace')
      }
    } catch (error) {
      console.error('认证错误:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 返回首页按钮 */}
        <div className="mb-6">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-blue-600 p-0 h-auto flex items-center gap-1"
          >
            返回首页
          </Button>
        </div>

        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <div 
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:bg-blue-700 transition-colors"
            onClick={() => navigate('/')}
          >
            <UserOutlined className="text-2xl text-white" />
          </div>
          <Title level={2} className="text-gray-800 mb-2">短视频创作AI助手</Title>
          <Text className="text-gray-600">
            为短视频创作者提供AI员工团队
          </Text>

        </div>

        <Card className="shadow-lg border-0">
          <div className="text-center mb-6">
            <Title level={3} className="text-gray-800 mb-2">
              {isRegister ? '创建账户' : '欢迎回来'}
            </Title>
            <Text className="text-gray-600">
              {isRegister ? '注册新账户开始使用' : '登录您的账户继续使用'}
            </Text>
          </div>

          <Form
            form={form}
            name="auth"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            {isRegister && (
              <Form.Item
                name="name"
                label="姓名"
                rules={[
                  { required: true, message: '请输入您的姓名' },
                  { min: 2, message: '姓名至少2个字符' }
                ]}
              >
                <Input
                  prefix={<UserOutlined className="text-gray-400" />}
                  placeholder="请输入您的姓名"
                  className="rounded-lg"
                />
              </Form.Item>
            )}

            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { validator: validateEmail }
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-gray-400" />}
                placeholder="请输入邮箱地址"
                className="rounded-lg"
              />
            </Form.Item>

            {/* 临时禁用邮箱验证码功能 - 域名审核中 */}
            {false && isRegister && (
              <Form.Item
                name="verificationCode"
                label="邮箱验证码"
                rules={[
                  { required: true, message: '请输入邮箱验证码' },
                  { len: 6, message: '验证码为6位数字' },
                  { pattern: /^\d{6}$/, message: '验证码必须为6位数字' }
                ]}
              >
                <div className="flex gap-2">
                  <Input
                    prefix={<SafetyOutlined className="text-gray-400" />}
                    placeholder="请输入6位验证码"
                    className="rounded-lg flex-1"
                    maxLength={6}
                  />
                  <Button
                    type="default"
                    onClick={sendVerificationCode}
                    loading={sendingCode}
                    disabled={countdown > 0}
                    className="rounded-lg px-4 whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s后重发` : '发送验证码'}
                  </Button>
                </div>
              </Form.Item>
            )}

            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="请输入密码"
                className="rounded-lg"
              />
            </Form.Item>

            {isRegister && (
              <Form.Item
                name="confirmPassword"
                label="确认密码"
                dependencies={['password']}
                rules={[
                  { required: true, message: '请确认密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined className="text-gray-400" />}
                  placeholder="请再次输入密码"
                  className="rounded-lg"
                />
              </Form.Item>
            )}

            <Form.Item className="mb-4">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 rounded-lg bg-blue-600 hover:bg-blue-700 border-0 text-lg font-medium"
              >
                {isRegister ? '注册账户' : '立即登录'}
              </Button>
            </Form.Item>
          </Form>

          <Divider className="my-6">
            <Text className="text-gray-500">或者</Text>
          </Divider>

          <div className="text-center">
            <Space>
              <Text className="text-gray-600">
                {isRegister ? '已有账户？' : '还没有账户？'}
              </Text>
              <Button
                type="link"
                onClick={() => {
                  setIsRegister(!isRegister)
                  form.resetFields()
                }}
                className="p-0 h-auto text-blue-600 hover:text-blue-700"
              >
                {isRegister ? '立即登录' : '免费注册'}
              </Button>
            </Space>
          </div>
        </Card>

        <div className="text-center mt-6">
          <Text className="text-gray-500 text-sm">
            登录即表示您同意我们的
            <Link to="/terms" className="text-blue-600 hover:text-blue-700 mx-1">
              服务条款
            </Link>
            和
            <Link to="/privacy" className="text-blue-600 hover:text-blue-700 mx-1">
              隐私政策
            </Link>
          </Text>
        </div>
      </div>
    </div>
  )
}

export default Login