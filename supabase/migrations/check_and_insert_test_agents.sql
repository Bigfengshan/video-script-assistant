-- 检查并插入测试AI员工数据

-- 首先检查当前AI员工数据
SELECT 
    'Current AI Agents' as info,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM ai_agents;

-- 显示现有的AI员工
SELECT 
    id,
    name,
    integration_type,
    is_active,
    created_at
FROM ai_agents
ORDER BY created_at;

-- 如果没有AI员工数据，插入测试数据
INSERT INTO ai_agents (
    name, 
    description, 
    integration_type, 
    chatbot_url, 
    deepseek_api_key,
    deepseek_model,
    system_prompt,
    temperature,
    max_tokens,
    required_plan,
    is_active
) 
SELECT 
    '短视频文案助手',
    '专业的短视频文案创作AI助手，帮助用户创作吸引人的短视频文案',
    'iframe',
    'https://udify.app/chatbot/demo-chatbot-url',
    NULL,
    'deepseek-chat',
    '你是一个专业的短视频文案创作助手，擅长创作吸引人的短视频文案。',
    0.7,
    2048,
    'free',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agents WHERE name = '短视频文案助手'
);

INSERT INTO ai_agents (
    name, 
    description, 
    integration_type, 
    deepseek_api_key,
    deepseek_model,
    system_prompt,
    temperature,
    max_tokens,
    required_plan,
    is_active
) 
SELECT 
    'DeepSeek助手',
    '基于DeepSeek API的智能对话助手',
    'deepseek',
    'sk-test-deepseek-key',
    'deepseek-chat',
    '你是一个智能助手，可以帮助用户解答各种问题。',
    0.8,
    4096,
    'professional',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agents WHERE name = 'DeepSeek助手'
);

INSERT INTO ai_agents (
    name, 
    description, 
    integration_type, 
    dify_api_endpoint,
    api_key,
    system_prompt,
    temperature,
    max_tokens,
    required_plan,
    is_active
) 
SELECT 
    'Dify API助手',
    '基于Dify API的智能对话助手',
    'api',
    'https://api.dify.ai/v1',
    'app-test-api-key',
    '你是一个基于Dify的智能助手。',
    0.7,
    2048,
    'team',
    true
WHERE NOT EXISTS (
    SELECT 1 FROM ai_agents WHERE name = 'Dify API助手'
);

-- 显示插入后的AI员工数据
SELECT 
    'After Insert - AI Agents' as info,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
FROM ai_agents;

SELECT 
    id,
    name,
    integration_type,
    is_active,
    created_at
FROM ai_agents
ORDER BY created_at;