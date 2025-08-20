-- 调试iframe加载问题的SQL查询

-- 1. 检查所有AI员工的基本信息
SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    is_active,
    created_at
FROM public.ai_agents 
ORDER BY created_at DESC;

-- 2. 检查iframe类型的AI员工
SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    LENGTH(chatbot_url) as url_length,
    is_active
FROM public.ai_agents 
WHERE integration_type = 'iframe'
ORDER BY created_at DESC;

-- 3. 检查api类型的AI员工
SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    dify_api_endpoint,
    api_key IS NOT NULL as has_api_key,
    is_active
FROM public.ai_agents 
WHERE integration_type = 'api'
ORDER BY created_at DESC;

-- 4. 检查chatbot_url为空或null的记录
SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    is_active
FROM public.ai_agents 
WHERE (chatbot_url IS NULL OR chatbot_url = '' OR LENGTH(TRIM(chatbot_url)) = 0)
AND is_active = true;

-- 5. 检查用户权限（管理员用户）
SELECT 
    u.id,
    u.email,
    u.role,
    COUNT(uap.agent_id) as accessible_agents
FROM public.users u
LEFT JOIN public.user_agent_permissions uap ON u.id = uap.user_id AND uap.is_active = true
WHERE u.role = 'admin' OR u.email LIKE '%admin%'
GROUP BY u.id, u.email, u.role;

-- 6. 检查具体的权限分配
SELECT 
    u.email,
    u.role,
    a.name as agent_name,
    a.integration_type,
    a.chatbot_url IS NOT NULL as has_chatbot_url,
    uap.is_active as permission_active
FROM public.users u
JOIN public.user_agent_permissions uap ON u.id = uap.user_id
JOIN public.ai_agents a ON uap.agent_id = a.id
WHERE u.role = 'admin' OR u.email LIKE '%admin%'
ORDER BY u.email, a.name;

-- 7. 统计各种集成类型的数量
SELECT 
    integration_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN chatbot_url IS NOT NULL AND chatbot_url != '' THEN 1 END) as has_url_count
FROM public.ai_agents
GROUP BY integration_type;