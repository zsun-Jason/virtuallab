<template>
  <div class="pid-controller">
    <h2>PID控制器仿真实验</h2>
    
    <el-row :gutter="20">
      <!-- 参数控制面板 -->
      <el-col :span="8">
        <el-card>
          <template #header>
            <h3>控制参数</h3>
          </template>
          
          <el-form label-width="80px">
            <el-form-item label="比例 Kp">
              <el-slider v-model="params.kp" :min="0" :max="10" :step="0.1" show-input />
            </el-form-item>
            
            <el-form-item label="积分 Ki">
              <el-slider v-model="params.ki" :min="0" :max="5" :step="0.1" show-input />
            </el-form-item>
            
            <el-form-item label="微分 Kd">
              <el-slider v-model="params.kd" :min="0" :max="5" :step="0.1" show-input />
            </el-form-item>
            
            <el-form-item label="目标值">
              <el-input-number v-model="params.setpoint" :min="0" :max="100" />
            </el-form-item>
            
            <el-form-item label="时间常数">
              <el-input-number v-model="params.timeConstant" :min="0.1" :max="10" :step="0.1" />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="startSimulation" :disabled="isRunning">
                {{ isRunning ? '运行中...' : '开始仿真' }}
              </el-button>
              <el-button @click="stopSimulation" :disabled="!isRunning">停止</el-button>
              <el-button @click="resetSimulation">重置</el-button>
            </el-form-item>
          </el-form>
          
          <el-divider />
          
          <div class="system-info">
            <h4>系统指标</h4>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="当前值">{{ currentValue.toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="误差">{{ error.toFixed(2) }}</el-descriptions-item>
              <el-descriptions-item label="超调量">{{ overshoot.toFixed(2) }}%</el-descriptions-item>
              <el-descriptions-item label="稳态误差">{{ steadyStateError.toFixed(2) }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
      
      <!-- 图表显示 -->
      <el-col :span="16">
        <el-card>
          <template #header>
            <h3>系统响应曲线</h3>
          </template>
          <div ref="chartRef" style="width: 100%; height: 500px;"></div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>实验说明</h3>
          </template>
          <el-alert type="info" :closable="false">
            <p><strong>PID控制器原理：</strong></p>
            <p>• Kp（比例）：响应误差的大小，Kp越大响应越快，但过大会导致振荡</p>
            <p>• Ki（积分）：消除稳态误差，Ki越大稳态误差越小，但过大会导致超调</p>
            <p>• Kd（微分）：预测误差变化趋势，减少超调和振荡</p>
            <p><strong>调试建议：</strong>先调Kp，再调Ki，最后微调Kd</p>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { PIDController, FirstOrderSystem } from '../utils/control'

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let animationId: number | null = null

const params = reactive({
  kp: 1.0,
  ki: 0.5,
  kd: 0.1,
  setpoint: 50,
  timeConstant: 2.0
})

const isRunning = ref(false)
const currentValue = ref(0)
const error = ref(0)
const overshoot = ref(0)
const steadyStateError = ref(0)

const timeData = ref<number[]>([])
const setpointData = ref<number[]>([])
const outputData = ref<number[]>([])
const controlData = ref<number[]>([])

let pidController: PIDController | null = null
let system: FirstOrderSystem | null = null
let time = 0
const dt = 0.05

onMounted(() => {
  initChart()
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
      data: ['设定值', '输出值', '控制量']
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
    yAxis: {
      type: 'value',
      name: '值'
    },
    series: [
      {
        name: '设定值',
        type: 'line',
        data: setpointData.value,
        lineStyle: { type: 'dashed' },
        itemStyle: { color: '#67C23A' }
      },
      {
        name: '输出值',
        type: 'line',
        data: outputData.value,
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '控制量',
        type: 'line',
        data: controlData.value,
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }
  
  chart.setOption(option)
}

const startSimulation = () => {
  if (isRunning.value) return
  
  resetSimulation()
  
  pidController = new PIDController(params.kp, params.ki, params.kd, dt)
  system = new FirstOrderSystem(params.timeConstant, 1, dt)
  
  isRunning.value = true
  time = 0
  
  simulate()
}

const simulate = () => {
  if (!isRunning.value || !pidController || !system) return
  
  // PID计算
  const controlOutput = pidController.compute(params.setpoint, currentValue.value)
  
  // 系统更新
  currentValue.value = system.update(controlOutput)
  
  // 记录数据
  timeData.value.push(time.toFixed(2))
  setpointData.value.push(params.setpoint)
  outputData.value.push(parseFloat(currentValue.value.toFixed(2)))
  controlData.value.push(parseFloat(controlOutput.toFixed(2)))
  
  // 限制数据点数量
  if (timeData.value.length > 200) {
    timeData.value.shift()
    setpointData.value.shift()
    outputData.value.shift()
    controlData.value.shift()
  }
  
  // 计算指标
  error.value = params.setpoint - currentValue.value
  
  const maxValue = Math.max(...outputData.value)
  overshoot.value = ((maxValue - params.setpoint) / params.setpoint) * 100
  
  if (timeData.value.length > 100) {
    const recentValues = outputData.value.slice(-20)
    const avgRecent = recentValues.reduce((a, b) => a + b, 0) / recentValues.length
    steadyStateError.value = params.setpoint - avgRecent
  }
  
  updateChart()
  
  time += dt
  
  if (time < 20) {
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
  setpointData.value = []
  outputData.value = []
  controlData.value = []
  currentValue.value = 0
  error.value = 0
  overshoot.value = 0
  steadyStateError.value = 0
  time = 0
  updateChart()
}
</script>

<style scoped>
.pid-controller {
  padding: 20px;
}

h2 {
  color: #303133;
  margin-bottom: 20px;
}

h3 {
  margin: 0;
  font-size: 16px;
}

h4 {
  margin: 10px 0;
  color: #606266;
}

.system-info {
  margin-top: 20px;
}
</style>
