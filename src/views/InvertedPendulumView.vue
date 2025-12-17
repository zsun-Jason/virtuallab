<template>
  <div class="inverted-pendulum">
    <h2>倒立摆控制实验</h2>
    
    <el-row :gutter="20" style="align-items: stretch;">
      <el-col :span="10" style="display: flex;">
        <el-card style="flex: 1;">
          <template #header>
            <h3>LQR控制参数</h3>
          </template>
          
          <el-form label-width="95px" label-position="left">
            <el-form-item label="位置 K1">
              <el-slider v-model="params.k1" :min="0" :max="80" :step="0.5" show-input />
            </el-form-item>
            <el-form-item label="速度 K2">
              <el-slider v-model="params.k2" :min="0" :max="20" :step="0.5" show-input />
            </el-form-item>
            <el-form-item label="角度 K3">
              <el-slider v-model="params.k3" :min="0" :max="80" :step="0.5" show-input />
            </el-form-item>
            <el-form-item label="角速度 K4">
              <el-slider v-model="params.k4" :min="0" :max="15" :step="0.5" show-input />
            </el-form-item>
            
            <el-divider />
            
            <el-form-item label="初始摆角">
              <el-input-number v-model="initialAngle" :min="-30" :max="30" :step="1" />
              <span class="hint">度</span>
            </el-form-item>
            
            <el-form-item label="目标位置">
              <el-input-number v-model="targetPosition" :min="-1.5" :max="1.5" :step="0.1" />
              <span class="hint">米</span>
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
              <el-descriptions-item label="小车位置">{{ cartPosition.toFixed(3) }} m</el-descriptions-item>
              <el-descriptions-item label="小车速度">{{ cartVelocity.toFixed(3) }} m/s</el-descriptions-item>
              <el-descriptions-item label="摆角">{{ pendulumAngle.toFixed(2) }}°</el-descriptions-item>
              <el-descriptions-item label="角速度">{{ angularVelocity.toFixed(3) }} rad/s</el-descriptions-item>
              <el-descriptions-item label="控制力">{{ controlForce.toFixed(2) }} N</el-descriptions-item>
            </el-descriptions>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="14" style="display: flex; flex-direction: column;">
        <el-card style="flex: 1; margin-bottom: 20px;">
          <template #header>
            <h3>倒立摆可视化</h3>
          </template>
          <div class="canvas-container" style="height: calc(100% - 60px); display: flex; align-items: center; justify-content: center;">
            <canvas ref="canvasRef" width="800" height="300" style="max-width: 100%; max-height: 100%;"></canvas>
          </div>
        </el-card>
        
        <el-card style="flex: 1;">
          <template #header>
            <h3>状态曲线</h3>
          </template>
          <div ref="chartRef" style="width: 100%; height: calc(100% - 60px);"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 实验指导单独成行，全宽显示 -->
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
                <p>1. 理解不稳定系统的动态特性与控制挑战</p>
                <p>2. 掌握LQR（线性二次调节器）状态反馈控制方法</p>
                <p>3. 学习多变量耦合系统的增益调节原则</p>
                <p>4. 培养系统调试与参数优化能力</p>
                
                <h4 style="color: #409EFF;">二、系统原理</h4>
                <p><strong>物理模型：</strong>倒立摆是典型的欠驱动、非线性、不稳定系统。小车在水平轨道上移动，摆杆通过铰链连接，仅受重力和小车加速度影响。</p>
                <p><strong>控制目标：</strong>通过控制小车的水平力，使摆杆保持竖直向上且小车稳定在目标位置。</p>
                <p><strong>状态反馈：</strong>控制力 = K1×位置 + K2×速度 + K3×角度 + K4×角速度</p>
                <p style="background: #f0f9ff; padding: 10px; border-left: 4px solid #409EFF;">
                  <strong>核心难点：</strong>角度控制（K3）与位置控制（K1）存在耦合关系。K1过大会导致小车剧烈移动，干扰角度平衡；K3过小则无法快速纠正摆杆倾斜。
                </p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="🔬 实验步骤（推荐按顺序完成）" name="2">
              <div style="padding: 10px;">
                <h4 style="color: #67C23A; margin-top: 0;">步骤1：观察系统失控现象（理解不稳定性）</h4>
                <p><strong>操作：</strong></p>
                <p>• 将所有增益K1、K2、K3、K4设为0</p>
                <p>• 设置初始摆角为5度</p>
                <p>• 点击"开始仿真"</p>
                <p><strong>观察：</strong>摆杆快速倾倒，系统完全失控</p>
                <p><strong>结论：</strong>开环系统本质不稳定，必须闭环控制</p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">步骤2：单纯角度控制（K3作用）</h4>
                <p><strong>操作：</strong></p>
                <p>• K1=0, K2=0, K3=60, K4=8</p>
                <p>• 初始摆角5度，点击运行</p>
                <p><strong>观察：</strong>摆杆能保持平衡，但小车会持续漂移，最终超出轨道范围</p>
                <p><strong>学习要点：</strong>K3能稳定角度，但无法控制位置。系统需要位置反馈。</p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">步骤3：体验K1过强的副作用</h4>
                <p><strong>操作：</strong></p>
                <p>• K1=80, K2=5, K3=60, K4=8（注意K1>K3）</p>
                <p>• 初始摆角5度</p>
                <p><strong>观察：</strong>小车剧烈震荡或摆杆快速倾倒</p>
                <p><strong>原因分析：</strong>K1过强导致小车强行拉回原点，产生的加速度扰动超过K3的纠正能力</p>
                <p style="background: #fff3cd; padding: 8px; border-radius: 4px;">
                  💡 <strong>关键发现：</strong>K1必须远小于K3，推荐K3:K1 ≈ 16:1
                </p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">步骤4：优化参数组合</h4>
                <p><strong>操作：</strong></p>
                <p>• 从K1=5, K2=3, K3=80, K4=12开始</p>
                <p>• 逐步调整K1（3~10），观察小车回位速度与角度稳定性的平衡</p>
                <p>• 调整K4（6~15），观察对振荡的抑制效果</p>
                <p><strong>调参技巧：</strong></p>
                <p>① 先固定K3=80作为主控增益</p>
                <p>② K1从小到大试探（3→5→8→10），找到不破坏平衡的最大值</p>
                <p>③ K2约为K1的0.5~1倍</p>
                <p>④ K4增大可减少振荡，但过大会降低响应速度</p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">步骤5：极限测试</h4>
                <p><strong>操作：</strong></p>
                <p>• 使用优化后的参数</p>
                <p>• 将初始角度逐步增大到15度、20度、25度</p>
                <p>• 观察系统失控的临界条件</p>
                <p><strong>思考：</strong>为什么初始角度过大会导致失败？（提示：线性化假设的有效范围）</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="📊 实验报告要求" name="3">
              <div style="padding: 10px;">
                <h4 style="color: #E6A23C; margin-top: 0;">需记录与分析的内容：</h4>
                <p><strong>1. 参数影响分析表</strong></p>
                <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                  <thead>
                    <tr style="background: #f5f7fa;">
                      <th style="border: 1px solid #ddd; padding: 8px;">增益</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">测试值</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">稳定时间(s)</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">最大超调</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">现象描述</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">K1</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">3/5/8/10/20</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                  </tbody>
                </table>
                
                <p><strong>2. 必答思考题</strong></p>
                <p>① 为什么K3必须远大于K1？从物理意义和控制效果两方面解释</p>
                <p>② K2和K4都是阻尼增益，它们的作用有何不同？</p>
                <p>③ 如果要求小车快速返回原点，应如何调整参数？会有什么代价？</p>
                <p>④ 实际工程中倒立摆控制有哪些应用场景？（如火箭姿态控制、机器人平衡）</p>
                
                <p><strong>3. 最优参数组合</strong></p>
                <p>• 针对5度初始角度的最优参数：K1=___, K2=___, K3=___, K4=___</p>
                <p>• 最大可控初始角度：___ 度</p>
                <p>• 系统稳定时间（2%误差带）：___ 秒</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="💡 扩展挑战" name="4">
              <div style="padding: 10px;">
                <h4 style="color: #F56C6C; margin-top: 0;">高级任务：</h4>
                <p><strong>挑战1：轨迹跟踪</strong></p>
                <p>• 将"目标位置"设为-0.5m或0.5m</p>
                <p>• 调整参数使小车在保持摆杆平衡的同时移动到目标位置</p>
                
                <p><strong>挑战2：抗扰动能力</strong></p>
                <p>• 在系统运行过程中，突然改变目标位置</p>
                <p>• 观察系统如何重新调整并保持稳定</p>
                
                <p><strong>挑战3：参数鲁棒性</strong></p>
                <p>• 设计一组参数，能同时应对5度、10度、15度初始角度</p>
                <p>• 提示：需要在快速性和稳定性之间找到平衡</p>
                
                <p style="background: #fef0f0; padding: 10px; border-left: 4px solid #F56C6C; margin-top: 15px;">
                  <strong>⚠️ 探索性问题：</strong><br>
                  如果摆杆初始向下（180度），如何实现"起摆+稳定"控制？（这需要切换控制策略，当前LQR仅适用于小角度）
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
import { ref, reactive, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'
import { InvertedPendulum, LQRController } from '../utils/pendulum'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let animationId: number | null = null

const activeSteps = ref([])  // 默认全部收起

const params = reactive({
  k1: 5,  // 位置控制 - 降低到让角度控制占主导
  k2: 3,  // 速度阻尼
  k3: 80, // 角度控制 - 主要控制项
  k4: 12  // 角速度阻尼
})

const initialAngle = ref(8) // 初始角度（度）
const targetPosition = ref(0)
const isRunning = ref(false)

const cartPosition = ref(0)
const cartVelocity = ref(0)
const pendulumAngle = ref(0)
const angularVelocity = ref(0)
const controlForce = ref(0)

const timeData = ref<number[]>([])
const angleData = ref<number[]>([])
const positionData = ref<number[]>([])

let pendulum: InvertedPendulum | null = null
let controller: LQRController | null = null
let time = 0
const dt = 0.01

onMounted(() => {
  initChart()
  drawInitialState()
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
  if (animationId) {
    cancelAnimationFrame(animationId)
  }
})

watch(params, () => {
  if (controller) {
    controller.updateGains(params.k1, params.k2, params.k3, params.k4)
  }
}, { deep: true })

const initChart = () => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
    updateChart()
  }
}

const updateChart = () => {
  if (!chart) return
  
  const option: echarts.EChartsOption = {
    animation: false, // 禁用动画，避免标签闪烁重叠
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['摆角 (°)', '小车位置 (m)'],
      top: 10
    },
    grid: {
      left: '80px',
      right: '80px',
      bottom: '80px',
      top: '60px'
    },
    xAxis: {
      type: 'value',
      name: '时间 (s)',
      nameLocation: 'middle',
      nameGap: 40,
      min: 0,
      minInterval: 5, // 标签最小间隔5秒
      axisLabel: {
        formatter: '{value}',
        margin: 15,
        hideOverlap: true // 自动隐藏重叠的标签
      },
      splitNumber: 6
    },
    yAxis: [
      {
        type: 'value',
        name: '摆角 (°)',
        position: 'left',
        min: -10,
        max: 10,
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: '{value}°'
        }
      },
      {
        type: 'value',
        name: '位置 (m)',
        position: 'right',
        min: -0.5,
        max: 0.5,
        nameLocation: 'middle',
        nameGap: 50,
        axisLabel: {
          formatter: '{value}m'
        }
      }
    ],
    series: [
      {
        name: '摆角 (°)',
        type: 'line',
        yAxisIndex: 0,
        data: angleData.value.map((val, idx) => [parseFloat(timeData.value[idx]), val]),
        itemStyle: { color: '#409EFF' },
        lineStyle: { width: 2 },
        showSymbol: false
      },
      {
        name: '小车位置 (m)',
        type: 'line',
        yAxisIndex: 1,
        data: positionData.value.map((val, idx) => [parseFloat(timeData.value[idx]), val]),
        itemStyle: { color: '#67C23A' },
        lineStyle: { width: 2 },
        showSymbol: false
      }
    ]
  }
  
  chart.setOption(option)
}

const drawPendulum = () => {
  if (!canvasRef.value) return
  
  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // 坐标系设置
  const centerY = canvas.height / 2
  const scale = 100 // 像素/米
  const cartWidth = 80
  const cartHeight = 40
  const poleLength = 100 // 像素
  
  // 绘制轨道
  ctx.strokeStyle = '#666'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(100, centerY + 50)
  ctx.lineTo(canvas.width - 100, centerY + 50)
  ctx.stroke()
  
  // 绘制目标位置
  if (targetPosition.value !== 0) {
    const targetX = canvas.width / 2 + targetPosition.value * scale
    ctx.strokeStyle = '#67C23A'
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(targetX, centerY - 50)
    ctx.lineTo(targetX, centerY + 70)
    ctx.stroke()
    ctx.setLineDash([])
  }
  
  // 小车位置
  const cartX = canvas.width / 2 + cartPosition.value * scale
  const cartY = centerY + 30
  
  // 绘制小车
  ctx.fillStyle = '#409EFF'
  ctx.fillRect(cartX - cartWidth / 2, cartY - cartHeight / 2, cartWidth, cartHeight)
  ctx.strokeStyle = '#303133'
  ctx.lineWidth = 2
  ctx.strokeRect(cartX - cartWidth / 2, cartY - cartHeight / 2, cartWidth, cartHeight)
  
  // 绘制轮子
  ctx.fillStyle = '#303133'
  ctx.beginPath()
  ctx.arc(cartX - 20, cartY + cartHeight / 2, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cartX + 20, cartY + cartHeight / 2, 8, 0, Math.PI * 2)
  ctx.fill()
  
  // 绘制摆杆
  const poleX = cartX
  const poleY = cartY - cartHeight / 2
  const angle = pendulumAngle.value * Math.PI / 180
  const poleEndX = poleX + poleLength * Math.sin(angle)
  const poleEndY = poleY - poleLength * Math.cos(angle)
  
  ctx.strokeStyle = '#E6A23C'
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(poleX, poleY)
  ctx.lineTo(poleEndX, poleEndY)
  ctx.stroke()
  
  // 绘制摆锤
  ctx.fillStyle = '#F56C6C'
  ctx.beginPath()
  ctx.arc(poleEndX, poleEndY, 12, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#303133'
  ctx.lineWidth = 2
  ctx.stroke()
  
  // 绘制枢轴
  ctx.fillStyle = '#303133'
  ctx.beginPath()
  ctx.arc(poleX, poleY, 6, 0, Math.PI * 2)
  ctx.fill()
  
  // 显示控制力方向
  if (Math.abs(controlForce.value) > 0.1) {
    const forceScale = 0.5
    const forceLength = Math.abs(controlForce.value) * forceScale
    const forceDirection = controlForce.value > 0 ? 1 : -1
    
    ctx.strokeStyle = '#F56C6C'
    ctx.fillStyle = '#F56C6C'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(cartX, cartY)
    ctx.lineTo(cartX + forceLength * forceDirection, cartY)
    ctx.stroke()
    
    // 箭头
    ctx.beginPath()
    ctx.moveTo(cartX + forceLength * forceDirection, cartY)
    ctx.lineTo(cartX + (forceLength - 10) * forceDirection, cartY - 5)
    ctx.lineTo(cartX + (forceLength - 10) * forceDirection, cartY + 5)
    ctx.closePath()
    ctx.fill()
  }
}

const drawInitialState = () => {
  pendulumAngle.value = initialAngle.value
  drawPendulum()
}

const startSimulation = () => {
  if (isRunning.value) return
  
  resetSimulation()
  
  pendulum = new InvertedPendulum(1.0, 0.1, 0.5, 9.81, 0.1, dt)
  const initAngle = initialAngle.value * Math.PI / 180
  pendulum.reset(initAngle)
  
  controller = new LQRController(params.k1, params.k2, params.k3, params.k4)
  
  isRunning.value = true
  time = 0
  
  simulate()
}

const simulate = () => {
  if (!isRunning.value || !pendulum || !controller) return
  
  const state = pendulum.getState()
  const force = controller.compute(state, targetPosition.value)
  
  pendulum.update(force)
  
  // 获取更新后的状态
  const newState = pendulum.getState()
  
  // 更新显示值
  cartPosition.value = newState[0]
  cartVelocity.value = newState[1]
  pendulumAngle.value = newState[2] * 180 / Math.PI
  angularVelocity.value = newState[3]
  controlForce.value = force
  
  // 每5帧记录一次数据（减少数据密度，避免图表卡顿）
  if (Math.floor(time / dt) % 5 === 0) {
    timeData.value.push(time.toFixed(2))
    angleData.value.push(parseFloat(pendulumAngle.value.toFixed(3)))
    positionData.value.push(parseFloat(cartPosition.value.toFixed(3)))
  }
  
  // 保留所有历史数据
  
  drawPendulum()
  
  // 每3帧更新一次图表（减少渲染压力）
  if (Math.floor(time / dt) % 3 === 0) {
    updateChart()
  }
  
  time += dt
  
  // 检查是否失败（摆倒下或小车出界）
  if (Math.abs(pendulumAngle.value) > 60 || Math.abs(cartPosition.value) > 1.9) {
    isRunning.value = false
    return
  }
  
  // 无限循环，直到失败或手动停止
  animationId = requestAnimationFrame(simulate)
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
  angleData.value = []
  positionData.value = []
  cartPosition.value = 0
  cartVelocity.value = 0
  pendulumAngle.value = initialAngle.value
  angularVelocity.value = 0
  controlForce.value = 0
  time = 0
  drawInitialState()
  updateChart()
}
</script>

<style scoped>
.inverted-pendulum {
  padding: 0;
}

h2 {
  color: #303133;
  margin: 0 0 20px 0;
}

h3 {
  margin: 0;
  font-size: 16px;
}

h4 {
  margin: 10px 0;
  color: #606266;
}

.canvas-container {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  overflow: hidden;
}

canvas {
  background: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  max-width: 100%;
  height: auto;
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
