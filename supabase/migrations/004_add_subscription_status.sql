-- 添加订阅状态列
-- 修复管理后台用户列表API中缺少subscriptions.status列的问题

-- 添加status列到subscriptions表
ALTER TABLE subscriptions 
ADD COLUMN status VARCHAR(20) DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'expired', 'cancelled'));

-- 更新现有记录的状态
-- 根据expires_at字段设置状态
UPDATE subscriptions 
SET status = CASE 
    WHEN expires_at IS NULL THEN 'active'
    WHEN expires_at > NOW() THEN 'active'
    ELSE 'expired'
END;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status);