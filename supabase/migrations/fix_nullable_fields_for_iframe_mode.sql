-- 修复AI员工表字段约束，使iframe模式下的API相关字段可以为空
-- 当integration_type为'iframe'时，dify_api_endpoint和api_key字段应该允许为空

-- 修改dify_api_endpoint字段，允许为空
ALTER TABLE ai_agents 
ALTER COLUMN dify_api_endpoint DROP NOT NULL;

-- 修改api_key字段，允许为空
ALTER TABLE ai_agents 
ALTER COLUMN api_key DROP NOT NULL;

-- 添加检查约束，确保数据完整性：
-- 当integration_type为'api'时，dify_api_endpoint和api_key必须不为空
-- 当integration_type为'iframe'时，chatbot_url必须不为空
ALTER TABLE ai_agents 
ADD CONSTRAINT check_integration_fields 
CHECK (
  (integration_type = 'api' AND dify_api_endpoint IS NOT NULL AND api_key IS NOT NULL) OR
  (integration_type = 'iframe' AND chatbot_url IS NOT NULL)
);

-- 添加注释说明约束逻辑
COMMENT ON CONSTRAINT check_integration_fields ON ai_agents IS 
'确保根据集成模式正确填写必需字段：API模式需要dify_api_endpoint和api_key，iframe模式需要chatbot_url';