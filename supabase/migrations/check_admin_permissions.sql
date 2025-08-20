-- 检查管理员用户权限配置

-- 检查用户表中的管理员用户
SELECT 
    'Admin Users' as info,
    id,
    email,
    role,
    created_at
FROM users 
WHERE role = 'admin'
ORDER BY created_at;

-- 检查用户权限分配表
SELECT 
    'User Agent Permissions' as info,
    COUNT(*) as total_permissions
FROM user_agent_permissions
WHERE is_active = true;

-- 检查管理员用户的权限分配
SELECT 
    'Admin Permissions Detail' as info,
    u.email,
    u.role,
    COUNT(uap.agent_id) as assigned_agents
FROM users u
LEFT JOIN user_agent_permissions uap ON u.id = uap.user_id AND uap.is_active = true
WHERE u.role = 'admin'
GROUP BY u.id, u.email, u.role;

-- 检查是否所有活跃的AI员工都分配给了管理员
SELECT 
    'Missing Admin Permissions' as info,
    aa.id as agent_id,
    aa.name as agent_name,
    aa.integration_type
FROM ai_agents aa
WHERE aa.is_active = true
AND NOT EXISTS (
    SELECT 1 
    FROM user_agent_permissions uap
    JOIN users u ON uap.user_id = u.id
    WHERE uap.agent_id = aa.id 
    AND u.role = 'admin'
    AND uap.is_active = true
);

-- 为管理员用户分配所有活跃AI员工的权限（如果缺失）
INSERT INTO user_agent_permissions (user_id, agent_id, granted_by, granted_at, is_active)
SELECT 
    u.id as user_id,
    aa.id as agent_id,
    u.id as granted_by,
    NOW() as granted_at,
    true as is_active
FROM users u
CROSS JOIN ai_agents aa
WHERE u.role = 'admin'
AND aa.is_active = true
AND NOT EXISTS (
    SELECT 1 
    FROM user_agent_permissions uap
    WHERE uap.user_id = u.id 
    AND uap.agent_id = aa.id
    AND uap.is_active = true
);

-- 显示最终的权限分配情况
SELECT 
    'Final Admin Permissions' as info,
    u.email,
    u.role,
    COUNT(uap.agent_id) as assigned_agents
FROM users u
LEFT JOIN user_agent_permissions uap ON u.id = uap.user_id AND uap.is_active = true
WHERE u.role = 'admin'
GROUP BY u.id, u.email, u.role;

-- 显示详细的权限分配
SELECT 
    'Detailed Admin Permissions' as info,
    u.email as admin_email,
    aa.name as agent_name,
    aa.integration_type,
    uap.granted_at
FROM users u
JOIN user_agent_permissions uap ON u.id = uap.user_id
JOIN ai_agents aa ON uap.agent_id = aa.id
WHERE u.role = 'admin' 
AND uap.is_active = true
AND aa.is_active = true
ORDER BY u.email, aa.name;