import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  Space,
  message,
  Popconfirm,
  Tag,
  Input,
  Card,
  Row,
  Col,
  Tooltip,
  DatePicker
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
  RobotOutlined
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import dayjs from 'dayjs'

const { Option } = Select
const { Search } = Input
const { RangePicker } = DatePicker

interface User {
  id: string
  email: string
  full_name?: string
  created_at: string
  subscription?: {
    plan_type: 'free' | 'professional' | 'team'
    status: 'active' | 'inactive' | 'cancelled'
  }
}

interface AIAgent {
  id: string
  name: string
  description: string
  is_active: boolean
  required_plan: 'free' | 'professional' | 'team'
}

interface UserPermission {
  id: string
  user_id: string
  agent_id: string
  granted_by: string
  granted_at: string
  revoked_at?: string
  is_active: boolean
  user?: User
  agent?: AIAgent
  granter?: User
}

interface AuditLog {
  id: string
  user_id: string
  agent_id: string
  action_by: string
  action_type: 'grant' | 'revoke'
  action_details: string
  ip_address?: string
  user_agent?: string
  created_at: string
  user?: User
  agent?: AIAgent
  actor?: User
}

const PermissionManagement: React.FC = () => {
  const { user, token } = useAuth()
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<UserPermission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [auditModalVisible, setAuditModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string | undefined>()
  const [selectedAgent, setSelectedAgent] = useState<string | undefined>()
  const [form] = Form.useForm()
  const [formSelectedUser, setFormSelectedUser] = useState<string | undefined>()
  const [formSelectedAgent, setFormSelectedAgent] = useState<string | undefined>()

  // 分页状态
  const [permissionPagination, setPermissionPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  const [auditPagination, setAuditPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  // 获取权限列表
  const fetchPermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPermissions(data.data || []);
      }
    } catch (error) {
      console.error('获取权限列表失败:', error);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    }
  };

  // 获取AI员工列表
  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions/user-agents', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('获取AI员工列表失败:', error);
    }
  };

  // 获取审计日志
  const fetchAuditLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions/audit', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.data || []);
      }
    } catch (error) {
      console.error('获取审计日志失败:', error);
    }
  };

  // 分配权限
  const grantPermission = async (values: { user_id: string; agent_id: string }) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: values.user_id,
          agentIds: [values.agent_id],
          operation: 'grant'
        })
      })

      const data = await response.json();
      if (data.success) {
        message.success(data.message || '权限分配成功')
        setModalVisible(false)
        form.resetFields()
        setFormSelectedUser(undefined)
        setFormSelectedAgent(undefined)
        fetchPermissions()
      } else {
        message.error(data.error || '权限分配失败')
      }
    } catch (error) {
      console.error('权限分配失败:', error)
      message.error('权限分配失败')
    }
  }

  // 检查用户订阅计划是否满足AI员工要求
  const checkPlanCompatibility = (userId?: string, agentId?: string) => {
    if (!userId || !agentId) return null
    
    const user = users.find(u => u.id === userId)
    const agent = agents.find(a => a.id === agentId)
    
    if (!user || !agent) return null
    
    const userPlan = user.subscription?.plan_type || 'free'
    const requiredPlan = agent.required_plan
    
    const planHierarchy = { 'free': 0, 'professional': 1, 'team': 2 }
    const userPlanLevel = planHierarchy[userPlan]
    const requiredPlanLevel = planHierarchy[requiredPlan]
    
    return {
      compatible: userPlanLevel >= requiredPlanLevel,
      userPlan,
      requiredPlan,
      user,
      agent
    }
  }

  // 撤销权限
  const revokePermission = async (userId: string, agentId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/permissions/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId: userId,
          agentIds: [agentId],
          operation: 'revoke'
        })
      })

      const data = await response.json();
      if (data.success) {
        message.success(data.message || '权限撤销成功')
        fetchPermissions()
      } else {
        message.error(data.error || '权限撤销失败')
      }
    } catch (error) {
      console.error('权限撤销失败:', error)
      message.error('权限撤销失败')
    }
  }

  useEffect(() => {
    fetchPermissions()
    fetchUsers()
    fetchAgents()
  }, [])

  const permissionColumns = [
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      render: (user: User) => (
        <Space>
          <UserOutlined />
          <div>
            <div>{user?.email}</div>
            {user?.full_name && <div style={{ fontSize: '12px', color: '#666' }}>{user.full_name}</div>}
            {user?.subscription && (
              <Tag 
                color={
                   user.subscription.plan_type === 'team' ? 'blue' : 
                   user.subscription.plan_type === 'professional' ? 'green' : 'default'
                 }
              >
                {user.subscription.plan_type === 'team' ? '团队版' : 
                 user.subscription.plan_type === 'professional' ? '专业版' : '免费版'}
              </Tag>
            )}
          </div>
        </Space>
      )
    },
    {
      title: 'AI员工',
      dataIndex: 'agent',
      key: 'agent',
      render: (agent: AIAgent) => (
        <Space>
          <RobotOutlined />
          <div>
            <div>{agent?.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>{agent?.description}</div>
            {agent?.required_plan && (
              <Tag 
                color={
                   agent.required_plan === 'team' ? 'blue' : 
                   agent.required_plan === 'professional' ? 'green' : 'default'
                 }
              >
                需要{agent.required_plan === 'team' ? '团队版' : 
                     agent.required_plan === 'professional' ? '专业版' : '免费版'}
              </Tag>
            )}
          </div>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive: boolean, record: UserPermission) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '有效' : '已撤销'}
        </Tag>
      )
    },
    {
      title: '授权人',
      dataIndex: 'granted_by_user',
      key: 'granted_by_user',
      render: (granter: User) => granter?.email || '-'
    },
    {
      title: '授权时间',
      dataIndex: 'granted_at',
      key: 'granted_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '撤销时间',
      dataIndex: 'revoked_at',
      key: 'revoked_at',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '操作',
      key: 'actions',
      render: (record: UserPermission) => (
        <Space>
          {record.is_active && (
            <Popconfirm
              title="确定要撤销此权限吗？"
              onConfirm={() => revokePermission(record.user_id, record.agent_id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                撤销
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  const auditColumns = [
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      render: (user: User) => user?.email || '-'
    },
    {
      title: 'AI员工',
      dataIndex: 'agent',
      key: 'agent',
      render: (agent: AIAgent) => agent?.name || '-'
    },
    {
      title: '操作类型',
      dataIndex: 'operation_type',
      key: 'operation_type',
      render: (type: string) => (
        <Tag color={type === 'grant' ? 'green' : 'red'}>
          {type === 'grant' ? '分配' : '撤销'}
        </Tag>
      )
    },
    {
      title: '操作人',
      dataIndex: 'operator',
      key: 'operator',
      render: (operator: User) => operator?.email || '-'
    },
    {
      title: '操作详情',
      dataIndex: 'operation_details',
      key: 'operation_details',
      ellipsis: true,
      render: (details: any) => {
        const detailsText = typeof details === 'object' ? JSON.stringify(details) : details;
        return (
          <Tooltip title={detailsText}>
            <span>{detailsText}</span>
          </Tooltip>
        );
      }
    },
    {
      title: 'IP地址',
      dataIndex: 'ip_address',
      key: 'ip_address'
    },
    {
      title: '操作时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
    }
  ]

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="权限管理" extra={
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  form.resetFields()
                  setFormSelectedUser(undefined)
                  setFormSelectedAgent(undefined)
                  setModalVisible(true)
                }}
              >
                分配权限
              </Button>
              <Button
                icon={<SearchOutlined />}
                onClick={() => setAuditModalVisible(true)}
              >
                查看审计日志
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchPermissions()}
              >
                刷新
              </Button>
            </Space>
          }>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Select
                  placeholder="筛选用户"
                  style={{ width: 200 }}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  onChange={(value) => {
                    setSelectedUser(value)
                    fetchPermissions()
                  }}
                >
                  {users.map(user => (
                    <Option key={user.id} value={user.id}>
                      {user.email}
                    </Option>
                  ))}
                </Select>
                <Select
                  placeholder="筛选AI员工"
                  style={{ width: 200 }}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                  onChange={(value) => {
                    setSelectedAgent(value)
                    fetchPermissions()
                  }}
                >
                  {agents.map(agent => (
                    <Option key={agent.id} value={agent.id}>
                      {agent.name}
                    </Option>
                  ))}
                </Select>
              </Space>
            </div>
            
            <Table
              columns={permissionColumns}
              dataSource={permissions}
              rowKey="id"
              loading={loading}
              pagination={{
                ...permissionPagination,
                onChange: (page) => fetchPermissions()
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 分配权限模态框 */}
      <Modal
        title="分配权限"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          form.resetFields()
          setFormSelectedUser(undefined)
          setFormSelectedAgent(undefined)
        }}
        onOk={() => form.submit()}
        okText="分配"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={grantPermission}
        >
          <Form.Item
            name="user_id"
            label="选择用户"
            rules={[{ required: true, message: '请选择用户' }]}
          >
            <Select
              placeholder="请选择用户"
              showSearch
              optionFilterProp="children"
              onChange={(value) => setFormSelectedUser(value)}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{user.email} {user.full_name && `(${user.full_name})`}</span>
                    {user.subscription && (
                      <Tag 
                        color={
                           user.subscription.plan_type === 'team' ? 'blue' : 
                           user.subscription.plan_type === 'professional' ? 'green' : 'default'
                         }
                      >
                        {user.subscription.plan_type === 'team' ? '团队版' : 
                         user.subscription.plan_type === 'professional' ? '专业版' : '免费版'}
                      </Tag>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item
            name="agent_id"
            label="选择AI员工"
            rules={[{ required: true, message: '请选择AI员工' }]}
          >
            <Select
              placeholder="请选择AI员工"
              showSearch
              optionFilterProp="children"
              onChange={(value) => setFormSelectedAgent(value)}
            >
              {agents.filter(agent => agent.is_active).map(agent => (
                <Option key={agent.id} value={agent.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{agent.name} - {agent.description}</span>
                    {agent.required_plan && (
                      <Tag 
                        color={
                           agent.required_plan === 'team' ? 'blue' : 
                           agent.required_plan === 'professional' ? 'green' : 'default'
                         }
                      >
                        需要{agent.required_plan === 'team' ? '团队版' : 
                             agent.required_plan === 'professional' ? '专业版' : '免费版'}
                      </Tag>
                    )}
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          {/* 计划兼容性提示 */}
          {(() => {
            const compatibility = checkPlanCompatibility(formSelectedUser, formSelectedAgent)
            if (!compatibility) return null
            
            return (
              <div style={{ marginTop: 16, padding: 12, borderRadius: 6, backgroundColor: compatibility.compatible ? '#f6ffed' : '#fff2f0', border: `1px solid ${compatibility.compatible ? '#b7eb8f' : '#ffccc7'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 'bold', color: compatibility.compatible ? '#52c41a' : '#ff4d4f' }}>
                    {compatibility.compatible ? '✓ 计划兼容' : '✗ 计划不兼容'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  用户 {compatibility.user.email} 当前为
                  <Tag color={compatibility.userPlan === 'team' ? 'blue' : compatibility.userPlan === 'professional' ? 'green' : 'default'} style={{ margin: '0 4px' }}>
                    {compatibility.userPlan === 'team' ? '团队版' : compatibility.userPlan === 'professional' ? '专业版' : '免费版'}
                  </Tag>
                  ，AI员工 {compatibility.agent.name} 需要
                  <Tag color={compatibility.requiredPlan === 'team' ? 'blue' : compatibility.requiredPlan === 'professional' ? 'green' : 'default'} style={{ margin: '0 4px' }}>
                    {compatibility.requiredPlan === 'team' ? '团队版' : compatibility.requiredPlan === 'professional' ? '专业版' : '免费版'}
                  </Tag>
                  {!compatibility.compatible && (
                    <div style={{ marginTop: 8, color: '#ff4d4f' }}>
                      请先为用户升级到相应的订阅计划，或选择其他AI员工。
                    </div>
                  )}
                </div>
              </div>
            )
          })()}
        </Form>
      </Modal>

      {/* 审计日志模态框 */}
      <Modal
        title="权限审计日志"
        open={auditModalVisible}
        onCancel={() => setAuditModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setAuditModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={1000}
      >
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Select
              placeholder="筛选用户"
              style={{ width: 150 }}
              allowClear
              showSearch
              optionFilterProp="children"
              onChange={(value) => fetchAuditLogs()}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.email}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="筛选AI员工"
              style={{ width: 150 }}
              allowClear
              showSearch
              optionFilterProp="children"
              onChange={(value) => fetchAuditLogs()}
            >
              {agents.map(agent => (
                <Option key={agent.id} value={agent.id}>
                  {agent.name}
                </Option>
              ))}
            </Select>
            <RangePicker
              onChange={(dates) => {
                if (dates) {
                  fetchAuditLogs()
                } else {
                  fetchAuditLogs()
                }
              }}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => fetchAuditLogs()}
            >
              刷新
            </Button>
          </Space>
        </div>
        
        <Table
          columns={auditColumns}
          dataSource={auditLogs}
          rowKey="id"
          loading={loading}
          pagination={{
            ...auditPagination,
            onChange: (page) => fetchAuditLogs()
          }}
          scroll={{ x: 800 }}
        />
      </Modal>
    </div>
  )
}

export default PermissionManagement