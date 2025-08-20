-- 更新AI员工的chatbot_url为可用的演示聊天机器人URL

-- 首先查看当前的iframe类型AI员工
SELECT id, name, integration_type, chatbot_url 
FROM ai_agents 
WHERE integration_type = 'iframe';

-- 更新chatbot_url为可用的演示URL
-- 使用一个实际可用的聊天机器人演示页面
UPDATE ai_agents 
SET chatbot_url = 'https://chatbot-ui-demo.vercel.app/'
WHERE integration_type = 'iframe';

-- 验证更新结果
SELECT id, name, integration_type, chatbot_url 
FROM ai_agents 
WHERE integration_type = 'iframe';