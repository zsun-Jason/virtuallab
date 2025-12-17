/**
 * PID控制器工具类
 */
export class PIDController {
  private kp: number // 比例增益
  private ki: number // 积分增益
  private kd: number // 微分增益
  private integral: number = 0
  private previousError: number = 0
  private dt: number

  constructor(kp: number, ki: number, kd: number, dt: number = 0.01) {
    this.kp = kp
    this.ki = ki
    this.kd = kd
    this.dt = dt
  }

  /**
   * 计算PID输出
   * @param setpoint 设定值
   * @param measurement 测量值
   * @returns 控制输出
   */
  compute(setpoint: number, measurement: number): number {
    const error = setpoint - measurement
    
    // 积分项
    this.integral += error * this.dt
    
    // 微分项
    const derivative = (error - this.previousError) / this.dt
    
    // PID输出
    const output = this.kp * error + this.ki * this.integral + this.kd * derivative
    
    this.previousError = error
    
    return output
  }

  /**
   * 重置PID控制器
   */
  reset(): void {
    this.integral = 0
    this.previousError = 0
  }

  /**
   * 更新PID参数
   */
  updateParameters(kp: number, ki: number, kd: number): void {
    this.kp = kp
    this.ki = ki
    this.kd = kd
    this.reset()
  }
}

/**
 * 一阶系统模拟
 */
export class FirstOrderSystem {
  private state: number = 0
  private timeConstant: number
  private gain: number
  private dt: number

  constructor(timeConstant: number, gain: number = 1, dt: number = 0.01) {
    this.timeConstant = timeConstant
    this.gain = gain
    this.dt = dt
  }

  /**
   * 更新系统状态
   * @param input 输入值
   * @returns 当前输出
   */
  update(input: number): number {
    const alpha = this.dt / (this.timeConstant + this.dt)
    this.state = this.state + alpha * (this.gain * input - this.state)
    return this.state
  }

  /**
   * 获取当前状态
   */
  getState(): number {
    return this.state
  }

  /**
   * 重置系统状态
   */
  reset(): void {
    this.state = 0
  }
}

/**
 * 传递函数计算工具
 */
export class TransferFunction {
  /**
   * 计算频率响应
   * @param num 分子多项式系数
   * @param den 分母多项式系数
   * @param frequencies 频率数组
   */
  static frequencyResponse(
    num: number[],
    den: number[],
    frequencies: number[]
  ): { magnitude: number[]; phase: number[] } {
    const magnitude: number[] = []
    const phase: number[] = []

    frequencies.forEach(freq => {
      const omega = 2 * Math.PI * freq
      const s = { re: 0, im: omega }

      // 计算分子
      let numVal = { re: 0, im: 0 }
      num.forEach((coef, i) => {
        const power = num.length - 1 - i
        const sPower = this.complexPower(s, power)
        numVal.re += coef * sPower.re
        numVal.im += coef * sPower.im
      })

      // 计算分母
      let denVal = { re: 0, im: 0 }
      den.forEach((coef, i) => {
        const power = den.length - 1 - i
        const sPower = this.complexPower(s, power)
        denVal.re += coef * sPower.re
        denVal.im += coef * sPower.im
      })

      // H(jω) = 分子 / 分母
      const result = this.complexDivide(numVal, denVal)

      magnitude.push(20 * Math.log10(this.complexMagnitude(result)))
      phase.push((Math.atan2(result.im, result.re) * 180) / Math.PI)
    })

    return { magnitude, phase }
  }

  private static complexPower(c: { re: number; im: number }, n: number) {
    if (n === 0) return { re: 1, im: 0 }
    if (n === 1) return c

    let result = c
    for (let i = 1; i < n; i++) {
      result = this.complexMultiply(result, c)
    }
    return result
  }

  private static complexMultiply(
    a: { re: number; im: number },
    b: { re: number; im: number }
  ) {
    return {
      re: a.re * b.re - a.im * b.im,
      im: a.re * b.im + a.im * b.re
    }
  }

  private static complexDivide(
    a: { re: number; im: number },
    b: { re: number; im: number }
  ) {
    const denominator = b.re * b.re + b.im * b.im
    return {
      re: (a.re * b.re + a.im * b.im) / denominator,
      im: (a.im * b.re - a.re * b.im) / denominator
    }
  }

  private static complexMagnitude(c: { re: number; im: number }): number {
    return Math.sqrt(c.re * c.re + c.im * c.im)
  }
}
