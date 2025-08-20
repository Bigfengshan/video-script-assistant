-- 添加用户角色字段和创建管理员账号
-- 临时修改：为了测试后台管理功能

-- 1. 为users表添加role字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';

-- 添加角色约束
ALTER TABLE users ADD CONSTRAINT check_user_role 
  CHECK (role IN ('user', 'admin', 'moderator'));

-- 2. 创建管理员账号（用于测试）
-- 密码：admin123 (bcrypt hash)
INSERT INTO users (id, email, password_hash, name, role, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  '$2b$10$69YLyB/2LJgCFgbnbBUmrefqmCSjPenMwdEmDo/WKJY1U93xn36Ka', -- 密码: admin123
  '系统管理员',
  'admin',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. 为管理员创建订阅记录
INSERT INTO subscriptions (id, user_id, plan_type, usage_count, usage_limit, expires_at, created_at)
SELECT 
  gen_random_uuid(),
  u.id,
  'team',
  0,
  999999,
  NOW() + INTERVAL '1 year',
  NOW()
FROM users u 
WHERE u.email = 'admin@test.com'
ON CONFLICT DO NOTHING;

-- 4. 授权给anon和authenticated角色
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON subscriptions TO anon;
GRANT ALL PRIVILEGES ON subscriptions TO authenticated;

-- 5. 创建RLS策略（如果需要）
-- 暂时禁用RLS以便测试
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;