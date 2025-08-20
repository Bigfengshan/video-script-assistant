# 短视频创作AI助手

一个基于React + TypeScript + Vite构建的智能短视频创作平台，集成了用户认证、AI工作台、订阅付费等功能。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS + Ant Design
- **后端**: Node.js + Express + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **邮件服务**: 腾讯云SES
- **认证**: JWT + Supabase Auth

## 功能特性

- 🔐 用户认证系统（邮箱验证码注册/登录）
- 🤖 AI工作台（智能对话、多轮会话）
- 💳 订阅付费系统（三种套餐）
- 👤 个人中心（账户管理、订阅状态）
- 🛠️ 管理后台（用户管理、数据看板）
- 📱 响应式设计（移动端适配）

## 环境配置

### 1. 环境变量设置

复制 `.env.example` 到 `.env` 并配置以下变量：

```bash
# Supabase Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-key

# API Configuration
PORT=3001

# Tencent Cloud SES Configuration
TENCENT_SECRET_ID=your-secret-id
TENCENT_SECRET_KEY=your-secret-key
TENCENT_REGION=ap-beijing
TENCENT_SES_TEMPLATE_ID=your-template-id
TENCENT_FROM_EMAIL=system@noreply.bigfan007.cn
TENCENT_FROM_NAME=短视频创作AI助手
```

### 2. 腾讯云SES二级域名配置

为避免与企业邮箱产生DNS记录冲突，建议使用二级域名配置腾讯云SES：

#### 2.1 创建发信域名
1. 登录腾讯云控制台，进入邮件推送服务
2. 选择「发信域名」→「新建」
3. 输入二级域名：`noreply.bigfan007.cn`

#### 2.2 DNS记录配置
在您的DNS服务商（如腾讯云DNS）中添加以下记录：

```bash
# MX记录
noreply.bigfan007.cn    MX    10    mx.exmail.qq.com

# SPF记录
noreply.bigfan007.cn    TXT   "v=spf1 include:spf.exmail.qq.com ~all"

# DKIM记录（腾讯云SES提供）
ses._domainkey.noreply.bigfan007.cn    TXT    "腾讯云提供的DKIM值"

# DMARC记录（可选）
_dmarc.noreply.bigfan007.cn    TXT    "v=DMARC1; p=quarantine; rua=mailto:admin@bigfan007.cn"
```

#### 2.3 验证配置
1. 在腾讯云SES控制台点击「验证」
2. 等待DNS记录生效（通常5-30分钟）
3. 验证成功后即可发送邮件

#### 2.4 测试DNS配置
```bash
# 检查MX记录
nslookup -type=MX noreply.bigfan007.cn

# 检查SPF记录
nslookup -type=TXT noreply.bigfan007.cn

# 检查DKIM记录
nslookup -type=TXT ses._domainkey.noreply.bigfan007.cn
```

## 安装和运行

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动后端API服务器
npm run server

# 构建生产版本
npm run build
```

## 项目结构

```
├── src/                 # 前端源码
│   ├── components/      # 组件
│   ├── pages/          # 页面
│   ├── hooks/          # 自定义Hook
│   └── utils/          # 工具函数
├── api/                # 后端API
│   ├── routes/         # 路由
│   ├── services/       # 服务
│   └── middleware/     # 中间件
├── supabase/           # 数据库迁移
└── migrations/         # SQL迁移文件
```
