-- 扩展ai_agents表以支持DeepSeek类型的AI员工
-- 添加DeepSeek相关的配置字段

-- 1. 扩展integration_type字段，添加deepseek选项
ALTER TABLE ai_agents 
DROP CONSTRAINT IF EXISTS ai_agents_integration_type_check;

ALTER TABLE ai_agents 
ADD CONSTRAINT ai_agents_integration_type_check 
CHECK (integration_type IN ('api', 'iframe', 'deepseek'));

-- 2. 添加DeepSeek相关的配置字段
ALTER TABLE ai_agents 
ADD COLUMN IF NOT EXISTS deepseek_api_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS deepseek_model VARCHAR(100) DEFAULT 'deepseek-chat',
ADD COLUMN IF NOT EXISTS system_prompt TEXT,
ADD COLUMN IF NOT EXISTS temperature DECIMAL(3,2) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
ADD COLUMN IF NOT EXISTS max_tokens INTEGER DEFAULT 2048 CHECK (max_tokens > 0 AND max_tokens <= 8192);

-- 3. 添加字段注释
COMMENT ON COLUMN ai_agents.deepseek_api_key IS 'DeepSeek API密钥，仅用于deepseek类型的AI员工';
COMMENT ON COLUMN ai_agents.deepseek_model IS 'DeepSeek模型名称，默认为deepseek-chat';
COMMENT ON COLUMN ai_agents.system_prompt IS '系统提示词，用于定义AI员工的角色和行为';
COMMENT ON COLUMN ai_agents.temperature IS '生成文本的随机性，范围0-2，默认0.7';
COMMENT ON COLUMN ai_agents.max_tokens IS '最大生成token数量，范围1-8192，默认2048';

-- 4. 更新integration_type字段的注释
COMMENT ON COLUMN ai_agents.integration_type IS '集成模式：api表示Dify API调用模式，iframe表示iframe嵌入模式，deepseek表示DeepSeek API调用模式';

-- 5. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_ai_agents_integration_type ON ai_agents(integration_type);

-- 6. 插入一个示例DeepSeek AI员工（可选，用于测试）
-- INSERT INTO ai_agents (
--     name, 
--     description, 
--     integration_type, 
--     deepseek_api_key, 
--     deepseek_model,
--     system_prompt,
--     temperature,
--     max_tokens,
--     is_active
-- ) VALUES (
--     'DeepSeek助手', 
--     '基于DeepSeek API的智能助手，擅长代码生成和技术问答', 
--     'deepseek', 
--     'your-deepseek-api-key-here', 
--     'deepseek-chat',
--     '你是一个专业的AI助手，擅长回答技术问题和协助编程任务。请用简洁、准确的语言回答用户的问题。',
--     0.7,
--     2048,
--     true
-- );

-- 7. 验证表结构
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'ai_agents' 
-- ORDER BY ordinal_position;