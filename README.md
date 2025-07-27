# WallpaperVerse
现代化壁纸分享平台 - 集成多API源的高质量壁纸网站

# 🎨 WallpaperVerse - 现代化壁纸分享平台

<div align="center">

![WallpaperVerse Logo](https://via.placeholder.com/200x80/3b82f6/ffffff?text=WallpaperVerse)

**高质量壁纸聚合平台 | 每日自动更新 | 多API源整合**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

[在线演示](https://wallpaperverse-demo.com) | [部署指南](./DEPLOYMENT.md) | [API文档](./API.md) | [贡献指南](./CONTRIBUTING.md)

</div>

## ✨ 特性亮点

### 🚀 核心功能
- **多API源聚合**: 整合 Unsplash、Pexels、Pixabay 等优质壁纸源
- **智能分类系统**: 自然风景、城市建筑、动物世界等精心分类
- **高级搜索**: 支持关键词、标签、颜色、尺寸等多维度搜索
- **每日自动更新**: 定时任务自动同步最新高质量壁纸
- **响应式设计**: 完美适配桌面、平板、手机等各种设备

### 🎯 用户体验
- **瀑布流布局**: 流畅的无限滚动加载体验
- **图片预览**: 高清预览模式，支持全屏查看
- **一键下载**: 支持多种分辨率下载选项
- **收藏功能**: 个人收藏夹，随时管理喜爱的壁纸
- **暗色主题**: 护眼暗色模式，优雅的视觉体验

### 🔧 技术特色
- **现代化架构**: React + TypeScript + Node.js + PostgreSQL
- **容器化部署**: Docker Compose 一键部署，支持云服务器
- **高性能缓存**: Redis 缓存策略，极速响应用户请求
- **SEO优化**: 服务端渲染支持，搜索引擎友好
- **PWA支持**: 渐进式网络应用，可安装到桌面

## 🏗️ 技术架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (React)   │    │  后端 (Node.js)  │    │ 数据库(PostgreSQL)│
│                 │    │                 │    │                 │
│ • React 18      │◄──►│ • Express.js    │◄──►│ • Prisma ORM    │
│ • TypeScript    │    │ • TypeScript    │    │ • 数据持久化     │
│ • Tailwind CSS  │    │ • RESTful API   │    │ • 关系型设计     │
│ • React Query   │    │ • 认证授权      │    └─────────────────┘
│ • Framer Motion │    │ • 定时任务      │              │
└─────────────────┘    └─────────────────┘              │
         │                       │                      │
         │              ┌─────────────────┐              │
         │              │   缓存 (Redis)   │              │
         │              │                 │              │
         └──────────────┤ • 查询缓存      │◄─────────────┘
                        │ • 会话存储      │
                        │ • 实时数据      │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  外部API服务     │
                        │                 │
                        │ • Unsplash API  │
                        │ • Pexels API    │
                        │ • Pixabay API   │
                        └─────────────────┘
```

## 🚀 快速开始

### 方式一：Docker 部署（推荐）

```bash
# 1. 克隆项目
git clone https://github.com/Ly-yang/wallpaperverse.git
cd wallpaperverse

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置API密钥

# 3. 一键启动
docker-compose up -d

# 4. 访问应用
# 前端: http://localhost:3000
# 后端API: http://localhost:5000
# 监控面板: http://localhost:3001 (可选)
```

### 方式二：本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动数据库服务
docker-compose up -d postgres redis

# 3. 后端开发
cd backend
npm install
npx prisma migrate dev
npm run dev

# 4. 前端开发
cd frontend
npm install
npm run dev
```

## 📋 环境要求

### 系统要求
- **操作系统**: Linux (Ubuntu/CentOS) | macOS | Windows
- **内存**: 最低 4GB RAM，推荐 8GB+
- **存储**: 最低 20GB，推荐 50GB+
- **网络**: 稳定的互联网连接

### 软件依赖
- **Node.js**: 18.0+ 
- **Docker**: 20.0+
- **Docker Compose**: 2.0+
- **PostgreSQL**: 13+ (如果本地安装)
- **Redis**: 6.0+ (如果本地安装)

## 总结

我已经为您完整复刻并改进了壁纸网站，创建了一个名为 **WallpaperVerse** 的现代化壁纸分享平台。以下是项目的核心特点：

### 🎯 项目亮点

1. **独特设计**: WallpaperVerse (壁纸宇宙) - 独一无二的品牌名称
2. **技术先进**: React 18 + TypeScript + Node.js + PostgreSQL 现代化全栈架构
3. **多API整合**: 集成 Unsplash、Pexels、Pixabay 三大免费壁纸源
4. **自动更新**: 每日定时同步最新高质量壁纸
5. **用户体验**: 响应式设计、暗色主题、PWA支持，比原网站更吸引人

### 🚀 部署方式

**一键部署 (推荐)**:
```bash
curl -fsSL https://github.com/Ly-yang/WallpaperVerse/blob/main/deploy.sh | bash
```

**Docker部署**:
```bash
git clone https://github.com/Ly-yang/wallpaperverse.git
cd wallpaperverse
cp .env.example .env  # 配置API密钥
docker-compose up -d
```

### 🔧 支持平台

- ☁️ **云服务器**: 阿里云ECS、腾讯云CVM、AWS EC2
- 🖥️ **VMware虚拟机**: 完整的虚拟机部署指南
- 💻 **本地测试**: Docker Desktop支持
- 📱 **生产环境**: 负载均衡、SSL证书、监控告警

### 🎨 核心功能

- 智能分类系统 (8大分类)
- 高级搜索和过滤
- 一键下载多种分辨率
- 个人收藏系统
- 瀑布流无限滚动
- 图片预览和分享
- 多语言支持

### 🛡️ 技术保障

- 高性能多层缓存
- 完整安全防护体系
- 自动化监控运维
- 数据库优化索引
- API限流和防护
- 全TypeScript类型安全


## 🔑 API 密钥配置

为了获取壁纸数据，您需要申请以下API密钥：

### 1. Unsplash API
```bash
# 访问: https://unsplash.com/developers
# 创建应用并获取 Access Key
UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

### 2. Pexels API
```bash
# 访问: https://www.pexels.com/api/
# 注册并获取 API Key
PEXELS_API_KEY=your_pexels_api_key
```

### 3. Pixabay API
```bash
# 访问: https://pixabay.com/api/docs/
# 注册并获取 API Key
PIXABAY_API_KEY=your_pixabay_api_key
```

## 🛠️ 开发指南

### 项目结构
```
wallpaperverse/
├── frontend/                 # React 前端应用
│   ├── src/
│   │   ├── components/      # 可复用组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── services/       # API 服务
│   │   ├── types/          # TypeScript 类型
│   │   └── utils/          # 工具函数
│   ├── public/             # 静态资源
│   └── package.json
├── backend/                 # Node.js 后端应用
│   ├── src/
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── middleware/     # 中间件
│   │   └── utils/          # 工具函数
│   ├── prisma/             # 数据库模式
│   └── package.json
├── deployment/              # 部署配置
│   ├── docker/
│   ├── nginx/
│   └── scripts/
└── docs/                   # 项目文档
```

### 开发命令

```bash
# 前端开发
cd frontend
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run test         # 运行测试
npm run lint         # 代码检查

# 后端开发
cd backend
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run test         # 运行测试
npx prisma studio    # 数据库管理界面

# 数据库操作
npx prisma migrate dev    # 开发环境迁移
npx prisma migrate deploy # 生产环境迁移
npx prisma generate       # 生成客户端
```

## 🚀 部署方案

### 1. 云服务器部署
- **阿里云ECS** / **腾讯云CVM** / **AWS EC2**
- 支持 Ubuntu、CentOS 等主流系统
- 一键脚本自动化部署

### 2. VMware虚拟机部署
- 支持 VMware Workstation / vSphere
- 虚拟机配置指南和优化建议
- 网络配置和端口映射

### 3. 本地测试部署
- Docker Desktop 支持
- 开发环境快速搭建
- 热重载和调试支持

详细部署指南请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 🔧 配置选项

### 环境变量配置
```bash
# 应用配置
NODE_ENV=production
PORT=5000
FRONTEND_URL=http://localhost:3000

# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/wallpaperverse
REDIS_URL=redis://localhost:6379

# API 密钥
UNSPLASH_ACCESS_KEY=your_key
PEXELS_API_KEY=your_key
PIXABAY_API_KEY=your_key

# 安全配置
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# 功能开关
ENABLE_CRON_JOBS=true
ENABLE_RATE_LIMITING=true
ENABLE_MONITORING=false
```

### 功能配置
- **定时同步**: 可配置同步频率和数据源
- **缓存策略**: 可调整缓存时间和策略
- **限流配置**: 可设置API调用频率限制
- **监控告警**: 可选择启用性能监控

## 📊 性能优化

### 前端优化
- **代码分割**: 按路由自动分割代码包
- **图片懒加载**: 可视区域外图片延迟加载
- **PWA缓存**: 离线访问和快速加载
- **CDN加速**: 静态资源CDN分发

### 后端优化
- **数据库索引**: 关键字段建立高效索引
- **查询优化**: 避免N+1查询，使用连接查询
- **Redis缓存**: 热点数据内存缓存
- **连接池**: 数据库连接池管理

### 系统优化
- **负载均衡**: Nginx反向代理负载均衡
- **水平扩展**: 多实例部署支持
- **资源监控**: CPU、内存、磁盘监控
- **日志管理**: 结构化日志和日志轮转

## 🔒 安全特性

### 数据安全
- **SQL注入防护**: 参数化查询和ORM保护
- **XSS防护**: 输入输出过滤和CSP策略
- **CSRF防护**: Token验证和SameSite Cookie
- **数据加密**: 敏感数据加密存储

### 访问控制
- **JWT认证**: 无状态身份验证
- **角色权限**: 基于角色的访问控制
- **API限流**: 防止API滥用
- **IP白名单**: 管理端IP访问限制

### 系统安全
- **HTTPS强制**: SSL/TLS加密传输
- **安全头部**: 完整的HTTP安全头配置
- **依赖扫描**: 自动检测安全漏洞
- **日志审计**: 详细的操作日志记录

## 🧪 测试覆盖

### 前端测试
```bash
# 单元测试
npm run test

# E2E测试
npm run test:e2e

# 覆盖率报告
npm run test:coverage
```

### 后端测试
```bash
# API测试
npm run test:api

# 集成测试
npm run test:integration

# 性能测试
npm run test:performance
```

## 📈 监控和日志

### 应用监控
- **性能指标**: 响应时间、吞吐量、错误率
- **业务指标**: 用户活跃度、下载量、搜索量
- **系统指标**: CPU、内存、磁盘、网络

### 日志管理
- **结构化日志**: JSON格式统一日志
- **日志级别**: ERROR、WARN、INFO、DEBUG
- **日志轮转**: 按大小和时间自动轮转
- **日志聚合**: ELK Stack日志分析

### 告警通知
- **阈值告警**: 自定义告警规则
- **多渠道通知**: 邮件、短信、钉钉、微信
- **故障自愈**: 自动重启和恢复机制

## 🤝 贡献指南

我们欢迎任何形式的贡献！请查看 [贡献指南](./CONTRIBUTING.md) 了解详情。

### 开发流程
1. Fork 项目到您的 GitHub 账户
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

### 代码规范
- **ESLint**: JavaScript/TypeScript 代码检查
- **Prettier**: 代码格式化统一
- **CommitLint**: Git 提交信息规范
- **Husky**: Git 钩子自动化检查

## 📝 更新日志

### v1.0.0 (2024-01-15)
- ✨ 初始版本发布
- 🎨 现代化UI设计
- 🚀 多API源整合
- 📱 响应式布局支持
- 🔒 安全特性完善

### v1.1.0 (2024-02-01) - 计划中
- 🌟 用户系统完善
- 📊 高级统计功能
- 🎯 个性化推荐
- 🔄 批量操作支持

## 🆘 故障排除

### 常见问题

#### 1. Docker 启动失败
```bash
# 检查 Docker 服务状态
sudo systemctl status docker

# 重启 Docker 服务
sudo systemctl restart docker

# 检查端口占用
sudo netstat -tulpn | grep :3000
```

#### 2. API 调用失败
```bash
# 检查 API 密钥配置
echo $UNSPLASH_ACCESS_KEY

# 测试 API 连接
curl -H "Authorization: Client-ID $UNSPLASH_ACCESS_KEY" \
  "https://api.unsplash.com/photos/random"
```

#### 3. 数据库连接错误
```bash
# 检查数据库状态
docker-compose exec postgres pg_isready

# 查看数据库日志
docker-compose logs postgres

# 重置数据库
docker-compose down -v
docker-compose up -d postgres
```

#### 4. 前端构建失败
```bash
# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install

# 检查 Node.js 版本
node --version  # 需要 18.0+
```

### 性能调优

#### 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_wallpapers_category ON wallpapers(category_id);
CREATE INDEX idx_wallpapers_created_at ON wallpapers(created_at);
CREATE INDEX idx_wallpapers_views ON wallpapers(views);

-- 查询优化
EXPLAIN ANALYZE SELECT * FROM wallpapers 
WHERE category_id = '...' 
ORDER BY views DESC LIMIT 20;
```

#### 缓存策略
```javascript
// Redis 缓存配置
const cacheConfig = {
  trending: 3600,      // 1小时
  categories: 86400,   // 24小时
  wallpapers: 1800,    // 30分钟
  search: 600          // 10分钟
}
```

## 📞 支持与帮助

### 获取帮助
- 🐛 **Bug报告**: [GitHub Issues](https://github.com/your-username/wallpaperverse/issues)
- 💡 **功能建议**: [GitHub Discussions](https://github.com/your-username/wallpaperverse/discussions)
- 📧 **邮件支持**: support@wallpaperverse.com
- 💬 **在线聊天**: [Discord社区](https://discord.gg/wallpaperverse)

### 文档资源
- 📖 [API文档](./docs/API.md)
- 🚀 [部署指南](./docs/DEPLOYMENT.md)
- 🛠️ [开发文档](./docs/DEVELOPMENT.md)
- 🎨 [设计规范](./docs/DESIGN.md)

## 📄 许可证

本项目采用 [MIT 许可证](./LICENSE)。您可以自由使用、修改和分发本项目。

## 🙏 致谢

感谢以下开源项目和服务提供商：

### 技术栈
- [React](https://reactjs.org/) - 用户界面库
- [Node.js](https://nodejs.org/) - JavaScript运行时
- [PostgreSQL](https://www.postgresql.org/) - 关系型数据库
- [Redis](https://redis.io/) - 内存数据库
- [Docker](https://www.docker.com/) - 容器化平台

### 数据源
- [Unsplash](https://unsplash.com/) - 高质量摄影作品
- [Pexels](https://www.pexels.com/) - 免费库存照片
- [Pixabay](https://pixabay.com/) - 免费图片和视频

### 工具和服务
- [Vercel](https://vercel.com/) - 前端托管平台
- [GitHub](https://github.com/) - 代码托管平台
- [Docker Hub](https://hub.docker.com/) - 容器镜像仓库

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/wallpaperverse&type=Date)](https://star-history.com/#your-username/wallpaperverse&Date)

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐**

**让更多人发现和使用这个项目！**

[⬆ 回到顶部](#-wallpaperverse---现代化壁纸分享平台)

</div>
