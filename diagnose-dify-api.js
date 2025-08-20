#!/usr/bin/env node

/**
 * Dify API 网络诊断工具
 * 用于诊断和排查 Dify API 连接问题
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import dns from 'dns';
import { promisify } from 'util';
import { URL } from 'url';
import chalk from 'chalk';
import ora from 'ora';

// 加载环境变量
dotenv.config();

// 异步化 DNS 查询
const dnsLookup = promisify(dns.lookup);
const dnsResolve = promisify(dns.resolve);

// Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

class DifyApiDiagnostic {
  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.results = {
      database: null,
      dns: null,
      connection: null,
      api: null,
      performance: null
    };
  }

  // 打印标题
  printHeader() {
    console.log(chalk.cyan.bold('\n🔍 Dify API 网络诊断工具'));
    console.log(chalk.gray('=' * 50));
    console.log();
  }

  // 打印结果摘要
  printSummary() {
    console.log(chalk.cyan.bold('\n📊 诊断结果摘要'));
    console.log(chalk.gray('=' * 30));
    
    const results = [
      { name: '数据库连接', status: this.results.database?.success },
      { name: 'DNS 解析', status: this.results.dns?.success },
      { name: '网络连接', status: this.results.connection?.success },
      { name: 'API 调用', status: this.results.api?.success },
      { name: '性能测试', status: this.results.performance?.success }
    ];

    results.forEach(result => {
      const icon = result.status ? '✅' : '❌';
      const color = result.status ? chalk.green : chalk.red;
      console.log(`${icon} ${color(result.name)}`);
    });

    // 提供修复建议
    this.printRecommendations();
  }

  // 提供修复建议
  printRecommendations() {
    console.log(chalk.yellow.bold('\n💡 修复建议'));
    console.log(chalk.gray('=' * 20));

    const recommendations = [];

    if (!this.results.database?.success) {
      recommendations.push('• 检查 Supabase 配置和网络连接');
    }

    if (!this.results.dns?.success) {
      recommendations.push('• 检查 DNS 设置，尝试使用公共 DNS (8.8.8.8, 1.1.1.1)');
      recommendations.push('• 检查防火墙和网络代理设置');
    }

    if (!this.results.connection?.success) {
      recommendations.push('• 检查目标服务器是否可达');
      recommendations.push('• 验证 API 端点 URL 是否正确');
      recommendations.push('• 检查是否需要 VPN 或代理');
    }

    if (!this.results.api?.success) {
      recommendations.push('• 验证 API 密钥是否正确和有效');
      recommendations.push('• 检查 API 端点格式是否符合 Dify 规范');
      recommendations.push('• 确认 Dify 服务状态是否正常');
    }

    if (!this.results.performance?.success) {
      recommendations.push('• 网络延迟过高，考虑使用更稳定的网络');
      recommendations.push('• 增加请求超时时间');
    }

    if (recommendations.length === 0) {
      console.log(chalk.green('✅ 所有测试通过，API 连接正常！'));
    } else {
      recommendations.forEach(rec => console.log(chalk.yellow(rec)));
    }
  }

  // 1. 测试数据库连接和获取 AI 员工配置
  async testDatabaseConnection() {
    const spinner = ora('正在测试数据库连接...').start();
    
    try {
      const { data: agents, error } = await this.supabase
        .from('ai_agents')
        .select('name, dify_api_endpoint, api_key, is_active')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!agents || agents.length === 0) {
        throw new Error('未找到活跃的 AI 员工配置');
      }

      this.results.database = {
        success: true,
        agents: agents,
        message: `成功获取 ${agents.length} 个 AI 员工配置`
      };

      spinner.succeed(chalk.green(`✅ 数据库连接成功 - ${this.results.database.message}`));
      
      // 显示获取到的配置
      console.log(chalk.blue('\n📋 AI 员工配置:'));
      agents.forEach((agent, index) => {
        console.log(chalk.gray(`  ${index + 1}. ${agent.name}`));
        console.log(chalk.gray(`     端点: ${agent.dify_api_endpoint}`));
        console.log(chalk.gray(`     密钥: ${agent.api_key ? agent.api_key.substring(0, 10) + '...' : '未配置'}`));
      });

      return agents[0]; // 返回第一个配置用于后续测试
    } catch (error) {
      this.results.database = {
        success: false,
        error: error.message
      };
      spinner.fail(chalk.red(`❌ 数据库连接失败: ${error.message}`));
      return null;
    }
  }

  // 2. 测试 DNS 解析
  async testDnsResolution(apiEndpoint) {
    const spinner = ora('正在测试 DNS 解析...').start();
    
    try {
      const url = new URL(apiEndpoint);
      const hostname = url.hostname;
      
      // DNS 查询
      const lookupResult = await dnsLookup(hostname);
      const resolveResult = await dnsResolve(hostname, 'A');
      
      this.results.dns = {
        success: true,
        hostname: hostname,
        ip: lookupResult.address,
        addresses: resolveResult,
        family: lookupResult.family
      };

      spinner.succeed(chalk.green(`✅ DNS 解析成功`));
      console.log(chalk.blue(`   主机名: ${hostname}`));
      console.log(chalk.blue(`   IP 地址: ${lookupResult.address}`));
      console.log(chalk.blue(`   地址族: IPv${lookupResult.family}`));
      
    } catch (error) {
      this.results.dns = {
        success: false,
        error: error.message
      };
      spinner.fail(chalk.red(`❌ DNS 解析失败: ${error.message}`));
    }
  }

  // 3. 测试基本网络连接
  async testNetworkConnection(apiEndpoint) {
    const spinner = ora('正在测试网络连接...').start();
    
    try {
      const startTime = Date.now();
      
      // 简单的 HTTP HEAD 请求测试连接
      const response = await axios.head(apiEndpoint, {
        timeout: 10000,
        validateStatus: () => true // 接受所有状态码
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.results.connection = {
        success: true,
        statusCode: response.status,
        responseTime: responseTime,
        headers: response.headers
      };

      spinner.succeed(chalk.green(`✅ 网络连接成功`));
      console.log(chalk.blue(`   状态码: ${response.status}`));
      console.log(chalk.blue(`   响应时间: ${responseTime}ms`));
      
    } catch (error) {
      this.results.connection = {
        success: false,
        error: error.message,
        code: error.code
      };
      
      let errorMsg = `网络连接失败: ${error.message}`;
      if (error.code === 'ENOTFOUND') {
        errorMsg += ' (域名无法解析)';
      } else if (error.code === 'ECONNREFUSED') {
        errorMsg += ' (连接被拒绝)';
      } else if (error.code === 'ETIMEDOUT') {
        errorMsg += ' (连接超时)';
      }
      
      spinner.fail(chalk.red(`❌ ${errorMsg}`));
    }
  }

  // 4. 测试完整的 API 调用
  async testApiCall(agent) {
    const spinner = ora('正在测试 Dify API 调用...').start();
    
    try {
      const startTime = Date.now();
      
      // 构造测试请求
      const requestData = {
        inputs: {},
        query: "你好，这是一个连接测试",
        response_mode: "blocking",
        conversation_id: "",
        user: "test-user"
      };

      const response = await axios.post(
        `${agent.dify_api_endpoint}/chat-messages`,
        requestData,
        {
          headers: {
            'Authorization': `Bearer ${agent.api_key}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      this.results.api = {
        success: true,
        statusCode: response.status,
        responseTime: responseTime,
        data: response.data
      };

      spinner.succeed(chalk.green(`✅ API 调用成功`));
      console.log(chalk.blue(`   状态码: ${response.status}`));
      console.log(chalk.blue(`   响应时间: ${responseTime}ms`));
      console.log(chalk.blue(`   响应数据: ${JSON.stringify(response.data).substring(0, 100)}...`));
      
    } catch (error) {
      this.results.api = {
        success: false,
        error: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data
      };
      
      let errorMsg = `API 调用失败: ${error.message}`;
      if (error.response) {
        errorMsg += ` (HTTP ${error.response.status})`;
        if (error.response.data) {
          errorMsg += ` - ${JSON.stringify(error.response.data)}`;
        }
      }
      
      spinner.fail(chalk.red(`❌ ${errorMsg}`));
    }
  }

  // 5. 性能测试
  async testPerformance(apiEndpoint) {
    const spinner = ora('正在进行性能测试...').start();
    
    try {
      const testCount = 3;
      const results = [];
      
      for (let i = 0; i < testCount; i++) {
        const startTime = Date.now();
        
        try {
          await axios.head(apiEndpoint, { timeout: 5000 });
          const endTime = Date.now();
          results.push(endTime - startTime);
        } catch (error) {
          results.push(-1); // 失败标记
        }
      }
      
      const successfulResults = results.filter(r => r > 0);
      const avgResponseTime = successfulResults.length > 0 
        ? successfulResults.reduce((a, b) => a + b, 0) / successfulResults.length 
        : -1;
      
      const successRate = (successfulResults.length / testCount) * 100;
      
      this.results.performance = {
        success: successRate >= 80 && avgResponseTime < 5000,
        avgResponseTime: avgResponseTime,
        successRate: successRate,
        results: results
      };

      if (this.results.performance.success) {
        spinner.succeed(chalk.green(`✅ 性能测试通过`));
      } else {
        spinner.warn(chalk.yellow(`⚠️  性能测试警告`));
      }
      
      console.log(chalk.blue(`   平均响应时间: ${avgResponseTime > 0 ? avgResponseTime.toFixed(2) + 'ms' : 'N/A'}`));
      console.log(chalk.blue(`   成功率: ${successRate.toFixed(1)}%`));
      
    } catch (error) {
      this.results.performance = {
        success: false,
        error: error.message
      };
      spinner.fail(chalk.red(`❌ 性能测试失败: ${error.message}`));
    }
  }

  // 主诊断流程
  async diagnose() {
    this.printHeader();
    
    // 1. 测试数据库连接
    const agent = await this.testDatabaseConnection();
    if (!agent) {
      console.log(chalk.red('\n❌ 无法获取 AI 员工配置，诊断终止'));
      return;
    }
    
    console.log();
    
    // 2. 测试 DNS 解析
    await this.testDnsResolution(agent.dify_api_endpoint);
    console.log();
    
    // 3. 测试网络连接
    await this.testNetworkConnection(agent.dify_api_endpoint);
    console.log();
    
    // 4. 测试 API 调用
    await this.testApiCall(agent);
    console.log();
    
    // 5. 性能测试
    await this.testPerformance(agent.dify_api_endpoint);
    
    // 6. 打印摘要和建议
    this.printSummary();
  }
}

// 主函数
async function main() {
  try {
    const diagnostic = new DifyApiDiagnostic();
    await diagnostic.diagnose();
  } catch (error) {
    console.error(chalk.red(`\n❌ 诊断过程中发生错误: ${error.message}`));
    process.exit(1);
  }
}

// 直接运行主函数
main().catch(error => {
  console.error(chalk.red(`\n❌ 诊断过程中发生错误: ${error.message}`));
  process.exit(1);
});

export default DifyApiDiagnostic;