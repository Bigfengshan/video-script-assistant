-- 为messages表添加status字段，用于标记消息状态
ALTER TABLE messages ADD COLUMN status VARCHAR(20) DEFAULT 'success';

-- 添加检查约束，确保status字段只能是指定的值
ALTER TABLE messages ADD CONSTRAINT check_message_status 
  CHECK (status IN ('success', 'fallback', 'error'));

-- 为现有记录设置默认状态
UPDATE messages SET status = 'success' WHERE status IS NULL;

-- 添加注释说明
COMMENT ON COLUMN messages.status IS '消息状态: success=API调用成功, fallback=使用备用回复, error=API调用失败';