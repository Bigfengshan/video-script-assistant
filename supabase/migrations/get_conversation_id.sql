-- 获取一个对话ID用于测试
SELECT 
    id as conversation_id,
    title,
    user_id,
    agent_id
FROM conversations 
LIMIT 1;