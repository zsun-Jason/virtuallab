import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/pid-controller',
    name: 'PIDController',
    component: () => import('../views/PIDControllerView.vue'),
    meta: { title: 'PID控制器仿真' }
  },
  {
    path: '/inverted-pendulum',
    name: 'InvertedPendulum',
    component: () => import('../views/InvertedPendulumView.vue'),
    meta: { title: '倒立摆控制' }
  },
  {
    path: '/dc-motor',
    name: 'DCMotor',
    component: () => import('../views/DCMotorView.vue'),
    meta: { title: '直流电机控制' }
  },
  {
    path: '/temperature-control',
    name: 'TemperatureControl',
    component: () => import('../views/TemperatureControlView.vue'),
    meta: { title: '温度控制系统' }
  },
  {
    path: '/plc-ladder',
    name: 'PLCLadder',
    component: () => import('../views/PLCLadderView.vue'),
    meta: { title: 'PLC梯形图编程' }
  },
  {
    path: '/frequency-analysis',
    name: 'FrequencyAnalysis',
    component: () => import('../views/FrequencyAnalysisView.vue'),
    meta: { title: '频域分析' }
  },
  {
    path: '/state-space',
    name: 'StateSpace',
    component: () => import('../views/StateSpaceView.vue'),
    meta: { title: '状态空间分析' }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
