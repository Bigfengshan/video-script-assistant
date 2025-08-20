-- 首先修改约束，支持deepseek类型
ALTER TABLE ai_agents 
DROP CONSTRAINT IF EXISTS check_integration_fields;

ALTER TABLE ai_agents 
ADD CONSTRAINT check_integration_fields 
CHECK (
  (integration_type = 'api' AND dify_api_endpoint IS NOT NULL AND api_key IS NOT NULL) OR
  (integration_type = 'iframe' AND chatbot_url IS NOT NULL) OR
  (integration_type = 'deepseek' AND deepseek_api_key IS NOT NULL)
);

-- 插入测试AI员工数据
INSERT INTO ai_agents (
  name,
  description,
  avatar_url,
  required_plan,
  is_active,
  integration_type,
  deepseek_api_key,
  system_prompt,
  temperature,
  max_tokens
) VALUES 
(
  '短视频文案助手',
  '专业的短视频文案创作助手，帮助您创作吸引人的短视频内容',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20video%20content%20creator%20avatar%20modern%20design&image_size=square',
  'free',
  true,
  'deepseek',
  'sk-test-key-1',
  '你是一个专业的短视频文案创作助手。你的任务是帮助用户创作吸引人、有趣且符合平台特点的短视频文案。请根据用户的需求，提供创意、有趣、能够引起观众共鸣的文案内容。',
  0.8,
  2048
),
(
  '营销策划专家',
  '专业的营销策划助手，提供全方位的营销策略和创意方案',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=marketing%20strategy%20expert%20professional%20avatar%20business%20style&image_size=square',
  'professional',
  true,
  'deepseek',
  'sk-test-key-2',
  '你是一个专业的营销策划专家。你擅长分析市场趋势，制定营销策略，创造有影响力的营销活动。请根据用户的产品或服务，提供专业的营销建议和创意方案。',
  0.7,
  2048
),
(
  '数据分析师',
  '专业的数据分析助手，帮助您分析数据并提供洞察',
  'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=data%20analyst%20professional%20avatar%20charts%20graphs%20modern&image_size=square',
  'team',
  true,
  'deepseek',
  'sk-test-key-3',
  '你是一个专业的数据分析师。你擅长数据处理、统计分析、数据可视化和商业洞察。请帮助用户分析数据，发现趋势和模式，并提供有价值的商业建议。',
  0.6,
  2048
);

-- 为ai_agents表设置权限
GRANT SELECT ON ai_agents TO anon;
GRANT ALL PRIVILEGES ON ai_agents TO authenticated;