# 自动化测试文档

## 测试概述

本项目包含完整的自动化测试套件，用于验证自动化控制算法和物理模型的正确性。

## 测试结构

```
tests/
├── unit/                      # 单元测试
│   ├── control.test.ts        # PID控制器和一阶系统测试（14个测试）
│   ├── motor.test.ts          # 直流电机模型测试（11个测试）
│   ├── temperature.test.ts    # 温度系统测试（10个测试）
│   └── pendulum.test.ts       # 倒立摆和LQR控制器测试（17个测试）
└── integration/               # 集成测试
    └── system.test.ts         # 闭环系统集成测试（6个测试）
```

## 运行测试

### 基本命令

```bash
# 运行所有测试
npm test

# 监视模式（自动重新运行）
npm run test:watch

# 可视化界面
npm run test:ui

# 生成覆盖率报告
npm run test:coverage
```

### 运行特定测试

```bash
# 只运行单元测试
npm test -- tests/unit

# 只运行集成测试
npm test -- tests/integration

# 运行特定文件
npm test -- control.test.ts
```

## 测试覆盖范围

### 单元测试（52个测试用例）

#### 1. PIDController测试（7个测试）
- ✓ 初始化验证
- ✓ 纯比例控制（Kp=1，error=10 → output=10）
- ✓ 积分项累积
- ✓ 稳态时积分不变
- ✓ 微分项响应误差变化率
- ✓ reset清零累积项
- ✓ updateParameters更新增益

#### 2. FirstOrderSystem测试（4个测试）
- ✓ 初始化验证
- ✓ 阶跃响应渐近特性
- ✓ 时间常数对响应速度的影响
- ✓ reset清零状态

#### 3. DCMotor测试（11个测试）
- ✓ 初始化验证
- ✓ 零电压静止状态
- ✓ 正电压加速
- ✓ 负电压反转
- ✓ 稳态收敛
- ✓ 负载对速度的影响
- ✓ 位置积分
- ✓ 电流与转矩关系
- ✓ 反电动势限速
- ✓ reset归零
- ✓ RPM单位转换

#### 4. TemperatureSystem测试（10个测试）
- ✓ 初始化验证
- ✓ 无加热保持环境温度
- ✓ 加热功率上升
- ✓ 热平衡状态
- ✓ 冷却过程
- ✓ 传感器延迟特性
- ✓ 环境温度影响
- ✓ 功率-温升线性关系
- ✓ reset重置
- ✓ 测量噪声特性

#### 5. InvertedPendulum测试（9个测试）
- ✓ 初始化验证
- ✓ 无控制不稳定性
- ✓ 控制力影响
- ✓ 小车运动方向
- ✓ 位置限制（±2m）
- ✓ reset重置
- ✓ getState状态向量

#### 6. LQRController测试（8个测试）
- ✓ 初始化验证
- ✓ 平衡点零控制力
- ✓ 摆角正偏→正向力
- ✓ 摆角负偏→负向力
- ✓ 位置正偏→负向力（拉回）
- ✓ 位置负偏→正向力（拉回）
- ✓ 控制力限幅（±100N）
- ✓ 增益调节效果

### 集成测试（6个测试）

#### 1. 电机闭环速度控制（2个测试）
- ✓ PID速度跟踪（±5%误差）
- ✓ 负载扰动补偿（保持90%以上）

#### 2. 温度闭环控制（2个测试）
- ✓ PI消除稳态误差（±2°C）
- ✓ 环境扰动补偿

#### 3. 性能指标（2个测试）
- ✓ 超调量计算（<50%）
- ✓ 稳定时间识别（<5s）

## 测试通过标准

### 控制性能指标
- **稳态误差**: <5%
- **超调量**: <50%
- **稳定时间**: <5秒
- **负载扰动抑制**: 保持目标值90%以上

### 物理模型精度
- **数值稳定性**: 使用RK4积分保证精度
- **能量守恒**: 电机模型满足功率平衡
- **热力学定律**: 温度系统满足能量守恒

## 故障排除

### 常见问题

1. **测试失败："Cannot find module '@/utils/...'**
   ```bash
   # 检查vitest.config.ts中的alias配置
   # 确保@指向src目录
   ```

2. **测试超时**
   ```bash
   # 增加超时时间
   npm test -- --testTimeout=10000
   ```

3. **数值精度问题**
   ```typescript
   // 使用toBeCloseTo而不是toBe
   expect(value).toBeCloseTo(expected, decimals)
   ```

## 持续集成

测试可集成到CI/CD流程：

```yaml
# .github/workflows/test.yml 示例
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

## 未来扩展计划

- [ ] 添加Vue组件测试
- [ ] 添加E2E测试（Playwright）
- [ ] 添加性能基准测试
- [ ] 增加代码覆盖率到90%+
- [ ] 添加快照测试
- [ ] 添加压力测试

## 贡献指南

添加新测试时请遵循：

1. **测试命名**: 使用描述性的中文名称
2. **AAA模式**: Arrange-Act-Assert结构
3. **独立性**: 每个测试应能独立运行
4. **可重复性**: 测试结果应稳定可靠
5. **覆盖边界**: 包含边界条件和异常情况

## 联系方式

如有问题或建议，请联系项目维护者或提交Issue。
