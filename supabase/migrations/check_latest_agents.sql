-- 查询最新的AI员工数据，特别关注iframe类型
SELECT 
    id,
    name,
    description,
    integration_type,
    chatbot_url,
    dify_api_endpoint,
    CASE 
        WHEN api_key IS NOT NULL AND api_key != '' THEN 'configured'
        ELSE 'not_configured'
    END as api_key_status,
    is_active,
    created_at
FROM ai_agents 
ORDER BY created_at DESC
LIMIT 10;