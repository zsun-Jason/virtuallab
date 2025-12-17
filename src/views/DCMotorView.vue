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
            
            <el-form-item>
              <el-button type="primary" @click="startSimulation" :disabled="isRunning">
                {{ isRunning ? '运行中...' : '开始运行' }}
              </el-button>
              <el-button @click="stopSimulation" :disabled="!isRunning">停止</el-button>
              <el-button @click="resetSimulation">重置</el-button>
            </el-form-item>
          </el-form>
          
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
    timeData.value.push(time.toFixed(2))
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
  padding: 20px;
}

h2, h3, h4 {
  color: #303133;
}

h2 {
  margin-bottom: 20px;
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
