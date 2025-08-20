-- 修复iframe类型AI员工的数据库约束问题
-- 对于iframe类型的AI员工，dify_api_endpoint应该可以为空

-- 更新现有的iframe类型AI员工，确保它们有有效的数据
UPDATE ai_agents 
SET 
    dify_api_endpoint = CASE 
        WHEN integration_type = 'iframe' THEN NULL
        ELSE dify_api_endpoint
    END,
    api_key = CASE 
        WHEN integration_type = 'iframe' THEN NULL
        ELSE api_key
    END
WHERE integration_type = 'iframe';

-- 查看更新后的结果
SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    dify_api_endpoint,
    CASE 
        WHEN api_key IS NOT NULL AND api_key != '' THEN 'configured'
        ELSE 'not_configured'
    END as api_key_status,
    is_active
FROM ai_agents
ORDER BY created_at DESC;