# 🎓 高校自动化课程模拟实验平台

一个基于Web的自动化控制系统仿真平台，为高校自动化、控制工程等专业提供在线实验环境。

## ✨ 功能特性

### 完整实现的实验模块

1. **PID控制器仿真** ✅
   - 实时调节Kp、Ki、Kd参数
   - 可视化系统响应曲线
   - 自动计算系统性能指标（超调量、稳态误差等）
   - 一阶系统模拟

2. **倒立摆控制** ✅
   - LQR状态反馈控制
   - 实时Canvas动画展示
   - 四个可调增益参数
   - 物理仿真（含摩擦、惯性）
   - 状态曲线实时绘制

3. **直流电机控制** ✅
   - 三种控制模式：速度控制、位置控制、直接电压控制
   - 完整的电机物理模型
   - 实时转动动画
   - PID参数调节
   - 负载扰动仿真

4. **温度控制系统** ✅
   - 恒温箱/烘箱温度控制
   - 传感器延迟和噪声模拟
   - 温度计可视化
   - 环境温度和加热功率可调
   - PID温度调节

5. **PLC梯形图编程** ✅
   - 图形化拖拽编程
   - 常开/常闭触点、输出线圈
   - 实时运行仿真
   - I/O状态监控
   - 三个预设示例程序

6. **频域分析工具** ✅
   - Bode图绘制（幅频、相频特性）
   - Nyquist图绘制
   - 自定义传递函数
   - 预设示例系统

7. **状态空间分析** ✅
   - 1-4阶系统支持
   - 矩阵输入（A、B、C、D）
   - 特征值计算
   - 可控性、可观性判断
   - 相平面轨迹绘制
   - 多种输入信号（阶跃、脉冲、正弦）

8. **首页导航** ✅
   - 实验模块分类展示
   - 难度标识
   - 快速导航

## 🛠️ 技术栈

- **前端框架**: Vue 3 + TypeScript + Vite
- **UI组件库**: Element Plus
- **状态管理**: Pinia
- **图表库**: ECharts
- **控制算法**: 自研控制工具库
- **样式**: SCSS + Element Plus主题

## 📦 项目结构

```
virtuallab/
├── src/
│   ├── views/              # 页面视图
│   │   ├── HomeView.vue               # 首页
│   │   ├── PIDControllerView.vue      # PID控制器
│   │   ├── FrequencyAnalysisView.vue  # 频域分析
│   │   └── ...
│   ├── components/         # 可复用组件
│   ├── composables/        # 组合式函数
│   ├── stores/            # Pinia状态管理
│   │   └── experiment.ts   # 实验数据存储
│   ├── utils/             # 工具函数
│   │   └── control.ts      # 控制算法库
│   ├── router/            # 路由配置
│   ├── types/             # TypeScript类型定义
│   ├── api/               # API接口
│   └── locales/           # 国际化
├── public/                # 静态资源
└── package.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0 (推荐 20.19.0+)
- npm >= 8.0.0

**注意**: 当前系统Node.js版本为16.20.2，建议升级到20.19+以获得最佳体验。

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 生产构建

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

### 运行测试

```bash
# 运行所有测试
npm test

# 生成覆盖率报告
npm run test:coverage

# 可视化测试界面
npm run test:ui

# 监视模式
npm run test:watch
```

## 🚀 部署指南

本项目支持使用Jenkins自动部署到Ubuntu服务器。详细部署步骤请参考 [DEPLOYMENT.md](./DEPLOYMENT.md)。

### 快速部署

1. **配置Ubuntu服务器**（安装Nginx）
2. **配置Jenkins Pipeline**
3. **修改Jenkinsfile中的服务器地址**
4. **推送代码触发自动部署**

手动部署命令：

```bash
# 构建
npm run build

# 部署到服务器
scp -r dist/* user@server:/var/www/virtuallab/
```

## 📚 核心算法

### PID控制器

```typescript
class PIDController {
  compute(setpoint, measurement) {
    error = setpoint - measurement
    integral += error * dt
    derivative = (error - previousError) / dt
   x] PID控制器仿真
- [x] 倒立摆控制（Canvas 2D可视化）
- [x] 直流电机控制（三种模式）
- [x] 温度控制系统
- [x] PLC梯形图编程
- [x] 频域分析（Bode、Nyquist）
- [x] 状态空间分析
- [ ] 倒立摆3D可视化优化（Three.js）
- [ ] 添加用户系统和进度跟踪
- [ ] 实验报告导出功能（PDF）
- [ ] 多人协作实验
- [ ] 移动端适配
- [ ] 英文界面支持
- [ ] 根轨迹绘制工具
- [ ] Fuzzy控制器
- [ ] 神经网络控制
- 支持任意阶传递函数
- 自动计算频率响应
- Bode图和Nyquist图绘制

## 🎯 使用指南

### PID控制器调试建议

1. **先调比例参数Kp**: 从小到大调整，观察系统响应速度
2. **再调积分参数Ki**: 消除稳态误差
3. **最后微调微分参数Kd**: 减少超调和振荡

### 频域分析

1. 输入传递函数的分子、分母多项式系数（逗号分隔）
2. 选择绘制Bode图或Nyquist图
3. 可加载预设示例快速体验

## 🔧 开发计划

- [ ] 完善倒立摆3D可视化（Three.js）
- [ ] 添加直流电机模型
- [ ] 实现PLC梯形图编辑器
- [ ] 添加用户系统和进度跟踪
- [ ] 实验报告导出功能（PDF）
- [ ] 多人协作实验
- [ ] 移动端适配
- [ ] 英文界面支持

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

### 开发流程

1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范

- 使用TypeScript编写代码
- 遵循ESLint规则
- 添加单元测试覆盖新功能
- 确保所有测试通过 (`npm test`)

## 📄 开源协议

MIT License

## 📚 相关文档

- [测试文档](./tests/README.md)
- [部署指南](./DEPLOYMENT.md)
- [测试总结报告](./TEST_SUMMARY.md)

## 🔗 相关链接

- GitHub仓库: https://github.com/zsun-Jason/virtuallab
- 问题反馈: https://github.com/zsun-Jason/virtuallab/issues

---

**开发团队**: 大连海事大学自动化实验平台小组  
**最后更新**: 2025-12-17
测试webhook触发

# Webhook测试 Wed Dec 17 12:08:50 CST 2025
测试时间: Wed Dec 17 12:10:11 CST 2025
# 自动触发验证 - 12:13:58
webhook测试最终版 12:16:38
GitHub project配置后的测试 12:19:57
