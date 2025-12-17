<template>
  <div class="frequency-analysis">
    <h2>频域分析工具</h2>
    
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>
            <h3>传递函数设置</h3>
          </template>
          
          <el-form label-width="80px">
            <el-form-item label="分子">
              <el-input v-model="numerator" placeholder="例如: 1,2,3" />
              <span class="hint">输入多项式系数，用逗号分隔</span>
            </el-form-item>
            
            <el-form-item label="分母">
              <el-input v-model="denominator" placeholder="例如: 1,3,2" />
              <span class="hint">输入多项式系数，用逗号分隔</span>
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" @click="plotBode">绘制Bode图</el-button>
              <el-button type="success" @click="plotNyquist">绘制Nyquist图</el-button>
            </el-form-item>
          </el-form>
          
          <el-divider />
          
          <div class="examples">
            <h4>示例传递函数</h4>
            <el-button size="small" @click="loadExample1">一阶系统</el-button>
            <el-button size="small" @click="loadExample2">二阶系统</el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card>
          <template #header>
            <h3>{{ currentPlot }}</h3>
          </template>
          <div ref="chartRef" style="width: 100%; height: 600px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { TransferFunction } from '../utils/control'

const chartRef = ref<HTMLElement | null>(null)
let chart: echarts.ECharts | null = null

const numerator = ref('1')
const denominator = ref('1,1')
const currentPlot = ref('Bode图')

onMounted(() => {
  if (chartRef.value) {
    chart = echarts.init(chartRef.value)
  }
})

onUnmounted(() => {
  if (chart) {
    chart.dispose()
  }
})

const plotBode = () => {
  currentPlot.value = 'Bode图'
  
  const num = numerator.value.split(',').map(Number)
  const den = denominator.value.split(',').map(Number)
  
  // 生成频率数组（对数分布）
  const frequencies: number[] = []
  for (let i = -2; i <= 3; i += 0.1) {
    frequencies.push(Math.pow(10, i))
  }
  
  const { magnitude, phase } = TransferFunction.frequencyResponse(num, den, frequencies)
  
  if (!chart) return
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['幅值 (dB)', '相位 (°)']
    },
    grid: [
      { left: '10%', right: '10%', top: '10%', height: '35%' },
      { left: '10%', right: '10%', top: '55%', height: '35%' }
    ],
    xAxis: [
      {
        type: 'log',
        name: '频率 (Hz)',
        gridIndex: 0
      },
      {
        type: 'log',
        name: '频率 (Hz)',
        gridIndex: 1
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: '幅值 (dB)',
        gridIndex: 0
      },
      {
        type: 'value',
        name: '相位 (°)',
        gridIndex: 1
      }
    ],
    series: [
      {
        name: '幅值 (dB)',
        type: 'line',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: frequencies.map((freq, i) => [freq, magnitude[i]]),
        itemStyle: { color: '#409EFF' }
      },
      {
        name: '相位 (°)',
        type: 'line',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: frequencies.map((freq, i) => [freq, phase[i]]),
        itemStyle: { color: '#E6A23C' }
      }
    ]
  }
  
  chart.setOption(option)
}

const plotNyquist = () => {
  currentPlot.value = 'Nyquist图'
  
  const num = numerator.value.split(',').map(Number)
  const den = denominator.value.split(',').map(Number)
  
  const frequencies: number[] = []
  for (let i = -2; i <= 3; i += 0.05) {
    frequencies.push(Math.pow(10, i))
  }
  
  const { magnitude, phase } = TransferFunction.frequencyResponse(num, den, frequencies)
  
  // 转换为实部和虚部
  const realParts: number[] = []
  const imagParts: number[] = []
  
  magnitude.forEach((mag, i) => {
    const magLinear = Math.pow(10, mag / 20)
    const phaseRad = (phase[i] * Math.PI) / 180
    realParts.push(magLinear * Math.cos(phaseRad))
    imagParts.push(magLinear * Math.sin(phaseRad))
  })
  
  if (!chart) return
  
  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'value',
      name: '实部'
    },
    yAxis: {
      type: 'value',
      name: '虚部'
    },
    series: [
      {
        name: 'Nyquist曲线',
        type: 'line',
        data: realParts.map((real, i) => [real, imagParts[i]]),
        itemStyle: { color: '#67C23A' }
      }
    ]
  }
  
  chart.setOption(option)
}

const loadExample1 = () => {
  numerator.value = '1'
  denominator.value = '1,1'
}

const loadExample2 = () => {
  numerator.value = '1'
  denominator.value = '1,0.6,1'
}
</script>

<style scoped>
.frequency-analysis {
  padding: 20px;
}

h2, h3 {
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

.hint {
  font-size: 12px;
  color: #909399;
}

.examples {
  margin-top: 10px;
}

.examples .el-button {
  margin-right: 10px;
  margin-bottom: 10px;
}
</style>
