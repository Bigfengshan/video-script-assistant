-- 查看API类型AI员工的详细数据
SELECT 
    id,
    name,
    description,
    integration_type,
    dify_api_endpoint,
    api_key,
    chatbot_url,
    is_active,
    created_at
FROM ai_agents 
WHERE integration_type = 'api'
ORDER BY created_at DESC;

-- 查看所有AI员工的集成类型分布
SELECT 
    integration_type,
    COUNT(*) as count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM ai_agents 
GROUP BY integration_type;