-- 更新iframe类型AI员工的chatbot_url为正确的Dify URL
UPDATE ai_agents 
SET chatbot_url = 'http://3492202eycu0.vicp.fun/chatbot/HOyoAikJVc793BV2'
WHERE integration_type = 'iframe';

-- 验证更新结果
SELECT 
    id,
    name,
    integration_type,
    chatbot_url,
    is_active
FROM ai_agents 
WHERE integration_type = 'iframe'
ORDER BY created_at DESC;