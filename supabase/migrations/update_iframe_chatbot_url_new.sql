-- 更新iframe类型AI员工的chatbot_url为新的可访问Dify URL
-- 首先查看当前的数据
SELECT id, name, integration_type, chatbot_url FROM ai_agents WHERE integration_type = 'iframe';

-- 更新chatbot_url为用户提供的新的可访问Dify URL
UPDATE ai_agents 
SET chatbot_url = 'https://3492202eycu0.vicp.fun/chat/HOyoAikJVc793BV2'
WHERE integration_type = 'iframe';

-- 验证更新结果
SELECT id, name, integration_type, chatbot_url, is_active FROM ai_agents WHERE integration_type = 'iframe';