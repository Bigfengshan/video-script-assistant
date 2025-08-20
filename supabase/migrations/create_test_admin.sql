-- 创建测试管理员用户并获取用户信息

-- 检查现有用户
SELECT 
    'Existing Users' as info,
    id,
    email,
    role,
    created_at
FROM users
ORDER BY created_at;

-- 创建测试管理员用户（如果不存在）
INSERT INTO users (email, role, created_at, updated_at)
SELECT 
    'admin@test.com',
    'admin',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@test.com'
);

-- 显示管理员用户信息
SELECT 
    'Admin User Info' as info,
    id,
    email,
    role,
    created_at
FROM users
WHERE role = 'admin'
ORDER BY created_at;