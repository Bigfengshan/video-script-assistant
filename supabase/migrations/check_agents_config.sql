-- 查询AI代理的API配置
SELECT 
  name,
  dify_api_endpoint,
  CASE 
    WHEN api_key IS NOT NULL AND api_key != '' THEN 'configured' 
    ELSE 'not configured' 
  END as api_key_status,
  is_active
FROM ai_agents
ORDER BY name;