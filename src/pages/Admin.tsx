import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Input,
  InputNumber,
  Select,
  Modal,
  Form,
  message,
  Tabs,
  Tag,
  Space,
  Popconfirm,
  Switch,
  Tooltip,
  Layout,
  Typography,
  Upload
} from 'antd'
import {
  UserOutlined,
  DollarOutlined,
  MessageOutlined,
  TeamOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  PlusOutlined,
  RobotOutlined,
  EyeOutlined,
  LogoutOutlined,
  ArrowLeftOutlined,
  UploadOutlined
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import Avatar from '../components/Avatar'
import PermissionManagement from '../components/PermissionManagement'

const { Search } = Input
const { Option } = Select
const { Header } = Layout
const { Title } = Typography

interface AdminStats {
  totalUsers: number
  activeSubscriptions: number
  newUsersThisMonth: number
  totalRevenue: number
  totalConversations: number
  totalMessages: number
}

interface User {
  id: string
  email: string
  created_at: string
  last_login: string
  subscriptions: {
    plan_type: string
    status: string
    usage_count: number
    usage_limit: number
    start_date: string
    end_date: string
  }[]
}

interface Order {
  id: string
  user_id: string
  plan_type: string
  amount: number
  status: string
  created_at: string
  users: {
    email: string
  }
}

interface AgentStat {
  id: string
  name: string
  conversationCount: number
  messageCount: number
}

interface AIAgent {
  id: string
  name: string
  description: string
  avatar_url?: string
  integration_type: 'api' | 'iframe' | 'deepseek'
  dify_api_endpoint?: string
  api_key?: string
  chatbot_url?: string
  deepseek_api_key?: string
  deepseek_model?: string
  system_prompt?: string
  temperature?: number
  max_tokens?: number
  required_plan: string
  is_active: boolean
  created_at: string
}

const Admin: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [agentStats, setAgentStats] = useState<AgentStat[]>([])
  const [aiAgents, setAiAgents] = useState<AIAgent[]>([])
  const [userPagination, setUserPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [orderPagination, setOrderPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [agentPagination, setAgentPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [userSearch, setUserSearch] = useState('')
  const [orderStatus, setOrderStatus] = useState('')
  const [agentSearch, setAgentSearch] = useState('')
  const [agentStatus, setAgentStatus] = useState('')
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [agentModalVisible, setAgentModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null)
  const [form] = Form.useForm()
  const [agentForm] = Form.useForm()

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      } else {
        message.error('获取统计信息失败')
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      message.error('获取统计信息失败')
    }
  }

  // 获取用户列表
  const fetchUsers = async (page = 1, search = '') => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users?page=${page}&limit=20&search=${search}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setUserPagination({
          current: data.page,
          pageSize: data.limit,
          total: data.total
        })
      } else {
        message.error('获取用户列表失败')
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      message.error('获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取订单列表
  const fetchOrders = async (page = 1, status = '') => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/orders?page=${page}&limit=20&status=${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        setOrderPagination({
          current: data.page,
          pageSize: data.limit,
          total: data.total
        })
      } else {
        message.error('获取订单列表失败')
      }
    } catch (error) {
      console.error('获取订单列表失败:', error)
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 获取AI员工统计
  const fetchAgentStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/agents/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAgentStats(data.agentStats)
      } else {
        message.error('获取AI员工统计失败')
      }
    } catch (error) {
      console.error('获取AI员工统计失败:', error)
      message.error('获取AI员工统计失败')
    }
  }

  // 获取AI员工列表
  const fetchAIAgents = async (page = 1, search = '', status = '') => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search,
        status
      })
      const response = await fetch(`/api/admin/agents?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAiAgents(data.agents)
        setAgentPagination({
          current: data.page,
          pageSize: data.limit,
          total: data.total
        })
      } else {
        message.error('获取AI员工列表失败')
      }
    } catch (error) {
      console.error('获取AI员工列表失败:', error)
      message.error('获取AI员工列表失败')
    } finally {
      setLoading(false)
    }
  }

  // 简化的表单验证函数
  const validateAIAgentForm = () => {
    return agentForm.validateFields()
  }

  // 创建或更新AI员工
  const saveAIAgent = async (values: any) => {
    try {
      // 使用Ant Design原生表单验证
      await validateAIAgentForm()
      
      const token = localStorage.getItem('token')
      const url = editingAgent 
        ? `/api/admin/agents/${editingAgent.id}`
        : '/api/admin/agents'
      const method = editingAgent ? 'PUT' : 'POST'
      
      // 根据集成模式构建提交数据，只包含相关字段
      const baseFields = {
        name: values.name,
        description: values.description,
        avatar_url: values.avatar_url,
        integration_type: values.integration_type,
        required_plan: values.required_plan
      }
      
      let submitData
      if (values.integration_type === 'api') {
        // API模式：只提交API相关字段
        submitData = {
          ...baseFields,
          dify_api_endpoint: values.dify_api_endpoint,
          api_key: values.api_key
        }
      } else if (values.integration_type === 'iframe') {
        // iframe模式：只提交chatbot_url字段
        submitData = {
          ...baseFields,
          chatbot_url: values.chatbot_url
        }
      } else if (values.integration_type === 'deepseek') {
        // DeepSeek模式：提交DeepSeek相关字段
        submitData = {
          ...baseFields,
          deepseek_api_key: values.deepseek_api_key,
          deepseek_model: values.deepseek_model,
          system_prompt: values.system_prompt,
          temperature: values.temperature,
          max_tokens: values.max_tokens
        }
      } else {
        // 默认情况
        submitData = baseFields
      }
      
      // 过滤掉undefined和空字符串的字段
      const cleanedData = Object.fromEntries(
        Object.entries(submitData).filter(([_, value]) => 
          value !== undefined && value !== null && value !== ''
        )
      )
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cleanedData)
      })
      
      if (response.ok) {
        message.success(editingAgent ? 'AI员工已更新' : 'AI员工已创建')
        setAgentModalVisible(false)
        setEditingAgent(null)
        agentForm.resetFields()
        fetchAIAgents(agentPagination.current, agentSearch, agentStatus)
      } else {
        const errorData = await response.json()
        message.error(errorData.error || '操作失败')
      }
    } catch (error) {
      console.error('保存AI员工失败:', error)
      if (error instanceof Error) {
        message.error(error.message)
      } else {
        message.error('保存AI员工失败')
      }
    }
  }

  // 删除AI员工
  const deleteAIAgent = async (agentId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const result = await response.json()
        const stats = result.deletedStats
        if (stats) {
          message.success(
            `AI员工删除成功！已删除：${stats.conversations}个对话、${stats.messages}条消息、${stats.permissions}个权限记录`,
            5 // 显示5秒
          )
        } else {
          message.success('AI员工已删除')
        }
        fetchAIAgents(agentPagination.current, agentSearch, agentStatus)
      } else {
        const errorData = await response.json()
        message.error(errorData.error || '删除失败')
      }
    } catch (error) {
      console.error('删除AI员工失败:', error)
      message.error('删除AI员工失败')
    }
  }

  // 切换AI员工状态
  const toggleAgentStatus = async (agentId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/agents/${agentId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: isActive })
      })
      
      if (response.ok) {
        message.success(`AI员工已${isActive ? '启用' : '禁用'}`)
        fetchAIAgents(agentPagination.current, agentSearch, agentStatus)
      } else {
        message.error('状态切换失败')
      }
    } catch (error) {
      console.error('切换状态失败:', error)
      message.error('切换状态失败')
    }
  }

  // 更新用户订阅
  const updateUserSubscription = async (values: any) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${editingUser?.id}/subscription`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      })
      
      if (response.ok) {
        message.success('用户订阅已更新')
        setEditModalVisible(false)
        fetchUsers(userPagination.current, userSearch)
      } else {
        message.error('更新用户订阅失败')
      }
    } catch (error) {
      console.error('更新用户订阅失败:', error)
      message.error('更新用户订阅失败')
    }
  }

  // 删除用户
  const deleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        message.success('用户已删除')
        fetchUsers(userPagination.current, userSearch)
      } else {
        message.error('删除用户失败')
      }
    } catch (error) {
      console.error('删除用户失败:', error)
      message.error('删除用户失败')
    }
  }

  useEffect(() => {
    fetchStats()
    fetchUsers()
    fetchOrders()
    fetchAgentStats()
    fetchAIAgents()
  }, [])

  const userColumns = [
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '订阅计划',
      key: 'subscription',
      render: (record: User) => {
        const subscription = record.subscriptions?.[0]
        if (!subscription) return <Tag>无订阅</Tag>
        
        const planColors: { [key: string]: string } = {
          free: 'default',
          pro: 'blue',
          team: 'gold'
        }
        
        return <Tag color={planColors[subscription.plan_type]}>{subscription.plan_type.toUpperCase()}</Tag>
      }
    },
    {
      title: '状态',
      key: 'status',
      render: (record: User) => {
        const subscription = record.subscriptions?.[0]
        if (!subscription) return <Tag color="default">无订阅</Tag>
        
        const statusColors: { [key: string]: string } = {
          active: 'green',
          expired: 'red',
          cancelled: 'orange'
        }
        
        return <Tag color={statusColors[subscription.status]}>{subscription.status}</Tag>
      }
    },
    {
      title: '使用情况',
      key: 'usage',
      render: (record: User) => {
        const subscription = record.subscriptions?.[0]
        if (!subscription) return '-'
        return `${subscription.usage_count}/${subscription.usage_limit}`
      }
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: User) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUser(record)
              const subscription = record.subscriptions?.[0]
              form.setFieldsValue({
                plan_type: subscription?.plan_type || 'free',
                status: subscription?.status || 'active',
                usage_limit: subscription?.usage_limit || 100
              })
              setEditModalVisible(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => deleteUser(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const orderColumns = [
    {
      title: '订单ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => id.slice(0, 8) + '...'
    },
    {
      title: '用户邮箱',
      key: 'user_email',
      render: (record: Order) => record.users?.email
    },
    {
      title: '计划类型',
      dataIndex: 'plan_type',
      key: 'plan_type',
      render: (planType: string) => {
        const planColors: { [key: string]: string } = {
          pro: 'blue',
          team: 'gold'
        }
        return <Tag color={planColors[planType]}>{planType.toUpperCase()}</Tag>
      }
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `¥${amount}`
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusColors: { [key: string]: string } = {
          pending: 'orange',
          completed: 'green',
          failed: 'red'
        }
        return <Tag color={statusColors[status]}>{status}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString()
    }
  ]

  const agentColumns = [
    {
      title: 'AI员工',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '对话数',
      dataIndex: 'conversationCount',
      key: 'conversationCount'
    },
    {
      title: '消息数',
      dataIndex: 'messageCount',
      key: 'messageCount'
    }
  ]

  const aiAgentColumns = [
    {
      title: '头像',
      dataIndex: 'avatar_url',
      key: 'avatar_url',
      width: 80,
      render: (avatarUrl: string, record: AIAgent) => (
        <Avatar src={avatarUrl} name={record.name} size="md" />
      )
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: AIAgent) => (
        <Space>
          <span>{name}</span>
        </Space>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => (
        <Tooltip title={description}>
          <span>{description}</span>
        </Tooltip>
      )
    },
    {
      title: 'Dify API端点',
      dataIndex: 'dify_api_endpoint',
      key: 'dify_api_endpoint',
      ellipsis: true,
      render: (endpoint: string) => (
        <Tooltip title={endpoint}>
          <span>{endpoint}</span>
        </Tooltip>
      )
    },
    {
      title: '所需计划',
      dataIndex: 'required_plan',
      key: 'required_plan',
      render: (plan: string) => {
        const planColors: { [key: string]: string } = {
          free: 'default',
          pro: 'blue',
          team: 'gold'
        }
        return <Tag color={planColors[plan]}>{plan.toUpperCase()}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: AIAgent) => (
        <Switch
          checked={isActive}
          onChange={(checked) => toggleAgentStatus(record.id, checked)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: AIAgent) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="link"
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: `AI员工详情 - ${record.name}`,
                  content: (
                    <div>
                      <p><strong>描述:</strong> {record.description}</p>
                      <p><strong>API端点:</strong> {record.dify_api_endpoint}</p>
                      <p><strong>API密钥:</strong> {record.api_key.replace(/./g, '*')}</p>
                      <p><strong>所需计划:</strong> {record.required_plan}</p>
                      <p><strong>状态:</strong> {record.is_active ? '启用' : '禁用'}</p>
                      <p><strong>创建时间:</strong> {new Date(record.created_at).toLocaleString()}</p>
                    </div>
                  ),
                  width: 600
                })
              }}
            />
          </Tooltip>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingAgent(record)
              agentForm.setFieldsValue({
                name: record.name,
                description: record.description,
                avatar_url: record.avatar_url,
                integration_type: record.integration_type || 'api',
                dify_api_endpoint: record.dify_api_endpoint,
                api_key: record.api_key,
                chatbot_url: record.chatbot_url,
                deepseek_api_key: record.deepseek_api_key,
                deepseek_model: record.deepseek_model,
                system_prompt: record.system_prompt,
                temperature: record.temperature,
                max_tokens: record.max_tokens,
                required_plan: record.required_plan
              })
              setAgentModalVisible(true)
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个AI员工吗？"
            description="删除后将无法恢复，建议先禁用。"
            onConfirm={() => deleteAIAgent(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header className="glass-effect backdrop-blur-md border-b border-white/20 sticky top-0 z-50" style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={3} className="gradient-text" style={{ margin: 0 }}>管理后台</Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#666' }}>管理员：{user?.email}</span>
            <Button 
              className="modern-button"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/profile')}
            >
              返回个人中心
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
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <p className="text-gray-600">系统管理和数据统计</p>
          </div>

        {/* 统计卡片 */}
        {stats && (
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="总用户数"
                  value={stats.totalUsers}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="活跃订阅"
                  value={stats.activeSubscriptions}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="本月新用户"
                  value={stats.newUsersThisMonth}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="总收入"
                  value={stats.totalRevenue}
                  prefix={<DollarOutlined />}
                  precision={2}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="总对话数"
                  value={stats.totalConversations}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#13c2c2' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Card>
                <Statistic
                  title="总消息数"
                  value={stats.totalMessages}
                  prefix={<MessageOutlined />}
                  valueStyle={{ color: '#eb2f96' }}
                />
              </Card>
            </Col>
          </Row>
        )}

        {/* 管理面板 */}
        <Card>
          <Tabs 
            defaultActiveKey="users"
            items={[
              {
                key: 'users',
                label: '用户管理',
                children: (
                  <>
                    <div className="mb-4 flex justify-between items-center">
                      <Search
                        placeholder="搜索用户邮箱"
                        allowClear
                        style={{ width: 300 }}
                        onSearch={(value) => {
                          setUserSearch(value)
                          fetchUsers(1, value)
                        }}
                      />
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchUsers(userPagination.current, userSearch)}
                      >
                        刷新
                      </Button>
                    </div>
                    <Table
                      columns={userColumns}
                      dataSource={users}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        ...userPagination,
                        onChange: (page) => fetchUsers(page, userSearch)
                      }}
                    />
                  </>
                )
              },
              {
                key: 'orders',
                label: '订单管理',
                children: (
                  <>
                    <div className="mb-4 flex justify-between items-center">
                      <Select
                        placeholder="筛选订单状态"
                        style={{ width: 200 }}
                        allowClear
                        onChange={(value) => {
                          setOrderStatus(value || '')
                          fetchOrders(1, value || '')
                        }}
                      >
                        <Option value="pending">待处理</Option>
                        <Option value="completed">已完成</Option>
                        <Option value="failed">失败</Option>
                      </Select>
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => fetchOrders(orderPagination.current, orderStatus)}
                      >
                        刷新
                      </Button>
                    </div>
                    <Table
                      columns={orderColumns}
                      dataSource={orders}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        ...orderPagination,
                        onChange: (page) => fetchOrders(page, orderStatus)
                      }}
                    />
                  </>
                )
              },
              {
                key: 'agents',
                label: 'AI员工统计',
                children: (
                  <>
                    <div className="mb-4 flex justify-end">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchAgentStats}
                      >
                        刷新
                      </Button>
                    </div>
                    <Table
                      columns={agentColumns}
                      dataSource={agentStats}
                      rowKey="id"
                      pagination={false}
                    />
                  </>
                )
              },
              {
                key: 'ai-agents',
                label: 'AI员工管理',
                children: (
                  <>
                    <div className="mb-4 flex justify-between items-center">
                      <Space>
                        <Search
                          placeholder="搜索AI员工名称"
                          allowClear
                          style={{ width: 250 }}
                          onSearch={(value) => {
                            setAgentSearch(value)
                            fetchAIAgents(1, value, agentStatus)
                          }}
                        />
                        <Select
                          placeholder="筛选状态"
                          style={{ width: 120 }}
                          allowClear
                          onChange={(value) => {
                            setAgentStatus(value || '')
                            fetchAIAgents(1, agentSearch, value || '')
                          }}
                        >
                          <Option value="active">启用</Option>
                          <Option value="inactive">禁用</Option>
                        </Select>
                      </Space>
                      <Space>
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => {
                            setEditingAgent(null)
                            agentForm.resetFields()
                            // 使用setTimeout确保在模态框打开后再设置字段值
                            setTimeout(() => {
                              agentForm.setFieldsValue({ 
                                integration_type: 'api',
                                required_plan: 'free'
                              })
                            }, 100)
                            setAgentModalVisible(true)
                          }}
                        >
                          添加AI员工
                        </Button>
                        <Button
                          icon={<ReloadOutlined />}
                          onClick={() => fetchAIAgents(agentPagination.current, agentSearch, agentStatus)}
                        >
                          刷新
                        </Button>
                      </Space>
                    </div>
                    <Table
                      columns={aiAgentColumns}
                      dataSource={aiAgents}
                      rowKey="id"
                      loading={loading}
                      pagination={{
                        ...agentPagination,
                        onChange: (page) => fetchAIAgents(page, agentSearch, agentStatus)
                      }}
                    />
                  </>
                )
              },
              {
                key: 'permissions',
                label: '权限管理',
                children: (
                  <PermissionManagement />
                )
              }
            ]}
          />
        </Card>

        {/* 编辑用户订阅模态框 */}
        <Modal
          title="编辑用户订阅"
          open={editModalVisible}
          onCancel={() => setEditModalVisible(false)}
          onOk={() => form.submit()}
          okText="保存"
          cancelText="取消"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={updateUserSubscription}
          >
            <Form.Item
              name="plan_type"
              label="订阅计划"
              rules={[{ required: true, message: '请选择订阅计划' }]}
            >
              <Select>
                <Option value="free">免费版</Option>
                <Option value="pro">专业版</Option>
                <Option value="team">团队版</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select>
                <Option value="active">活跃</Option>
                <Option value="expired">过期</Option>
                <Option value="cancelled">已取消</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="usage_limit"
              label="使用限制"
              rules={[{ required: true, message: '请输入使用限制' }]}
            >
              <Input type="number" />
            </Form.Item>
          </Form>
        </Modal>

        {/* AI员工管理模态框 */}
        <Modal
          title={editingAgent ? '编辑AI员工' : '添加AI员工'}
          open={agentModalVisible}
          onCancel={() => {
            setAgentModalVisible(false)
            setEditingAgent(null)
            agentForm.resetFields()
          }}
          onOk={() => agentForm.submit()}
          okText="保存"
          cancelText="取消"
          width={600}
        >
          <Form
            form={agentForm}
            layout="vertical"
            onFinish={saveAIAgent}
          >
            <Form.Item
              name="name"
              label="AI员工名称"
              rules={[
                { required: true, message: '请输入AI员工名称' },
                { max: 50, message: '名称不能超过50个字符' }
              ]}
            >
              <Input placeholder="请输入AI员工名称" />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="描述"
              rules={[
                { required: true, message: '请输入AI员工描述' },
                { max: 200, message: '描述不能超过200个字符' }
              ]}
            >
              <Input.TextArea 
                rows={3} 
                placeholder="请输入AI员工的功能描述" 
              />
            </Form.Item>
            
            <Form.Item
              name="integration_type"
              label="集成模式"
              rules={[{ required: true, message: '请选择集成模式' }]}
            >
              <Select 
                placeholder="请选择集成模式"
                onChange={(value) => {
                  // 使用setTimeout异步处理表单状态更新，避免循环引用警告
                  setTimeout(() => {
                    // 当集成模式改变时，清除相关字段的值和验证状态
                    if (value === 'api') {
                      agentForm.setFieldsValue({ 
                        chatbot_url: undefined,
                        deepseek_api_key: undefined,
                        deepseek_model: undefined,
                        system_prompt: undefined,
                        temperature: undefined,
                        max_tokens: undefined
                      })
                      agentForm.setFields([
                        { name: 'chatbot_url', errors: [] },
                        { name: 'deepseek_api_key', errors: [] },
                        { name: 'deepseek_model', errors: [] },
                        { name: 'system_prompt', errors: [] },
                        { name: 'temperature', errors: [] },
                        { name: 'max_tokens', errors: [] }
                      ])
                    } else if (value === 'iframe') {
                      agentForm.setFieldsValue({ 
                        dify_api_endpoint: undefined,
                        api_key: undefined,
                        deepseek_api_key: undefined,
                        deepseek_model: undefined,
                        system_prompt: undefined,
                        temperature: undefined,
                        max_tokens: undefined
                      })
                      agentForm.setFields([
                        { name: 'dify_api_endpoint', errors: [] },
                        { name: 'api_key', errors: [] },
                        { name: 'deepseek_api_key', errors: [] },
                        { name: 'deepseek_model', errors: [] },
                        { name: 'system_prompt', errors: [] },
                        { name: 'temperature', errors: [] },
                        { name: 'max_tokens', errors: [] }
                      ])
                    } else if (value === 'deepseek') {
                      agentForm.setFieldsValue({ 
                        dify_api_endpoint: undefined,
                        api_key: undefined,
                        chatbot_url: undefined
                      })
                      agentForm.setFields([
                        { name: 'dify_api_endpoint', errors: [] },
                        { name: 'api_key', errors: [] },
                        { name: 'chatbot_url', errors: [] }
                      ])
                    }
                  }, 0)
                }}
              >
                <Option value="api">API调用模式</Option>
                <Option value="iframe">iframe嵌入模式</Option>
                <Option value="deepseek">DeepSeek API模式</Option>
              </Select>
            </Form.Item>
            
            <Form.Item
              name="avatar_url"
              label="头像"
            >
              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.avatar_url !== currentValues.avatar_url || 
                  prevValues.name !== currentValues.name
                }
              >
                {({ getFieldValue, setFieldsValue }) => {
                  const avatarUrl = getFieldValue('avatar_url')
                  const name = getFieldValue('name')
                  
                  return (
                    <div className="flex items-center space-x-4">
                      <Avatar 
                        src={avatarUrl} 
                        name={name || 'AI'} 
                        size="lg" 
                      />
                      <div className="flex flex-col space-y-2">
                        <Upload
                          name="avatar"
                          listType="picture"
                          maxCount={1}
                          beforeUpload={(file) => {
                            const isImage = file.type.startsWith('image/');
                            if (!isImage) {
                              message.error('只能上传图片文件!');
                              return false;
                            }
                            const isLt2M = file.size / 1024 / 1024 < 2;
                            if (!isLt2M) {
                              message.error('图片大小不能超过2MB!');
                              return false;
                            }
                            
                            // 创建FormData并上传文件
                            const formData = new FormData();
                            formData.append('avatar', file);
                            
                            const token = localStorage.getItem('token');
                            fetch('/api/admin/upload/avatar', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`
                              },
                              body: formData
                            })
                            .then(response => response.json())
                            .then(data => {
                              if (data.success) {
                                setFieldsValue({ avatar_url: data.url });
                                message.success('头像上传成功!');
                              } else {
                                message.error(data.error || '头像上传失败!');
                              }
                            })
                            .catch(error => {
                              console.error('头像上传失败:', error);
                              message.error('头像上传失败!');
                            });
                            
                            return false; // 阻止默认上传行为
                          }}
                          showUploadList={false}
                        >
                          <Button icon={<UploadOutlined />}>上传头像</Button>
                        </Upload>
                        <Input 
                          placeholder="或输入头像URL" 
                          value={avatarUrl}
                          onChange={(e) => setFieldsValue({ avatar_url: e.target.value })}
                        />
                      </div>
                    </div>
                  )
                }}
              </Form.Item>
            </Form.Item>
            
            {/* 动态配置字段 - 根据集成模式显示不同字段 */}
            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.integration_type !== currentValues.integration_type
              }
            >
              {({ getFieldValue }) => {
                const integrationType = getFieldValue('integration_type')
                
                if (integrationType === 'api') {
                  return (
                    <>
                      <Form.Item
                        name="dify_api_endpoint"
                        label="Dify API端点"
                        rules={[
                          { type: 'url', message: '请输入有效的API端点URL' }
                        ]}
                      >
                        <Input placeholder="https://api.dify.ai/v1/chat-messages" />
                      </Form.Item>
                      
                      <Form.Item
                        name="api_key"
                        label="API密钥"
                        rules={[
                          { min: 10, message: 'API密钥长度不能少于10个字符' }
                        ]}
                      >
                        <Input.Password placeholder="请输入Dify API密钥" />
                      </Form.Item>
                    </>
                  )
                } else if (integrationType === 'iframe') {
                  return (
                    <Form.Item
                      name="chatbot_url"
                      label="聊天机器人URL"
                      rules={[
                        { type: 'url', message: '请输入有效的URL' },
                        {
                          validator: (_, value) => {
                            if (!value) {
                              return Promise.resolve()
                            }
                            if (!value.startsWith('http://') && !value.startsWith('https://')) {
                              return Promise.reject(new Error('URL必须以http://或https://开头'))
                            }
                            return Promise.resolve()
                          }
                        }
                      ]}
                    >
                      <Input placeholder="https://udify.app/chatbot/xxx" />
                    </Form.Item>
                  )
                } else if (integrationType === 'deepseek') {
                  return (
                    <>
                      <Form.Item
                        name="deepseek_api_key"
                        label="DeepSeek API密钥"
                        rules={[
                          { required: true, message: '请输入DeepSeek API密钥' },
                          { min: 10, message: 'API密钥长度不能少于10个字符' }
                        ]}
                      >
                        <Input.Password placeholder="请输入DeepSeek API密钥" />
                      </Form.Item>
                      
                      <Form.Item
                        name="deepseek_model"
                        label="DeepSeek模型"
                        initialValue="deepseek-chat"
                        rules={[{ required: true, message: '请选择DeepSeek模型' }]}
                      >
                        <Select placeholder="请选择DeepSeek模型">
                          <Option value="deepseek-chat">deepseek-chat</Option>
                          <Option value="deepseek-coder">deepseek-coder</Option>
                        </Select>
                      </Form.Item>
                      
                      <Form.Item
                        name="system_prompt"
                        label="系统提示词"
                        rules={[
                          { required: true, message: '请输入系统提示词' },
                          { max: 2000, message: '提示词不能超过2000个字符' }
                        ]}
                      >
                        <Input.TextArea 
                          rows={4} 
                          placeholder="请输入系统提示词，定义AI员工的角色和行为规范" 
                        />
                      </Form.Item>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Form.Item
                          name="temperature"
                          label="温度参数"
                          initialValue={0.7}
                          rules={[
                            { required: true, message: '请输入温度参数' },
                            { type: 'number', min: 0, max: 2, message: '温度参数必须在0-2之间' }
                          ]}
                        >
                          <InputNumber 
                            min={0} 
                            max={2} 
                            step={0.1} 
                            placeholder="0.7" 
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                        
                        <Form.Item
                          name="max_tokens"
                          label="最大令牌数"
                          initialValue={2048}
                          rules={[
                            { required: true, message: '请输入最大令牌数' },
                            { type: 'number', min: 1, max: 8192, message: '令牌数必须在1-8192之间' }
                          ]}
                        >
                          <InputNumber 
                            min={1} 
                            max={8192} 
                            step={1} 
                            placeholder="2048" 
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </div>
                    </>
                  )
                }
                
                return null
              }}
            </Form.Item>
            

            
            <Form.Item
              name="required_plan"
              label="所需订阅计划"
              rules={[{ required: true, message: '请选择所需订阅计划' }]}
              initialValue="free"
            >
              <Select>
                <Option value="free">免费版</Option>
                <Option value="pro">专业版</Option>
                <Option value="team">团队版</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
        </div>
      </div>
    </Layout>
  )
}

export default Admin