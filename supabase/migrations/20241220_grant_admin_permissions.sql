-- 为admin用户分配所有AI员工权限

-- 首先检查是否存在admin用户
DO $$
DECLARE
    admin_user_id UUID;
    agent_record RECORD;
BEGIN
    -- 查找admin用户（通过email查找）
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email LIKE '%admin%' OR email = 'admin@example.com'
    LIMIT 1;
    
    -- 如果没有找到admin用户，创建一个测试admin用户
    IF admin_user_id IS NULL THEN
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, role)
        VALUES (
            gen_random_uuid(),
            'admin@example.com',
            crypt('admin123', gen_salt('bf')),
            now(),
            now(),
            now(),
            'authenticated'
        )
        RETURNING id INTO admin_user_id;
        
        -- 同时在users表中创建对应记录
        INSERT INTO public.users (id, email, password_hash, name, role, created_at, updated_at)
        VALUES (
            admin_user_id,
            'admin@example.com',
            crypt('admin123', gen_salt('bf')),
            'Admin User',
            'admin',
            now(),
            now()
        );
        
        RAISE NOTICE 'Created admin user with ID: %', admin_user_id;
    ELSE
        RAISE NOTICE 'Found admin user with ID: %', admin_user_id;
    END IF;
    
    -- 为admin用户分配所有AI员工的权限
    FOR agent_record IN SELECT id FROM public.ai_agents WHERE is_active = true LOOP
        -- 检查权限是否已存在
        IF NOT EXISTS (
            SELECT 1 FROM public.user_agent_permissions 
            WHERE user_id = admin_user_id 
            AND agent_id = agent_record.id 
            AND is_active = true
        ) THEN
            -- 插入权限记录
            INSERT INTO public.user_agent_permissions (
                user_id, 
                agent_id, 
                granted_by, 
                is_active,
                created_at,
                updated_at
            ) VALUES (
                admin_user_id,
                agent_record.id,
                admin_user_id, -- 自己给自己分配权限
                true,
                now(),
                now()
            );
            
            RAISE NOTICE 'Granted permission for agent % to admin user', agent_record.id;
        ELSE
            RAISE NOTICE 'Permission already exists for agent %', agent_record.id;
        END IF;
    END LOOP;
    
    -- 记录审计日志
    INSERT INTO public.permission_audit_logs (
        user_id,
        agent_id,
        operation_type,
        operated_by,
        created_at
    )
    SELECT 
        admin_user_id,
        id,
        'grant',
        admin_user_id,
        now()
    FROM public.ai_agents 
    WHERE is_active = true;
    
END $$;

-- 验证权限分配结果
SELECT 
    u.email,
    u.role,
    COUNT(uap.agent_id) as granted_agents_count
FROM public.users u
LEFT JOIN public.user_agent_permissions uap ON u.id = uap.user_id AND uap.is_active = true
WHERE u.role = 'admin' OR u.email LIKE '%admin%'
GROUP BY u.id, u.email, u.role;