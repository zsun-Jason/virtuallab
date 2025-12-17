<template>
  <div id="app">
    <el-container>
      <el-header>
        <div class="header-content">
          <div class="header-title">
            <h1>⚓ 大连海事大学 · 自动化课程虚拟实验平台</h1>
          </div>
          <div class="header-actions">
            <el-button @click="toggleLanguage">{{ locale === 'zh' ? 'EN' : '中文' }}</el-button>
          </div>
        </div>
      </el-header>
      
      <el-container>
        <el-aside width="250px">
          <el-menu
            :default-active="currentRoute"
            router
            class="lab-menu"
          >
            <el-menu-item index="/">
              <el-icon><HomeFilled /></el-icon>
              <span>首页</span>
            </el-menu-item>
            
            <el-sub-menu index="control">
              <template #title>
                <el-icon><Setting /></el-icon>
                <span>控制系统</span>
              </template>
              <el-menu-item index="/pid-controller">PID控制器</el-menu-item>
              <el-menu-item index="/inverted-pendulum">倒立摆控制</el-menu-item>
              <el-menu-item index="/dc-motor">直流电机控制</el-menu-item>
              <el-menu-item index="/temperature-control">温度控制</el-menu-item>
            </el-sub-menu>
            
            <el-sub-menu index="analysis">
              <template #title>
                <el-icon><TrendCharts /></el-icon>
                <span>系统分析</span>
              </template>
              <el-menu-item index="/frequency-analysis">频域分析</el-menu-item>
              <el-menu-item index="/state-space">状态空间</el-menu-item>
            </el-sub-menu>
            
            <el-menu-item index="/plc-ladder">
              <el-icon><Grid /></el-icon>
              <span>PLC编程</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        
        <el-main>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { HomeFilled, Setting, TrendCharts, Grid } from '@element-plus/icons-vue'

const route = useRoute()
const locale = ref('zh')

const currentRoute = computed(() => route.path)

const toggleLanguage = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}
</script>

<style scoped>
#app {
  height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

.el-header {
  background-color: #409eff;
  color: white;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.header-title h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.el-aside {
  background-color: #f5f7fa;
  overflow-y: auto;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

.lab-menu {
  border: none;
  background-color: transparent;
}

.el-main {
  padding: 20px;
  background-color: #ffffff;
  overflow-y: auto;
}
</style>
