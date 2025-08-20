-- 添加订阅日期字段
-- 修复管理后台用户列表API中缺少subscriptions.start_date和end_date列的问题

-- 添加start_date和end_date列到subscriptions表
ALTER TABLE subscriptions 
ADD COLUMN start_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN end_date TIMESTAMPTZ;

-- 更新现有记录的日期
-- 对于现有记录，设置start_date为created_at，end_date根据plan_type设置
UPDATE subscriptions 
SET start_date = created_at,
    end_date = CASE 
        WHEN plan_type = 'free' THEN NULL
        WHEN plan_type = 'professional' THEN created_at + INTERVAL '1 month'
        WHEN plan_type = 'team' THEN created_at + INTERVAL '1 month'
        ELSE NULL
    END
WHERE start_date IS NULL;

-- 更新status字段，基于end_date重新计算
UPDATE subscriptions 
SET status = CASE 
    WHEN plan_type = 'free' THEN 'active'
    WHEN end_date IS NULL THEN 'active'
    WHEN end_date > NOW() THEN 'active'
    ELSE 'expired'
END;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_subscriptions_dates ON subscriptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status ON subscriptions(plan_type, status);