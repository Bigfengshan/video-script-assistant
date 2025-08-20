-- 更新管理员账号密码
-- 临时修改：为了测试后台管理功能

-- 删除可能存在的旧管理员账号
DELETE FROM users WHERE email = 'admin@test.com';

-- 创建新的管理员账号
-- 密码：admin123 (bcrypt hash: $2b$10$69YLyB/2LJgCFgbnbBUmrefqmCSjPenMwdEmDo/WKJY1U93xn36Ka)
INSERT INTO users (id, email, password_hash, name, role, email_verified, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'admin@test.com',
  '$2b$10$69YLyB/2LJgCFgbnbBUmrefqmCSjPenMwdEmDo/WKJY1U93xn36Ka',
  '系统管理员',
  'admin',
  true,
  NOW(),
  NOW()
);

-- 为管理员创建订阅记录
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
WHERE u.email = 'admin@test.com';