-- 查询当前AI员工的详细信息，特别关注chatbot_url
SELECT 
    id,
    name,
    description,
    integration_type,
    chatbot_url,
    dify_api_endpoint,
    CASE 
        WHEN api_key IS NOT NULL AND api_key != '' THEN '已设置'
        ELSE '未设置'
    END as api_key_status,
    is_active,
    created_at
FROM ai_agents 
ORDER BY created_at DESC;