/**
 * 控制算法单元测试
 * 测试PID控制器和一阶系统
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { PIDController, FirstOrderSystem } from '@/utils/control'

describe('PIDController', () => {
  let pid: PIDController

  beforeEach(() => {
    pid = new PIDController(1.0, 0.0, 0.0, 0.01) // 纯比例控制
  })

  it('应正确初始化PID参数', () => {
    expect(pid).toBeDefined()
  })

  it('纯比例控制：误差10，Kp=1，输出应为10', () => {
    const output = pid.compute(10, 0) // setpoint=10, measurement=0, error=10
    expect(output).toBeCloseTo(10, 1)
  })

  it('积分项应随时间累积', () => {
    const pidWithI = new PIDController(1.0, 0.1, 0.0, 0.01)
    const output1 = pidWithI.compute(10, 0)
    const output2 = pidWithI.compute(10, 0)
    expect(output2).toBeGreaterThan(output1)
  })

  it('稳态时（误差为0）积分项不变', () => {
    const pidWithI = new PIDController(1.0, 0.1, 0.0, 0.01)
    pidWithI.compute(10, 0) // 先累积积分
    const output1 = pidWithI.compute(10, 10) // 误差为0
    const output2 = pidWithI.compute(10, 10) // 误差仍为0
    expect(output1).toBeCloseTo(output2, 2)
  })

  it('微分项应响应误差变化率', () => {
    const pidWithD = new PIDController(1.0, 0.0, 1.0, 0.01)
    pidWithD.compute(10, 0) // 误差从0变为10
    const output = pidWithD.compute(10, 5) // 误差变为5（误差减小）
    // 误差减小时，微分项为负，输出应小于纯比例项
    expect(output).toBeLessThan(5)
  })

  it('reset应清零所有累积项', () => {
    const pidWithI = new PIDController(1.0, 0.1, 0.0, 0.01)
    for (let i = 0; i < 10; i++) {
      pidWithI.compute(10, 0)
    }
    pidWithI.reset()
    const output = pidWithI.compute(10, 0)
    expect(output).toBeCloseTo(10, 1)
  })

  it('updateParameters应重置累积项并更新增益', () => {
    const pidWithI = new PIDController(1.0, 0.1, 0.0, 0.01)
    for (let i = 0; i < 10; i++) {
      pidWithI.compute(10, 0)
    }
    pidWithI.updateParameters(2.0, 0.2, 0.0)
    const output = pidWithI.compute(10, 0)
    expect(output).toBeCloseTo(20, 1) // 新Kp=2, error=10
  })
})

describe('FirstOrderSystem', () => {
  it('应正确初始化系统', () => {
    const system = new FirstOrderSystem(1.0, 1.0, 0.01)
    expect(system.getState()).toBe(0)
  })

  it('阶跃响应应逐渐趋近输入值', () => {
    const system = new FirstOrderSystem(1.0, 1.0, 0.01)
    system.update(10) // 第一次
    const state1 = system.getState()
    expect(state1).toBeGreaterThan(0)
    expect(state1).toBeLessThan(10)
    
    // 长时间后应趋近于10
    for (let i = 0; i < 1000; i++) {
      system.update(10)
    }
    const steadyState = system.getState()
    expect(steadyState).toBeCloseTo(10, 0)
  })

  it('时间常数越大，响应越慢', () => {
    const fastSystem = new FirstOrderSystem(0.1, 1.0, 0.01)
    const slowSystem = new FirstOrderSystem(1.0, 1.0, 0.01)
    
    for (let i = 0; i < 10; i++) {
      fastSystem.update(10)
      slowSystem.update(10)
    }
    
    expect(fastSystem.getState()).toBeGreaterThan(slowSystem.getState())
  })

  it('reset应清零系统状态', () => {
    const system = new FirstOrderSystem(1.0, 1.0, 0.01)
    for (let i = 0; i < 100; i++) {
      system.update(10)
    }
    system.reset()
    expect(system.getState()).toBe(0)
  })
})
