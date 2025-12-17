/**
 * 倒立摆系统单元测试
 * 测试倒立摆物理模型和LQR控制器
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { InvertedPendulum, LQRController } from '@/utils/pendulum'

describe('InvertedPendulum', () => {
  let pendulum: InvertedPendulum

  beforeEach(() => {
    pendulum = new InvertedPendulum(1.0, 0.1, 0.5, 9.81, 0.1, 0.01)
  })

  it('应正确初始化倒立摆', () => {
    expect(pendulum).toBeDefined()
    expect(pendulum.x).toBe(0)
    expect(pendulum.xDot).toBe(0)
    expect(pendulum.theta).toBeCloseTo(0.1, 2) // 初始偏移
    expect(pendulum.thetaDot).toBe(0)
  })

  it('无控制力时，摆杆应开始倾倒（系统不稳定）', () => {
    // 多次更新，无控制力
    for (let i = 0; i < 100; i++) {
      pendulum.update(0)
    }
    // 角度应该偏离初始值（系统不稳定）
    expect(Math.abs(pendulum.theta)).toBeGreaterThan(0.1)
  })

  it('施加正确的控制力应能影响摆杆运动', () => {
    const lqr = new LQRController(1, 1, 20, 3)
    for (let i = 0; i < 100; i++) {
      const state = pendulum.getState()
      const force = lqr.compute(state)
      pendulum.update(force)
    }
    // 摆角应比无控制时小
    const controlledAngle = Math.abs(pendulum.theta)
    
    const testPendulum = new InvertedPendulum(1.0, 0.1, 0.5, 9.81, 0.1, 0.01)
    for (let i = 0; i < 100; i++) {
      testPendulum.update(0)
    }
    const uncontrolledAngle = Math.abs(testPendulum.theta)
    
    expect(controlledAngle).toBeLessThan(uncontrolledAngle)
  })

  it('小车位置应受控制力影响', () => {
    // 施加正向力
    for (let i = 0; i < 50; i++) {
      pendulum.update(10)
    }
    const x1 = pendulum.x
    expect(x1).toBeGreaterThan(0)
    
    // 重置后施加负向力
    pendulum.reset(0.1)
    for (let i = 0; i < 50; i++) {
      pendulum.update(-10)
    }
    const x2 = pendulum.x
    expect(x2).toBeLessThan(0)
  })

  it('小车位置应被限制在±2m范围内', () => {
    // 施加很大的力
    for (let i = 0; i < 500; i++) {
      pendulum.update(100)
    }
    expect(Math.abs(pendulum.x)).toBeLessThanOrEqual(2)
  })

  it('reset应将状态重置为初始值', () => {
    for (let i = 0; i < 100; i++) {
      pendulum.update(10)
    }
    pendulum.reset(0.05)
    expect(pendulum.x).toBe(0)
    expect(pendulum.xDot).toBe(0)
    expect(pendulum.theta).toBeCloseTo(0.05, 3)
    expect(pendulum.thetaDot).toBe(0)
  })

  it('getState应返回正确的状态向量', () => {
    const state = pendulum.getState()
    expect(state).toHaveLength(4)
    expect(state[0]).toBe(pendulum.x)
    expect(state[1]).toBe(pendulum.xDot)
    expect(state[2]).toBe(pendulum.theta)
    expect(state[3]).toBe(pendulum.thetaDot)
  })
})

describe('LQRController', () => {
  let lqr: LQRController

  beforeEach(() => {
    lqr = new LQRController(1, 1, 20, 3)
  })

  it('应正确初始化LQR控制器', () => {
    expect(lqr).toBeDefined()
  })

  it('系统在平衡点时，控制力应接近0', () => {
    const state: [number, number, number, number] = [0, 0, 0, 0]
    const force = lqr.compute(state)
    expect(Math.abs(force)).toBeLessThan(0.1)
  })

  it('摆杆偏右（θ>0），应施加正向力（向右推）', () => {
    const state: [number, number, number, number] = [0, 0, 0.1, 0]
    const force = lqr.compute(state)
    expect(force).toBeGreaterThan(0)
  })

  it('摆杆偏左（θ<0），应施加负向力（向左推）', () => {
    const state: [number, number, number, number] = [0, 0, -0.1, 0]
    const force = lqr.compute(state)
    expect(force).toBeLessThan(0)
  })

  it('小车偏右（x>0），位置项产生正向力', () => {
    const state: [number, number, number, number] = [1, 0, 0, 0]
    const force = lqr.compute(state)
    expect(force).toBeGreaterThan(0) // K[0]*x，x>0 => F>0
  })

  it('小车偏左（x<0），位置项产生负向力', () => {
    const state: [number, number, number, number] = [-1, 0, 0, 0]
    const force = lqr.compute(state)
    expect(force).toBeLessThan(0) // K[0]*x，x<0 => F<0
  })

  it('控制力应被限制在±100以内', () => {
    const extremeState: [number, number, number, number] = [10, 10, 1.5, 5]
    const force = lqr.compute(extremeState)
    expect(Math.abs(force)).toBeLessThanOrEqual(100)
  })

  it('增大角度增益K3，对角度偏差的响应应更强', () => {
    const lqr1 = new LQRController(1, 1, 20, 3)
    const lqr2 = new LQRController(1, 1, 40, 3) // K3加倍
    const state: [number, number, number, number] = [0, 0, 0.1, 0]
    const force1 = lqr1.compute(state)
    const force2 = lqr2.compute(state)
    expect(Math.abs(force2)).toBeGreaterThan(Math.abs(force1))
  })

  it('updateGains应更新控制器增益', () => {
    const state: [number, number, number, number] = [0, 0, 0.1, 0]
    const force1 = lqr.compute(state)
    lqr.updateGains(1, 1, 40, 3) // K3翻倍
    const force2 = lqr.compute(state)
    expect(Math.abs(force2)).toBeGreaterThan(Math.abs(force1))
  })
})
