pipeline {
    agent any
    
    environment {
        NODE_VERSION = '20.19.0'
        DEPLOY_SERVER = 'your-ubuntu-server-ip'
        DEPLOY_USER = 'ubuntu'
        DEPLOY_PATH = '/var/www/virtuallab'
        APP_NAME = 'virtuallab'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo '🔄 检出代码...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            steps {
                echo '📦 安装依赖...'
                sh '''
                    node -v
                    npm -v
                    npm ci
                '''
            }
        }
        
        stage('Run Tests') {
            steps {
                echo '🧪 运行测试...'
                sh 'npm test -- --run'
            }
        }
        
        stage('Build') {
            steps {
                echo '🔨 构建生产版本...'
                sh 'npm run build'
            }
        }
        
        stage('Generate Test Report') {
            steps {
                echo '📊 生成测试报告...'
                sh 'npm run test:coverage || true'
            }
        }
        
        stage('Archive Artifacts') {
            steps {
                echo '📦 归档构建产物...'
                archiveArtifacts artifacts: 'dist/**/*', fingerprint: true
                archiveArtifacts artifacts: 'coverage/**/*', fingerprint: true, allowEmptyArchive: true
            }
        }
        
        stage('Deploy to Ubuntu Server') {
            steps {
                echo '🚀 部署到Ubuntu服务器...'
                script {
                    sh """
                        # 压缩构建产物
                        tar -czf dist.tar.gz dist/
                        
                        # 上传到服务器
                        scp dist.tar.gz ${DEPLOY_USER}@${DEPLOY_SERVER}:${DEPLOY_PATH}/
                        scp deploy.sh ${DEPLOY_USER}@${DEPLOY_SERVER}:${DEPLOY_PATH}/
                        scp ecosystem.config.js ${DEPLOY_USER}@${DEPLOY_SERVER}:${DEPLOY_PATH}/
                        
                        # 在服务器上执行部署脚本
                        ssh ${DEPLOY_USER}@${DEPLOY_SERVER} "cd ${DEPLOY_PATH} && bash deploy.sh"
                    """
                }
            }
        }
    }
    
    post {
        success {
            echo '✅ 构建和部署成功！'
            // 可以在这里添加通知，如钉钉、企业微信、邮件等
        }
        failure {
            echo '❌ 构建或部署失败！'
            // 发送失败通知
        }
        always {
            echo '🧹 清理工作空间...'
            cleanWs()
        }
    }
}
