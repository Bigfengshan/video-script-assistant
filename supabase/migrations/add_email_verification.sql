-- 添加邮箱验证码表
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 为邮箱字段创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email ON email_verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_expires_at ON email_verification_codes(expires_at);

-- 添加用户表的邮箱验证状态字段（如果用户表存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    -- 检查字段是否已存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
      ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified_at') THEN
      ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMP WITH TIME ZONE;
    END IF;
  END IF;
END $$;

-- 启用RLS（行级安全）
ALTER TABLE email_verification_codes ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can only access their own verification codes" ON email_verification_codes
  FOR ALL USING (auth.email() = email);

-- 允许匿名用户插入验证码（注册时需要）
CREATE POLICY "Allow anonymous insert for registration" ON email_verification_codes
  FOR INSERT WITH CHECK (true);

-- 授权给anon和authenticated角色
GRANT SELECT, INSERT, UPDATE ON email_verification_codes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON email_verification_codes TO authenticated;

-- 创建清理过期验证码的函数
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM email_verification_codes 
  WHERE expires_at < NOW() OR used = TRUE;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_verification_codes_updated_at
  BEFORE UPDATE ON email_verification_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();