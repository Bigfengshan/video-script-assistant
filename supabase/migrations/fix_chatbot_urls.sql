-- 修复AI员工的chatbot_url，将example.com替换为有效的Dify聊天机器人URL

-- 首先查看当前的chatbot_url
SELECT id, name, integration_type, chatbot_url 
FROM ai_agents 
WHERE integration_type = 'iframe';

-- 更新指向example.com或无效URL的chatbot_url
UPDATE ai_agents 
SET chatbot_url = 'https://udify.app/chatbot/your-chatbot-id'
WHERE integration_type = 'iframe' 
AND (chatbot_url LIKE '%example.com%' OR chatbot_url IS NULL OR chatbot_url = '');

-- 验证更新结果
SELECT id, name, integration_type, chatbot_url 
FROM ai_agents 
WHERE integration_type = 'iframe';