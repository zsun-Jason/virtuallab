# 快速开始指南

## 📌 当前状态

项目已成功创建！但需要升级Node.js版本才能运行。

## ⚠️ 重要：Node.js版本升级

当前系统: **Node.js v16.20.2**  
项目要求: **Node.js v20.19+ 或 v22.12+**

### 升级方法

#### 方法1: 使用nvm (推荐)
```bash
# 安装nvm（如果还没安装）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装Node.js 20
nvm install 20
nvm use 20

# 验证版本
node -v
```

#### 方法2: 官网下载
访问 https://nodejs.org/ 下载最新LTS版本

## 🚀 启动项目

升级Node.js后，在项目目录运行：

```bash
# 重新安装依赖（如果需要）
npm install

# 启动开发服务器
npm run dev
```

浏览器会自动打开 http://localhost:3000

## 📚 实验模块说明

### 1️⃣ PID控制器仿真 (完整可用)
- 调节Kp、Ki、Kd参数
- 实时查看系统响应曲线
- 自动计算性能指标

**使用步骤**:
1. 左侧面板调整PID参数
2. 设置目标值和系统时间常数
3. 点击"开始仿真"
4. 观察右侧响应曲线和系统指标

### 2️⃣ 频域分析工具 (完整可用)
- 绘制Bode图和Nyquist图
- 自定义传递函数

**使用步骤**:
1. 输入传递函数的分子系数（用逗号分隔）
2. 输入分母系数
3. 点击"绘制Bode图"或"绘制Nyquist图"
4. 可使用示例按钮快速体验

### 3️⃣ 其他模块 (开发中)
- 倒立摆控制
- 直流电机控制
- 温度控制系统
- PLC梯形图编程
- 状态空间分析

## 🎯 项目特色

✨ 完全基于浏览器，无需安装MATLAB等软件  
✨ 实时交互式参数调节  
✨ 美观的UI界面（Element Plus）  
✨ 专业的控制算法实现  
✨ 响应式设计，支持各种屏幕尺寸  

## 🔧 开发建议

### 调试PID参数的技巧
1. **先调Kp**: 从0开始逐渐增大，观察响应速度
2. **再调Ki**: 增大Ki可消除稳态误差
3. **最后调Kd**: 用于抑制振荡和超调

### 常见PID参数范围
- Kp: 0.5 - 5.0
- Ki: 0.1 - 2.0
- Kd: 0.05 - 1.0

## 📝 项目结构

```
virtuallab/
├── src/
│   ├── views/          # 实验页面
│   │   ├── HomeView.vue              # 首页
│   │   ├── PIDControllerView.vue     # PID实验
│   │   └── FrequencyAnalysisView.vue # 频域分析
│   ├── router/         # 路由配置
│   ├── stores/         # 状态管理
│   ├── utils/          # 工具函数
│   │   └── control.ts  # 控制算法核心
│   └── App.vue         # 主应用组件
└── README.md
```

## 🆘 遇到问题？

### 编译错误
- 确认Node.js版本 >= 20.19
- 删除node_modules和package-lock.json后重新npm install

### 页面空白
- 检查浏览器控制台错误信息
- 确认开发服务器正常运行

### 图表不显示
- 检查ECharts是否正确加载
- 刷新页面重试

## 📬 反馈与建议

如有问题或改进建议，欢迎反馈！

---
祝实验愉快！🎓
