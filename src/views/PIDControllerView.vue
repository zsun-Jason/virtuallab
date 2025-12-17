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
                <p>1. 理解PID控制器三个参数的物理意义和作用</p>
                <p>2. 掌握PID参数整定的基本方法</p>
                <p>3. 学习分析系统性能指标：超调量、稳定时间、稳态误差</p>
                <p>4. 培养控制系统调试与优化能力</p>
                
                <h4 style="color: #409EFF;">二、PID控制原理</h4>
                <p><strong>控制律：</strong>u(t) = Kp·e(t) + Ki·∫e(t)dt + Kd·de(t)/dt</p>
                <p><strong>• Kp（比例项）：</strong>根据当前误差大小产生控制作用。Kp越大，响应越快，但过大会引起振荡。</p>
                <p><strong>• Ki（积分项）：</strong>消除稳态误差。Ki越大，消除误差越快，但过大会导致超调和振荡。</p>
                <p><strong>• Kd（微分项）：</strong>预测误差变化趋势，提前施加阻尼。Kd增大可减少超调，但过大对噪声敏感。</p>
                <p style="background: #f0f9ff; padding: 10px; border-left: 4px solid #409EFF;">
                  <strong>经典整定法：</strong>Ziegler-Nichols法建议先调Kp至临界振荡，再根据公式计算Ki和Kd。本实验推荐采用试凑法逐步调优。
                </p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="🔬 实验步骤（推荐顺序）" name="2">
              <div style="padding: 10px;">
                <h4 style="color: #67C23A; margin-top: 0;">步骤1：纯比例控制（P控制）</h4>
                <p><strong>操作：</strong></p>
                <p>• 设置Kp=1.0, Ki=0, Kd=0</p>
                <p>• 目标值设为50，点击"开始仿真"</p>
                <p><strong>观察：</strong>系统有稳态误差，无法到达目标值</p>
                <p><strong>实验：</strong>逐步增大Kp（1.0 → 2.0 → 4.0 → 6.0），观察响应速度和振荡</p>
                <p><strong>结论：</strong>Kp过小响应慢，过大产生振荡，且始终存在稳态误差</p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">步骤2：添加积分控制（PI控制）</h4>
                <p><strong>操作：</strong></p>
                <p>• 保持Kp=2.0，设置Ki=0.5, Kd=0</p>
                <p>• 运行仿真，观察稳态误差变化</p>
                <p><strong>观察：</strong>稳态误差逐渐消除，但可能出现超调</p>
                <p><strong>实验：</strong>调整Ki（0.1 → 0.5 → 1.0 → 2.0），观察消除误差的速度和超调量</p>
                <p style="background: #fff3cd; padding: 8px; border-radius: 4px;">
                  💡 <strong>关键发现：</strong>Ki过小，消除误差慢；Ki过大，超调严重且可能振荡
                </p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">步骤3：添加微分控制（PID控制）</h4>
                <p><strong>操作：</strong></p>
                <p>• 设置Kp=2.0, Ki=0.5, Kd=0.2</p>
                <p>• 观察微分项对超调的抑制作用</p>
                <p><strong>观察：</strong>超调量减小，系统更快稳定</p>
                <p><strong>实验：</strong>调整Kd（0 → 0.1 → 0.3 → 0.5），观察对超调和振荡的影响</p>
                <p><strong>注意：</strong>Kd过大会使系统对噪声敏感，实际应用需权衡</p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">步骤4：参数优化</h4>
                <p><strong>目标：</strong>找到最佳参数组合，使系统快速稳定且超调小</p>
                <p><strong>参考起点：</strong>Kp=2.0, Ki=0.5, Kd=0.2</p>
                <p><strong>优化策略：</strong></p>
                <p>① 先固定Ki和Kd，微调Kp找到响应速度与振荡的平衡点</p>
                <p>② 调整Ki，在消除误差速度和超调之间取舍</p>
                <p>③ 最后微调Kd，进一步抑制振荡</p>
                <p><strong>性能指标：</strong>超调量<20%，稳定时间<10s，稳态误差<2%</p>
                
                <el-divider />
                
                <h4 style="color: #67C23A;">步骤5：系统特性测试</h4>
                <p><strong>操作：</strong></p>
                <p>• 使用优化后的参数</p>
                <p>• 改变目标值（20、50、80），观察系统适应性</p>
                <p>• 改变时间常数（1.0、2.0、5.0），测试参数鲁棒性</p>
                <p><strong>思考：</strong>为什么时间常数变化时，最优PID参数会改变？</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="📊 实验报告要求" name="3">
              <div style="padding: 10px;">
                <h4 style="color: #E6A23C; margin-top: 0;">需记录与分析的内容：</h4>
                <p><strong>1. 参数影响分析表</strong></p>
                <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                  <thead>
                    <tr style="background: #f5f7fa;">
                      <th style="border: 1px solid #ddd; padding: 8px;">参数</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">测试值</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">上升时间(s)</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">超调量(%)</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">稳态误差</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">Kp</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">1.0/2.0/4.0/6.0</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">Ki</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">0/0.5/1.0/2.0</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">Kd</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">0/0.1/0.3/0.5</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                  </tbody>
                </table>
                
                <p><strong>2. 必答思考题</strong></p>
                <p>① 为什么纯比例控制无法消除稳态误差？</p>
                <p>② Ki增大为何会导致超调增加？从积分项累积角度解释</p>
                <p>③ 微分项Kd对噪声敏感的原因是什么？</p>
                <p>④ 如果被控对象时间常数增大（响应变慢），应如何调整PID参数？</p>
                
                <p><strong>3. 最优参数记录</strong></p>
                <p>• 针对默认系统（时间常数=2.0）的最优参数：Kp=___, Ki=___, Kd=___</p>
                <p>• 系统性能指标：超调量=___%，稳定时间=___s，稳态误差=___</p>
                <p>• 参数选择理由：___</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="💡 扩展挑战" name="4">
              <div style="padding: 10px;">
                <h4 style="color: #F56C6C; margin-top: 0;">高级任务：</h4>
                <p><strong>挑战1：抗扰动能力测试</strong></p>
                <p>• 设计方案测试系统的扰动抑制能力（提示：可通过改变目标值模拟扰动）</p>
                <p>• 比较不同PID参数下的抗扰动性能</p>
                
                <p><strong>挑战2：参数自整定</strong></p>
                <p>• 研究Ziegler-Nichols整定法则</p>
                <p>• 尝试实现继电反馈法自动获取临界参数</p>
                
                <p><strong>挑战3：改进型PID</strong></p>
                <p>• 了解积分分离、微分先行等改进算法</p>
                <p>• 思考如何避免积分饱和问题</p>
                
                <p style="background: #fef0f0; padding: 10px; border-left: 4px solid #F56C6C; margin-top: 15px;">
                  <strong>⚠️ 探索性问题：</strong><br>
                  实际工程中PID控制器占据90%以上的控制应用。思考：为什么如此简单的算法能有如此广泛的应用？它的局限性在哪里？
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
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { PIDController, FirstOrderSystem } from '../utils/control'

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null
let animationId: number | null = null

const activeSteps = ref([])  // 默认全部收起

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
  timeData.value.push(Number(time.toFixed(2)))
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

.system-info {
  margin-top: 20px;
}
</style>
