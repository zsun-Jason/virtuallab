<template>
  <div class="temperature-control">
    <h2>温度控制系统实验</h2>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <h3>控制参数</h3>
          </template>
          
          <el-form label-width="100px">
            <el-form-item label="目标温度">
              <el-input-number v-model="targetTemp" :min="20" :max="200" :step="5" />
              <span class="hint">°C</span>
            </el-form-item>
            
            <el-divider />
            
            <h4>PID参数</h4>
            <el-form-item label="Kp">
              <el-slider v-model="pidParams.kp" :min="0" :max="10" :step="0.1" show-input />
            </el-form-item>
            <el-form-item label="Ki">
              <el-slider v-model="pidParams.ki" :min="0" :max="5" :step="0.1" show-input />
            </el-form-item>
            <el-form-item label="Kd">
              <el-slider v-model="pidParams.kd" :min="0" :max="5" :step="0.1" show-input />
            </el-form-item>
            
            <el-divider />
            
            <h4>系统参数</h4>
            <el-form-item label="环境温度">
              <el-input-number v-model="ambientTemp" :min="0" :max="40" :step="1" />
              <span class="hint">°C</span>
            </el-form-item>
            
            <el-form-item label="加热功率">
              <el-input-number v-model="heaterPower" :min="100" :max="2000" :step="50" />
              <span class="hint">W</span>
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
              {{ isRunning ? '运行中...' : '开始仿真' }}
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
            <h4>系统状态</h4>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="实际温度">{{ actualTemp.toFixed(2) }}°C</el-descriptions-item>
              <el-descriptions-item label="测量温度">{{ measuredTemp.toFixed(2) }}°C</el-descriptions-item>
              <el-descriptions-item label="温度误差">{{ tempError.toFixed(2) }}°C</el-descriptions-item>
              <el-descriptions-item label="加热比例">{{ heatingRatio.toFixed(1) }}%</el-descriptions-item>
              <el-descriptions-item label="功耗">{{ powerConsumption.toFixed(1) }} W</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
            <h3>温度可视化</h3>
          </template>
          <div class="thermometer-container">
            <canvas ref="thermometerCanvas" width="600" height="400"></canvas>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>温度曲线</h3>
          </template>
          <div ref="chartRef" style="width: 100%; height: 350px;"></div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>实验说明</h3>
          </template>
          <el-alert type="info" :closable="false">
            <p><strong>温度控制系统特点：</strong></p>
            <p>• <strong>大惯性系统</strong>：温度变化缓慢，响应时间长</p>
            <p>• <strong>纯滞后</strong>：传感器测量存在延迟（2秒）</p>
            <p>• <strong>非线性</strong>：散热与温差成正比</p>
            <p><strong>PID调试建议：</strong></p>
            <p>• Kp不宜过大，否则会振荡</p>
            <p>• Ki很重要，用于消除稳态误差</p>
            <p>• Kd可以减少超调，但对测量噪声敏感</p>
            <p><strong>应用场景：</strong>恒温箱、烘箱、反应釜温度控制</p>
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
                <p>1. 理解温度控制系统的大惯性、纯滞后特性</p>
                <p>2. 掌握PID控制在温度系统中的参数整定方法</p>
                <p>3. 学会分析温度超调、振荡等现象的成因</p>
                <p>4. 体验传感器延迟对控制性能的影响</p>
                
                <h4 style="color: #409EFF;">二、温度控制系统模型</h4>
                <p><strong>热平衡方程：</strong>C·dT/dt = Q_in - Q_out</p>
                <p>• <strong>Q_in（加热功率）：</strong>Q_in = P·u(t)，其中u(t)∈[0,1]为加热比例</p>
                <p>• <strong>Q_out（散热功率）：</strong>Q_out = h·(T - T_amb)，散热与温差成正比</p>
                <p>• <strong>C（热容）：</strong>系统储存热能的能力，决定升温速度</p>
                <p>• <strong>h（散热系数）：</strong>环境散热能力，影响稳态温度</p>
                
                <p><strong>纯滞后特性：</strong></p>
                <p>传感器测量值 T_measured(t) = T_actual(t - τ)，延迟τ=2秒</p>
                <p>这导致控制器"看到的温度"比实际温度晚2秒，容易引起超调和振荡</p>
                
                <p style="background: #f0f9ff; padding: 10px; border-left: 4px solid #409EFF;">
                  <strong>关键特性：</strong>温度系统是典型的<strong>大惯性+纯滞后</strong>系统。大惯性导致响应慢，纯滞后导致控制器"反应不及时"，两者叠加使得PID参数整定非常困难。
                </p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="🔬 实验步骤（四个阶段）" name="2">
              <div style="padding: 10px;">
                <h4 style="color: #67C23A; margin-top: 0;">阶段一：系统特性认识</h4>
                <p><strong>步骤1：开环响应测试</strong></p>
                <p>• 将PID参数全部设为0（Kp=0, Ki=0, Kd=0）</p>
                <p>• 目标温度80°C，加热功率500W，环境温度20°C</p>
                <p>• 点击"开始运行"，观察温度变化曲线</p>
                <p><strong>观察：</strong>温度缓慢上升，但<strong>无法达到80°C</strong>（因为散热平衡）</p>
                <p><strong>分析：</strong>稳态温度 = 环境温度 + 加热功率/散热系数</p>
                
                <p><strong>步骤2：纯滞后影响观察</strong></p>
                <p>• 观察图表中"实际温度"和"测量温度"两条曲线</p>
                <p><strong>现象：</strong>测量温度滞后实际温度2秒</p>
                <p><strong>思考：</strong>控制器基于测量值决策，会产生什么问题？</p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">阶段二：纯比例控制（P控制）</h4>
                <p><strong>步骤1：小Kp测试</strong></p>
                <p>• 设置Kp=1.0, Ki=0, Kd=0</p>
                <p>• 目标80°C，重置并运行</p>
                <p><strong>现象：</strong>温度上升，但存在<strong>稳态误差</strong>（约5-10°C）</p>
                <p><strong>原因：</strong>比例控制无法消除稳态误差</p>
                
                <p><strong>步骤2：大Kp测试</strong></p>
                <p>• 增大Kp=5.0, Ki=0, Kd=0</p>
                <p><strong>现象：</strong>超调增大，可能出现振荡</p>
                <p><strong>原因：</strong>纯滞后+大增益 → 控制器过度补偿</p>
                <p style="background: #fff3cd; padding: 8px; border-radius: 4px;">
                  💡 <strong>规律：</strong>Kp过小响应慢，Kp过大会振荡，需折中选择
                </p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">阶段三：PI控制（消除稳态误差）</h4>
                <p><strong>步骤1：加入积分项</strong></p>
                <p>• 设置Kp=2.0, Ki=0.5, Kd=0</p>
                <p>• 目标80°C，运行至稳定</p>
                <p><strong>现象：</strong>温度最终<strong>精确达到80°C</strong>，无稳态误差</p>
                <p><strong>原理：</strong>积分项累积误差，直到误差为0</p>
                
                <p><strong>步骤2：积分饱和测试</strong></p>
                <p>• 增大Ki=2.0（其他参数不变）</p>
                <p><strong>现象：</strong>超调明显增大，调节时间变长</p>
                <p><strong>原因：</strong>积分项积累过快，导致"积分饱和"</p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">阶段四：完整PID控制（抑制超调）</h4>
                <p><strong>步骤1：加入微分项</strong></p>
                <p>• 设置Kp=2.0, Ki=0.5, Kd=1.0</p>
                <p>• 目标80°C，观察响应曲线</p>
                <p><strong>效果：</strong>超调减小，调节时间缩短</p>
                <p><strong>原理：</strong>微分项预测温度变化趋势，提前制动</p>
                
                <p><strong>步骤2：抗扰动测试</strong></p>
                <p>• 温度稳定在80°C后，将环境温度从20°C降至10°C</p>
                <p><strong>观察：</strong>温度短暂下降，PID自动增大加热功率，重新稳定在80°C</p>
                
                <p><strong>步骤3：目标变化响应</strong></p>
                <p>• 初始目标60°C，稳定后改为100°C</p>
                <p>• 记录升温时间和超调量</p>
                <p><strong>优化目标：</strong>调整PID参数，使超调<5%，调节时间<30秒</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="📊 实验报告要求" name="3">
              <div style="padding: 10px;">
                <h4 style="color: #E6A23C; margin-top: 0;">需记录与分析的内容：</h4>
                <p><strong>1. 控制方式性能对比</strong></p>
                <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                  <thead>
                    <tr style="background: #f5f7fa;">
                      <th style="border: 1px solid #ddd; padding: 8px;">控制器类型</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">调节时间(s)</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">超调量(%)</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">稳态误差(°C)</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">稳定性</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">P控制(Kp=2)</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">PI控制(Kp=2, Ki=0.5)</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">PID控制(Kp=2, Ki=0.5, Kd=1)</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                  </tbody>
                </table>
                
                <p><strong>2. 必答思考题</strong></p>
                <p>① 为什么纯比例控制存在稳态误差？从数学角度解释</p>
                <p>② 传感器延迟2秒对控制的影响是什么？如何优化？</p>
                <p>③ 如果加热功率不足（如200W），即使PID参数最优，能否达到100°C？为什么？</p>
                <p>④ 为什么温度控制的Kp通常比位置/速度控制小很多？</p>
                <p>⑤ 环境温度突变时，哪个PID参数起主要作用？</p>
                
                <p><strong>3. 性能指标记录</strong></p>
                <p>• 目标温度80°C，环境20°C，加热功率500W：</p>
                <p>  - 调节时间（95%准则）：___秒</p>
                <p>  - 超调量：___%</p>
                <p>  - 稳态误差：___°C</p>
                <p>  - 最优PID参数：Kp=___, Ki=___, Kd=___</p>
                
                <p><strong>4. 波形图分析</strong></p>
                <p>• 截图保存"实际温度"、"测量温度"、"加热比例"三条曲线</p>
                <p>• 标注关键时间点：超调峰值时刻、首次进入误差带时刻</p>
                <p>• 分析"测量温度"滞后对控制输出的影响</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="💡 扩展挑战" name="4">
              <div style="padding: 10px;">
                <h4 style="color: #F56C6C; margin-top: 0;">高级任务：</h4>
                <p><strong>挑战1：Ziegler-Nichols整定法</strong></p>
                <p>• 研究经典的Z-N参数整定方法</p>
                <p>• 步骤：先找临界增益Ku（使系统持续振荡的Kp），测临界周期Tu</p>
                <p>• 按公式计算：Kp=0.6Ku, Ki=2Kp/Tu, Kd=KpTu/8</p>
                <p>• 对比经验参数和Z-N参数的性能差异</p>
                
                <p><strong>挑战2：Smith预估控制</strong></p>
                <p>• 研究Smith预估器原理（补偿纯滞后）</p>
                <p>• 思考：如何在已知延迟时间的情况下，提前预测温度变化？</p>
                <p>• 设计改进方案：加入温度变化率的前馈补偿</p>
                
                <p><strong>挑战3：分段控制策略</strong></p>
                <p>• 设计双模式控制：</p>
                <p>  - 远离目标（|e|>10°C）：大功率快速加热</p>
                <p>  - 接近目标（|e|<10°C）：精细PID控制</p>
                <p>• 对比单一PID控制，分析性能提升</p>
                
                <p><strong>挑战4：能耗优化</strong></p>
                <p>• 目标：在保证±2°C精度前提下，降低平均功耗</p>
                <p>• 思路：调整PID参数，减少控制输出抖动</p>
                <p>• 计算能效比：(达标时间×温度精度) / 总能耗</p>
                
                <p style="background: #fef0f0; padding: 10px; border-left: 4px solid #F56C6C; margin-top: 15px;">
                  <strong>⚠️ 工程应用思考：</strong><br>
                  温度控制广泛应用于化工、食品、医药等行业。思考：对于不同热容、不同延迟的温度系统（如小型恒温箱 vs 大型反应釜），PID参数差异会有多大？如何快速整定？
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
import { TemperatureSystem } from '../utils/temperature'
import { PIDController } from '../utils/control'

const thermometerCanvas = ref<HTMLCanvasElement | null>(null)
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let animationId: number | null = null

const activeSteps = ref([])  // 默认全部收起

const targetTemp = ref(80)
const ambientTemp = ref(20)
const heaterPower = ref(500)

const pidParams = reactive({
  kp: 2.0,
  ki: 0.5,
  kd: 1.0
})

const isRunning = ref(false)
const actualTemp = ref(20)
const measuredTemp = ref(20)
const heatingRatio = ref(0)

const timeData = ref<number[]>([])
const targetTempData = ref<number[]>([])
const actualTempData = ref<number[]>([])
const measuredTempData = ref<number[]>([])
const controlData = ref<number[]>([])

let tempSystem: TemperatureSystem | null = null
let pidController: PIDController | null = null
let time = 0
const dt = 0.1

const tempError = computed(() => targetTemp.value - measuredTemp.value)
const powerConsumption = computed(() => heaterPower.value * (heatingRatio.value / 100))

onMounted(() => {
  initChart()
  drawThermometer(20)
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
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['目标温度', '实际温度', '测量温度', '加热比例']
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
    yAxis: [
      {
        type: 'value',
        name: '温度 (°C)',
        position: 'left'
      },
      {
        type: 'value',
        name: '加热比例 (%)',
        position: 'right',
        max: 100
      }
    ],
    series: [
      {
        name: '目标温度',
        type: 'line',
        data: targetTempData.value,
        lineStyle: { type: 'dashed' },
        itemStyle: { color: '#67C23A' },
        showSymbol: false
      },
      {
        name: '实际温度',
        type: 'line',
        data: actualTempData.value,
        itemStyle: { color: '#409EFF' },
        showSymbol: false
      },
      {
        name: '测量温度',
        type: 'line',
        data: measuredTempData.value,
        itemStyle: { color: '#E6A23C' },
        showSymbol: false,
        lineStyle: { width: 1 }
      },
      {
        name: '加热比例',
        type: 'line',
        data: controlData.value,
        yAxisIndex: 1,
        itemStyle: { color: '#F56C6C' },
        showSymbol: false
      }
    ]
  }
  
  chart.setOption(option)
}

const drawThermometer = (temp: number) => {
  if (!thermometerCanvas.value) return
  
  const canvas = thermometerCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  const centerX = 200
  const thermHeight = 300
  const thermWidth = 60
  const bulbRadius = 40
  
  // 温度范围
  const minTemp = 0
  const maxTemp = 200
  const tempRatio = (temp - minTemp) / (maxTemp - minTemp)
  
  // 绘制温度计主体
  ctx.strokeStyle = '#303133'
  ctx.lineWidth = 3
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(centerX - thermWidth / 2, 50, thermWidth, thermHeight, 10)
  ctx.fill()
  ctx.stroke()
  
  // 绘制温度液柱
  const liquidHeight = thermHeight * tempRatio
  const gradient = ctx.createLinearGradient(0, 350 - liquidHeight, 0, 350)
  
  if (temp >= targetTemp.value - 2 && temp <= targetTemp.value + 2) {
    gradient.addColorStop(0, '#67C23A')
    gradient.addColorStop(1, '#85CE61')
  } else if (temp > targetTemp.value + 10) {
    gradient.addColorStop(0, '#F56C6C')
    gradient.addColorStop(1, '#F78989')
  } else {
    gradient.addColorStop(0, '#409EFF')
    gradient.addColorStop(1, '#66B1FF')
  }
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.roundRect(centerX - thermWidth / 2 + 5, 350 - liquidHeight, thermWidth - 10, liquidHeight, 5)
  ctx.fill()
  
  // 绘制底部球泡
  ctx.beginPath()
  ctx.arc(centerX, 350 + bulbRadius, bulbRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  
  // 绘制刻度
  ctx.strokeStyle = '#909399'
  ctx.fillStyle = '#606266'
  ctx.font = '12px Arial'
  ctx.textAlign = 'right'
  ctx.lineWidth = 1
  
  for (let t = minTemp; t <= maxTemp; t += 20) {
    const y = 350 - ((t - minTemp) / (maxTemp - minTemp)) * thermHeight
    ctx.beginPath()
    ctx.moveTo(centerX + thermWidth / 2, y)
    ctx.lineTo(centerX + thermWidth / 2 + 10, y)
    ctx.stroke()
    ctx.fillText(`${t}°C`, centerX + thermWidth / 2 + 40, y + 4)
  }
  
  // 绘制目标温度线
  const targetY = 350 - ((targetTemp.value - minTemp) / (maxTemp - minTemp)) * thermHeight
  ctx.strokeStyle = '#67C23A'
  ctx.setLineDash([5, 5])
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(centerX - thermWidth / 2 - 20, targetY)
  ctx.lineTo(centerX + thermWidth / 2 + 20, targetY)
  ctx.stroke()
  ctx.setLineDash([])
  
  ctx.fillStyle = '#67C23A'
  ctx.font = 'bold 14px Arial'
  ctx.textAlign = 'left'
  ctx.fillText(`目标: ${targetTemp.value}°C`, centerX - thermWidth / 2 - 20, targetY - 10)
  
  // 显示当前温度
  ctx.fillStyle = '#303133'
  ctx.font = 'bold 24px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(`${temp.toFixed(1)}°C`, centerX, 420)
  
  // 绘制加热器状态
  const heaterX = 400
  const heaterY = 150
  
  ctx.fillStyle = '#909399'
  ctx.fillRect(heaterX, heaterY, 150, 100)
  
  // 加热线圈
  const coilColor = heatingRatio.value > 0 ? '#F56C6C' : '#DCDFE6'
  ctx.strokeStyle = coilColor
  ctx.lineWidth = 5
  
  for (let i = 0; i < 5; i++) {
    const y = heaterY + 20 + i * 15
    ctx.beginPath()
    ctx.moveTo(heaterX + 20, y)
    ctx.lineTo(heaterX + 40, y + 7)
    ctx.lineTo(heaterX + 60, y)
    ctx.lineTo(heaterX + 80, y + 7)
    ctx.lineTo(heaterX + 100, y)
    ctx.lineTo(heaterX + 120, y + 7)
    ctx.lineTo(heaterX + 130, y)
    ctx.stroke()
  }
  
  // 加热指示
  ctx.fillStyle = '#303133'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.fillText('加热器', heaterX + 75, heaterY - 10)
  ctx.fillText(`${heatingRatio.value.toFixed(0)}%`, heaterX + 75, heaterY + 120)
}

const startSimulation = () => {
  if (isRunning.value) return
  
  tempSystem = new TemperatureSystem(
    1000,
    10,
    heaterPower.value,
    ambientTemp.value,
    2,
    ambientTemp.value,
    dt
  )
  
  pidController = new PIDController(pidParams.kp, pidParams.ki, pidParams.kd, dt)
  
  isRunning.value = true
  time = 0
  
  simulate()
}

const simulate = () => {
  if (!isRunning.value || !tempSystem || !pidController) return
  
  pidController.updateParameters(pidParams.kp, pidParams.ki, pidParams.kd)
  
  const controlSignal = pidController.compute(targetTemp.value, tempSystem.measuredTemp)
  const clampedSignal = Math.max(0, Math.min(100, controlSignal))
  
  tempSystem.setAmbientTemperature(ambientTemp.value)
  tempSystem.setHeaterPower(heaterPower.value)
  tempSystem.update(clampedSignal)
  
  actualTemp.value = tempSystem.temperature
  measuredTemp.value = tempSystem.measuredTemp
  heatingRatio.value = clampedSignal
  
  // 记录数据
  if (Math.floor(time * 10) % 5 === 0) {
    timeData.value.push(time.toFixed(1))
    targetTempData.value.push(targetTemp.value)
    actualTempData.value.push(parseFloat(actualTemp.value.toFixed(2)))
    measuredTempData.value.push(parseFloat(measuredTemp.value.toFixed(2)))
    controlData.value.push(parseFloat(heatingRatio.value.toFixed(1)))
    
    if (timeData.value.length > 200) {
      timeData.value.shift()
      targetTempData.value.shift()
      actualTempData.value.shift()
      measuredTempData.value.shift()
      controlData.value.shift()
    }
    
    updateChart()
  }
  
  drawThermometer(actualTemp.value)
  
  time += dt
  
  if (time < 300) {
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
  targetTempData.value = []
  actualTempData.value = []
  measuredTempData.value = []
  controlData.value = []
  actualTemp.value = ambientTemp.value
  measuredTemp.value = ambientTemp.value
  heatingRatio.value = 0
  time = 0
  drawThermometer(ambientTemp.value)
  updateChart()
}
</script>

<style scoped>
.temperature-control {
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

.thermometer-container {
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
