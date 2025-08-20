-- 更新AI员工的chatbot_url为有效的测试URL
UPDATE ai_agents 
SET chatbot_url = 'https://www.example.com'
WHERE integration_type = 'iframe' AND name = '123';

-- 查看更新后的结果
SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    is_active
FROM ai_agents
WHERE integration_type = 'iframe';