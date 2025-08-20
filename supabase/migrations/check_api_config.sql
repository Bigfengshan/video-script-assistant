-- 检查API类型AI员工的详细配置
SELECT 
    id,
    name,
    integration_type,
    dify_api_endpoint,
    CASE 
        WHEN api_key IS NOT NULL THEN CONCAT('已配置 (长度: ', LENGTH(api_key), ', 前缀: ', LEFT(api_key, 10), '...')
        ELSE '未配置'
    END as api_key_status,
    chatbot_url,
    is_active
FROM ai_agents 
WHERE integration_type = 'api'
ORDER BY created_at DESC;

-- 检查是否有API配置不完整的员工
SELECT 
    name,
    integration_type,
    CASE WHEN dify_api_endpoint IS NULL OR dify_api_endpoint = '' THEN '缺少API端点' ELSE 'API端点已配置' END as endpoint_status,
    CASE WHEN api_key IS NULL OR api_key = '' THEN '缺少API密钥' ELSE 'API密钥已配置' END as key_status
FROM ai_agents 
WHERE integration_type = 'api'
    AND (dify_api_endpoint IS NULL OR dify_api_endpoint = '' OR api_key IS NULL OR api_key = '');