/**
 * 直流电机模型类
 */
export class DCMotor {
  // 电机参数
  private R: number  // 电枢电阻 (Ω)
  private L: number  // 电枢电感 (H)
  private Kt: number // 转矩常数 (N·m/A)
  private Ke: number // 反电动势常数 (V·s/rad)
  private J: number  // 转动惯量 (kg·m²)
  private b: number  // 粘滞摩擦系数 (N·m·s/rad)
  
  // 状态变量
  public current: number = 0  // 电流 (A)
  public speed: number = 0    // 角速度 (rad/s)
  public position: number = 0 // 角位置 (rad)
  
  private dt: number

  constructor(
    R: number = 1.0,
    L: number = 0.5,
    Kt: number = 0.01,
    Ke: number = 0.01,
    J: number = 0.01,
    b: number = 0.1,
    dt: number = 0.001
  ) {
    this.R = R
    this.L = L
    this.Kt = Kt
    this.Ke = Ke
    this.J = J
    this.b = b
    this.dt = dt
  }

  /**
   * 更新电机状态
   * @param voltage 施加电压 (V)
   * @param loadTorque 负载转矩 (N·m)
   */
  update(voltage: number, loadTorque: number = 0): void {
    // 反电动势
    const backEmf = this.Ke * this.speed
    
    // 电流变化率 (di/dt)
    const diDt = (voltage - backEmf - this.R * this.current) / this.L
    
    // 电磁转矩
    const torque = this.Kt * this.current
    
    // 角速度变化率 (dω/dt)
    const dwDt = (torque - this.b * this.speed - loadTorque) / this.J
    
    // 更新状态
    this.current += diDt * this.dt
    this.speed += dwDt * this.dt
    this.position += this.speed * this.dt
    
    // 限制电流
    this.current = Math.max(-50, Math.min(50, this.current))
  }

  /**
   * 重置电机状态
   */
  reset(): void {
    this.current = 0
    this.speed = 0
    this.position = 0
  }

  /**
   * 获取转速 (RPM)
   */
  getSpeedRPM(): number {
    return this.speed * 60 / (2 * Math.PI)
  }

  /**
   * 获取位置 (度)
   */
  getPositionDegree(): number {
    return this.position * 180 / Math.PI
  }
}
