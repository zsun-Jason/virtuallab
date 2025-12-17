/**
 * 直流电机模型单元测试
 * 测试电机物理模型的动态响应
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { DCMotor } from '@/utils/motor'

describe('DCMotor', () => {
  let motor: DCMotor

  beforeEach(() => {
    motor = new DCMotor(1.0, 0.5, 0.01, 0.01, 0.01, 0.1, 0.001)
  })

  it('应正确初始化电机参数', () => {
    expect(motor).toBeDefined()
    expect(motor.speed).toBe(0)
    expect(motor.current).toBe(0)
    expect(motor.position).toBe(0)
  })

  it('无输入电压时，电机速度应保持为0（静止状态）', () => {
    for (let i = 0; i < 100; i++) {
      motor.update(0, 0)
    }
    expect(Math.abs(motor.speed)).toBeLessThan(0.1)
  })

  it('施加正电压，电机应加速（速度为正）', () => {
    for (let i = 0; i < 100; i++) {
      motor.update(12, 0) // 12V电压，无负载
    }
    expect(motor.speed).toBeGreaterThan(0)
  })

  it('施加负电压，电机应反转（速度为负）', () => {
    for (let i = 0; i < 100; i++) {
      motor.update(-12, 0)
    }
    expect(motor.speed).toBeLessThan(0)
  })

  it('稳态时，速度应收敛到平衡值', () => {
    for (let i = 0; i < 500; i++) {
      motor.update(12, 0)
    }
    const speed1 = motor.speed
    for (let i = 0; i < 100; i++) {
      motor.update(12, 0)
    }
    const speed2 = motor.speed
    // 稳态时速度变化应很小
    expect(Math.abs(speed2 - speed1)).toBeLessThan(5)
  })

  it('负载增大，稳态速度应下降', () => {
    // 无负载运行
    for (let i = 0; i < 500; i++) {
      motor.update(12, 0)
    }
    const speedNoLoad = motor.speed

    // 重置并施加负载
    motor.reset()
    for (let i = 0; i < 500; i++) {
      motor.update(12, 0.5) // 0.5 N·m负载
    }
    const speedWithLoad = motor.speed

    expect(speedWithLoad).toBeLessThan(speedNoLoad)
  })

  it('电机位置应随时间积分（速度的积分）', () => {
    for (let i = 0; i < 100; i++) {
      motor.update(12, 0)
    }
    const position1 = motor.position
    for (let i = 0; i < 100; i++) {
      motor.update(12, 0)
    }
    const position2 = motor.position
    // 位置应持续增加
    expect(position2).toBeGreaterThan(position1)
  })

  it('电机电流应与电压正相关', () => {
    for (let i = 0; i < 100; i++) {
      motor.update(24, 0) // 高电压
    }
    expect(motor.current).toBeGreaterThan(0)
  })

  it('反电动势应限制最大速度', () => {
    // 长时间高电压运行
    for (let i = 0; i < 1000; i++) {
      motor.update(24, 0)
    }
    // 速度应该有上限（不会无限增长）
    expect(motor.speed).toBeLessThan(5000) // 合理的上限
    expect(motor.speed).toBeGreaterThan(0)
  })

  it('reset应将所有状态归零', () => {
    for (let i = 0; i < 100; i++) {
      motor.update(12, 0)
    }
    motor.reset()
    expect(motor.speed).toBe(0)
    expect(motor.current).toBe(0)
    expect(motor.position).toBe(0)
  })

  it('getSpeedRPM应正确转换转速单位', () => {
    for (let i = 0; i < 100; i++) {
      motor.update(12, 0)
    }
    const rpm = motor.getSpeedRPM()
    const radPerSec = motor.speed
    const expectedRpm = radPerSec * 60 / (2 * Math.PI)
    expect(rpm).toBeCloseTo(expectedRpm, 1)
  })
})
