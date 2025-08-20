-- 查询iframe类型AI员工的chatbot_url设置
SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    is_active,
    created_at
FROM ai_agents 
WHERE integration_type = 'iframe' 
ORDER BY created_at DESC;