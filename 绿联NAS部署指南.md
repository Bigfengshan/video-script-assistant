# 短视频文案助手 - 绿联NAS部署指南

本指南将帮助您将短视频文案助手项目部署到绿联NAS上，让您可以在家庭网络中运行这个AI助手应用。

## 📋 部署前准备

### 1. 硬件要求
- 绿联NAS设备（推荐4GB以上内存）
- 至少10GB可用存储空间
- 稳定的网络连接

### 2. 软件要求
- 绿联NAS系统已更新到最新版本
- Docker功能已启用
- 文件管理器可正常使用

## 🚀 第一步：准备NAS环境

### 1.1 启用Docker功能
1. 登录绿联NAS管理界面
2. 进入「应用中心」
3. 搜索并安装「Docker」应用
4. 等待安装完成后，启动Docker服务

### 1.2 创建项目文件夹
1. 打开「文件管理器」
2. 在根目录下创建新文件夹：`video-assistant`
3. 在该文件夹下创建以下子文件夹：
   - `app`（存放项目文件）
   - `data`（存放数据库文件）
   - `logs`（存放日志文件）

## 📁 第二步：上传项目文件

### 2.1 准备项目文件
在您的电脑上，将以下文件和文件夹打包：
- `src/` 文件夹
- `api/` 文件夹
- `public/` 文件夹
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `vite.config.ts`
- `tailwind.config.js`
- `postcss.config.js`
- `index.html`

### 2.2 上传到NAS
1. 使用绿联NAS的「文件管理器」
2. 进入之前创建的 `video-assistant/app` 文件夹
3. 将打包的项目文件上传到此文件夹
4. 确保所有文件都已正确上传

## 🗄️ 第三步：配置数据库

### 方案A：使用Supabase（推荐）

#### 3.1 获取Supabase配置信息
1. 登录您的Supabase账户
2. 进入项目设置页面
3. 记录以下信息：
   - Project URL
   - API Key (anon key)
   - Service Role Key

#### 3.2 创建环境变量文件
在NAS的 `video-assistant/app` 文件夹中创建 `.env` 文件：
```
SUPABASE_URL=你的supabase项目URL
SUPABASE_ANON_KEY=你的anon密钥
SUPABASE_SERVICE_ROLE_KEY=你的service_role密钥
JWT_SECRET=一个随机的32位字符串
NODE_ENV=production
```

### 方案B：使用本地SQLite数据库

#### 3.1 创建环境变量文件
在NAS的 `video-assistant/app` 文件夹中创建 `.env` 文件：
```
DATABASE_TYPE=sqlite
DATABASE_PATH=/app/data/database.sqlite
JWT_SECRET=一个随机的32位字符串
NODE_ENV=production
```

## 🐳 第四步：创建Docker配置

### 4.1 创建Dockerfile
在 `video-assistant/app` 文件夹中创建 `Dockerfile` 文件：

```dockerfile
# 使用Node.js官方镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建项目
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["npm", "start"]
```

### 4.2 创建docker-compose.yml
在 `video-assistant` 文件夹中创建 `docker-compose.yml` 文件：

```yaml
version: '3.8'

services:
  video-assistant:
    build: ./app
    container_name: video-assistant
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
    env_file:
      - ./app/.env
    restart: unless-stopped
    networks:
      - video-assistant-network

networks:
  video-assistant-network:
    driver: bridge
```

### 4.3 修改package.json
确保您的 `package.json` 文件包含启动脚本：

```json
{
  "scripts": {
    "start": "node api/server.js",
    "build": "vite build",
    "dev": "vite"
  }
}
```

## 🔧 第五步：部署应用

### 5.1 使用Docker部署
1. 在绿联NAS上打开「终端」或SSH连接
2. 进入项目目录：
   ```bash
   cd /volume1/video-assistant
   ```
3. 构建并启动容器：
   ```bash
   docker-compose up -d
   ```
4. 查看容器状态：
   ```bash
   docker-compose ps
   ```

### 5.2 检查部署状态
1. 查看容器日志：
   ```bash
   docker-compose logs -f video-assistant
   ```
2. 确认应用正常启动，没有错误信息

## 🌐 第六步：配置网络访问

### 6.1 内网访问
1. 在浏览器中输入：`http://NAS的IP地址:3000`
2. 例如：`http://192.168.1.100:3000`
3. 如果能正常访问，说明部署成功

### 6.2 配置反向代理（可选）
如果您想使用域名访问，可以配置Nginx反向代理：

1. 在绿联NAS上安装Nginx
2. 创建配置文件 `/etc/nginx/sites-available/video-assistant`：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. 启用配置并重启Nginx：
```bash
ln -s /etc/nginx/sites-available/video-assistant /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## 🔒 第七步：安全配置

### 7.1 防火墙设置
1. 在绿联NAS控制面板中找到「安全」设置
2. 开放3000端口（或您配置的其他端口）
3. 建议只允许内网访问，提高安全性

### 7.2 SSL证书配置（可选）
如果需要HTTPS访问：
1. 获取SSL证书（可使用Let's Encrypt免费证书）
2. 在Nginx配置中添加SSL设置
3. 将HTTP流量重定向到HTTPS

## 📊 第八步：监控和维护

### 8.1 查看应用状态
```bash
# 查看容器状态
docker-compose ps

# 查看实时日志
docker-compose logs -f

# 查看资源使用情况
docker stats
```

### 8.2 备份数据
定期备份以下重要文件：
- 环境变量文件 `.env`
- 数据库文件（如果使用SQLite）
- 用户上传的文件
- 配置文件

### 8.3 更新应用
当需要更新应用时：
1. 停止当前容器：`docker-compose down`
2. 更新项目文件
3. 重新构建并启动：`docker-compose up -d --build`

## ❓ 常见问题解决

### Q1: 容器启动失败
**解决方案：**
1. 检查Docker服务是否正常运行
2. 查看容器日志：`docker-compose logs`
3. 确认端口没有被占用
4. 检查环境变量配置是否正确

### Q2: 无法访问应用
**解决方案：**
1. 确认防火墙设置正确
2. 检查NAS的IP地址是否正确
3. 确认端口映射配置正确
4. 尝试在NAS本地访问：`curl http://localhost:3000`

### Q3: 数据库连接失败
**解决方案：**
1. 检查Supabase配置信息是否正确
2. 确认网络连接正常
3. 验证API密钥是否有效
4. 检查数据库权限设置

### Q4: 应用运行缓慢
**解决方案：**
1. 检查NAS硬件资源使用情况
2. 增加Docker容器的内存限制
3. 优化数据库查询
4. 考虑升级NAS硬件

### Q5: 文件上传失败
**解决方案：**
1. 检查存储空间是否充足
2. 确认文件权限设置正确
3. 检查上传文件大小限制
4. 查看应用日志获取详细错误信息

## 📞 技术支持

如果在部署过程中遇到问题：
1. 首先查看容器日志获取错误信息
2. 检查本指南中的常见问题部分
3. 确认所有配置文件格式正确
4. 验证网络连接和权限设置

## 🎉 部署完成

恭喜！您已经成功将短视频文案助手部署到绿联NAS上。现在您可以：

1. 通过浏览器访问应用
2. 创建管理员账户
3. 配置AI服务
4. 开始使用短视频文案生成功能

享受您的私有AI助手吧！

---

**注意事项：**
- 定期备份重要数据
- 保持系统和应用更新
- 监控资源使用情况
- 注意网络安全设置