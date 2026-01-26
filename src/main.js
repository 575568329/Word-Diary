// 首先加载核心服务模块（必须最先加载，因为其他模块依赖它）
import * as servicesCore from './services-core.js'

// 将核心服务挂载到 window 对象，供 preload 脚本使用
if (typeof window !== 'undefined') {
  window.servicesCore = servicesCore
  // 触发加载完成事件
  document.dispatchEvent(new CustomEvent('servicesCoreReady'))
}

// 只在浏览器开发环境加载 mock（uTools 生产环境由 preload 提供真实 API）
// 检测是否在 uTools 环境中
if (typeof window !== 'undefined' && !window.utools) {
  import('./dev-mock.js')
}

import { createApp } from 'vue'
import './main.css'
import App from './App.vue'

createApp(App).mount('#app')
