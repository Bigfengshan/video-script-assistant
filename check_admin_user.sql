-- 检查管理员用户信息
SELECT 
    id,
    email,
    name,
    role,
    created_at
FROM public.users 
WHERE role = 'admin' 
   OR email LIKE '%admin%'
ORDER BY created_at DESC;

-- 检查auth.users中的管理员
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email LIKE '%admin%'
   OR email LIKE '%bigfan007.cn%'
ORDER BY created_at DESC;