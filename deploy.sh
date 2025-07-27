#!/bin/bash

# WallpaperVerse 自动部署脚本
# 支持云服务器、VMware虚拟机等环境
# 作者: WallpaperVerse Team
# 版本: 1.0.0

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查是否为root用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warn "检测到root用户，建议使用普通用户运行此脚本"
        read -p "是否继续? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# 检测操作系统
detect_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$NAME
        VERSION=$VERSION_ID
    else
        log_error "无法检测操作系统"
        exit 1
    fi
    
    log_info "检测到操作系统: $OS $VERSION"
}

# 检查系统要求
check_requirements() {
    log_step "检查系统要求..."
    
    # 检查内存
    MEMORY_GB=$(free -g | awk '/^Mem:/{print $2}')
    if [[ $MEMORY_GB -lt 4 ]]; then
        log_warn "系统内存少于4GB，可能影响性能"
    fi
    
    # 检查磁盘空间
    DISK_GB=$(df -BG / | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $DISK_GB -lt 20 ]]; then
        log_error "磁盘可用空间少于20GB，无法继续安装"
        exit 1
    fi
    
    log_info "系统要求检查通过"
}

# 安装必需软件
install_dependencies() {
    log_step "安装必需软件..."
    
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt update
        sudo apt install -y curl wget git vim htop net-tools
        
        # 安装 Docker
        if ! command -v docker &> /dev/null; then
            log_info "安装 Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        fi
        
        # 安装 Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            log_info "安装 Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        sudo yum update -y
        sudo yum install -y curl wget git vim htop net-tools
        
        # 安装 Docker
        if ! command -v docker &> /dev/null; then
            log_info "安装 Docker..."
            sudo yum install -y yum-utils
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            sudo yum install -y docker-ce docker-ce-cli containerd.io
            sudo systemctl start docker
            sudo systemctl enable docker
            sudo usermod -aG docker $USER
        fi
        
        # 安装 Docker Compose
        if ! command -v docker-compose &> /dev/null; then
            log_info "安装 Docker Compose..."
            sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
    else
        log_error "不支持的操作系统: $OS"
        exit 1
    fi
    
    log_info "必需软件安装完成"
}

# 配置防火墙
configure_firewall() {
    log_step "配置防火墙..."
    
    if command -v ufw &> /dev/null; then
        # Ubuntu/Debian
        sudo ufw --force enable
        sudo ufw allow 22/tcp   # SSH
        sudo ufw allow 80/tcp   # HTTP
        sudo ufw allow 443/tcp  # HTTPS
        sudo ufw allow 3000/tcp # Frontend (development)
        sudo ufw allow 5000/tcp # Backend API
        log_info "UFW 防火墙配置完成"
        
    elif command -v firewall-cmd &> /dev/null; then
        # CentOS/RHEL
        sudo systemctl start firewalld
        sudo systemctl enable firewalld
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --permanent --add-port=3000/tcp
        sudo firewall-cmd --permanent --add-port=5000/tcp
        sudo firewall-cmd --reload
        log_info "Firewalld 防火墙配置完成"
    else
        log_warn "未找到防火墙工具，请手动配置"
    fi
}

# 克隆项目
clone_project() {
    log_step "克隆项目..."
    
    if [[ -d "wallpaperverse" ]]; then
        log_warn "项目目录已存在，是否删除重新克隆? (y/N)"
        read -p "> " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf wallpaperverse
        else
            log_info "使用现有项目目录"
            cd wallpaperverse
            git pull origin main
            return
        fi
    fi
    
    # 这里使用示例仓库地址，实际使用时请替换为真实地址
    REPO_URL="https://github.com/your-username/wallpaperverse.git"
    
    log_info "从 $REPO_URL 克隆项目..."
    git clone $REPO_URL wallpaperverse
    cd wallpaperverse
}

# 配置环境变量
configure_environment() {
    log_step "配置环境变量..."
    
    if [[ ! -f .env ]]; then
        cp .env.example .env
        log_info "已创建 .env 文件，请配置以下变量:"
        echo
        echo "必需配置的API密钥:"
        echo "- UNSPLASH_ACCESS_KEY (https://unsplash.com/developers)"
        echo "- PEXELS_API_KEY (https://www.pexels.com/api/)"
        echo "- PIXABAY_API_KEY (https://pixabay.com/api/docs/)"
        echo
        
        read -p "是否现在配置API密钥? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            configure_api_keys
        else
            log_warn "请稍后手动编辑 .env 文件配置API密钥"
        fi
    fi
    
    # 生成随机密钥
    if ! grep -q "JWT_SECRET=" .env || grep -q "JWT_SECRET=your-super-secret" .env; then
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        log_info "已生成JWT密钥"
    fi
    
    # 生成随机数据库密码
    if ! grep -q "POSTGRES_PASSWORD=" .env || grep -q "POSTGRES_PASSWORD=wallpaperverse123" .env; then
        DB_PASSWORD=$(openssl rand -base64 16)
        sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=$DB_PASSWORD/" .env
        log_info "已生成数据库密码"
    fi
    
    # 生成随机Redis密码
    if ! grep -q "REDIS_PASSWORD=" .env || grep -q "REDIS_PASSWORD=redis123" .env; then
        REDIS_PASSWORD=$(openssl rand -base64 16)
        sed -i "s/REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
        log_info "已生成Redis密码"
    fi
}

# 配置API密钥
configure_api_keys() {
    echo
    log_info "配置API密钥..."
    
    echo "请访问以下链接获取API密钥:"
    echo "1. Unsplash: https://unsplash.com/developers"
    echo "2. Pexels: https://www.pexels.com/api/"
    echo "3. Pixabay: https://pixabay.com/api/docs/"
    echo
    
    read -p "Unsplash Access Key: " UNSPLASH_KEY
    if [[ -n "$UNSPLASH_KEY" ]]; then
        sed -i "s/UNSPLASH_ACCESS_KEY=.*/UNSPLASH_ACCESS_KEY=$UNSPLASH_KEY/" .env
    fi
    
    read -p "Pexels API Key: " PEXELS_KEY
    if [[ -n "$PEXELS_KEY" ]]; then
        sed -i "s/PEXELS_API_KEY=.*/PEXELS_API_KEY=$PEXELS_KEY/" .env
    fi
    
    read -p "Pixabay API Key: " PIXABAY_KEY
    if [[ -n "$PIXABAY_KEY" ]]; then
        sed -i "s/PIXABAY_API_KEY=.*/PIXABAY_API_KEY=$PIXABAY_KEY/" .env
    fi
    
    log_info "API密钥配置完成"
}

# 启动服务
start_services() {
    log_step "启动服务..."
    
    # 检查Docker服务
    if ! systemctl is-active --quiet docker; then
        sudo systemctl start docker
        log_info "已启动Docker服务"
    fi
    
    # 构建并启动服务
    log_info "构建Docker镜像..."
    docker-compose build
    
    log_info "启动所有服务..."
    docker-compose up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 30
    
    # 检查服务状态
    check_services_health
}

# 检查服务健康状态
check_services_health() {
    log_step "检查服务状态..."
    
    # 检查数据库
    if docker-compose exec -T postgres pg_isready -U wallpaperverse > /dev/null 2>&1; then
        log_info "✓ PostgreSQL 数据库运行正常"
    else
        log_error "✗ PostgreSQL 数据库连接失败"
    fi
    
    # 检查Redis
    if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
        log_info "✓ Redis 缓存运行正常"
    else
        log_error "✗ Redis 缓存连接失败"
    fi
    
    # 检查后端API
    sleep 10  # 等待后端启动
    if curl -f http://localhost:5000/health > /dev/null 2>&1; then
        log_info "✓ 后端API运行正常"
    else
        log_error "✗ 后端API连接失败"
    fi
    
    # 检查前端
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        log_info "✓ 前端应用运行正常"
    else
        log_error "✗ 前端应用连接失败"
    fi
}

# 初始化数据
initialize_data() {
    log_step "初始化数据..."
    
    # 运行数据库迁移
    log_info "运行数据库迁移..."
    docker-compose exec backend npx prisma migrate deploy
    
    # 创建默认分类
    log_info "创建默认分类..."
    docker-compose exec backend npm run seed
    
    # 同步初始壁纸数据
    log_info "同步初始壁纸数据..."
    docker-compose exec backend npm run sync:wallpapers
    
    log_info "数据初始化完成"
}

# 设置SSL证书（可选）
setup_ssl() {
    log_step "设置SSL证书..."
    
    read -p "是否配置SSL证书? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    read -p "请输入域名 (例: wallpaperverse.com): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        log_warn "未输入域名，跳过SSL配置"
        return
    fi
    
    # 安装 Certbot
    if [[ "$OS" == *"Ubuntu"* ]] || [[ "$OS" == *"Debian"* ]]; then
        sudo apt install -y certbot python3-certbot-nginx
    elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]]; then
        sudo yum install -y certbot python3-certbot-nginx
    fi
    
    # 获取证书
    sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN
    
    # 设置自动续期
    (crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -
    
    log_info "SSL证书配置完成"
}

# 创建系统服务
create_systemd_service() {
    log_step "创建系统服务..."
    
    cat > /tmp/wallpaperverse.service << EOF
[Unit]
Description=WallpaperVerse Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF
    
    sudo mv /tmp/wallpaperverse.service /etc/systemd/system/
    sudo systemctl daemon-reload
    sudo systemctl enable wallpaperverse.service
    
    log_info "系统服务创建完成"
}

# 显示部署信息
show_deployment_info() {
    echo
    log_info "=========================================="
    log_info "🎉 WallpaperVerse 部署完成！"
    log_info "=========================================="
    echo
    echo "访问地址:"
    echo "  前端应用: http://$(curl -s ifconfig.me):3000"
    echo "  后端API:  http://$(curl -s ifconfig.me):5000"
    echo "  健康检查: http://$(curl -s ifconfig.me):5000/health"
    echo
    echo "管理命令:"
    echo "  查看状态: docker-compose ps"
    echo "  查看日志: docker-compose logs -f"
    echo "  重启服务: docker-compose restart"
    echo "  停止服务: docker-compose down"
    echo "  更新应用: ./scripts/update.sh"
    echo
    echo "配置文件:"
    echo "  环境变量: .env"
    echo "  Docker配置: docker-compose.yml"
    echo "  Nginx配置: nginx/nginx.conf"
    echo
    log_info "🔧 如需帮助，请查看文档: ./docs/DEPLOYMENT.md"
    echo
}

# 主函数
main() {
    echo
    log_info "=========================================="
    log_info "🚀 WallpaperVerse 自动部署脚本"
    log_info "=========================================="
    echo
    
    check_root
    detect_os
    check_requirements
    install_dependencies
    configure_firewall
    clone_project
    configure_environment
    start_services
    initialize_data
    setup_ssl
    create_systemd_service
    show_deployment_info
    
    log_info "🎉 部署完成！感谢使用 WallpaperVerse！"
}

# 检查参数
case "${1:-}" in
    --help|-h)
        echo "WallpaperVerse 自动部署脚本"
        echo
        echo "用法: $0 [选项]"
        echo
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --version, -v  显示版本信息"
        echo "  --check        仅检查系统要求"
        echo
        exit 0
        ;;
    --version|-v)
        echo "WallpaperVerse Deploy Script v1.0.0"
        exit 0
        ;;
    --check)
        detect_os
        check_requirements
        log_info "系统检查完成"
        exit 0
        ;;
    "")
        main
        ;;
    *)
        log_error "未知参数: $1"
        echo "使用 --help 查看帮助信息"
        exit 1
        ;;
esac
