/**
 * 温度控制系统单元测试
 * 测试温度系统的热力学特性
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { TemperatureSystem } from '@/utils/temperature'

describe('TemperatureSystem', () => {
  let tempSystem: TemperatureSystem

  beforeEach(() => {
    tempSystem = new TemperatureSystem(1000, 10, 1000, 20, 2, 20, 0.1)
  })

  it('应正确初始化温度系统', () => {
    expect(tempSystem).toBeDefined()
    expect(tempSystem.temperature).toBeCloseTo(20, 1)
    expect(tempSystem.measuredTemp).toBeCloseTo(20, 0)
  })

  it('无加热时，温度应保持环境温度', () => {
    for (let i = 0; i < 100; i++) {
      tempSystem.update(0) // 加热功率0%
    }
    expect(tempSystem.temperature).toBeCloseTo(20, 1)
  })

  it('施加加热功率，温度应上升', () => {
    for (let i = 0; i < 100; i++) {
      tempSystem.update(50) // 50%加热
    }
    expect(tempSystem.temperature).toBeGreaterThan(20)
  })

  it('温度应有上限（热平衡状态）', () => {
    // 长时间加热达到热平衡
    for (let i = 0; i < 3000; i++) {
      tempSystem.update(100)
    }
    const temp1 = tempSystem.temperature
    // 继续加热，温度应变化很小
    for (let i = 0; i < 2000; i++) {
      tempSystem.update(100)
    }
    const temp2 = tempSystem.temperature
    // 温度变化应很小（达到热平衡）
    expect(Math.abs(temp2 - temp1)).toBeLessThan(10)
  })

  it('停止加热后，温度应逐渐下降到环境温度', () => {
    // 先加热
    for (let i = 0; i < 500; i++) {
      tempSystem.update(100)
    }
    const tempHot = tempSystem.temperature
    expect(tempHot).toBeGreaterThan(50)
    
    // 停止加热
    for (let i = 0; i < 500; i++) {
      tempSystem.update(0)
    }
    const tempCooled = tempSystem.temperature
    expect(tempCooled).toBeLessThan(tempHot)
    expect(tempCooled).toBeGreaterThan(20)
  })

  it('传感器测量应有延迟（纯滞后特性）', () => {
    // 快速加热
    for (let i = 0; i < 50; i++) {
      tempSystem.update(100)
    }
    // 实际温度应大于测量温度（测量有延迟）
    expect(tempSystem.temperature).toBeGreaterThan(tempSystem.measuredTemp)
  })

  it('环境温度改变应影响散热速率', () => {
    // 在环境温度20°C下稳定
    for (let i = 0; i < 500; i++) {
      tempSystem.update(50)
    }
    const temp1 = tempSystem.temperature

    // 降低环境温度到10°C后重新测试
    const tempSystem2 = new TemperatureSystem(1000, 10, 1000, 10, 2, 20, 0.1)
    for (let i = 0; i < 500; i++) {
      tempSystem2.update(50)
    }
    const temp2 = tempSystem2.temperature

    // 环境温度低时，相同加热功率下稳态温度应更低
    expect(temp2).toBeLessThan(temp1)
  })

  it('加热功率加倍，稳态温升应近似加倍', () => {
    // 50%功率加热到稳态
    for (let i = 0; i < 1000; i++) {
      tempSystem.update(50)
    }
    const temp1 = tempSystem.temperature
    const deltaT1 = temp1 - 20

    // 重置并用100%功率
    tempSystem.reset(20)
    for (let i = 0; i < 1000; i++) {
      tempSystem.update(100)
    }
    const temp2 = tempSystem.temperature
    const deltaT2 = temp2 - 20

    // 温升应近似加倍（考虑10%误差）
    expect(deltaT2).toBeGreaterThan(deltaT1 * 1.8)
    expect(deltaT2).toBeLessThan(deltaT1 * 2.2)
  })

  it('reset应将温度重置为初始值', () => {
    for (let i = 0; i < 500; i++) {
      tempSystem.update(100)
    }
    tempSystem.reset(25)
    expect(tempSystem.temperature).toBeCloseTo(25, 1)
    expect(tempSystem.measuredTemp).toBeCloseTo(25, 0)
  })
})
