<template>
  <div class="home-view">
    <el-card class="welcome-card">
      <template #header>
        <div style="display: flex; align-items: center; gap: 15px;">
          <span style="font-size: 32px;">⚓</span>
          <div>
            <h2 style="margin: 0;">大连海事大学自动化课程虚拟实验平台</h2>
            <p style="margin: 5px 0 0 0; color: #909399; font-size: 14px;">Dalian Maritime University Automation Lab</p>
          </div>
        </div>
      </template>
      <div style="line-height: 1.8;">
        <p class="intro">
          <strong>欢迎使用大连海事大学自动化虚拟实验平台！</strong>
        </p>
        <p style="margin: 10px 0;">
          本平台由大连海事大学自动化专业开发，提供多种控制系统仿真实验，支持学生随时随地进行实验学习和参数调试。
        </p>
        <p style="margin: 10px 0; color: #606266;">
          🎯 <strong>平台特色：</strong>真实物理模型 • 实时参数调节 • 详细实验指导 • 数据可视化分析
        </p>
      </div>
    </el-card>

    <div class="lab-grid">
      <el-card
        v-for="lab in labs"
        :key="lab.path"
        class="lab-card"
        shadow="hover"
        @click="navigateToLab(lab.path)"
      >
        <div class="lab-icon">{{ lab.icon }}</div>
        <h3>{{ lab.title }}</h3>
        <p>{{ lab.description }}</p>
        <el-tag :type="lab.difficulty === '初级' ? 'success' : lab.difficulty === '中级' ? 'warning' : 'danger'">
          {{ lab.difficulty }}
        </el-tag>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const labs = [
  {
    path: '/pid-controller',
    title: 'PID控制器仿真',
    description: '学习和调试PID控制器参数，观察系统响应',
    icon: '🎛️',
    difficulty: '初级'
  },
  {
    path: '/inverted-pendulum',
    title: '倒立摆控制',
    description: '经典的倒立摆平衡控制问题',
    icon: '⚖️',
    difficulty: '中级'
  },
  {
    path: '/dc-motor',
    title: '直流电机控制',
    description: '直流电机的速度和位置控制',
    icon: '⚙️',
    difficulty: '初级'
  },
  {
    path: '/temperature-control',
    title: '温度控制系统',
    description: '模拟温度控制的闭环系统',
    icon: '🌡️',
    difficulty: '初级'
  },
  {
    path: '/plc-ladder',
    title: 'PLC梯形图编程',
    description: '学习PLC的基本编程和逻辑控制',
    icon: '🪜',
    difficulty: '中级'
  },
  {
    path: '/frequency-analysis',
    title: '频域分析',
    description: 'Bode图、Nyquist图等频域分析工具',
    icon: '📊',
    difficulty: '中级'
  },
  {
    path: '/state-space',
    title: '状态空间分析',
    description: '现代控制理论的状态空间方法',
    icon: '🧮',
    difficulty: '高级'
  }
]

const navigateToLab = (path: string) => {
  router.push(path)
}
</script>

<style scoped>
.home-view {
  max-width: 1200px;
  margin: 0 auto;
}

.welcome-card {
  margin-bottom: 30px;
}

.welcome-card h2 {
  margin: 0;
  color: #409eff;
}

.intro {
  font-size: 16px;
  line-height: 1.6;
  color: #606266;
}

.lab-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.lab-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.lab-card:hover {
  transform: translateY(-5px);
}

.lab-icon {
  font-size: 48px;
  text-align: center;
  margin-bottom: 10px;
}

.lab-card h3 {
  margin: 10px 0;
  color: #303133;
}

.lab-card p {
  color: #909399;
  font-size: 14px;
  margin-bottom: 15px;
  min-height: 40px;
}
</style>
