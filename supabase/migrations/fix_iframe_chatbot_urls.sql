-- 修复iframe类型AI员工的无效chatbot_url
-- 首先查看当前的iframe类型AI员工
SELECT 'Current iframe agents:' as info;
SELECT id, name, chatbot_url, is_active FROM ai_agents WHERE integration_type = 'iframe';

-- 更新无效的chatbot_url为有效的演示URL
UPDATE ai_agents 
SET chatbot_url = 'https://udify.app/chat/7QGBPawbRW2ZNvbX'
WHERE integration_type = 'iframe' 
  AND (chatbot_url IS NULL OR chatbot_url LIKE '%example.com%' OR chatbot_url = '');

-- 显示更新后的结果
SELECT 'Updated iframe agents:' as info;
SELECT id, name, chatbot_url, is_active FROM ai_agents WHERE integration_type = 'iframe';

-- 确保所有iframe类型的AI员工都是激活状态
UPDATE ai_agents 
SET is_active = true 
WHERE integration_type = 'iframe';

SELECT 'Final status:' as info;
SELECT 
  COUNT(*) as total_iframe_agents,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_agents,
  COUNT(CASE WHEN chatbot_url IS NOT NULL AND chatbot_url != '' THEN 1 END) as agents_with_url
FROM ai_agents 
WHERE integration_type = 'iframe';