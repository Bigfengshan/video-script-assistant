-- 为ai_agents表添加integration_type字段，用于区分API调用和iframe嵌入模式
ALTER TABLE ai_agents 
ADD COLUMN integration_type VARCHAR(20) DEFAULT 'api' CHECK (integration_type IN ('api', 'iframe'));

-- 为现有记录设置默认值，确保向后兼容
UPDATE ai_agents 
SET integration_type = 'api' 
WHERE integration_type IS NULL;

-- 添加注释说明字段用途
COMMENT ON COLUMN ai_agents.integration_type IS '集成模式：api表示API调用模式，iframe表示iframe嵌入模式';