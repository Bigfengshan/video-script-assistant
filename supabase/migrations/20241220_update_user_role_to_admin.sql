-- Update the user role to admin for testing permissions
UPDATE users 
SET role = 'admin', updated_at = now() 
WHERE email = 'admin@bigfan007.cn';

-- Grant permissions to anon and authenticated roles for users table
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Grant permissions for ai_agents table
GRANT SELECT ON ai_agents TO anon;
GRANT ALL PRIVILEGES ON ai_agents TO authenticated;

-- Grant permissions for user_agent_permissions table
GRANT SELECT ON user_agent_permissions TO anon;
GRANT ALL PRIVILEGES ON user_agent_permissions TO authenticated;

-- Grant permissions for permission_audit_logs table
GRANT SELECT ON permission_audit_logs TO anon;
GRANT ALL PRIVILEGES ON permission_audit_logs TO authenticated;