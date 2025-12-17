/**
 * 温度控制系统模型（加热炉/恒温箱）
 */
export class TemperatureSystem {
  // 系统参数
  private thermalMass: number      // 热容 (J/°C)
  private heatLossCoeff: number    // 散热系数 (W/°C)
  private heaterPower: number      // 加热器功率 (W)
  private ambientTemp: number      // 环境温度 (°C)
  private sensorDelay: number      // 传感器延迟 (s)
  
  // 状态变量
  public temperature: number       // 当前温度 (°C)
  public measuredTemp: number      // 测量温度 (°C)
  private tempHistory: number[]    // 温度历史（用于模拟传感器延迟）
  
  private dt: number

  constructor(
    thermalMass: number = 1000,
    heatLossCoeff: number = 10,
    heaterPower: number = 500,
    ambientTemp: number = 20,
    sensorDelay: number = 2,
    initialTemp: number = 20,
    dt: number = 0.1
  ) {
    this.thermalMass = thermalMass
    this.heatLossCoeff = heatLossCoeff
    this.heaterPower = heaterPower
    this.ambientTemp = ambientTemp
    this.sensorDelay = sensorDelay
    this.temperature = initialTemp
    this.measuredTemp = initialTemp
    this.dt = dt
    
    // 初始化温度历史
    const historyLength = Math.ceil(sensorDelay / dt)
    this.tempHistory = new Array(historyLength).fill(initialTemp)
  }

  /**
   * 更新系统状态
   * @param controlSignal 控制信号 (0-100%)
   */
  update(controlSignal: number): void {
    // 限制控制信号范围
    controlSignal = Math.max(0, Math.min(100, controlSignal))
    
    // 加热功率
    const heatingPower = this.heaterPower * (controlSignal / 100)
    
    // 散热功率
    const heatLoss = this.heatLossCoeff * (this.temperature - this.ambientTemp)
    
    // 温度变化率 (dT/dt)
    const dTdt = (heatingPower - heatLoss) / this.thermalMass
    
    // 更新实际温度
    this.temperature += dTdt * this.dt
    
    // 模拟传感器延迟
    this.tempHistory.push(this.temperature)
    this.measuredTemp = this.tempHistory.shift()!
    
    // 添加测量噪声（±0.1°C）
    this.measuredTemp += (Math.random() - 0.5) * 0.2
  }

  /**
   * 重置系统
   */
  reset(initialTemp: number = 20): void {
    this.temperature = initialTemp
    this.measuredTemp = initialTemp
    const historyLength = Math.ceil(this.sensorDelay / this.dt)
    this.tempHistory = new Array(historyLength).fill(initialTemp)
  }

  /**
   * 更新环境温度
   */
  setAmbientTemperature(temp: number): void {
    this.ambientTemp = temp
  }

  /**
   * 更新加热器功率
   */
  setHeaterPower(power: number): void {
    this.heaterPower = power
  }
}
