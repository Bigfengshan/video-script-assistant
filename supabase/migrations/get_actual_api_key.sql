-- 查询实际的API密钥（用于测试）
SELECT 
  name,
  dify_api_endpoint,
  CASE 
    WHEN api_key IS NOT NULL AND api_key != '' THEN 
      CONCAT(LEFT(api_key, 10), '...', RIGHT(api_key, 4), ' (长度: ', LENGTH(api_key), ')')
    ELSE '未配置'
  END as api_key_info,
  api_key as full_api_key,
  is_active,
  created_at
FROM ai_agents 
WHERE is_active = true
ORDER BY created_at DESC;