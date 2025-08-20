-- 调试管理员权限问题的查询

-- 1. 检查AI员工数据
SELECT 
    'AI Agents' as table_name,
    id, 
    name, 
    description, 
    integration_type, 
    is_active,
    created_at
FROM ai_agents 
ORDER BY created_at;

-- 2. 检查用户数据
SELECT 
    'Users' as table_name,
    id, 
    email, 
    name, 
    role,
    created_at
FROM users 
ORDER BY created_at;

-- 3. 检查用户权限分配
SELECT 
    'User Agent Permissions' as table_name,
    uap.id,
    u.email as user_email,
    u.role as user_role,
    a.name as agent_name,
    uap.is_active,
    uap.created_at
FROM user_agent_permissions uap
JOIN users u ON uap.user_id = u.id
JOIN ai_agents a ON uap.agent_id = a.id
ORDER BY uap.created_at;

-- 4. 检查管理员用户的权限统计
SELECT 
    'Admin Permissions Summary' as table_name,
    u.email,
    u.role,
    COUNT(uap.agent_id) as granted_agents_count,
    COUNT(CASE WHEN uap.is_active = true THEN 1 END) as active_permissions_count
FROM users u
LEFT JOIN user_agent_permissions uap ON u.id = uap.user_id
WHERE u.role = 'admin' OR u.email LIKE '%admin%'
GROUP BY u.id, u.email, u.role;

-- 5. 检查活跃的AI员工数量
SELECT 
    'Active AI Agents Count' as table_name,
    COUNT(*) as total_agents,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_agents
FROM ai_agents;