#!/bin/bash

# 自动化部署脚本
# 用于在Ubuntu服务器上部署虚拟实验平台

set -e  # 遇到错误立即退出

# 配置变量
APP_NAME="virtuallab"
DEPLOY_PATH="/var/www/virtuallab"
BACKUP_PATH="/var/www/backups"
NGINX_CONF="/etc/nginx/sites-available/virtuallab"
PM2_APP_NAME="virtuallab"

echo "================================================"
echo "🚀 开始部署 ${APP_NAME}"
echo "================================================"

# 1. 创建备份
echo "📦 备份当前版本..."
BACKUP_FILE="${BACKUP_PATH}/backup_$(date +%Y%m%d_%H%M%S).tar.gz"
mkdir -p ${BACKUP_PATH}
if [ -d "${DEPLOY_PATH}/dist" ]; then
    tar -czf ${BACKUP_FILE} -C ${DEPLOY_PATH} dist/
    echo "✅ 备份完成: ${BACKUP_FILE}"
else
    echo "⚠️  首次部署，跳过备份"
fi

# 2. 解压新版本
echo "📂 解压新版本..."
cd ${DEPLOY_PATH}
if [ -f "dist.tar.gz" ]; then
    # 删除旧的dist目录
    rm -rf dist/
    # 解压新版本
    tar -xzf dist.tar.gz
    rm dist.tar.gz
    echo "✅ 解压完成"
else
    echo "❌ 找不到 dist.tar.gz 文件"
    exit 1
fi

# 3. 设置权限
echo "🔐 设置文件权限..."
chown -R www-data:www-data ${DEPLOY_PATH}/dist
chmod -R 755 ${DEPLOY_PATH}/dist
echo "✅ 权限设置完成"

# 4. 重启Nginx（如果使用静态文件服务）
if [ -f "${NGINX_CONF}" ]; then
    echo "🔄 重新加载Nginx配置..."
    sudo nginx -t && sudo systemctl reload nginx
    echo "✅ Nginx重载完成"
fi

# 5. 清理旧备份（保留最近5个）
echo "🧹 清理旧备份..."
cd ${BACKUP_PATH}
ls -t | tail -n +6 | xargs -r rm
echo "✅ 清理完成"

# 6. 健康检查
echo "🏥 执行健康检查..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "000")
if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "304" ]; then
    echo "✅ 服务运行正常 (HTTP $HTTP_CODE)"
else
    echo "⚠️  服务可能未正常启动 (HTTP $HTTP_CODE)"
    echo "📋 查看Nginx日志: sudo tail -f /var/log/nginx/error.log"
fi

echo "================================================"
echo "✅ 部署完成！"
echo "================================================"
echo "📊 部署信息："
echo "   - 部署路径: ${DEPLOY_PATH}"
echo "   - 备份路径: ${BACKUP_FILE}"
echo "   - 部署时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================"
