/**
 * 倒立摆物理模型类
 */
export class InvertedPendulum {
  // 物理参数
  private M: number // 小车质量 (kg)
  private m: number // 摆杆质量 (kg)
  private L: number // 摆杆长度 (m)
  private g: number // 重力加速度 (m/s^2)
  private b: number // 摩擦系数
  
  // 状态变量
  public x: number = 0       // 小车位置 (m)
  public xDot: number = 0    // 小车速度 (m/s)
  public theta: number = 0.1 // 摆角 (rad)，初始偏移
  public thetaDot: number = 0 // 角速度 (rad/s)
  
  private dt: number

  constructor(
    M: number = 1.0,
    m: number = 0.1,
    L: number = 0.5,
    g: number = 9.81,
    b: number = 0.1,
    dt: number = 0.01
  ) {
    this.M = M
    this.m = m
    this.L = L
    this.g = g
    this.b = b
    this.dt = dt
  }

  /**
   * 更新系统状态
   * @param force 施加在小车上的力 (N)
   */
  update(force: number): void {
    // 使用RK4方法提高数值稳定性
    const k1 = this.derivative(this.x, this.xDot, this.theta, this.thetaDot, force)
    const k2 = this.derivative(
      this.x + 0.5 * this.dt * k1.xDot,
      this.xDot + 0.5 * this.dt * k1.xDotDot,
      this.theta + 0.5 * this.dt * k1.thetaDot,
      this.thetaDot + 0.5 * this.dt * k1.thetaDotDot,
      force
    )
    const k3 = this.derivative(
      this.x + 0.5 * this.dt * k2.xDot,
      this.xDot + 0.5 * this.dt * k2.xDotDot,
      this.theta + 0.5 * this.dt * k2.thetaDot,
      this.thetaDot + 0.5 * this.dt * k2.thetaDotDot,
      force
    )
    const k4 = this.derivative(
      this.x + this.dt * k3.xDot,
      this.xDot + this.dt * k3.xDotDot,
      this.theta + this.dt * k3.thetaDot,
      this.thetaDot + this.dt * k3.thetaDotDot,
      force
    )
    
    // RK4组合
    this.x += (this.dt / 6) * (k1.xDot + 2*k2.xDot + 2*k3.xDot + k4.xDot)
    this.xDot += (this.dt / 6) * (k1.xDotDot + 2*k2.xDotDot + 2*k3.xDotDot + k4.xDotDot)
    this.theta += (this.dt / 6) * (k1.thetaDot + 2*k2.thetaDot + 2*k3.thetaDot + k4.thetaDot)
    this.thetaDot += (this.dt / 6) * (k1.thetaDotDot + 2*k2.thetaDotDot + 2*k3.thetaDotDot + k4.thetaDotDot)
    
    // 限制小车位置
    this.x = Math.max(-2, Math.min(2, this.x))
  }

  /**
   * 计算导数（状态微分方程）
   */
  private derivative(_x: number, xDot: number, theta: number, thetaDot: number, force: number) {
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)
    const totalMass = this.M + this.m
    
    // 分子分母计算（标准倒立摆方程）
    const numeratorTheta = this.g * sinTheta + cosTheta * (
      (-force - this.m * this.L * thetaDot * thetaDot * sinTheta + this.b * xDot) / totalMass
    )
    const denominatorTheta = this.L * (4.0/3.0 - this.m * cosTheta * cosTheta / totalMass)
    const thetaDotDot = numeratorTheta / denominatorTheta
    
    // 小车加速度
    const xDotDot = (force + this.m * this.L * (
      thetaDot * thetaDot * sinTheta - thetaDotDot * cosTheta
    ) - this.b * xDot) / totalMass
    
    return { xDot, xDotDot, thetaDot, thetaDotDot }
  }

  /**
   * 重置系统状态
   */
  reset(initialTheta: number = 0.1): void {
    this.x = 0
    this.xDot = 0
    this.theta = initialTheta
    this.thetaDot = 0
  }

  /**
   * 获取当前状态向量
   */
  getState(): [number, number, number, number] {
    return [this.x, this.xDot, this.theta, this.thetaDot]
  }
}

/**
 * LQR控制器（状态反馈）
 */
export class LQRController {
  private K: number[] // 反馈增益矩阵

  constructor(k1: number = 1, k2: number = 1, k3: number = 20, k4: number = 3) {
    this.K = [k1, k2, k3, k4]
  }

  /**
   * 计算控制力
   * @param state 状态向量 [x, xDot, theta, thetaDot]
   * @param _target 目标位置（暂未使用）
   */
  compute(state: [number, number, number, number], _target: number = 0): number {
    const [x, xDot, theta, thetaDot] = state
    
    // 简化的控制律：主要稳定角度
    // 当theta>0(向右倾)时，需要正力F>0(向右推)
    const force = 
      (this.K[2] ?? 0) * theta +         // 角度项：theta>0 => F>0
      (this.K[3] ?? 0) * thetaDot +      // 角速度项：抑制摆动
      (this.K[0] ?? 0) * x +             // 位置项：拉回原点
      (this.K[1] ?? 0) * xDot            // 速度项：阻尼
    
    // 限制控制力
    return Math.max(-100, Math.min(100, force))
  }

  /**
   * 更新增益矩阵
   */
  updateGains(k1: number, k2: number, k3: number, k4: number): void {
    this.K = [k1, k2, k3, k4]
  }
}
