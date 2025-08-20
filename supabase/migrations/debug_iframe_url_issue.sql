-- 调试iframe URL获取失败问题
-- 查询所有AI员工的详细信息，重点关注iframe类型

SELECT 
    'All AI Agents:' as section;

SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    is_active,
    created_at
FROM ai_agents 
ORDER BY created_at DESC;

SELECT 
    '\nIframe type agents only:' as section;

SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    CASE 
        WHEN chatbot_url IS NULL THEN 'NULL'
        WHEN chatbot_url = '' THEN 'EMPTY STRING'
        WHEN LENGTH(chatbot_url) < 10 THEN 'TOO SHORT'
        WHEN chatbot_url NOT LIKE 'http%' THEN 'INVALID FORMAT'
        ELSE 'VALID'
    END as url_status,
    is_active,
    created_at
FROM ai_agents 
WHERE integration_type = 'iframe'
ORDER BY created_at DESC;

SELECT 
    '\nURL validation summary:' as section;

SELECT 
    integration_type,
    COUNT(*) as total_count,
    COUNT(chatbot_url) as has_url_count,
    COUNT(*) - COUNT(chatbot_url) as null_url_count,
    COUNT(CASE WHEN chatbot_url = '' THEN 1 END) as empty_url_count,
    COUNT(CASE WHEN chatbot_url NOT LIKE 'http%' AND chatbot_url IS NOT NULL AND chatbot_url != '' THEN 1 END) as invalid_format_count
FROM ai_agents 
GROUP BY integration_type
ORDER BY integration_type;