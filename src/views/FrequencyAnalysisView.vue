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
          </el-form>
          
          <div style="padding: 20px 40px;">
            <el-button 
              type="primary" 
              size="default"
              @click="plotBode"
              style="width: 100%; height: 40px; display: block; margin: 0 0 10px 0; padding: 0;"
            >
              绘制Bode图
            </el-button>
            <el-button 
              type="success"
              size="default"
              @click="plotNyquist"
              style="width: 100%; height: 40px; display: block; margin: 0; padding: 0;"
            >
              绘制Nyquist图
            </el-button>
          </div>
          
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
                <p>1. 理解频域分析的基本概念和物理意义</p>
                <p>2. 掌握Bode图和Nyquist图的绘制与分析方法</p>
                <p>3. 学会通过频域特性判断系统稳定性和性能</p>
                <p>4. 掌握相位裕度、幅值裕度等关键指标的计算</p>
                
                <h4 style="color: #409EFF;">二、频域分析理论</h4>
                <p><strong>传递函数：</strong>G(s) = N(s) / D(s)</p>
                <p>将s替换为jω，得到频率响应函数G(jω)</p>
                <p><strong>• 幅频特性：</strong>|G(jω)| = 系统对不同频率输入的增益</p>
                <p><strong>• 相频特性：</strong>∠G(jω) = 系统对不同频率输入的相位滞后</p>
                
                <h4 style="color: #409EFF;">三、Bode图（伯德图）</h4>
                <p><strong>组成：</strong>两个图——幅值图和相位图</p>
                <p><strong>幅值图：</strong>纵轴为20log|G(jω)| (dB)，横轴为logω（对数频率）</p>
                <p><strong>相位图：</strong>纵轴为∠G(jω) (°)，横轴为logω</p>
                
                <h4 style="color: #409EFF;">四、Nyquist图</h4>
                <p><strong>定义：</strong>在复平面上绘制G(jω)的轨迹，ω从0→∞</p>
                <p><strong>应用：</strong>奈奎斯特稳定判据——通过曲线包围(-1,0)点判断闭环稳定性</p>
                
                <p style="background: #f0f9ff; padding: 10px; border-left: 4px solid #409EFF;">
                  <strong>关键指标：</strong><br>
                  • <strong>截止频率ωc：</strong>幅值穿越0dB的频率<br>
                  • <strong>相位裕度PM：</strong>在ωc处，相位距离-180°的余量，PM>45°系统稳定<br>
                  • <strong>幅值裕度GM：</strong>在相位-180°处，幅值距离0dB的余量
                </p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="🔬 实验步骤" name="2">
              <div style="padding: 10px;">
                <h4 style="color: #67C23A; margin-top: 0;">步骤1：一阶系统Bode图</h4>
                <p>• 选择预设："一阶系统"，G(s) = 1/(s+1)</p>
                <p>• 点击"绘制Bode图"</p>
                <p><strong>观察：</strong>幅值低频0dB，高频-20dB/dec；相位0°→-90°</p>
                
                <p><strong>步骤2：二阶系统</strong></p>
                <p>• 选择"二阶系统"，观察-40dB/dec斜率</p>
                
                <p><strong>步骤3：Nyquist图</strong></p>
                <p>• 绘制Nyquist图，观察是否包围(-1,0)点</p>
                
                <p><strong>步骤4：稳定性判断</strong></p>
                <p>• 自定义传递函数，读取ωc和PM</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="📊 实验报告要求" name="3">
              <div style="padding: 10px;">
                <h4 style="color: #E6A23C; margin-top: 0;">记录内容：</h4>
                <p><strong>1. 特性对比表</strong></p>
                <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                  <thead>
                    <tr style="background: #f5f7fa;">
                      <th style="border: 1px solid #ddd; padding: 8px;">传递函数</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">截止频率</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">相位裕度</th>
                      <th style="border: 1px solid #ddd; padding: 8px;">稳定性</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #ddd; padding: 8px;">1/(s+1)</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                      <td style="border: 1px solid #ddd; padding: 8px;">...</td>
                    </tr>
                  </tbody>
                </table>
                
                <p><strong>2. 思考题</strong></p>
                <p>① Bode图为什么用dB表示？</p>
                <p>② Nyquist图包围(-1,0)点意味着什么？</p>
                <p>③ PM=60°和PM=30°哪个更稳定？</p>
              </div>
            </el-collapse-item>
            
            <el-collapse-item title="💡 扩展挑战" name="4">
              <div style="padding: 10px;">
                <h4 style="color: #F56C6C; margin-top: 0;">高级任务：</h4>
                <p><strong>挑战1：</strong>研究带宽与上升时间关系(上升时间≈2.2/ωc)</p>
                <p><strong>挑战2：</strong>分析非最小相位系统G(s)=(1-s)/(1+s)</p>
                <p><strong>挑战3：</strong>设计超前校正器提升相位裕度</p>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { TransferFunction } from '../utils/control'

const activeSteps = ref([])  // 默认全部收起

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
    const currentPhase = phase[i] ?? 0
    const phaseRad = (currentPhase * Math.PI) / 180
    realParts.push(magLinear * Math.cos(phaseRad))
    imagParts.push(magLinear * Math.sin(phaseRad))
  })
  
  if (!chart) {
    console.error('Chart not initialized')
    return
  }
  
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
  padding: 0;
}

h2, h3 {
  color: #303133;
}

h2 {
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
