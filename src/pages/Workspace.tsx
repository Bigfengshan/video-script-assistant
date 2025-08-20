import React, { useState, useEffect, useRef } from 'react'
import { Layout, Card, Typography, Button, Input, Space, Empty, message, Alert, Spin, Modal, Badge } from 'antd'
import { Avatar } from 'antd'
import { SendOutlined, UserOutlined, RobotOutlined, PlusOutlined, LogoutOutlined, LeftOutlined, RightOutlined, ReloadOutlined, HomeOutlined, WifiOutlined, CheckCircleOutlined, ExclamationCircleOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import CustomAvatar from '../components/Avatar'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const { TextArea } = Input

interface AIAgent {
  id: string
  name: string
  description?: string
  avatar_url?: string
  integration_type?: 'api' | 'iframe' | 'deepseek'
  dify_api_endpoint?: string
  api_key?: string
  chatbot_url?: string
  deepseek_api_key?: string
  deepseek_model?: string
  system_prompt?: string
  temperature?: number
  max_tokens?: number
  required_plan: 'free' | 'professional' | 'team'
  is_active: boolean
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

interface Conversation {
  id: string
  title?: string
  messages: Message[]
}

// IframeAgent 组件
interface IframeAgentProps {
  agent: AIAgent
  onError?: (error: any) => void
}

const IframeAgent: React.FC<IframeAgentProps> = ({ agent, onError }) => {
  console.log('🔄 IframeAgent组件渲染 - agent.id:', agent.id, 'agent.name:', agent.name)
  
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showFallback, setShowFallback] = useState(false)
  const [iframeUrl, setIframeUrl] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(true)

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

  // 获取iframe URL
  const fetchIframeUrl = async () => {
    console.log('📡 fetchIframeUrl开始执行 - agent.id:', agent.id, 'integration_type:', agent.integration_type)
    try {
      setUrlLoading(true)
      const response = await fetch(`${API_BASE_URL}/api/agents/${agent.id}/iframe-url`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ fetchIframeUrl成功 - URL:', data.url)
        setIframeUrl(data.url)
      } else {
        const errorData = await response.json()
        console.log('❌ fetchIframeUrl失败 - 错误:', errorData.error)
        setError(errorData.error || '获取iframe URL失败')
      }
    } catch (error) {
      console.error('❌ 获取iframe URL错误:', error)
      setError('网络错误，无法获取聊天机器人链接')
    } finally {
      setUrlLoading(false)
      console.log('🏁 fetchIframeUrl执行完成')
    }
  }

  // 组件加载时获取iframe URL
  useEffect(() => {
    console.log('🎯 useEffect触发 - agent.id变化:', agent.id, 'integration_type:', agent.integration_type)
    // 当切换AI员工时，重置重试计数
    setRetryCount(0)
    
    if (agent.integration_type === 'api' || agent.integration_type === 'iframe') {
      console.log('🚀 准备调用fetchIframeUrl - 类型匹配:', agent.integration_type)
      fetchIframeUrl()
    } else {
      console.log('⏭️ 跳过fetchIframeUrl - 类型不匹配:', agent.integration_type)
      setUrlLoading(false)
    }
  }, [agent.id])



  const handleLoad = () => {
    console.log('✅ iframe加载完成 - agent.id:', agent.id, 'URL:', iframeUrl)
    setError(null)
  }

  const handleError = (e: any) => {
    console.error('❌ iframe加载错误 - agent.id:', agent.id, 'error:', e)
    console.error('❌ 当前尝试加载的URL:', iframeUrl)
    
    // 根据错误类型提供更具体的错误信息
    let errorMessage = '无法加载聊天机器人'
    if (e?.type === 'error') {
      errorMessage = '网络连接失败或服务器拒绝连接。可能原因：\n• 网络连接问题\n• 服务器暂时不可用\n• 跨域访问限制'
    } else {
      errorMessage = '加载失败，可能是服务暂时不可用或配置问题'
    }
    
    setError(errorMessage)
    onError?.(e)
  }

  const handleRetry = () => {
    setError(null)
    setShowFallback(false)
    setRetryCount(prev => prev + 1)
    
    // 重新获取iframe URL
    if (agent.integration_type === 'api' || agent.integration_type === 'iframe') {
      fetchIframeUrl()
    }
    
    // 强制重新加载iframe - 通过临时改变src来触发重新加载
    setTimeout(() => {
      const iframe = document.querySelector(`iframe[title="${agent.name} 聊天机器人"]`) as HTMLIFrameElement
      if (iframe && iframeUrl) {
        iframe.src = 'about:blank' // 先设置为空白页
        setTimeout(() => {
          iframe.src = iframeUrl // 然后重新设置正确的URL
        }, 100)
      }
    }, 100)
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return url.startsWith('http://') || url.startsWith('https://')
    } catch {
      return false
    }
  }

  // 如果正在加载URL，显示加载状态
  if (urlLoading && (agent.integration_type === 'api' || agent.integration_type === 'iframe')) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: '#666' }}>
            正在获取聊天机器人链接...
          </div>
        </div>
      </div>
    )
  }

  // 检查URL有效性 - 只有在不是加载状态且URL无效时才显示错误
  if ((agent.integration_type === 'api' || agent.integration_type === 'iframe') && !urlLoading && !isValidUrl(iframeUrl || '')) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Alert
          message="URL获取失败"
          description={error || '无法获取有效的聊天机器人链接'}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchIframeUrl}>
              重新获取
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div style={{ height: '100%', padding: '16px' }}>
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>
          与 {agent.name} 对话
        </Title>

        {retryCount > 0 && (
          <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
            (重试次数: {retryCount})
          </Text>
        )}
      </div>
      
      {error && (
        <div style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          zIndex: 1,
          padding: '24px'
        }}>
          <div style={{ maxWidth: '500px', width: '100%' }}>
            <Alert
              message="聊天机器人加载失败"
              description={
                <div>
                  <p style={{ marginBottom: '8px' }}>{error}</p>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    <p style={{ margin: '2px 0' }}>• 请检查网络连接是否正常</p>
                    <p style={{ margin: '2px 0' }}>• 确认聊天机器人服务是否可用</p>
                    <p style={{ margin: '2px 0' }}>• 如问题持续，请联系技术支持</p>
                  </div>
                </div>
              }
              type="error"
              showIcon
              style={{ marginBottom: '24px' }}
            />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {retryCount < 3 ? (
                <Button 
                  type="primary" 
                  size="large"
                  icon={<ReloadOutlined />}
                  onClick={handleRetry}
                  style={{ width: '100%' }}
                >
                  重新加载 (第 {retryCount + 1} 次尝试)
                </Button>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#666', marginBottom: '12px' }}>已尝试多次加载失败</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button 
                      onClick={() => {
                        setRetryCount(0)
                        handleRetry()
                      }}
                      style={{ flex: 1 }}
                    >
                      重置并重试
                    </Button>
                    <Button 
                      type="primary"
                      onClick={() => window.location.reload()}
                      style={{ flex: 1 }}
                    >
                      刷新页面
                    </Button>
                  </div>
                </div>
              )}
              
              <Button 
                 type="link" 
                 size="small"
                 onClick={() => {
                   setError(null)
                   setShowFallback(true)
                 }}
                 style={{ color: '#999' }}
               >
                 暂时跳过，查看AI员工信息
               </Button>
            </div>
          </div>
        </div>
      )}
      
      <div style={{ position: 'relative', height: 'calc(100vh - 200px)', minHeight: '700px' }}>
        {!error && !showFallback && (
            <div>

              <iframe
                key={agent.id} // 只使用agent.id作为key，避免不必要的重新渲染
                src={iframeUrl || ''}
                style={{
                  width: '100%',
                  height: 'calc(100% - 32px)',
                  minHeight: '650px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '12px'
                }}
                frameBorder="0"
                allow="microphone; camera; geolocation; autoplay; encrypted-media; fullscreen"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation allow-downloads allow-modals"
                title={`${agent.name} 聊天机器人`}
                onLoad={handleLoad}
                onError={handleError}
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          )}
          
          {showFallback && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fafafa',
              padding: '24px'
            }}>
              <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ color: '#1890ff', marginBottom: '8px' }}>{agent.name}</h3>
                  <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
                    {agent.description || '这是一个智能AI助手，可以帮助您解决各种问题。'}
                  </p>
                </div>
                
                <div style={{ 
                  backgroundColor: '#fff', 
                  padding: '20px', 
                  borderRadius: '8px', 
                  border: '1px solid #e8e8e8',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ marginBottom: '12px', color: '#333' }}>AI员工信息</h4>
                  <div style={{ textAlign: 'left' }}>
                    <p><strong>类型：</strong> {agent.integration_type === 'iframe' ? '网页聊天机器人' : agent.integration_type}</p>
                    <p><strong>状态：</strong> {agent.is_active ? '已激活' : '未激活'}</p>
                    <p><strong>服务地址：</strong> <span style={{ fontSize: '12px', color: '#666' }}>{iframeUrl || '正在获取...'}</span></p>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <Button 
                    type="primary"
                    onClick={() => {
                      setShowFallback(false)
                      handleRetry()
                    }}
                  >
                    重新尝试加载
                  </Button>
                  <Button 
                    onClick={() => {
                      if (iframeUrl) {
                        window.open(iframeUrl, '_blank')
                      }
                    }}
                    disabled={!iframeUrl}
                  >
                    在新窗口打开
                  </Button>
                </div>
                
                <p style={{ marginTop: '16px', fontSize: '12px', color: '#999' }}>
                  如果持续无法加载，请联系管理员检查服务配置
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}

const Workspace: React.FC = () => {
  const { user, subscription, logout } = useAuth()
  const navigate = useNavigate()
  const [agents, setAgents] = useState<AIAgent[]>([])  
  const [selectedAgent, setSelectedAgent] = useState<AIAgent | null>(null)
  const [conversations, setConversations] = useState<Conversation[]>([])  
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [inputMessage, setInputMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [agentsLoading, setAgentsLoading] = useState(true)
  const [agentsCollapsed, setAgentsCollapsed] = useState(false)
  const [conversationsCollapsed, setConversationsCollapsed] = useState(false)
  const [networkStatus, setNetworkStatus] = useState<'online' | 'offline' | 'checking'>('checking')
  const [lastNetworkCheck, setLastNetworkCheck] = useState<Date>(new Date())

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

  // 网络状态检测
  const checkNetworkStatus = async () => {
    try {
      setNetworkStatus('checking')
      const response = await axios.get(`${API_BASE_URL}/api/health`, {
        timeout: 5000,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      setNetworkStatus('online')
      setLastNetworkCheck(new Date())
    } catch (error) {
      console.warn('网络检测失败:', error)
      setNetworkStatus('offline')
      setLastNetworkCheck(new Date())
    }
  }

  // 监听selectedAgent变化
  useEffect(() => {
    console.log('🔄 selectedAgent状态变化:', selectedAgent ? `${selectedAgent.name} (${selectedAgent.id})` : 'null')
  }, [selectedAgent])

  // 监听网络状态变化
  useEffect(() => {
    // 初始检测
    checkNetworkStatus()
    
    // 定期检测网络状态（每30秒）
    const networkCheckInterval = setInterval(checkNetworkStatus, 30000)
    
    // 监听浏览器网络状态变化
    const handleOnline = () => {
      console.log('网络已连接')
      checkNetworkStatus()
    }
    
    const handleOffline = () => {
      console.log('网络已断开')
      setNetworkStatus('offline')
      setLastNetworkCheck(new Date())
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      clearInterval(networkCheckInterval)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 获取AI员工列表和对话历史
  useEffect(() => {
    fetchAgents()
  }, [])

  // 当选择AI员工时，获取对话历史
  useEffect(() => {
    fetchConversations()
  }, [selectedAgent])

  const fetchAgents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        // API已经返回了用户有权限访问的AI员工列表
        setAgents(data.agents || [])
        // 默认选择第一个可用的AI员工
        const availableAgent = data.agents?.find((agent: AIAgent) => 
          agent.is_active && canUseAgent(agent.required_plan)
        )
        if (availableAgent) {
          setSelectedAgent(availableAgent)
        }
      } else if (response.status === 403) {
        // 用户没有任何AI员工权限
        setAgents([])
        setSelectedAgent(null)
        message.warning('您暂无权限访问任何AI员工，请联系管理员分配权限')
      }
    } catch (error) {
      console.error('获取AI员工列表失败:', error)
      message.error('获取AI员工列表失败，请稍后重试')
    } finally {
      setAgentsLoading(false)
    }
  }

  // 检查用户是否可以使用某个AI员工
  const canUseAgent = (requiredPlan: string) => {
    if (!subscription) return false
    
    const planLevels = { free: 0, professional: 1, team: 2 }
    const userLevel = planLevels[subscription.plan_type as keyof typeof planLevels] || 0
    const requiredLevel = planLevels[requiredPlan as keyof typeof planLevels] || 0
    
    return userLevel >= requiredLevel
  }

  // 获取对话历史
  const fetchConversations = async () => {
    console.log('=== fetchConversations 开始执行 ===')
    console.log('selectedAgent:', selectedAgent)
    
    // 只有在选择了AI员工时才获取对话历史
    if (!selectedAgent) {
      console.log('没有选择AI员工，清空对话列表')
      setConversations([])
      return
    }

    try {
      const apiUrl = `${API_BASE_URL}/api/conversations?agent_id=${selectedAgent.id}`
      console.log('API请求URL:', apiUrl)
      console.log('请求头Authorization:', `Bearer ${localStorage.getItem('token')?.substring(0, 20)}...`)
      
      // 在API请求中直接传递agent_id参数，让后端返回过滤后的对话
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('API响应状态:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('API响应数据:', data)
        console.log('原始conversations数组:', data.conversations)
        console.log('conversations数组长度:', data.conversations?.length || 0)
        
        // 后端已经返回过滤后的对话，无需客户端再次过滤
        const formattedConversations = (data.conversations || []).map((conv: any) => ({
          id: conv.id,
          title: conv.title || `与${conv.ai_agents?.name || selectedAgent.name}的对话`,
          messages: [] // 消息将在选择对话时单独加载
        }))
        
        console.log('格式化后的conversations:', formattedConversations)
        console.log('即将设置到state的conversations数量:', formattedConversations.length)
        
        setConversations(formattedConversations)
        console.log('conversations state已更新')
      } else {
        console.error('API请求失败:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('错误响应内容:', errorData)
      }
    } catch (error) {
      console.error('获取对话历史失败:', error)
      console.error('错误详情:', error instanceof Error ? error.message : String(error))
    }
    
    console.log('=== fetchConversations 执行结束 ===')
  }

  // 获取对话消息
  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return data.messages || []
      }
    } catch (error) {
      console.error('获取对话消息失败:', error)
    }
    return []
  }

  // 删除对话
  const handleDeleteConversation = async (conversationId: string, conversationTitle: string) => {
    Modal.confirm({
      title: '确认删除对话',
      content: `确定要删除对话 "${conversationTitle}" 吗？此操作不可撤销。`,
      okText: '删除',
      cancelText: '取消',
      okType: 'danger',
      onOk: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/conversations/${conversationId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (response.ok) {
            // 更新对话列表，移除已删除的对话
            setConversations(prev => prev.filter(conv => conv.id !== conversationId))
            
            // 如果删除的是当前对话，清空当前对话
            if (currentConversation?.id === conversationId) {
              setCurrentConversation(null)
            }
            
            message.success('对话删除成功')
          } else {
            const errorData = await response.json()
            throw new Error(errorData.error || '删除对话失败')
          }
        } catch (error) {
          console.error('删除对话失败:', error)
          message.error(error instanceof Error ? error.message : '删除对话失败')
        }
      }
    })
  }

  // 创建新对话
  const createNewConversation = async () => {
    if (!selectedAgent) return
    
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/conversations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agent_id: selectedAgent.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '创建对话失败')
      }

      const data = await response.json()
      const newConversation: Conversation = {
        id: data.conversation.id,
        title: `与${selectedAgent.name}的对话`,
        messages: []
      }
      
      setConversations(prev => [newConversation, ...prev])
      setCurrentConversation(newConversation)
      
    } catch (error) {
      console.error('创建对话失败:', error)
      message.error(error instanceof Error ? error.message : '创建对话失败')
    } finally {
      setLoading(false)
    }
  }

  // 发送消息
  const sendMessage = async () => {
    console.log('=== sendMessage 调试信息 ===')
    console.log('inputMessage:', inputMessage)
    console.log('inputMessage.trim():', inputMessage.trim())
    console.log('selectedAgent:', selectedAgent)
    console.log('currentConversation:', currentConversation)
    console.log('subscription:', subscription)
    
    if (!inputMessage.trim()) {
      console.log('返回原因: inputMessage为空')
      return
    }
    
    if (!selectedAgent) {
      console.log('返回原因: 未选择AI员工')
      return
    }
    
    // 确保有当前对话，如果没有则创建
    let activeConversation = currentConversation
    if (!activeConversation) {
      console.log('没有当前对话，自动创建新对话...')
      // 自动创建新对话
      try {
        const response = await fetch(`${API_BASE_URL}/api/conversations`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            agent_id: selectedAgent.id,
            title: `与${selectedAgent.name}的对话`
          })
        })

        if (response.ok) {
          const data = await response.json()
          activeConversation = {
            ...data.conversation,
            messages: []
          }
          setCurrentConversation(activeConversation)
          setConversations(prev => [activeConversation, ...prev])
          console.log('新对话创建成功，继续发送消息...')
        } else {
          console.log('创建对话失败')
          message.error('创建对话失败，请重试')
          return
        }
      } catch (error) {
        console.error('创建对话时出错:', error)
        message.error('创建对话失败，请重试')
        return
      }
    }
    
    if (!subscription) {
      console.log('返回原因: subscription为空')
      message.warning('订阅信息加载失败，请刷新页面重试')
      return
    }
    
    if (subscription.usage_count >= subscription.usage_limit) {
      console.log('返回原因: 使用次数已达上限', { usage_count: subscription.usage_count, usage_limit: subscription.usage_limit })
      message.warning('您的使用次数已达上限，请升级订阅计划')
      return
    }
    
    console.log('所有检查通过，开始发送消息...')

    // 最终安全检查：确保activeConversation存在且有有效的id
    if (!activeConversation || !activeConversation.id) {
      console.error('activeConversation无效:', activeConversation)
      message.error('对话状态异常，请刷新页面重试')
      return
    }

    console.log('activeConversation验证通过:', { id: activeConversation.id, title: activeConversation.title })

    const messageContent = inputMessage.trim()
    setInputMessage('')
    setLoading(true)

    try {
      // 调用后端API发送消息
      const response = await fetch(`${API_BASE_URL}/api/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: messageContent
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        // API调用失败，显示详细错误信息
        const errorMessage = data.details 
          ? `${data.error}\n详细信息: ${data.details}`
          : data.error || '发送消息失败'
        
        // 如果后端返回了用户消息，说明用户消息已保存
        if (data.userMessage) {
          const updatedConversation = {
            ...activeConversation,
            messages: [...activeConversation.messages, data.userMessage]
          }
          
          setCurrentConversation(updatedConversation)
          setConversations(prev => 
            prev.map(conv => conv.id === activeConversation.id ? updatedConversation : conv)
          )
        }
        
        throw new Error(errorMessage)
      }

      const { userMessage, aiMessage } = data

      // 更新当前对话，添加用户消息和AI回复
      const updatedConversation = {
        ...activeConversation,
        messages: [...activeConversation.messages, userMessage, aiMessage]
      }
      
      setCurrentConversation(updatedConversation)
      setConversations(prev => 
        prev.map(conv => conv.id === activeConversation.id ? updatedConversation : conv)
      )
      
    } catch (error) {
      console.error('发送消息失败:', error)
      
      // 处理不同类型的错误
      let errorMessage = '发送消息失败，请稍后重试'
      let errorDetails = ''
      let showRetryButton = true
      
      if (error instanceof Error) {
        errorMessage = error.message
        
        // 检查是否是JWT签名无效错误
        if (errorMessage.includes('invalid signature') || errorMessage.includes('JsonWebTokenError')) {
          message.error('登录状态已失效，请重新登录', 3)
          setTimeout(() => {
            window.location.href = '/token-reset'
          }, 3000)
          return
        }
        
        // 如果是AI服务不可用的错误，提供更详细的说明
        if (errorMessage.includes('AI服务暂时不可用')) {
          errorMessage = '🤖 AI助手暂时无法响应'
          errorDetails = '可能原因：网络连接不稳定或AI服务正在维护中。请稍后重试，或联系技术支持。'
          showRetryButton = true
        } else if (errorMessage.includes('网络')) {
          errorMessage = '🌐 网络连接失败'
          errorDetails = '请检查您的网络连接，确保网络畅通后重试。'
          showRetryButton = true
        }
      } else {
        errorMessage = '发送消息失败'
        errorDetails = '遇到了未知错误，请重试或联系技术支持。'
      }
      
      // 显示更友好的错误提示
      const errorContent = (
        <div>
          <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>{errorMessage}</div>
          {errorDetails && (
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
              {errorDetails}
            </div>
          )}
          {showRetryButton && (
            <div style={{ marginTop: '8px' }}>
              <Button 
                size="small" 
                type="primary" 
                onClick={() => {
                  message.destroy()
                  // 重新发送消息
                  if (messageContent) {
                    setInputMessage(messageContent)
                    setTimeout(() => sendMessage(), 100)
                  }
                }}
              >
                重试发送
              </Button>
            </div>
          )}
        </div>
      )
      
      message.error({
        content: errorContent,
        duration: 8, // 延长显示时间
        style: { maxWidth: '400px' }
      })
      
      // 如果还没有显示用户消息，则显示
      if (activeConversation && !activeConversation.messages.some(msg => msg.content === messageContent && msg.role === 'user')) {
        const userMessage: Message = {
          id: Date.now().toString(),
          role: 'user',
          content: messageContent,
          created_at: new Date().toISOString()
        }
        
        const updatedConversation = {
          ...activeConversation,
          messages: [...activeConversation.messages, userMessage]
        }
        
        setCurrentConversation(updatedConversation)
        setConversations(prev => 
          prev.map(conv => conv.id === activeConversation.id ? updatedConversation : conv)
        )
      }
    } finally {
      setLoading(false)
    }
  }

  // 网络状态指示器组件
  const NetworkStatusIndicator = () => {
    const getStatusConfig = () => {
      switch (networkStatus) {
        case 'online':
          return {
            type: 'success' as const,
            icon: <CheckCircleOutlined />,
            text: '网络正常',
            color: '#52c41a'
          }
        case 'offline':
          return {
            type: 'error' as const,
            icon: <ExclamationCircleOutlined />,
            text: '网络异常',
            color: '#ff4d4f'
          }
        case 'checking':
          return {
            type: 'info' as const,
            icon: <WifiOutlined />,
            text: '检测中...',
            color: '#1890ff'
          }
      }
    }

    const config = getStatusConfig()
    const timeSinceCheck = Math.floor((new Date().getTime() - lastNetworkCheck.getTime()) / 1000)

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
        <span style={{ color: config.color }}>
          {config.icon}
        </span>
        <span style={{ color: config.color }}>
          {config.text}
        </span>
        {networkStatus !== 'checking' && (
          <span style={{ color: '#999', fontSize: '11px' }}>
            ({timeSinceCheck}s前)
          </span>
        )}
        {networkStatus === 'offline' && (
          <Button 
            size="small" 
            type="link" 
            onClick={checkNetworkStatus}
            style={{ padding: 0, height: 'auto', fontSize: '11px' }}
          >
            重试
          </Button>
        )}
      </div>
    )
  }

  return (
    <Layout style={{ 
      height: '100vh', 
      overflow: 'hidden',
      background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
    }}>
      {/* 网络状态提示 */}
      {networkStatus === 'offline' && (
        <Alert
          message="网络连接异常"
          description="当前网络连接不稳定，可能影响AI助手的正常使用。请检查网络连接后重试。"
          type="warning"
          showIcon
          closable
          style={{ margin: 0, borderRadius: 0 }}
        />
      )}
      
      <Header className="glass-effect backdrop-blur-md border-b border-white/20" style={{ padding: '0 32px', position: 'relative', zIndex: 50, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)', borderRadius: '0 0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} className="gradient-text" style={{ margin: 0 }}>AI工作台</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <NetworkStatusIndicator />
            <span style={{ color: '#666' }}>欢迎，{user?.email}</span>
            <Button 
              className="modern-button"
              icon={<HomeOutlined />}
              onClick={() => navigate('/')}
            >返回首页</Button>
            <Button 
              className="modern-button"
              icon={<UserOutlined />}
              onClick={() => navigate('/profile')}
            >
              个人中心
            </Button>
            <Button 
              className="modern-button-secondary"
              icon={<LogoutOutlined />}
              onClick={logout}
            >
              退出登录
            </Button>
          </div>
        </div>
      </Header>
      
      <Layout style={{ 
        height: 'calc(100vh - 64px)', 
        overflow: 'hidden',
        background: 'transparent',
        padding: '16px',
        gap: '16px'
      }}>
        {/* 左侧：AI员工选择区域 */}
        <Sider 
          width={agentsCollapsed ? 50 : 250} 
          style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            transition: 'width 0.3s ease',
            height: '100%',
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)'
          }}
        >
          <div style={{ padding: agentsCollapsed ? '8px' : '16px', marginBottom: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              {!agentsCollapsed && <Title level={4} style={{ margin: 0 }}>AI员工</Title>}
              <Button 
                  type="text" 
                  icon={agentsCollapsed ? <RightOutlined /> : <LeftOutlined />}
                  onClick={() => setAgentsCollapsed(!agentsCollapsed)}
                  style={{ 
                    padding: '8px',
                    minWidth: 'auto',
                    width: agentsCollapsed ? '100%' : 'auto',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: 'none',
                    color: '#3b82f6',
                    transition: 'all 0.2s ease'
                  }}
                />
            </div>
            
            {!agentsCollapsed && (
              agentsLoading ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>加载中...</div>
              ) : (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {agents.map(agent => (
                    <Card
                      key={agent.id}
                      size="small"
                      hoverable
                      style={{
                        cursor: 'pointer',
                        border: selectedAgent?.id === agent.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        borderRadius: '16px',
                        backgroundColor: selectedAgent?.id === agent.id ? 'rgba(59, 130, 246, 0.05)' : '#ffffff',
                        opacity: canUseAgent(agent.required_plan) ? 1 : 0.5,
                        boxShadow: selectedAgent?.id === agent.id ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.2s ease',
                        marginBottom: '6px',
                        height: '100px', // 设置固定高度
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      onClick={() => {
                        if (canUseAgent(agent.required_plan)) {
                          console.log('👆 用户点击AI员工 - agent.id:', agent.id, 'agent.name:', agent.name, 'integration_type:', agent.integration_type)
                          setSelectedAgent(agent)
                        }
                      }}
                      styles={{
                        body: {
                          padding: '12px',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between'
                        }
                      }}
                    >
                      <Card.Meta
                        avatar={<CustomAvatar src={agent.avatar_url} name={agent.name} size="sm" />}
                        title={
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1f2937',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '160px'
                          }}>
                            {agent.name}
                          </div>
                        }
                        description={
                          <div style={{
                            fontSize: '12px',
                            color: '#6b7280',
                            lineHeight: '1.4',
                            display: '-webkit-box',
                            WebkitLineClamp: 2, // 限制为2行
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            height: '34px', // 固定描述区域高度
                            marginTop: '4px'
                          }}>
                            {agent.description}
                          </div>
                        }
                      />
                      {!canUseAgent(agent.required_plan) && (
                        <Text type="secondary" style={{ 
                          fontSize: '11px',
                          marginTop: '4px',
                          color: '#ef4444'
                        }}>
                          需要{agent.required_plan}计划
                        </Text>
                      )}
                    </Card>
                  ))}
                </Space>
              )
            )}
          </div>
        </Sider>
        
        {/* 中间：对话历史区域 - 在API和DeepSeek模式下显示 */}
        {(() => {
          console.log('=== 对话历史侧边栏调试信息 ===');
          console.log('selectedAgent:', selectedAgent);
          console.log('selectedAgent?.integration_type:', selectedAgent?.integration_type);
          const shouldShowSidebar = selectedAgent?.integration_type === 'api' || selectedAgent?.integration_type === 'deepseek';
          console.log('条件判断结果 (api或deepseek):', shouldShowSidebar);
          console.log('================================');
          return shouldShowSidebar;
        })() && (
          <Sider 
            width={conversationsCollapsed ? 50 : 280} 
            style={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)', 
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              transition: 'width 0.3s ease',
              height: '100%',
              overflowY: 'auto',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
              marginLeft: '8px'
            }}
          >
            <div style={{ padding: conversationsCollapsed ? '8px' : '16px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                {!conversationsCollapsed && (
                  <>
                    <Title level={4} style={{ margin: 0 }}>对话历史</Title>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />} 
                      size="small"
                      onClick={createNewConversation}
                      disabled={!selectedAgent}
                      style={{
                        borderRadius: '12px',
                        backgroundColor: '#3b82f6',
                        borderColor: '#3b82f6',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease',
                        padding: '4px 8px'
                      }}
                    >
                      新对话
                    </Button>
                  </>
                )}
                <Button 
                  type="text" 
                  icon={conversationsCollapsed ? <RightOutlined /> : <LeftOutlined />}
                  onClick={() => setConversationsCollapsed(!conversationsCollapsed)}
                  style={{ 
                    padding: '8px',
                    minWidth: 'auto',
                    width: conversationsCollapsed ? '100%' : 'auto',
                    marginLeft: conversationsCollapsed ? 0 : '8px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    border: 'none',
                    color: '#3b82f6',
                    transition: 'all 0.2s ease'
                  }}
                />
              </div>
              
              {!conversationsCollapsed && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  {conversations.map(conv => (
                    <Card
                      key={conv.id}
                      size="small"
                      hoverable
                      style={{
                        cursor: 'pointer',
                        border: currentConversation?.id === conv.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                        borderRadius: '16px',
                        backgroundColor: currentConversation?.id === conv.id ? 'rgba(59, 130, 246, 0.05)' : '#ffffff',
                        boxShadow: currentConversation?.id === conv.id ? '0 4px 12px rgba(59, 130, 246, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
                        transition: 'all 0.2s ease',
                        marginBottom: '6px'
                      }}
                      onClick={async (e) => {
                        // 如果点击的是删除按钮，不执行加载对话的逻辑
                        if ((e.target as HTMLElement).closest('.delete-button')) {
                          return
                        }
                        
                        // 加载对话消息
                        const messages = await fetchConversationMessages(conv.id)
                        const conversationWithMessages = {
                          ...conv,
                          messages
                        }
                        setCurrentConversation(conversationWithMessages)
                        
                        // 更新对话列表中的消息数量
                        setConversations(prev => 
                          prev.map(c => c.id === conv.id ? conversationWithMessages : c)
                        )
                      }}
                      actions={[
                        <Button
                          key="delete"
                          type="text"
                          size="small"
                          icon={<DeleteOutlined />}
                          className="delete-button"
                          style={{
                            color: '#ef4444',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteConversation(conv.id, conv.title || '新对话')
                          }}
                          onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
                          }}
                          onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = 'transparent'
                          }}
                        />
                      ]}
                    >
                      <Card.Meta
                        title={conv.title || '新对话'}
                        description={`${conv.messages?.length || 0} 条消息`}
                      />
                    </Card>
                  ))}
                </Space>
              )}
            </div>
          </Sider>
        )}
        
        {/* 右侧：对话内容区域 */}
        <Content 
          style={{ 
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            transition: 'all 0.3s ease',
            height: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            marginLeft: '8px'
          }}
        >
          {selectedAgent ? (
            // 根据集成类型选择显示方式
            selectedAgent.integration_type === 'iframe' ? (
              // iframe嵌入模式
              selectedAgent.chatbot_url ? (
                <IframeAgent 
                  agent={selectedAgent} 
                  onError={(error) => {
                    console.error('iframe加载错误:', error)
                    message.error('聊天机器人加载失败，请检查网络连接或URL是否正确')
                  }}
                />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Empty 
                    description={
                      <div>
                        <Text>该AI员工暂未配置聊天机器人URL</Text>
                        <br />
                        <Text type="secondary">请联系管理员配置chatbot_url</Text>
                      </div>
                    } 
                  />
                </div>
              )
            ) : (
              // API调用模式和DeepSeek模式 - 显示传统的对话界面
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '500px', maxHeight: 'calc(100vh - 120px)' }}>
                {/* 对话标题 */}
                <div style={{ 
                  padding: '16px 20px', 
                  borderBottom: '1px solid #e2e8f0',
                  position: 'sticky',
                  top: '0',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  zIndex: 10,
                  marginTop: '0',
                  borderRadius: '20px 20px 0 0'
                }}>
                  <Title level={4} style={{ margin: 0 }}>
                    与 {selectedAgent.name} 对话
                  </Title>
                  {currentConversation && (
                    <Text type="secondary">{currentConversation.title}</Text>
                  )}
                </div>
                
                {/* 消息列表 */}
                <div 
                  style={{ 
                    flex: 1,
                    minHeight: 0,
                    maxHeight: 'calc(100vh - 280px)', // 减少预留空间，让输入框更靠近底部
                    padding: '16px 20px', 
                    overflowY: 'auto',
                    background: 'transparent'
                  }}
                  onWheel={(e) => {
                    // 阻止滚动事件冒泡到父容器，确保只在消息列表内滚动
                    e.stopPropagation()
                  }}
                >
                  {currentConversation ? (
                    currentConversation.messages.length > 0 ? (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {currentConversation.messages.map(message => (
                          <div
                            key={message.id}
                            style={{
                              display: 'flex',
                              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                              marginBottom: '12px'
                            }}
                          >
                            <div
                              style={{
                                maxWidth: '70%',
                                padding: '12px 16px',
                                borderRadius: '20px',
                                backgroundColor: message.role === 'user' ? '#3b82f6' : '#f1f5f9',
                                color: message.role === 'user' ? '#fff' : '#1e293b',
                                boxShadow: message.role === 'user' ? '0 4px 12px rgba(59, 130, 246, 0.25)' : '0 2px 8px rgba(0, 0, 0, 0.06)',
                                border: message.role === 'user' ? 'none' : '1px solid #e2e8f0'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                {message.role === 'assistant' && <RobotOutlined />}
                                <div style={{ flex: 1 }}>
                                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {message.content}
                                  </div>
                                  <div style={{ 
                                    fontSize: '12px', 
                                    opacity: 0.7, 
                                    marginTop: '4px' 
                                  }}>
                                    {new Date(message.created_at).toLocaleTimeString()}
                                  </div>
                                </div>
                                {message.role === 'user' && <UserOutlined />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </Space>
                    ) : (
                      <Empty description="开始新的对话吧！" />
                    )
                  ) : (
                    <Empty description="请创建或选择一个对话" />
                  )}
                </div>
                
                {/* 输入区域 */}
                <div style={{ 
                  padding: '12px 20px 16px 20px', // 减少padding，让输入框更靠近底部
                  borderTop: '1px solid #e2e8f0',
                  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                  borderRadius: '0 0 20px 20px',
                  flexShrink: 0, // 防止输入区域被压缩
                  minHeight: '60px', // 减少最小高度，减少下方空白
                  position: 'relative',
                  zIndex: 1
                }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <TextArea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="输入您的消息..."
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      onPressEnter={(e) => {
                        if (!e.shiftKey) {
                          e.preventDefault()
                          sendMessage()
                        }
                      }}
                      disabled={loading}
                      style={{ 
                        resize: 'none',
                        borderRadius: '16px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      loading={loading}
                      onClick={sendMessage}
                      disabled={!inputMessage.trim() || loading}
                      style={{ 
                        height: 'auto',
                        borderRadius: '16px',
                        backgroundColor: '#3b82f6',
                        borderColor: '#3b82f6',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      发送
                    </Button>
                  </Space.Compact>
                  
                  {!currentConversation && (
                    <div style={{ marginTop: '8px', textAlign: 'center' }}>
                      <Button 
                        type="dashed" 
                        onClick={createNewConversation}
                        disabled={!selectedAgent}
                        style={{
                          borderRadius: '16px',
                          borderColor: '#3b82f6',
                          color: '#3b82f6',
                          backgroundColor: 'rgba(59, 130, 246, 0.05)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        创建新对话
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Empty description="请选择一个AI员工开始对话" />
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  )
}

export default Workspace