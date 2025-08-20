-- 修复API类型AI员工的Dify API端点配置
-- 根据用户提供的文档，基础URL应该是 http://3492202eycu0.vicp.fun/v1

-- 更新API端点为正确的基础URL
UPDATE ai_agents 
SET dify_api_endpoint = 'http://3492202eycu0.vicp.fun/v1'
WHERE integration_type = 'api';

-- 验证更新结果
SELECT 
    id,
    name,
    integration_type,
    dify_api_endpoint,
    CASE 
        WHEN api_key IS NOT NULL THEN CONCAT('已配置 (长度: ', LENGTH(api_key), ')')
        ELSE '未配置'
    END as api_key_status
FROM ai_agents 
WHERE integration_type = 'api';