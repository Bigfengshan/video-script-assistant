import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { message } from 'antd'

interface User {
  id: string
  email: string
  name: string
  avatar_url?: string
  created_at: string
  updated_at?: string
  last_login?: string
}

interface Subscription {
  id: string
  user_id: string
  plan_type: 'free' | 'professional' | 'team'
  plan?: string // 兼容性属性
  usage_count: number
  usage_limit: number
  expires_at?: string
  end_date?: string // 兼容性属性
  status?: 'active' | 'inactive' | 'cancelled'
  created_at: string
}

interface AuthContextType {
  user: User | null
  subscription: Subscription | null
  token: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string, verificationCode?: string) => Promise<boolean>
  logout: () => void
  loading: boolean
  refreshUserInfo: () => Promise<void>
  refreshUser: () => Promise<void> // 兼容性别名
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // 获取用户信息
  const fetchUserInfo = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setSubscription(data.subscription)
        return true
      } else if (response.status === 401) {
        // Token无效，清除本地存储
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
        setToken(null)
        
        // 如果是JWT签名无效错误，跳转到token重置页面
        const errorData = await response.json().catch(() => ({}))
        if (errorData.error && errorData.error.includes('invalid signature')) {
          window.location.href = '/token-reset'
        }
        
        return false
      } else {
        // 其他错误
        localStorage.removeItem('token')
        setToken(null)
        setUser(null)
        setSubscription(null)
        return false
      }
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 网络错误时不清除认证状态，保持当前登录状态
      // 只有在明确的认证失败（401状态码）时才清除认证状态
      return false
    }
  }

  // 刷新用户信息
  const refreshUserInfo = async () => {
    if (token) {
      await fetchUserInfo(token)
    }
  }

  // 登录
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        const { user, token: authToken } = data
        setUser(user)
        setToken(authToken)
        localStorage.setItem('token', authToken)
        
        // 获取订阅信息
        await fetchUserInfo(authToken)
        
        message.success('登录成功')
        return true
      } else {
        message.error(data.error || '登录失败')
        return false
      }
    } catch (error) {
      console.error('登录错误:', error)
      message.error('网络错误，请稍后重试')
      return false
    }
  }

  // 注册
  const register = async (email: string, password: string, name: string, verificationCode?: string): Promise<boolean> => {
    try {
      const requestBody: any = { email, password, name }
      if (verificationCode) {
        requestBody.verificationCode = verificationCode
      }
      
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok) {
        const { user, token: authToken } = data
        setUser(user)
        setToken(authToken)
        localStorage.setItem('token', authToken)
        
        // 获取订阅信息
        await fetchUserInfo(authToken)
        
        message.success('注册成功')
        return true
      } else {
        message.error(data.error || '注册失败')
        return false
      }
    } catch (error) {
      console.error('注册错误:', error)
      message.error('网络错误，请稍后重试')
      return false
    }
  }

  // 登出
  const logout = () => {
    setUser(null)
    setSubscription(null)
    setToken(null)
    localStorage.removeItem('token')
    message.success('已退出登录')
  }

  // 初始化时检查token
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        // 尝试验证token，但不因为网络错误而清除认证状态
        // fetchUserInfo内部已经处理了401认证失败的情况
        await fetchUserInfo(storedToken)
      }
      setLoading(false)
    }

    initAuth()
  }, [])

  const value: AuthContextType = {
    user,
    subscription,
    token,
    login,
    register,
    logout,
    loading,
    refreshUserInfo,
    refreshUser: refreshUserInfo // 兼容性别名
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}