-- 更新AI代理的API配置为正确的端点和密钥
-- 用户提供的正确端点: http://3492202eycu0.vicp.fun/v1

-- 首先查看当前配置
SELECT 'Before Update:' as status;
SELECT name, dify_api_endpoint, 
       CASE WHEN api_key IS NOT NULL AND api_key != '' 
            THEN CONCAT('已配置 (长度: ', LENGTH(api_key), ')') 
            ELSE '未配置' END as api_key_status
FROM ai_agents;

-- 更新所有AI代理的API端点为正确地址
UPDATE ai_agents 
SET dify_api_endpoint = 'http://3492202eycu0.vicp.fun/v1'
WHERE dify_api_endpoint != 'http://3492202eycu0.vicp.fun/v1';

-- 注意: API密钥需要用户提供实际的密钥值
-- 这里先使用占位符，用户需要手动替换为实际的API密钥
-- UPDATE ai_agents SET api_key = 'YOUR_ACTUAL_API_KEY_HERE' WHERE name = '人设定位师';

-- 查看更新后的配置
SELECT 'After Update:' as status;
SELECT name, dify_api_endpoint, 
       CASE WHEN api_key IS NOT NULL AND api_key != '' 
            THEN CONCAT('已配置 (长度: ', LENGTH(api_key), ')') 
            ELSE '未配置' END as api_key_status
FROM ai_agents;