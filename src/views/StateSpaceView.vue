<template>
  <div class="state-space">
    <h2>状态空间分析</h2>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <h3>系统矩阵输入</h3>
          </template>
          
          <el-alert type="info" :closable="false" style="margin-bottom: 15px;">
            状态方程: ẋ = Ax + Bu<br/>
            输出方程: y = Cx + Du
          </el-alert>
          
          <el-form label-width="80px">
            <el-form-item label="系统阶数">
              <el-input-number v-model="order" :min="1" :max="4" @change="updateMatrices" />
            </el-form-item>
            
            <el-divider />
            
            <h4>A矩阵 ({{ order }}×{{ order }})</h4>
            <div class="matrix-input">
              <div v-for="i in order" :key="`a-row-${i}`" class="matrix-row">
                <el-input-number
                  v-for="j in order"
                  :key="`a-${i}-${j}`"
                  v-model="matrices.A[i-1][j-1]"
                  :step="0.1"
                  size="small"
                  style="width: 80px; margin: 2px;"
                />
              </div>
            </div>
            
            <h4 style="margin-top: 15px;">B矩阵 ({{ order }}×1)</h4>
            <div class="matrix-input">
              <div class="matrix-row">
                <el-input-number
                  v-for="i in order"
                  :key="`b-${i}`"
                  v-model="matrices.B[i-1][0]"
                  :step="0.1"
                  size="small"
                  style="width: 80px; margin: 2px;"
                />
              </div>
            </div>
            
            <h4 style="margin-top: 15px;">C矩阵 (1×{{ order }})</h4>
            <div class="matrix-input">
              <div class="matrix-row">
                <el-input-number
                  v-for="i in order"
                  :key="`c-${i}`"
                  v-model="matrices.C[0][i-1]"
                  :step="0.1"
                  size="small"
                  style="width: 80px; margin: 2px;"
                />
              </div>
            </div>
            
            <h4 style="margin-top: 15px;">D标量</h4>
            <el-input-number v-model="matrices.D" :step="0.1" style="width: 100%;" />
            
            <el-divider />
            
            <el-form-item label="输入信号">
              <el-select v-model="inputType" style="width: 100%;">
                <el-option label="阶跃信号" value="step" />
                <el-option label="脉冲信号" value="impulse" />
                <el-option label="正弦信号" value="sine" />
              </el-select>
            </el-form-item>
            
            <el-form-item v-if="inputType === 'step'" label="阶跃幅值">
              <el-input-number v-model="stepAmplitude" :min="0" :max="10" :step="0.1" />
            </el-form-item>
            
            <el-form-item v-if="inputType === 'sine'" label="频率(Hz)">
              <el-input-number v-model="sineFrequency" :min="0.1" :max="10" :step="0.1" />
            </el-form-item>
          </el-form>
          
          <div style="padding: 20px 40px;">
            <el-button 
              type="primary" 
              size="default"
              @click="simulate"
              style="width: 100%; height: 40px; display: block; margin: 0 0 10px 0; padding: 0;"
            >
              <el-icon><VideoPlay /></el-icon> 开始仿真
            </el-button>
            <el-button 
              size="default"
              @click="loadExample"
              style="width: 100%; height: 40px; display: block; margin: 0; padding: 0;"
            >
              加载示例
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
            <h3>系统响应</h3>
          </template>
          <div ref="responseChart" style="width: 100%; height: 400px;"></div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>相平面图 (前两个状态)</h3>
          </template>
          <div ref="phaseChart" style="width: 100%; height: 300px;"></div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>系统特征分析</h3>
          </template>
          
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="系统阶数">{{ order }}</el-descriptions-item>
            <el-descriptions-item label="可控性">
              <el-tag :type="controllability ? 'success' : 'danger'">
                {{ controllability ? '可控' : '不可控' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="可观性">
              <el-tag :type="observability ? 'success' : 'danger'">
                {{ observability ? '可观' : '不可观' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="稳定性">
              <el-tag :type="stability === '稳定' ? 'success' : stability === '临界' ? 'warning' : 'danger'">
                {{ stability }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
          
          <el-divider />
          
          <div v-if="eigenvalues.length > 0">
            <h4>特征值</h4>
            <div class="eigenvalues">
              <el-tag
                v-for="(ev, i) in eigenvalues"
                :key="`ev-${i}`"
                style="margin: 5px;"
                :type="ev.real < 0 ? 'success' : ev.real > 0 ? 'danger' : 'warning'"
              >
                λ{{ i+1 }}: {{ formatComplex(ev) }}
              </el-tag>
            </div>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>知识点</h3>
          </template>
          
          <el-alert type="info" :closable="false">
            <p><strong>状态空间表示法：</strong></p>
            <p>• 用一组一阶微分方程描述系统</p>
            <p>• A矩阵：系统矩阵，决定系统动态特性</p>
            <p>• B矩阵：输入矩阵，决定输入对状态的影响</p>
            <p>• C矩阵：输出矩阵，决定如何观测状态</p>
            <p>• D矩阵：直接传递矩阵</p>
            <p><strong>系统特性：</strong></p>
            <p>• 特征值实部为负→系统稳定</p>
            <p>• 可控性：能否通过输入控制所有状态</p>
            <p>• 可观性：能否通过输出观测所有状态</p>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const responseChart = ref<HTMLElement | null>(null)
const phaseChart = ref<HTMLElement | null>(null)
let responseChartInstance: echarts.ECharts | null = null
let phaseChartInstance: echarts.ECharts | null = null

const order = ref(2)
const inputType = ref('step')
const stepAmplitude = ref(1)
const sineFrequency = ref(1)

const matrices = reactive({
  A: [[0, 1], [-2, -3]],
  B: [[0], [1]],
  C: [[1, 0]],
  D: 0
})

const eigenvalues = ref<Array<{real: number, imag: number}>>([])
const controllability = ref(true)
const observability = ref(true)
const stability = ref('稳定')

onMounted(() => {
  if (responseChart.value) {
    responseChartInstance = echarts.init(responseChart.value)
  }
  if (phaseChart.value) {
    phaseChartInstance = echarts.init(phaseChart.value)
  }
})

onUnmounted(() => {
  if (responseChartInstance) {
    responseChartInstance.dispose()
  }
  if (phaseChartInstance) {
    phaseChartInstance.dispose()
  }
})

const updateMatrices = () => {
  const n = order.value
  
  // 初始化矩阵
  matrices.A = Array(n).fill(0).map(() => Array(n).fill(0))
  matrices.B = Array(n).fill(0).map(() => [0])
  matrices.C = [Array(n).fill(0)]
  
  // 默认值：标准形式
  for (let i = 0; i < n - 1; i++) {
    matrices.A[i][i + 1] = 1
  }
  matrices.B[n - 1][0] = 1
  matrices.C[0][0] = 1
}

const loadExample = () => {
  order.value = 2
  matrices.A = [[0, 1], [-2, -3]]
  matrices.B = [[0], [1]]
  matrices.C = [[1, 0]]
  matrices.D = 0
  inputType.value = 'step'
  stepAmplitude.value = 1
  
  ElMessage.success('已加载二阶系统示例')
}

const simulate = () => {
  const dt = 0.01
  const duration = 10
  const steps = Math.floor(duration / dt)
  
  const n = order.value
  const state = Array(n).fill(0)
  
  const timeData: number[] = []
  const outputData: number[] = []
  const state1Data: number[] = []
  const state2Data: number[] = []
  
  for (let step = 0; step < steps; step++) {
    const t = step * dt
    
    // 输入信号
    let u = 0
    if (inputType.value === 'step') {
      u = stepAmplitude.value
    } else if (inputType.value === 'impulse') {
      u = step === 0 ? 10 : 0
    } else if (inputType.value === 'sine') {
      u = Math.sin(2 * Math.PI * sineFrequency.value * t)
    }
    
    // 计算状态导数 ẋ = Ax + Bu
    const stateDot = Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        stateDot[i] += matrices.A[i][j] * state[j]
      }
      stateDot[i] += matrices.B[i][0] * u
    }
    
    // 更新状态（欧拉法）
    for (let i = 0; i < n; i++) {
      state[i] += stateDot[i] * dt
    }
    
    // 计算输出 y = Cx + Du
    let output = matrices.D * u
    for (let i = 0; i < n; i++) {
      output += matrices.C[0][i] * state[i]
    }
    
    // 记录数据
    if (step % 10 === 0) {
      timeData.push(parseFloat(t.toFixed(2)))
      outputData.push(parseFloat(output.toFixed(3)))
      state1Data.push(parseFloat(state[0].toFixed(3)))
      if (n >= 2) {
        state2Data.push(parseFloat(state[1].toFixed(3)))
      }
    }
  }
  
  // 更新响应曲线
  if (responseChartInstance) {
    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['输出', '状态1', '状态2'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: timeData, name: '时间 (s)' },
      yAxis: { type: 'value' },
      series: [
        {
          name: '输出',
          type: 'line',
          data: outputData,
          showSymbol: false,
          itemStyle: { color: '#409EFF' }
        },
        {
          name: '状态1',
          type: 'line',
          data: state1Data,
          showSymbol: false,
          itemStyle: { color: '#67C23A' }
        },
        ...(n >= 2 ? [{
          name: '状态2',
          type: 'line',
          data: state2Data,
          showSymbol: false,
          itemStyle: { color: '#E6A23C' }
        }] : [])
      ]
    }
    responseChartInstance.setOption(option)
  }
  
  // 更新相平面图
  if (phaseChartInstance && n >= 2) {
    const phaseData = state1Data.map((x1, i) => [x1, state2Data[i]])
    
    const option: echarts.EChartsOption = {
      tooltip: { trigger: 'axis' },
      grid: { left: '10%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'value', name: 'x₁' },
      yAxis: { type: 'value', name: 'x₂' },
      series: [
        {
          name: '相轨迹',
          type: 'line',
          data: phaseData,
          showSymbol: false,
          itemStyle: { color: '#F56C6C' }
        }
      ]
    }
    phaseChartInstance.setOption(option)
  }
  
  // 计算特征值（简化版，仅用于2x2）
  if (n === 2) {
    const a = matrices.A[0][0]
    const b = matrices.A[0][1]
    const c = matrices.A[1][0]
    const d = matrices.A[1][1]
    
    const trace = a + d
    const det = a * d - b * c
    const discriminant = trace * trace - 4 * det
    
    if (discriminant >= 0) {
      const lambda1 = (trace + Math.sqrt(discriminant)) / 2
      const lambda2 = (trace - Math.sqrt(discriminant)) / 2
      eigenvalues.value = [
        { real: lambda1, imag: 0 },
        { real: lambda2, imag: 0 }
      ]
    } else {
      const realPart = trace / 2
      const imagPart = Math.sqrt(-discriminant) / 2
      eigenvalues.value = [
        { real: realPart, imag: imagPart },
        { real: realPart, imag: -imagPart }
      ]
    }
    
    // 判断稳定性
    const maxReal = Math.max(...eigenvalues.value.map(ev => ev.real))
    if (maxReal < -0.01) {
      stability.value = '稳定'
    } else if (maxReal > 0.01) {
      stability.value = '不稳定'
    } else {
      stability.value = '临界稳定'
    }
    
    // 简化判断可控性和可观性
    controllability.value = Math.abs(b) > 0.01
    observability.value = Math.abs(matrices.C[0][0]) > 0.01 || Math.abs(matrices.C[0][1]) > 0.01
  }
  
  ElMessage.success('仿真完成')
}

const formatComplex = (ev: {real: number, imag: number}): string => {
  if (Math.abs(ev.imag) < 0.001) {
    return ev.real.toFixed(3)
  } else {
    return `${ev.real.toFixed(3)} ${ev.imag >= 0 ? '+' : ''}${ev.imag.toFixed(3)}j`
  }
}
</script>

<style scoped>
.state-space {
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
  margin: 10px 0;
}

.matrix-input {
  margin: 10px 0;
}

.matrix-row {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 5px;
}

.eigenvalues {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}
</style>
