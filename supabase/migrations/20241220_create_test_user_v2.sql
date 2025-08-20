-- 删除之前的测试用户（如果存在）
DELETE FROM user_agent_permissions WHERE user_id IN (SELECT id FROM users WHERE email = 'testuser@bigfan007.cn');
DELETE FROM users WHERE email = 'testuser@bigfan007.cn';

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
  granted_at,
  is_active
)
SELECT 
  u.id,
  a.id,
  u.id, -- 自己授权给自己
  NOW(),
  true
FROM 
  users u,
  ai_agents a
WHERE 
  u.email = 'testuser@bigfan007.cn'
  AND a.is_active = true
-- 如果权限已存在则忽略错误
;