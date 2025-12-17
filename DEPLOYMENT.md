# 🚀 部署指南

本文档详细说明如何使用Jenkins将虚拟实验平台部署到Ubuntu Linux服务器。

## 📋 前置要求

### Jenkins服务器
- Java 11或更高版本
- Jenkins 2.387+
- Git
- Node.js 20.19.0+

### Ubuntu目标服务器
- Ubuntu 20.04 LTS或更高版本
- Nginx
- 至少2GB内存
- 10GB可用磁盘空间

## 🔧 Ubuntu服务器配置

### 1. 安装Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 2. 创建部署目录

```bash
sudo mkdir -p /var/www/virtuallab
sudo mkdir -p /var/www/backups
sudo chown -R $USER:$USER /var/www/virtuallab
sudo chown -R $USER:$USER /var/www/backups
```

### 3. 配置Nginx

```bash
# 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/virtuallab

# 编辑配置文件，修改server_name为你的域名或IP
sudo nano /etc/nginx/sites-available/virtuallab

# 创建软链接
sudo ln -s /etc/nginx/sites-available/virtuallab /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启Nginx
sudo systemctl restart nginx
```

### 4. 配置防火墙

```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
sudo ufw status
```

## 🔑 SSH密钥配置

### 在Jenkins服务器上生成SSH密钥

```bash
# 在Jenkins用户下生成密钥
sudo su - jenkins
ssh-keygen -t rsa -b 4096 -C "jenkins@yourdomain.com"

# 复制公钥到Ubuntu服务器
ssh-copy-id ubuntu@your-ubuntu-server-ip
```

### 测试SSH连接

```bash
ssh ubuntu@your-ubuntu-server-ip
```

## 📦 Jenkins配置

### 1. 安装必要插件

在Jenkins中安装以下插件：
- Git Plugin
- Pipeline Plugin
- SSH Agent Plugin
- NodeJS Plugin

### 2. 配置Node.js

Jenkins → 系统管理 → 全局工具配置 → NodeJS
- 名称: Node 20.19
- 版本: 20.19.0
- 勾选"自动安装"

### 3. 配置SSH凭据

Jenkins → 系统管理 → Manage Credentials → Add Credentials
- 类型: SSH Username with private key
- ID: ubuntu-server-ssh
- Username: ubuntu
- Private Key: 粘贴Jenkins服务器的私钥

### 4. 创建Pipeline任务

1. 新建任务 → Pipeline
2. 配置Git仓库：https://github.com/zsun-Jason/virtuallab.git
3. Pipeline脚本: 选择"Pipeline script from SCM"
4. SCM: Git
5. 仓库URL: https://github.com/zsun-Jason/virtuallab.git
6. 脚本路径: Jenkinsfile

### 5. 修改Jenkinsfile环境变量

编辑`Jenkinsfile`，修改以下变量：

```groovy
environment {
    DEPLOY_SERVER = '192.168.1.100'  // 你的Ubuntu服务器IP
    DEPLOY_USER = 'ubuntu'           // SSH用户名
    DEPLOY_PATH = '/var/www/virtuallab'
}
```

## 🚀 部署流程

### 自动部署

1. 推送代码到GitHub仓库
2. 在Jenkins中点击"立即构建"
3. 查看构建日志
4. 构建成功后，访问服务器IP或域名

### 手动部署

如果不使用Jenkins，可以手动执行：

```bash
# 在本地构建
npm install
npm run build

# 压缩构建产物
tar -czf dist.tar.gz dist/

# 上传到服务器
scp dist.tar.gz ubuntu@your-server:/var/www/virtuallab/
scp deploy.sh ubuntu@your-server:/var/www/virtuallab/

# SSH到服务器执行部署
ssh ubuntu@your-server
cd /var/www/virtuallab
chmod +x deploy.sh
./deploy.sh
```

## 🔍 故障排查

### 问题1: Nginx 403 Forbidden

```bash
# 检查文件权限
ls -la /var/www/virtuallab/dist

# 修正权限
sudo chown -R www-data:www-data /var/www/virtuallab/dist
sudo chmod -R 755 /var/www/virtuallab/dist
```

### 问题2: 无法连接到服务器

```bash
# 检查Nginx状态
sudo systemctl status nginx

# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 检查端口占用
sudo netstat -tulpn | grep :80
```

### 问题3: 页面刷新404错误

确保Nginx配置中有：

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### 问题4: Jenkins构建失败

```bash
# 检查Jenkins日志
sudo tail -f /var/log/jenkins/jenkins.log

# 检查磁盘空间
df -h

# 检查Node.js版本
node -v
```

## 📊 监控和日志

### 查看访问日志

```bash
sudo tail -f /var/log/nginx/virtuallab_access.log
```

### 查看错误日志

```bash
sudo tail -f /var/log/nginx/virtuallab_error.log
```

### 查看部署历史

```bash
ls -lh /var/www/backups/
```

### 回滚到上一个版本

```bash
cd /var/www/virtuallab
# 找到最新的备份
LATEST_BACKUP=$(ls -t /var/www/backups/ | head -1)
# 恢复备份
tar -xzf /var/www/backups/$LATEST_BACKUP
sudo systemctl reload nginx
```

## 🔐 安全建议

1. **使用HTTPS**: 安装Let's Encrypt证书
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **限制SSH访问**: 修改`/etc/ssh/sshd_config`
   ```
   PermitRootLogin no
   PasswordAuthentication no
   ```

3. **配置fail2ban**: 防止暴力破解
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   ```

4. **定期更新系统**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

## 📈 性能优化

### 启用HTTP/2

在Nginx配置中添加：

```nginx
listen 443 ssl http2;
```

### 启用Brotli压缩

```bash
sudo apt install nginx-module-brotli
```

### 配置CDN

建议将静态资源部署到CDN，如：
- 阿里云OSS + CDN
- 腾讯云COS + CDN
- Cloudflare

## 🎯 下一步

- [ ] 配置监控告警（Prometheus + Grafana）
- [ ] 设置自动化测试
- [ ] 配置蓝绿部署
- [ ] 添加日志收集（ELK Stack）
- [ ] 配置备份自动化

## 📞 获取帮助

如有问题，请：
1. 查看Jenkins构建日志
2. 查看Nginx错误日志
3. 检查服务器资源使用情况
4. 提交Issue到GitHub仓库

---

**最后更新**: 2025-12-17
