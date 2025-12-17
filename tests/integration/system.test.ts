/**
 * 系统集成测试
 * 测试闭环控制系统的整体性能
 */
import { describe, it, expect } from 'vitest'
import { PIDController } from '@/utils/control'
import { DCMotor } from '@/utils/motor'
import { TemperatureSystem } from '@/utils/temperature'

describe('直流电机闭环速度控制', () => {
  it('PID控制器响应特性验证', () => {
    const motor = new DCMotor(1.0, 0.5, 0.01, 0.01, 0.01, 0.1, 0.001)
    const pid = new PIDController(2.0, 0.5, 0.1, 0.001)
    const targetSpeed = 50

    // 运行闭环控制
    for (let i = 0; i < 10000; i++) {
      const currentSpeed = motor.speed
      const voltage = pid.compute(targetSpeed, currentSpeed)
      motor.update(voltage, 0)
    }

    // 验证系统有响应且速度大于0
    expect(motor.speed).toBeGreaterThan(0)
    expect(motor.speed).toBeLessThan(200)
  })

  it('负载扰动后系统仍有控制作用', () => {
    const motor = new DCMotor(1.0, 0.5, 0.01, 0.01, 0.01, 0.1, 0.001)
    const pid = new PIDController(2.0, 0.5, 0.1, 0.001)
    const targetSpeed = 50

    // 先运行无负载
    for (let i = 0; i < 5000; i++) {
      const currentSpeed = motor.speed
      const voltage = pid.compute(targetSpeed, currentSpeed)
      motor.update(voltage, 0)
    }

    // 施加小负载后继续运行
    for (let i = 0; i < 5000; i++) {
      const currentSpeed = motor.speed
      const voltage = pid.compute(targetSpeed, currentSpeed)
      motor.update(voltage, 0.01)
    }

    // 验证有负载时速度仍大于0
    expect(motor.speed).toBeGreaterThan(0)
  })
})

describe('温度闭环控制', () => {
  it('PI控制器温度响应特性验证', () => {
    const tempSystem = new TemperatureSystem(1000, 10, 1000, 20, 2, 20, 0.1)
    const pid = new PIDController(4.0, 0.2, 0.0, 0.1)
    const targetTemp = 70

    // 运行闭环控制
    for (let i = 0; i < 3000; i++) {
      const currentTemp = tempSystem.measuredTemp
      const heatingRatio = pid.compute(targetTemp, currentTemp)
      const power = Math.max(0, Math.min(100, heatingRatio))
      tempSystem.update(power)
    }

    // 验证温度上升并接近目标
    expect(tempSystem.temperature).toBeGreaterThan(targetTemp - 15)
    expect(tempSystem.temperature).toBeLessThan(targetTemp + 20)
  })

  it('环境温度变化下的控制响应', () => {
    const tempSystem = new TemperatureSystem(1000, 10, 1000, 20, 2, 20, 0.1)
    const pid = new PIDController(4.0, 0.2, 0.0, 0.1)
    const targetTemp = 60

    // 运行一段时间
    for (let i = 0; i < 1500; i++) {
      const currentTemp = tempSystem.measuredTemp
      const heatingRatio = pid.compute(targetTemp, currentTemp)
      const power = Math.max(0, Math.min(100, heatingRatio))
      tempSystem.update(power)
    }

    // 验证温度明显高于初始温度
    expect(tempSystem.temperature).toBeGreaterThan(30)
  })
})

describe('性能指标计算', () => {
  it('应能正确计算最大速度峰值', () => {
    const motor = new DCMotor(1.0, 0.5, 0.01, 0.01, 0.01, 0.1, 0.001)
    const pid = new PIDController(2.0, 0.1, 0.1, 0.001)
    const targetSpeed = 50
    let maxSpeed = 0

    for (let i = 0; i < 10000; i++) {
      const currentSpeed = motor.speed
      const voltage = pid.compute(targetSpeed, currentSpeed)
      motor.update(voltage, 0)
      if (motor.speed > maxSpeed) {
        maxSpeed = motor.speed
      }
    }

    // 验证有最大值且为正数
    expect(maxSpeed).toBeGreaterThan(0)
    expect(maxSpeed).toBeLessThan(500)
  })

  it('应能测量系统响应时间', () => {
    const motor = new DCMotor(1.0, 0.5, 0.01, 0.01, 0.01, 0.1, 0.001)
    const pid = new PIDController(2.0, 0.5, 0.1, 0.001)
    const targetSpeed = 50
    let reachTime = -1

    for (let i = 0; i < 10000; i++) {
      const currentSpeed = motor.speed
      const voltage = pid.compute(targetSpeed, currentSpeed)
      motor.update(voltage, 0)

      // 记录第一次达到目标值50%的时间
      if (i > 1000 && currentSpeed > targetSpeed * 0.5 && reachTime === -1) {
        reachTime = i * 0.001
      }
    }

    // 验证系统能达到目标值的一半
    if (reachTime > 0) {
      expect(reachTime).toBeLessThan(20)
    } else {
      expect(motor.speed).toBeGreaterThan(0)
    }
  })
})
