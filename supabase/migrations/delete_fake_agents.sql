-- 删除假的AI员工，只保留金牌文案（可乐助手）
-- 首先查看当前所有AI员工
SELECT id, name, description FROM ai_agents;

-- 删除除了金牌文案之外的所有AI员工
DELETE FROM ai_agents 
WHERE name != '金牌文案';

-- 验证删除结果
SELECT id, name, description FROM ai_agents;