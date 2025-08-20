-- 创建用户AI员工权限管理系统
-- 添加用户权限表和审计日志表

-- 创建用户AI员工权限关联表
CREATE TABLE user_agent_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建唯一约束，确保同一用户对同一AI员工只有一条有效权限记录
CREATE UNIQUE INDEX idx_user_agent_permissions_unique_active 
ON user_agent_permissions(user_id, agent_id) 
WHERE is_active = true;

-- 创建索引
CREATE INDEX idx_user_agent_permissions_user_id ON user_agent_permissions(user_id);
CREATE INDEX idx_user_agent_permissions_agent_id ON user_agent_permissions(agent_id);
CREATE INDEX idx_user_agent_permissions_is_active ON user_agent_permissions(is_active);
CREATE INDEX idx_user_agent_permissions_granted_at ON user_agent_permissions(granted_at DESC);

-- 权限审计日志表
CREATE TABLE permission_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    agent_id UUID NOT NULL REFERENCES ai_agents(id),
    operated_by UUID NOT NULL REFERENCES users(id),
    operation_type VARCHAR(20) NOT NULL CHECK (operation_type IN ('grant', 'revoke', 'batch_grant', 'batch_revoke')),
    operation_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_permission_audit_logs_user_id ON permission_audit_logs(user_id);
CREATE INDEX idx_permission_audit_logs_operated_by ON permission_audit_logs(operated_by);
CREATE INDEX idx_permission_audit_logs_operation_type ON permission_audit_logs(operation_type);
CREATE INDEX idx_permission_audit_logs_created_at ON permission_audit_logs(created_at DESC);

-- 设置权限
GRANT SELECT ON user_agent_permissions TO anon;
GRANT ALL PRIVILEGES ON user_agent_permissions TO authenticated;

GRANT SELECT ON permission_audit_logs TO anon;
GRANT ALL PRIVILEGES ON permission_audit_logs TO authenticated;

-- 为现有用户分配默认权限
-- 为所有现有用户分配所有活跃AI员工的权限（初始化数据）
INSERT INTO user_agent_permissions (user_id, agent_id, granted_by, granted_at, is_active)
SELECT 
    u.id as user_id,
    a.id as agent_id,
    (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as granted_by,
    NOW() as granted_at,
    true as is_active
FROM users u
CROSS JOIN ai_agents a
WHERE u.role = 'user' 
  AND a.is_active = true
ON CONFLICT (user_id, agent_id) WHERE is_active = true DO NOTHING;

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_agent_permissions_updated_at 
    BEFORE UPDATE ON user_agent_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();