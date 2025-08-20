-- 初始化AI员工数据
INSERT INTO ai_agents (name, description, avatar_url, dify_api_endpoint, api_key, required_plan) VALUES
('人设定位师', '帮助用户分析自身优势，明确账号风格和目标受众，搭建独特的IP人设', '/avatars/persona-designer.png', 'https://api.dify.ai/v1/workflows/run', 'dify-api-key-1', 'free'),
('选题策划师', '结合热点趋势和账号定位，为用户提供源源不断的爆款选题灵感', '/avatars/topic-planner.png', 'https://api.dify.ai/v1/workflows/run', 'dify-api-key-2', 'free'),
('金牌文案', '专注于撰写高转化率、高完播率的短视频脚本和口播文案', '/avatars/copywriter.png', 'https://api.dify.ai/v1/workflows/run', 'dify-api-key-3', 'professional'),
('拍摄总监', '根据文案内容，提供分镜设计、拍摄手法、灯光布局等专业建议', '/avatars/director.png', 'https://api.dify.ai/v1/workflows/run', 'dify-api-key-4', 'professional'),
('剪辑助理', '提供剪辑节奏、BGM选择、花字特效等后期制作的优化建议', '/avatars/editor.png', 'https://api.dify.ai/v1/workflows/run', 'dify-api-key-5', 'professional'),
('发布优化师', '辅助用户撰写吸引人的标题、标签，并建议最佳发布时间', '/avatars/publisher.png', 'https://api.dify.ai/v1/workflows/run', 'dify-api-key-6', 'professional');