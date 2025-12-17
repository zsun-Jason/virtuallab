<template>
  <div class="dc-motor">
    <h2>直流电机控制实验</h2>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <h3>控制模式</h3>
          </template>
          
          <el-radio-group v-model="controlMode" @change="onModeChange">
            <el-radio label="speed">速度控制</el-radio>
            <el-radio label="position">位置控制</el-radio>
            <el-radio label="voltage">直接电压控制</el-radio>
          </el-radio-group>
          
          <el-divider />
          
          <el-form label-width="100px">
            <template v-if="controlMode === 'speed'">
              <el-form-item label="目标转速">
                <el-input-number v-model="targetSpeed" :min="0" :max="3000" :step="10" />
                <span class="hint">RPM</span>
              </el-form-item>
              
              <h4 style="margin-top: 20px;">PID参数</h4>
              <el-form-item label="Kp">
                <el-slider v-model="speedPID.kp" :min="0" :max="2" :step="0.01" show-input />
              </el-form-item>
              <el-form-item label="Ki">
                <el-slider v-model="speedPID.ki" :min="0" :max="1" :step="0.01" show-input />
              </el-form-item>
              <el-form-item label="Kd">
                <el-slider v-model="speedPID.kd" :min="0" :max="0.5" :step="0.01" show-input />
              </el-form-item>
            </template>
            
            <template v-else-if="controlMode === 'position'">
              <el-form-item label="目标位置">
                <el-input-number v-model="targetPosition" :min="0" :max="360" :step="10" />
                <span class="hint">度</span>
              </el-form-item>
              
              <h4 style="margin-top: 20px;">PID参数</h4>
              <el-form-item label="Kp">
                <el-slider v-model="positionPID.kp" :min="0" :max="5" :step="0.1" show-input />
              </el-form-item>
              <el-form-item label="Ki">
                <el-slider v-model="positionPID.ki" :min="0" :max="2" :step="0.1" show-input />
              </el-form-item>
              <el-form-item label="Kd">
                <el-slider v-model="positionPID.kd" :min="0" :max="1" :step="0.1" show-input />
              </el-form-item>
            </template>
            
            <template v-else>
              <el-form-item label="输入电压">
                <el-slider v-model="inputVoltage" :min="0" :max="24" :step="0.1" show-input />
                <span class="hint">V</span>
              </el-form-item>
            </template>
            
            <el-divider />
            
            <el-form-item label="负载转矩">
              <el-slider v-model="loadTorque" :min="0" :max="1" :step="0.05" show-input />
              <span class="hint">N·m</span>
            </el-form-item>
          </el-form>
          
          <div style="padding: 20px 40px;">
            <el-button 
              type="primary" 
              size="default"
              @click="startSimulation" 
              :disabled="isRunning"
              style="width: 100%; height: 40px; display: block; margin: 0 0 10px 0; padding: 0;"
            >
              {{ isRunning ? '运行中...' : '开始运行' }}
            </el-button>
            <el-button 
              size="default"
              @click="stopSimulation" 
              :disabled="!isRunning"
              style="width: 100%; height: 40px; display: block; margin: 0 0 10px 0; padding: 0;"
            >
              停止
            </el-button>
            <el-button 
              size="default"
              @click="resetSimulation"
              style="width: 100%; height: 40px; display: block; margin: 0; padding: 0;"
            >
              重置
            </el-button>
          </div>
          
          <el-divider />
          
          <div class="system-info">
            <h4>电机状态</h4>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="转速">{{ currentSpeed.toFixed(1) }} RPM</el-descriptions-item>
              <el-descriptions-item label="位置">{{ currentPosition.toFixed(1) }}°</el-descriptions-item>
              <el-descriptions-item label="电流">{{ motorCurrent.toFixed(3) }} A</el-descriptions-item>
              <el-descriptions-item label="电压">{{ appliedVoltage.toFixed(2) }} V</el-descriptions-item>
              <el-descriptions-item label="输出功率">{{ outputPower.toFixed(2) }} W</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
            <h3>电机动画</h3>
          </template>
          <div class="motor-container">
            <canvas ref="motorCanvas" width="400" height="400"></canvas>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>响应曲线</h3>
          </template>
          <div ref="chartRef" style="width: 100%; height: 350px;"></div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>实验说明</h3>
          </template>
          <el-alert type="info" :closable="false">
            <p><strong>控制模式说明：</strong></p>
            <p>• <strong>速度控制</strong>：使用PID控制器维持目标转速，常用于风扇、泵等应用</p>
            <p>• <strong>位置控制</strong>：精确控制电机旋转角度，常用于机器人关节、舵机</p>
            <p>• <strong>直接电压控制</strong>：开环控制，观察电机的基本特性</p>
            <p><strong>参数影响：</strong></p>
            <p>• 负载转矩增大会降低转速，需要控制器补偿</p>
            <p>• 调大Kp可加快响应，但过大会振荡</p>
            <p>• Ki可消除稳态误差，Kd可减少超调</p>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 实验指导手册 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <h3>📖 实验指导手册</h3>
          </template>
          
          <el-collapse v-model="activeSteps" accordion>
            <el-collapse-item title="📚 实验目的与原理" name="1">
              <div style="padding: 10px;">
                <h4 style="color: #409EFF; margin-top: 0;">一、实验目的</h4>
                <p>1. 理解直流电机的基本工作原理和数学模型</p>
                <p>2. 掌握电机速度控制和位置控制的实现方法</p>
                <p>3. 学习PID控制器在电机控制中的应用</p>
                <p>4. 观察负载扰动对系统性能的影响</p>
                
                <h4 style="color: #409EFF;">二、直流电机模型</h4>
                <p><strong>电气方程：</strong>V = R·i + L·di/dt + Ke·ω</p>
                <p><strong>机械方程：</strong>J·dω/dt = Kt·i - B·ω - TL</p>
                <p>其中：V-电压，i-电流，ω-角速度，TL-负载转矩</p>
                <p><strong>• Ke（反电动势常数）：</strong>转速越高，反电动势越大，限制电流增长</p>
                <p><strong>• Kt（转矩常数）：</strong>电流产生转矩的效率</p>
                <p><strong>• J（转动惯量）：</strong>影响加速性能，J越大启动越慢</p>
                <p><strong>• B（摩擦系数）：</strong>机械阻尼，消耗能量</p>
                <p style="background: #f0f9ff; padding: 10px; border-left: 4px solid #409EFF;">
                  <strong>关键特性：</strong>直流电机是一阶惯性系统，无超调特性。但在位置控制时，系统变为二阶系统，可能产生超调和振荡。
                </p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="🔬 实验步骤（三种模式）" name="2">
              <div style="padding: 10px;">
                <h4 style="color: #67C23A; margin-top: 0;">模式一：直接电压控制（开环控制）</h4>
                <p><strong>步骤1：观察电机基本特性</strong></p>
                <p>• 选择"直接电压控制"模式</p>
                <p>• 将负载转矩设为0</p>
                <p>• 调节输入电压从0V→6V→12V→24V，观察转速变化</p>
                <p><strong>观察：</strong>电压与转速近似线性关系，但存在启动延迟</p>
                
                <p><strong>步骤2：负载扰动测试</strong></p>
                <p>• 固定电压12V</p>
                <p>• 在运行过程中逐步增大负载转矩（0→0.2→0.5→0.8）</p>
                <p><strong>观察：</strong>负载增大导致转速下降，开环控制无法补偿</p>
                <p style="background: #fff3cd; padding: 8px; border-radius: 4px;">
                  💡 <strong>结论：</strong>开环控制无法抵抗扰动，转速会随负载变化而波动
                </p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">模式二：速度控制（闭环PID控制）</h4>
                <p><strong>步骤1：基本速度控制</strong></p>
                <p>• 选择"速度控制"模式</p>
                <p>• 设置目标转速1000 RPM</p>
                <p>• 使用默认PID参数（Kp=0.5, Ki=0.1, Kd=0.05）</p>
                <p>• 负载设为0，点击"开始运行"</p>
                <p><strong>观察：</strong>转速快速达到目标值并稳定</p>
                
                <p><strong>步骤2：抗扰动能力测试</strong></p>
                <p>• 保持转速1000 RPM运行</p>
                <p>• 运行中逐步增大负载转矩（0→0.5→1.0）</p>
                <p><strong>观察：</strong>PID控制器自动调整电压，转速基本保持不变</p>
                <p><strong>对比：</strong>与开环控制相比，闭环控制具有强抗扰性</p>
                
                <p><strong>步骤3：PID参数整定</strong></p>
                <p>• 目标转速2000 RPM，负载0.3 N·m</p>
                <p>• 测试不同Kp值（0.2/0.5/1.0/1.5），观察响应速度和振荡</p>
                <p>• 固定Kp=0.5，测试Ki（0/0.1/0.3），观察稳态误差消除</p>
                <p>• 测试Kd（0/0.05/0.1），观察超调抑制效果</p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">模式三：位置控制（精确定位）</h4>
                <p><strong>步骤1：基本位置控制</strong></p>
                <p>• 选择"位置控制"模式</p>
                <p>• 设置目标位置90°</p>
                <p>• 使用默认参数（Kp=2.0, Ki=0.5, Kd=0.3）</p>
                <p><strong>观察：</strong>电机从0°旋转到90°并停止，可能有小幅振荡</p>
                
                <p><strong>步骤2：连续定位测试</strong></p>
                <p>• 依次设置目标位置：90°→180°→270°→360°→0°</p>
                <p>• 观察每次定位的精度和稳定时间</p>
                <p><strong>分析：</strong>位置控制是速度控制的积分，系统阶数升高</p>
                
                <p><strong>步骤3：参数优化</strong></p>
                <p>• 目标180°，分别测试：</p>
                <p>  - Kp过小（0.5）：响应慢，定位时间长</p>
                <p>  - Kp过大（5.0）：超调振荡</p>
                <p>  - 最优组合：Kp=2.0, Ki=0.5, Kd=0.3</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="📊 实验报告要求" name="3">
              <div style="padding: 10px;">
                <h4 style="color: #E6A23C; margin-top: 0;">需记录与分析的内容：</h4>
                <p><strong>1. 三种控制模式对比表</strong></p>
                <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                  <thead>
                    <tr style="background: #f5f7fa;">
                      <th style="border: 1px solid #ddd; padding: 8px;">控制模式</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">响应时间</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">稳态误差</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">抗扰性</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">适用场景</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">直接电压控制</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">速度控制</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">位置控制</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                  </tbody>
                </table>
                
                <p><strong>2. 必答思考题</strong></p>
                <p>① 为什么直接电压控制下，负载增大会导致转速下降？从电机方程解释</p>
                <p>② 速度控制时，为什么需要积分项Ki？如果Ki=0会怎样？</p>
                <p>③ 位置控制比速度控制更容易振荡的原因是什么？（提示：系统阶数）</p>
                <p>④ 实际应用中，如何选择速度控制还是位置控制？举例说明</p>
                
                <p><strong>3. 性能指标记录</strong></p>
                <p>• 速度控制（目标1500 RPM，负载0.5 N·m）：</p>
                <p>  - 调节时间：___s</p>
                <p>  - 稳态误差：___RPM</p>
                <p>  - 最优PID参数：Kp=___, Ki=___, Kd=___</p>
                <p>• 位置控制（目标180°）：</p>
                <p>  - 定位时间：___s</p>
                <p>  - 位置误差：___°</p>
                <p>  - 超调量：___%</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="💡 扩展挑战" name="4">
              <div style="padding: 10px;">
                <h4 style="color: #F56C6C; margin-top: 0;">高级任务：</h4>
                <p><strong>挑战1：负载突变响应</strong></p>
                <p>• 速度控制模式下，记录负载从0突变到1.0 N·m的瞬态响应</p>
                <p>• 分析PID控制器的补偿过程（电压如何变化）</p>
                
                <p><strong>挑战2：轨迹跟踪</strong></p>
                <p>• 位置控制模式，设计一个往返运动：0°→360°→0°→360°...</p>
                <p>• 优化PID参数，使每次定位时间最短且无超调</p>
                
                <p><strong>挑战3：能效分析</strong></p>
                <p>• 对比不同控制模式下的平均功耗</p>
                <p>• 思考：如何在保证性能的同时降低能耗？</p>
                
                <p><strong>挑战4：前馈控制</strong></p>
                <p>• 研究前馈控制原理（负载补偿）</p>
                <p>• 设计方案：如何利用已知负载信息改善控制性能？</p>
                
                <p style="background: #fef0f0; padding: 10px; border-left: 4px solid #F56C6C; margin-top: 15px;">
                  <strong>⚠️ 工程应用思考：</strong><br>
                  电机控制是工业自动化的核心技术。思考：在机器人关节、数控机床、电动汽车等应用中，电机控制面临哪些特殊挑战？如何解决？
                </p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import * as echarts from 'echarts'
import { DCMotor } from '../utils/motor'
import { PIDController } from '../utils/control'

const motorCanvas = ref<HTMLCanvasElement | null>(null)
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let animationId: number | null = null

const activeSteps = ref([])  // 默认全部收起

const controlMode = ref<'speed' | 'position' | 'voltage'>('speed')
const targetSpeed = ref(1000) // RPM
const targetPosition = ref(180) // 度
const inputVoltage = ref(12) // V
const loadTorque = ref(0) // N·m

const speedPID = reactive({ kp: 0.5, ki: 0.1, kd: 0.05 })
const positionPID = reactive({ kp: 2.0, ki: 0.5, kd: 0.3 })

const isRunning = ref(false)
const currentSpeed = ref(0)
const currentPosition = ref(0)
const motorCurrent = ref(0)
const appliedVoltage = ref(0)

const timeData = ref<number[]>([])
const speedData = ref<number[]>([])
const targetData = ref<number[]>([])
const voltageData = ref<number[]>([])

let motor: DCMotor | null = null
let pidController: PIDController | null = null
let time = 0
const dt = 0.001
let frameCount = 0

const outputPower = computed(() => {
  return appliedVoltage.value * motorCurrent.value
})

onMounted(() => {
  initChart()
  drawMotor(0)
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }
}

const updateChart = () => {
  if (!chart) return
  
  const series: any[] = []
  
  if (controlMode.value === 'speed') {
    series.push(
      {
        name: '目标转速',
        type: 'line',
        data: targetData.value,
        lineStyle: { type: 'dashed' },
        itemStyle: { color: '#67C23A' },
        showSymbol: false
      },
      {
        name: '实际转速',
        type: 'line',
        data: speedData.value,
        itemStyle: { color: '#409EFF' },
        showSymbol: false
      }
    )
  } else if (controlMode.value === 'position') {
    series.push(
      {
        name: '目标位置',
        type: 'line',
        data: targetData.value,
        lineStyle: { type: 'dashed' },
        itemStyle: { color: '#67C23A' },
        showSymbol: false
      },
      {
        name: '实际位置',
        type: 'line',
        data: speedData.value,
        itemStyle: { color: '#409EFF' },
        showSymbol: false
      }
    )
  } else {
    series.push(
      {
        name: '转速',
        type: 'line',
        data: speedData.value,
        itemStyle: { color: '#409EFF' },
        showSymbol: false
      },
      {
        name: '电压',
        type: 'line',
        data: voltageData.value,
        yAxisIndex: 1,
        itemStyle: { color: '#E6A23C' },
        showSymbol: false
      }
    )
  }
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: series.map(s => s.name)
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: timeData.value,
      name: '时间 (s)'
    },
    yAxis: controlMode.value === 'voltage' ? [
      {
        type: 'value',
        name: 'RPM'
      },
      {
        type: 'value',
        name: '电压 (V)'
      }
    ] : {
      type: 'value',
      name: controlMode.value === 'speed' ? 'RPM' : '度'
    },
    series
  }
  
  chart.setOption(option)
}

const drawMotor = (angle: number) => {
  if (!motorCanvas.value) return
  
  const canvas = motorCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const centerX = canvas.width / 2
  const centerY = canvas.height / 2
  
  // 绘制电机外壳
  ctx.fillStyle = '#909399'
  ctx.beginPath()
  ctx.arc(centerX, centerY, 120, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.fillStyle = '#DCDFE6'
  ctx.beginPath()
  ctx.arc(centerX, centerY, 110, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制转子
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(angle)
  
  // 磁极
  for (let i = 0; i < 4; i++) {
    ctx.save()
    ctx.rotate((Math.PI / 2) * i)
    
    ctx.fillStyle = i % 2 === 0 ? '#F56C6C' : '#409EFF'
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.arc(0, 0, 90, -Math.PI / 8, Math.PI / 8)
    ctx.closePath()
    ctx.fill()
    
    ctx.restore()
  }
  
  // 转轴
  ctx.fillStyle = '#303133'
  ctx.beginPath()
  ctx.arc(0, 0, 20, 0, Math.PI * 2)
  ctx.fill()
  
  ctx.restore()
  
  // 绘制指示线
  ctx.save()
  ctx.translate(centerX, centerY)
  ctx.rotate(angle)
  
  ctx.strokeStyle = '#F56C6C'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, -80)
  ctx.stroke()
  
  ctx.restore()
  
  // 显示角度
  ctx.fillStyle = '#303133'
  ctx.font = '16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`${currentPosition.value.toFixed(1)}°`, centerX, centerY + 160)
  ctx.fillText(`${currentSpeed.value.toFixed(0)} RPM`, centerX, centerY + 180)
}

const onModeChange = () => {
  resetSimulation()
}

const startSimulation = () => {
  if (isRunning.value) return
  
  motor = new DCMotor(1.0, 0.5, 0.01, 0.01, 0.01, 0.1, dt)
  
  if (controlMode.value !== 'voltage') {
    const params = controlMode.value === 'speed' ? speedPID : positionPID
    pidController = new PIDController(params.kp, params.ki, params.kd, dt)
  }
  
  isRunning.value = true
  time = 0
  frameCount = 0
  
  simulate()
}

const simulate = () => {
  if (!isRunning.value || !motor) return
  
  let voltage = 0
  
  if (controlMode.value === 'voltage') {
    voltage = inputVoltage.value
  } else if (controlMode.value === 'speed' && pidController) {
    pidController.updateParameters(speedPID.kp, speedPID.ki, speedPID.kd)
    voltage = pidController.compute(targetSpeed.value, motor.getSpeedRPM())
    voltage = Math.max(0, Math.min(24, voltage))
  } else if (controlMode.value === 'position' && pidController) {
    pidController.updateParameters(positionPID.kp, positionPID.ki, positionPID.kd)
    voltage = pidController.compute(targetPosition.value, motor.getPositionDegree())
    voltage = Math.max(0, Math.min(24, voltage))
  }
  
  motor.update(voltage, loadTorque.value)
  
  currentSpeed.value = motor.getSpeedRPM()
  currentPosition.value = motor.getPositionDegree() % 360
  motorCurrent.value = motor.current
  appliedVoltage.value = voltage
  
  // 记录数据（降采样）
  frameCount++
  if (frameCount % 50 === 0) {
    timeData.value.push(Number(time.toFixed(2)))
    speedData.value.push(
      controlMode.value === 'position' 
        ? parseFloat(currentPosition.value.toFixed(1))
        : parseFloat(currentSpeed.value.toFixed(1))
    )
    
    if (controlMode.value === 'speed') {
      targetData.value.push(targetSpeed.value)
    } else if (controlMode.value === 'position') {
      targetData.value.push(targetPosition.value)
    } else {
      voltageData.value.push(parseFloat(appliedVoltage.value.toFixed(2)))
    }
    
    if (timeData.value.length > 200) {
      timeData.value.shift()
      speedData.value.shift()
      targetData.value.shift()
      voltageData.value.shift()
    }
    
    updateChart()
  }
  
  drawMotor((motor.position % (2 * Math.PI)))
  
  time += dt
  
  if (time < 10) {
    animationId = requestAnimationFrame(simulate)
  } else {
    isRunning.value = false
  }
}

const stopSimulation = () => {
  isRunning.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
}

const resetSimulation = () => {
  stopSimulation()
  timeData.value = []
  speedData.value = []
  targetData.value = []
  voltageData.value = []
  currentSpeed.value = 0
  currentPosition.value = 0
  motorCurrent.value = 0
  appliedVoltage.value = 0
  time = 0
  frameCount = 0
  drawMotor(0)
  updateChart()
}
</script>

<style scoped>
.dc-motor {
  padding: 0;
}

h2, h3, h4 {
  color: #303133;
}

h2 {
  margin: 0 0 20px 0;
}

h3, h4 {
  margin: 0;
  font-size: 16px;
}

h4 {
  font-size: 14px;
  color: #606266;
}

.motor-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 4px;
}

canvas {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.system-info {
  margin-top: 20px;
}

.hint {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
</style>
