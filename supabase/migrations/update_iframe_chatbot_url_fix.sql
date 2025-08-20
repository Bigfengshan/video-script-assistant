-- 更新iframe类型AI员工的chatbot_url为正确的Dify URL
-- 首先查看当前的数据
SELECT id, name, integration_type, chatbot_url FROM ai_agents WHERE integration_type = 'iframe';

-- 更新chatbot_url为用户提供的正确Dify URL
UPDATE ai_agents 
SET chatbot_url = 'http://3492202eycu0.vicp.fun/chatbot/HOyoAikJVc793BV2'
WHERE integration_type = 'iframe' 
  AND (chatbot_url IS NULL 
       OR chatbot_url = 'https://example.com' 
       OR chatbot_url = 'https://chatbot-ui-demo.vercel.app'
       OR chatbot_url != 'http://3492202eycu0.vicp.fun/chatbot/HOyoAikJVc793BV2');

-- 验证更新结果
SELECT id, name, integration_type, chatbot_url, is_active FROM ai_agents WHERE integration_type = 'iframe';