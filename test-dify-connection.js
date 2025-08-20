import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns';
import net from 'net';
import https from 'https';
import http from 'http';

// 加载环境变量
dotenv.config();

const execAsync = promisify(exec);
const dnsLookup = promisify(dns.lookup);

// Supabase配置
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
const supabase = createClient(supabaseUrl, supabaseKey);

class DifyConnectionTester {
  constructor() {
    this.results = {
      database: null,
      dns: null,
      ping: null,
      curl: null,
      axios: null,
      ssl: null,
      recommendations: []
    };
  }

  async testDatabaseConnection() {
    console.log('\n🔍 测试数据库连接...');
    try {
      const { data, error } = await supabase
        .from('ai_agents')
        .select('name, dify_api_endpoint, api_key, is_active')
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) {
        this.results.database = { success: false, error: error.message };
        console.log('❌ 数据库连接失败:', error.message);
        return null;
      }

      this.results.database = { success: true, data };
      console.log('✅ 数据库连接成功');
      console.log('📋 AI员工配置:', {
        name: data.name,
        endpoint: data.dify_api_endpoint,
        hasApiKey: !!data.api_key,
        keyLength: data.api_key ? data.api_key.length : 0
      });
      
      return data;
    } catch (error) {
      this.results.database = { success: false, error: error.message };
      console.log('❌ 数据库连接异常:', error.message);
      return null;
    }
  }

  async testDNSResolution(hostname) {
    console.log('\n🌐 测试DNS解析...');
    try {
      const result = await dnsLookup(hostname);
      this.results.dns = { success: true, ip: result.address, family: result.family };
      console.log(`✅ DNS解析成功: ${hostname} -> ${result.address} (IPv${result.family})`);
      return result;
    } catch (error) {
      this.results.dns = { success: false, error: error.message };
      console.log(`❌ DNS解析失败: ${error.message}`);
      this.results.recommendations.push('检查域名是否正确，或尝试使用公共DNS服务器（如8.8.8.8）');
      return null;
    }
  }

  async testPing(hostname) {
    console.log('\n🏓 测试网络连通性（ping）...');
    try {
      const { stdout } = await execAsync(`ping -c 4 ${hostname}`);
      const lines = stdout.split('\n');
      const statsLine = lines.find(line => line.includes('packets transmitted'));
      const timeLine = lines.find(line => line.includes('min/avg/max'));
      
      this.results.ping = { 
        success: true, 
        stats: statsLine,
        timing: timeLine
      };
      console.log('✅ Ping测试成功');
      console.log('📊 统计信息:', statsLine);
      if (timeLine) console.log('⏱️  延迟信息:', timeLine);
    } catch (error) {
      this.results.ping = { success: false, error: error.message };
      console.log('❌ Ping测试失败:', error.message);
      this.results.recommendations.push('网络连接可能存在问题，检查防火墙设置或网络配置');
    }
  }

  async testCurl(url, apiKey) {
    console.log('\n🌍 测试HTTP连接（curl）...');
    try {
      const curlCommand = `curl -X POST "${url}/chat-messages" \
        -H "Authorization: Bearer ${apiKey}" \
        -H "Content-Type: application/json" \
        -d '{"inputs":{},"query":"test","response_mode":"blocking","user":"test"}' \
        --connect-timeout 30 \
        --max-time 60 \
        -v`;
      
      const { stdout, stderr } = await execAsync(curlCommand);
      
      this.results.curl = { 
        success: true, 
        stdout: stdout.substring(0, 500),
        stderr: stderr.substring(0, 500)
      };
      console.log('✅ Curl测试完成');
      console.log('📤 响应预览:', stdout.substring(0, 200));
      if (stderr) console.log('🔍 详细信息:', stderr.substring(0, 200));
    } catch (error) {
      this.results.curl = { success: false, error: error.message };
      console.log('❌ Curl测试失败:', error.message);
      this.results.recommendations.push('HTTP连接失败，可能是端口被阻塞或服务不可用');
    }
  }

  async testAxiosConnection(url, apiKey) {
    console.log('\n⚡ 测试Axios连接...');
    
    const axiosInstance = axios.create({
      timeout: 60000,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DifyConnectionTester/1.0'
      },
      httpAgent: new http.Agent({
        keepAlive: true,
        timeout: 60000,
        keepAliveMsecs: 30000
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        timeout: 60000,
        keepAliveMsecs: 30000,
        rejectUnauthorized: false // 临时忽略SSL证书问题
      })
    });

    try {
      const startTime = Date.now();
      const response = await axiosInstance.post(`${url}/chat-messages`, {
        inputs: {},
        query: 'connection test',
        response_mode: 'blocking',
        user: 'test-user'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.results.axios = {
        success: true,
        status: response.status,
        duration: duration,
        headers: Object.keys(response.headers),
        dataPreview: JSON.stringify(response.data).substring(0, 200)
      };
      
      console.log(`✅ Axios连接成功 (${duration}ms)`);
      console.log('📊 响应状态:', response.status);
      console.log('📋 响应头:', Object.keys(response.headers).join(', '));
      console.log('📄 响应预览:', JSON.stringify(response.data).substring(0, 100));
      
    } catch (error) {
      const duration = Date.now() - Date.now();
      this.results.axios = {
        success: false,
        error: error.message,
        code: error.code,
        status: error.response?.status,
        duration: duration
      };
      
      console.log('❌ Axios连接失败:', error.message);
      if (error.code) console.log('🔍 错误代码:', error.code);
      if (error.response) {
        console.log('📊 响应状态:', error.response.status);
        console.log('📄 响应数据:', JSON.stringify(error.response.data).substring(0, 200));
      }
      
      // 根据错误类型给出建议
      if (error.code === 'ECONNRESET') {
        this.results.recommendations.push('连接被重置，可能是服务器负载过高或网络不稳定');
      } else if (error.code === 'ETIMEDOUT') {
        this.results.recommendations.push('连接超时，尝试增加超时时间或检查网络延迟');
      } else if (error.code === 'ENOTFOUND') {
        this.results.recommendations.push('域名解析失败，检查域名是否正确');
      } else if (error.code === 'ECONNREFUSED') {
        this.results.recommendations.push('连接被拒绝，检查端口是否开放或服务是否运行');
      }
    }
  }

  async testSSLCertificate(hostname, port = 443) {
    console.log('\n🔒 测试SSL证书...');
    
    return new Promise((resolve) => {
      const socket = new net.Socket();
      const startTime = Date.now();
      
      socket.setTimeout(10000);
      
      socket.connect(port, hostname, () => {
        const duration = Date.now() - startTime;
        this.results.ssl = {
          success: true,
          port: port,
          duration: duration,
          message: 'TCP连接成功'
        };
        console.log(`✅ SSL端口连接成功 (${duration}ms)`);
        socket.destroy();
        resolve();
      });
      
      socket.on('error', (error) => {
        this.results.ssl = {
          success: false,
          error: error.message,
          code: error.code
        };
        console.log('❌ SSL连接失败:', error.message);
        if (error.code === 'ECONNREFUSED') {
          this.results.recommendations.push('SSL端口被拒绝，检查是否使用了正确的端口');
        }
        resolve();
      });
      
      socket.on('timeout', () => {
        this.results.ssl = {
          success: false,
          error: 'Connection timeout'
        };
        console.log('❌ SSL连接超时');
        this.results.recommendations.push('SSL连接超时，可能是防火墙阻塞或服务不可用');
        socket.destroy();
        resolve();
      });
    });
  }

  generateReport() {
    console.log('\n📋 ===== 诊断报告 =====');
    console.log('\n🔍 测试结果汇总:');
    console.log('- 数据库连接:', this.results.database?.success ? '✅ 成功' : '❌ 失败');
    console.log('- DNS解析:', this.results.dns?.success ? '✅ 成功' : '❌ 失败');
    console.log('- Ping测试:', this.results.ping?.success ? '✅ 成功' : '❌ 失败');
    console.log('- Curl测试:', this.results.curl?.success ? '✅ 成功' : '❌ 失败');
    console.log('- Axios连接:', this.results.axios?.success ? '✅ 成功' : '❌ 失败');
    console.log('- SSL测试:', this.results.ssl?.success ? '✅ 成功' : '❌ 失败');
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 修复建议:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n📊 详细结果:');
    console.log(JSON.stringify(this.results, null, 2));
  }

  async runAllTests() {
    console.log('🚀 开始Dify API连接诊断...');
    
    // 1. 测试数据库连接并获取配置
    const config = await this.testDatabaseConnection();
    if (!config) {
      console.log('\n❌ 无法获取API配置，测试终止');
      return;
    }
    
    // 解析URL
    let hostname, port;
    try {
      const url = new URL(config.dify_api_endpoint);
      hostname = url.hostname;
      port = url.port || (url.protocol === 'https:' ? 443 : 80);
    } catch (error) {
      console.log('❌ API端点URL格式错误:', error.message);
      this.results.recommendations.push('检查API端点URL格式是否正确');
      return;
    }
    
    // 2. DNS解析测试
    await this.testDNSResolution(hostname);
    
    // 3. 网络连通性测试
    await this.testPing(hostname);
    
    // 4. SSL证书测试（如果是HTTPS）
    if (config.dify_api_endpoint.startsWith('https')) {
      await this.testSSLCertificate(hostname, port);
    }
    
    // 5. Curl测试
    await this.testCurl(config.dify_api_endpoint, config.api_key);
    
    // 6. Axios连接测试
    await this.testAxiosConnection(config.dify_api_endpoint, config.api_key);
    
    // 7. 生成报告
    this.generateReport();
  }
}

// 运行测试
const tester = new DifyConnectionTester();
tester.runAllTests().catch(error => {
  console.error('❌ 测试过程中发生错误:', error);
});