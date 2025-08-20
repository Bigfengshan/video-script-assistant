-- 为测试用户分配AI员工权限
-- 获取用户ID和AI员工ID，然后插入权限记录

INSERT INTO user_agent_permissions (
  user_id,
  agent_id,
  granted_by,
  is_active
)
SELECT 
  u.id as user_id,
  a.id as agent_id,
  (SELECT id FROM users WHERE role = 'admin' LIMIT 1) as granted_by,
  true as is_active
FROM 
  users u,
  ai_agents a
WHERE 
  u.role = 'user'
  AND a.is_active = true;

-- 为user_agent_permissions表设置权限
GRANT SELECT ON user_agent_permissions TO anon;
GRANT ALL PRIVILEGES ON user_agent_permissions TO authenticated;