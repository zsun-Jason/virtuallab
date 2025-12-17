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
