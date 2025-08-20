-- 添加外键约束
-- 这个迁移文件用于修复管理后台API错误，添加表之间的关系约束

-- 首先清理无效的数据记录
-- 删除引用不存在用户的订阅记录
DELETE FROM subscriptions 
WHERE user_id NOT IN (SELECT id FROM users);

-- 删除引用不存在用户的订单记录
DELETE FROM orders 
WHERE user_id NOT IN (SELECT id FROM users);

-- 删除引用不存在订阅的订单记录
DELETE FROM orders 
WHERE subscription_id IS NOT NULL 
AND subscription_id NOT IN (SELECT id FROM subscriptions);

-- 删除引用不存在用户的对话记录
DELETE FROM conversations 
WHERE user_id NOT IN (SELECT id FROM users);

-- 删除引用不存在AI员工的对话记录
DELETE FROM conversations 
WHERE agent_id NOT IN (SELECT id FROM ai_agents);

-- 删除引用不存在对话的消息记录
DELETE FROM messages 
WHERE conversation_id NOT IN (SELECT id FROM conversations);

-- 添加 subscriptions 表的外键约束
ALTER TABLE subscriptions 
ADD CONSTRAINT fk_subscriptions_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 添加 orders 表的外键约束
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_subscription_id 
FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL;

-- 添加 conversations 表的外键约束
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_user_id 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_agent_id 
FOREIGN KEY (agent_id) REFERENCES ai_agents(id) ON DELETE CASCADE;

-- 添加 messages 表的外键约束
ALTER TABLE messages 
ADD CONSTRAINT fk_messages_conversation_id 
FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

-- 创建复合索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_orders_user_subscription ON orders(user_id, subscription_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_agent ON conversations(user_id, agent_id);