# WallpaperVerse 部署指南

这份文档将指导您如何在不同环境中部署 WallpaperVerse 壁纸平台。

## 🎯 系统要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB SSD
- **网络**: 10Mbps 带宽

### 推荐配置
- **CPU**: 4核心以上
- **内存**: 8GB RAM 以上
- **存储**: 50GB SSD 以上
- **网络**: 100Mbps 带宽以上

### 支持的操作系统
- Ubuntu 20.04+ / Debian 11+
- CentOS 8+ / RHEL 8+
- Docker Desktop (Windows/macOS)
- VMware 虚拟机

## 🐳 Docker 部署（推荐）

### 1. 快速开始

```bash
# 克隆项目
git clone https://github.com/your-username/wallpaperverse.git
cd wallpaververse

# 复制环境变量模板
cp .env.example .env

# 编辑环境变量
nano .env

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 2. 环境变量配置

创建 `.env` 文件并配置以下变量：

```bash
# 基础配置
NODE_ENV=production
FRONTEND_URL=http://localhost:3000

# 数据库配置
POSTGRES_PASSWORD=your-secure-password
REDIS_PASSWORD=your-redis-password

# API密钥（必需）
UNSPLASH_ACCESS_KEY=your-unsplash-access-key
PEXELS_API_KEY=your-pexels-api-key
PIXABAY_API_KEY=your-pixabay-api-key

# JWT配置
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# 功能开关
ENABLE_CRON_JOBS=true
ENABLE_RATE_LIMITING=true

# 监控（可选）
GRAFANA_PASSWORD=admin123
```

### 3. API密钥获取

#### Unsplash API
1. 访问 [Unsplash Developers](https://unsplash.com/developers)
2. 创建新应用
3. 获取 Access Key

#### Pexels API
1. 访问 [Pexels API](https://www.pexels.com/api/)
2. 注册并获取 API Key

#### Pixabay API
1. 访问 [Pixabay API](https://pixabay.com/api/docs/)
2. 注册并获取 API Key

### 4. 生产环境优化

```bash
# 使用生产环境配置
cp docker-compose.prod.yml docker-compose.yml

# 启用SSL（需要域名和证书）
./scripts/setup-ssl.sh your-domain.com

# 启用监控
docker-compose --profile monitoring up -d
```

## 🖥️ 本地开发部署

### 1. 环境准备

```bash
# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# 安装依赖
sudo apt-get update
sudo apt-get install -y git nginx postgresql redis-server
```

### 2. 数据库设置

```bash
# 启动 PostgreSQL 和 Redis
sudo systemctl start postgresql redis-server
sudo systemctl enable postgresql redis-server

# 创建数据库
sudo -u postgres createdb wallpaperverse
sudo -u postgres createuser wallpaperverse

# 设置密码
sudo -u postgres psql -c "ALTER USER wallpaperverse PASSWORD 'your-password';"
sudo -u postgres psql -c "GRANT ALL ON DATABASE wallpaperverse TO wallpaperverse;"
```

### 3. 后端部署

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env

# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 构建项目
npm run build

# 启动服务
npm start

# 或使用 PM2（推荐）
npm install -g pm2
pm2 start ecosystem.config.js
pm2 startup
pm2 save
```

### 4. 前端部署

```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
nano .env

# 构建项目
npm run build

# 使用 serve 提供静态文件
npm install -g serve
serve -s dist -l 3000

# 或复制到 Nginx
sudo cp -r dist/* /var/www/html/
```

## ☁️ 云服务器部署

### 1. 阿里云ECS部署

```bash
# 连接到服务器
ssh root@your-server-ip

# 更新系统
yum update -y

# 安装 Docker
yum install -y docker
systemctl start docker
systemctl enable docker

# 安装 Docker Compose
curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# 部署项目
git clone https://github.com/your-username/wallpaperverse.git
cd wallpaperverse
cp .env.example .env
# 编辑 .env 文件
docker-compose up -d
```

### 2. 腾讯云轻量应用服务器

```bash
# 使用腾讯云Docker镜像
# 或按照标准Docker部署流程
```

### 3. AWS EC2部署

```bash
# 启动 EC2 实例（Ubuntu 20.04）
# 配置安全组：开放 80, 443, 22 端口

# 连接实例
ssh -i your-key.pem ubuntu@your-ec2-ip

# 安装依赖
sudo apt update
sudo apt install -y docker.io docker-compose git

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# 部署项目
git clone https://github.com/your-username/wallpaperverse.git
cd wallpaperverse
cp .env.example .env
# 配置环境变量
docker-compose up -d
```

## 🔧 VMware虚拟机部署

### 1. 虚拟机配置

- **操作系统**: Ubuntu Server 20.04 LTS
- **CPU**: 2核心（推荐4核心）
- **内存**: 4GB（推荐8GB）
- **硬盘**: 40GB（推荐100GB）
- **网络**: 桥接模式或NAT模式

### 2. 系统安装

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装必需软件
sudo apt install -y curl wget git vim htop

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $USER

# 重新登录或使用 newgrp docker

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3. 网络配置

```bash
# 配置静态IP（可选）
sudo nano /etc/netplan/00-installer-config.yaml

# 示例配置
network:
  ethernets:
    ens33:
      dhcp4: false
      addresses:
        - 192.168.1.100/24
      gateway4: 192.168.1.1
      nameservers:
        addresses: [8.8.8.8, 1.1.1.1]
  version: 2

# 应用配置
sudo netplan apply
```

## 🔒 安全配置

### 1. 防火墙设置

```bash
# Ubuntu/Debian
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. SSL证书配置

```bash
# 使用 Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. 数据库安全

```bash
# 设置强密码
# 定期备份
# 限制网络访问
# 启用日志记录
```

## 📊 监控和日志

### 1. 日志查看

```bash
# Docker 容器日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# 系统日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 2. 性能监控

```bash
# 启用监控套件
docker-compose --profile monitoring up -d

# 访问监控界面
# Prometheus: http://your-domain:9090
# Grafana: http://your-domain:3001
```

### 3. 健康检查

```bash
# API健康检查
curl http://your-domain/health

# 服务状态检查
docker-compose ps
```

## 🔄 维护和更新

### 1. 数据备份

```bash
# 数据库备份
docker-compose exec postgres pg_dump -U wallpaperverse wallpaperverse > backup.sql

# Redis备份
docker-compose exec redis redis-cli BGSAVE

# 文件备份
tar -czf uploads-backup.tar.gz uploads/
```

### 2. 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重建镜像
docker-compose build --no-cache

# 重启服务
docker-compose down
docker-compose up -d

# 运行数据库迁移（如有需要）
docker-compose exec backend npx prisma migrate deploy
```

### 3. 性能优化

```bash
# 清理 Docker 镜像
docker system prune -af

# 优化数据库
docker-compose exec postgres vacuumdb -U wallpaperverse -d wallpaperverse -z

# 清理缓存
docker-compose exec redis redis-cli FLUSHDB
```

## 🚨 故障排除

### 常见问题

1. **端口占用**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo systemctl stop apache2  # 如果有Apache占用80端口
   ```

2. **权限问题**
   ```bash
   sudo chown -R 1000:1000 uploads/
   sudo chmod -R 755 uploads/
   ```

3. **内存不足**
   ```bash
   # 添加交换空间
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

4. **数据库连接失败**
   ```bash
   # 检查数据库状态
   docker-compose exec postgres pg_isready -U wallpaperverse
   
   # 重置数据库连接
   docker-compose restart postgres
   ```

## 📞 技术支持

如果您在部署过程中遇到问题，请：

1. 查看项目 [GitHub Issues](https://github.com/your-username/wallpaperverse/issues)
2. 检查日志文件获取错误信息
3. 确认所有环境变量配置正确
4. 验证API密钥有效性

---

*最后更新: 2024年1月*
