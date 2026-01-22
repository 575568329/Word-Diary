<script setup>
import { onMounted, ref, computed } from 'vue'
import Translate from './Translate/index.vue'
import Review from './Review/index.vue'
import WordList from './WordList/index.vue'
import TagManage from './TagManage/index.vue'
import Settings from './Settings/index.vue'

const route = ref('')
const enterAction = ref({})

// 检查是否在真实 uTools 环境中（非 mock）
const isRealUtools = computed(() => {
  return typeof window !== 'undefined' && window.utools && !window.utools.__isMock
})

// 是否显示开发导航
const showDevNav = computed(() => {
  return typeof window !== 'undefined' && window.__DEV_MOCK__
})

// 切换路由（开发环境用）
const switchRoute = (code) => {
  route.value = code
  enterAction.value = { code, type: 'text', payload: '' }
}

onMounted(() => {
  if (window.utools) {
    window.utools.onPluginEnter((action) => {
      route.value = action.code
      enterAction.value = action
    })
    window.utools.onPluginOut((isKill) => {
      route.value = ''
    })
  }
})
</script>

<template>
  <div class="app-container">
    <!-- 开发环境导航 -->
    <div v-if="showDevNav" class="dev-nav">
      <span class="logo-text">单词日记</span>
      <button :class="{ active: route === 'translate' }" @click="switchRoute('translate')">翻译</button>
      <button :class="{ active: route === 'review' }" @click="switchRoute('review')">复习</button>
      <button :class="{ active: route === 'wordlist' }" @click="switchRoute('wordlist')">单词本</button>
      <button :class="{ active: route === 'tags' }" @click="switchRoute('tags')">标签</button>
      <button :class="{ active: route === 'settings' }" @click="switchRoute('settings')">设置</button>
    </div>
    
    <template v-if="route === 'translate'">
      <Translate :enterAction="enterAction"></Translate>
    </template>
    <template v-if="route === 'review'">
      <Review :enterAction="enterAction"></Review>
    </template>
    <template v-if="route === 'wordlist'">
      <WordList :enterAction="enterAction"></WordList>
    </template>
    <template v-if="route === 'tags'">
      <TagManage :enterAction="enterAction"></TagManage>
    </template>
    <template v-if="route === 'settings'">
      <Settings :enterAction="enterAction"></Settings>
    </template>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100%;
}

/* 开发环境导航样式 */
.dev-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: sticky;
  top: 0;
  z-index: 100;
}

.dev-badge {
  background: rgba(0, 0, 0, 0.2);
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  margin-right: 8px;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  margin-right: 12px;
}

.dev-nav button {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.dev-nav button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.dev-nav button.active {
  background: #fff;
  color: #667eea;
  font-weight: 600;
}
</style>
