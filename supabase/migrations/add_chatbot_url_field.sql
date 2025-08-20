-- 为ai_agents表添加chatbot_url字段
ALTER TABLE ai_agents ADD COLUMN chatbot_url VARCHAR(500);

-- 添加注释
COMMENT ON COLUMN ai_agents.chatbot_url IS 'Dify聊天机器人的iframe URL';

-- 为现有的AI员工添加示例chatbot_url（基于用户提供的URL格式）
UPDATE ai_agents 
SET chatbot_url = 'http://3492202eycu0.vicp.fun/chatbot/HOyoAikJVc793BV2'
WHERE name = '短视频文案助手' AND chatbot_url IS NULL;