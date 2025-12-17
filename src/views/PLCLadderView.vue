<template>
  <div class="plc-ladder">
    <h2>PLC梯形图编程</h2>
    
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card>
          <template #header>
            <h3>组件库</h3>
          </template>
          
          <div class="component-library">
            <div
              v-for="comp in components"
              :key="comp.type"
              class="component-item"
              draggable="true"
              @dragstart="onDragStart($event, comp)"
            >
              <div class="component-icon">{{ comp.icon }}</div>
              <div class="component-name">{{ comp.name }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>I/O状态</h3>
          </template>
          
          <div class="io-panel">
            <h4>输入 (X)</h4>
            <div v-for="i in 8" :key="`input-${i}`" class="io-item">
              <el-switch 
                v-model="inputs[i-1]" 
                :active-text="`X${i-1}`"
                :disabled="isRunning"
              />
            </div>
            
            <el-divider />
            
            <h4>输出 (Y)</h4>
            <div v-for="i in 8" :key="`output-${i}`" class="io-item">
              <el-tag :type="outputs[i-1] ? 'success' : 'info'">
                Y{{ i-1 }}: {{ outputs[i-1] ? 'ON' : 'OFF' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="ladder-header">
              <h3>梯形图编辑器</h3>
              <div>
                <el-button type="primary" size="small" @click="runProgram" :disabled="isRunning">
                  <el-icon><VideoPlay /></el-icon> 运行
                </el-button>
                <el-button size="small" @click="stopProgram" :disabled="!isRunning">
                  <el-icon><VideoPause /></el-icon> 停止
                </el-button>
                <el-button size="small" @click="clearProgram">
                  <el-icon><Delete /></el-icon> 清空
                </el-button>
              </div>
            </div>
          </template>
          
          <div
            class="ladder-canvas"
            @drop="onDrop"
            @dragover="onDragOver"
          >
            <div v-if="rungs.length === 0" class="empty-hint">
              从左侧拖拽组件到此处开始编程
            </div>
            
            <div
              v-for="(rung, rungIndex) in rungs"
              :key="`rung-${rungIndex}`"
              class="rung"
            >
              <div class="rung-number">{{ rungIndex + 1 }}</div>
              <div class="rung-line-left"></div>
              
              <div class="rung-components">
                <div
                  v-for="(comp, compIndex) in rung"
                  :key="`comp-${rungIndex}-${compIndex}`"
                  class="ladder-component"
                  :class="{ active: comp.state }"
                >
                  <div class="component-symbol">{{ comp.icon }}</div>
                  <div class="component-label">
                    <el-input
                      v-model="comp.address"
                      size="small"
                      style="width: 60px;"
                      @blur="validateAddress(comp)"
                    />
                  </div>
                  <el-button
                    type="danger"
                    size="small"
                    circle
                    class="delete-btn"
                    @click="removeComponent(rungIndex, compIndex)"
                  >
                    <el-icon><Close /></el-icon>
                  </el-button>
                </div>
              </div>
              
              <div class="rung-line-right"></div>
              <el-button
                type="danger"
                size="small"
                circle
                @click="removeRung(rungIndex)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            
            <el-button type="primary" text @click="addRung" class="add-rung-btn">
              <el-icon><Plus /></el-icon> 添加新行
            </el-button>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card>
          <template #header>
            <h3>示例程序</h3>
          </template>
          
          <div class="examples">
            <el-button @click="loadExample1" size="small" style="width: 100%; margin-bottom: 10px;">
              启保停控制
            </el-button>
            <el-button @click="loadExample2" size="small" style="width: 100%; margin-bottom: 10px;">
              交通信号灯
            </el-button>
            <el-button @click="loadExample3" size="small" style="width: 100%;">
              自锁电路
            </el-button>
          </div>
        </el-card>
        
        <el-card style="margin-top: 20px;">
          <template #header>
            <h3>帮助说明</h3>
          </template>
          
          <el-alert type="info" :closable="false">
            <p><strong>基本操作：</strong></p>
            <p>• 从左侧拖拽组件到中间编辑区</p>
            <p>• 点击组件标签修改地址</p>
            <p>• X0-X7: 输入点</p>
            <p>• Y0-Y7: 输出点</p>
            <p>• M0-M99: 中间继电器</p>
            <p><strong>组件说明：</strong></p>
            <p>• ─┤├─ 常开触点</p>
            <p>• ─┤/├─ 常闭触点</p>
            <p>• ─( )─ 输出线圈</p>
          </el-alert>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { VideoPlay, VideoPause, Delete, Close, Plus } from '@element-plus/icons-vue'

interface LadderComponent {
  type: 'NO' | 'NC' | 'COIL'  // NO:常开 NC:常闭 COIL:线圈
  icon: string
  address: string
  state: boolean
}

const components = [
  { type: 'NO', icon: '─┤├─', name: '常开触点' },
  { type: 'NC', icon: '─┤/├─', name: '常闭触点' },
  { type: 'COIL', icon: '─( )─', name: '输出线圈' }
]

const rungs = ref<LadderComponent[][]>([])
const inputs = reactive<boolean[]>(new Array(8).fill(false))
const outputs = reactive<boolean[]>(new Array(8).fill(false))
const memory = reactive<Map<string, boolean>>(new Map())

const isRunning = ref(false)
let scanInterval: number | null = null

const onDragStart = (event: DragEvent, comp: any) => {
  event.dataTransfer!.effectAllowed = 'copy'
  event.dataTransfer!.setData('component', JSON.stringify(comp))
}

const onDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

const onDrop = (event: DragEvent) => {
  event.preventDefault()
  const compData = JSON.parse(event.dataTransfer!.getData('component'))
  
  // 如果没有行，先创建一行
  if (rungs.value.length === 0) {
    addRung()
  }
  
  // 添加到最后一行
  const lastRung = rungs.value[rungs.value.length - 1]
  
  // 检查最后一行是否已有输出线圈
  const hasCoil = lastRung.some(c => c.type === 'COIL')
  if (compData.type === 'COIL' && hasCoil) {
    ElMessage.warning('每行只能有一个输出线圈')
    return
  }
  
  const defaultAddress = compData.type === 'COIL' ? 'Y0' : 'X0'
  lastRung.push({
    type: compData.type,
    icon: compData.icon,
    address: defaultAddress,
    state: false
  })
}

const addRung = () => {
  rungs.value.push([])
}

const removeRung = (index: number) => {
  rungs.value.splice(index, 1)
}

const removeComponent = (rungIndex: number, compIndex: number) => {
  rungs.value[rungIndex].splice(compIndex, 1)
  if (rungs.value[rungIndex].length === 0) {
    removeRung(rungIndex)
  }
}

const validateAddress = (comp: LadderComponent) => {
  const addr = comp.address.toUpperCase()
  const validPattern = /^[XYM]\d+$/
  
  if (!validPattern.test(addr)) {
    ElMessage.error('地址格式错误！应为X0-X7, Y0-Y7, M0-M99')
    comp.address = comp.type === 'COIL' ? 'Y0' : 'X0'
    return
  }
  
  const type = addr[0]
  const num = parseInt(addr.substring(1))
  
  if ((type === 'X' || type === 'Y') && num > 7) {
    ElMessage.error('输入输出地址范围：0-7')
    comp.address = type + '0'
    return
  }
  
  if (type === 'M' && num > 99) {
    ElMessage.error('中间继电器地址范围：0-99')
    comp.address = 'M0'
    return
  }
  
  comp.address = addr
}

const getValue = (address: string): boolean => {
  const type = address[0]
  const num = parseInt(address.substring(1))
  
  if (type === 'X') {
    return inputs[num] || false
  } else if (type === 'Y') {
    return outputs[num] || false
  } else if (type === 'M') {
    return memory.get(address) || false
  }
  
  return false
}

const setValue = (address: string, value: boolean) => {
  const type = address[0]
  const num = parseInt(address.substring(1))
  
  if (type === 'Y') {
    outputs[num] = value
  } else if (type === 'M') {
    memory.set(address, value)
  }
}

const scanProgram = () => {
  // PLC扫描周期
  for (const rung of rungs.value) {
    if (rung.length === 0) continue
    
    // 计算该行的逻辑结果
    let rungResult = true
    let coilAddress = ''
    
    for (const comp of rung) {
      comp.state = false
      
      if (comp.type === 'NO') {
        // 常开触点
        const value = getValue(comp.address)
        rungResult = rungResult && value
        comp.state = value
      } else if (comp.type === 'NC') {
        // 常闭触点
        const value = !getValue(comp.address)
        rungResult = rungResult && value
        comp.state = value
      } else if (comp.type === 'COIL') {
        // 输出线圈
        coilAddress = comp.address
        comp.state = rungResult
      }
    }
    
    // 设置输出
    if (coilAddress) {
      setValue(coilAddress, rungResult)
    }
  }
}

const runProgram = () => {
  if (rungs.value.length === 0) {
    ElMessage.warning('请先编写梯形图程序')
    return
  }
  
  isRunning.value = true
  scanInterval = setInterval(scanProgram, 100) as unknown as number
  ElMessage.success('程序运行中')
}

const stopProgram = () => {
  isRunning.value = false
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
  ElMessage.info('程序已停止')
}

const clearProgram = () => {
  rungs.value = []
  outputs.fill(false)
  memory.clear()
}

const loadExample1 = () => {
  // 启保停控制
  clearProgram()
  rungs.value = [
    [
      { type: 'NO', icon: '─┤├─', address: 'X0', state: false },
      { type: 'COIL', icon: '─( )─', address: 'Y0', state: false }
    ],
    [
      { type: 'NO', icon: '─┤├─', address: 'Y0', state: false },
      { type: 'NC', icon: '─┤/├─', address: 'X1', state: false },
      { type: 'COIL', icon: '─( )─', address: 'Y0', state: false }
    ]
  ]
  ElMessage.success('已加载启保停控制示例：X0启动，X1停止，Y0输出')
}

const loadExample2 = () => {
  // 简单交通信号灯（简化版）
  clearProgram()
  rungs.value = [
    [
      { type: 'NO', icon: '─┤├─', address: 'X0', state: false },
      { type: 'COIL', icon: '─( )─', address: 'Y0', state: false }
    ],
    [
      { type: 'NO', icon: '─┤├─', address: 'X1', state: false },
      { type: 'COIL', icon: '─( )─', address: 'Y1', state: false }
    ],
    [
      { type: 'NO', icon: '─┤├─', address: 'X2', state: false },
      { type: 'COIL', icon: '─( )─', address: 'Y2', state: false }
    ]
  ]
  ElMessage.success('已加载交通灯示例：X0红灯，X1黄灯，X2绿灯')
}

const loadExample3 = () => {
  // 自锁电路
  clearProgram()
  rungs.value = [
    [
      { type: 'NO', icon: '─┤├─', address: 'X0', state: false },
      { type: 'NC', icon: '─┤/├─', address: 'X1', state: false },
      { type: 'COIL', icon: '─( )─', address: 'M0', state: false }
    ],
    [
      { type: 'NO', icon: '─┤├─', address: 'M0', state: false },
      { type: 'NC', icon: '─┤/├─', address: 'X1', state: false },
      { type: 'COIL', icon: '─( )─', address: 'M0', state: false }
    ],
    [
      { type: 'NO', icon: '─┤├─', address: 'M0', state: false },
      { type: 'COIL', icon: '─( )─', address: 'Y0', state: false }
    ]
  ]
  ElMessage.success('已加载自锁电路示例：X0启动，X1复位，Y0输出')
}
</script>

<style scoped>
.plc-ladder {
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

.ladder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.component-library {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.component-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  cursor: move;
  transition: all 0.3s;
}

.component-item:hover {
  background: #e4e7ed;
  transform: translateX(5px);
}

.component-icon {
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  margin-right: 10px;
  color: #409eff;
}

.component-name {
  font-size: 14px;
  color: #606266;
}

.io-panel {
  max-height: 400px;
  overflow-y: auto;
}

.io-item {
  margin-bottom: 10px;
}

.ladder-canvas {
  min-height: 400px;
  background: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  position: relative;
}

.empty-hint {
  text-align: center;
  color: #909399;
  padding: 50px;
  font-size: 14px;
}

.rung {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
}

.rung-number {
  width: 30px;
  text-align: center;
  color: #909399;
  font-weight: bold;
}

.rung-line-left,
.rung-line-right {
  width: 30px;
  height: 2px;
  background: #303133;
}

.rung-components {
  display: flex;
  align-items: center;
  flex: 1;
  background: white;
  padding: 10px;
  border-radius: 4px;
  min-height: 60px;
}

.ladder-component {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 10px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  border: 2px solid #dcdfe6;
  transition: all 0.3s;
}

.ladder-component.active {
  background: #e6f7ff;
  border-color: #409eff;
  box-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
}

.component-symbol {
  font-family: monospace;
  font-size: 20px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 5px;
}

.component-label {
  font-size: 12px;
}

.delete-btn {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-rung-btn {
  margin-top: 20px;
}

.examples {
  display: flex;
  flex-direction: column;
}
</style>
