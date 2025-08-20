-- 查询AI代理的API配置并显示结果
SELECT 
    'API配置检查结果:' as info;

SELECT 
    name as "代理名称",
    dify_api_endpoint as "API端点",
    CASE 
        WHEN api_key IS NOT NULL AND api_key != '' THEN CONCAT('已配置 (长度: ', LENGTH(api_key), ')')
        ELSE '未配置'
    END as "API密钥状态",
    CASE 
        WHEN is_active THEN '激活'
        ELSE '未激活'
    END as "状态",
    created_at as "创建时间"
FROM ai_agents 
ORDER BY created_at DESC;