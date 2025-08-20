-- 创建测试用户并分配AI员工权限
-- 注意：这里使用bcrypt加密的密码 'test123'

-- 插入测试用户（密码：test123）
INSERT INTO users (email, name, password_hash, role) 
VALUES (
  'testuser@bigfan007.cn',
  'Test User',
  '$2b$10$K8BEaPAXhjWhAnpT4tmdFeO4F/SKa98nxPRF0HePBinxFyqM9aT.W',
  'user'
);

-- 为测试用户分配所有AI员工权限
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
  u.email = 'testuser@bigfan007.cn'
  AND a.is_active = true
-- 如果权限已存在则忽略错误
;