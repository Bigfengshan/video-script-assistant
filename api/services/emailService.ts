import { createClient } from '@supabase/supabase-js';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';

const SesClient = tencentcloud.ses.v20201002.Client;

// Supabase客户端
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 腾讯云SES客户端配置
const clientConfig = {
  credential: {
    secretId: process.env.TENCENT_SECRET_ID!,
    secretKey: process.env.TENCENT_SECRET_KEY!,
  },
  region: process.env.TENCENT_REGION || 'ap-beijing',
  profile: {
    httpProfile: {
      endpoint: 'ses.tencentcloudapi.com',
    },
  },
};

const sesClient = new SesClient(clientConfig);

/**
 * 生成6位数字验证码
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * 保存验证码到数据库
 */
export async function saveVerificationCode(email: string, code: string): Promise<boolean> {
  try {
    // 设置5分钟后过期
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    
    // 先删除该邮箱的旧验证码
    await supabase
      .from('email_verification_codes')
      .delete()
      .eq('email', email);
    
    // 插入新验证码
    const { error } = await supabase
      .from('email_verification_codes')
      .insert({
        email,
        code,
        expires_at: expiresAt.toISOString(),
        used: false
      });
    
    if (error) {
      console.error('保存验证码失败:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('保存验证码异常:', error);
    return false;
  }
}

/**
 * 验证验证码
 */
export async function verifyCode(email: string, code: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('email_verification_codes')
      .select('*')
      .eq('email', email)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();
    
    if (error || !data) {
      return false;
    }
    
    // 标记验证码为已使用
    await supabase
      .from('email_verification_codes')
      .update({ used: true })
      .eq('id', data.id);
    
    return true;
  } catch (error) {
    console.error('验证码验证异常:', error);
    return false;
  }
}

/**
 * 使用腾讯云SES发送验证码邮件
 */
export async function sendVerificationEmail(email: string, code: string): Promise<boolean> {
  try {
    const params = {
      Source: process.env.TENCENT_FROM_EMAIL!,
      Subject: '邮箱验证码 - 短视频创作AI助手',
      Template: {
        TemplateID: parseInt(process.env.TENCENT_SES_TEMPLATE_ID!),
        TemplateData: JSON.stringify({
          code: code,
          name: '用户'
        })
      },
      Destination: [email],
      FromEmailAddress: process.env.TENCENT_FROM_EMAIL!,
      FromEmailAddressAlias: process.env.TENCENT_FROM_NAME || '短视频创作AI助手'
    };
    
    const response = await sesClient.SendEmail(params);
    
    if (response.MessageId) {
      console.log('邮件发送成功:', response.MessageId);
      return true;
    } else {
      console.error('邮件发送失败:', response);
      return false;
    }
  } catch (error) {
    console.error('发送邮件异常:', error);
    return false;
  }
}

/**
 * 发送验证码（生成+保存+发送）
 */
export async function sendVerificationCode(email: string): Promise<{ success: boolean; message: string }> {
  try {
    // 生成验证码
    const code = generateVerificationCode();
    
    // 保存到数据库
    const saved = await saveVerificationCode(email, code);
    if (!saved) {
      return { success: false, message: '验证码保存失败' };
    }
    
    // 发送邮件
    const sent = await sendVerificationEmail(email, code);
    if (!sent) {
      return { success: false, message: '邮件发送失败' };
    }
    
    return { success: true, message: '验证码发送成功' };
  } catch (error) {
    console.error('发送验证码异常:', error);
    return { success: false, message: '发送验证码失败' };
  }
}

/**
 * 清理过期的验证码
 */
export async function cleanupExpiredCodes(): Promise<void> {
  try {
    await supabase
      .from('email_verification_codes')
      .delete()
      .or('expires_at.lt.' + new Date().toISOString() + ',used.eq.true');
  } catch (error) {
    console.error('清理过期验证码失败:', error);
  }
}