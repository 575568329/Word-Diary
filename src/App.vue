<script setup>
import { onMounted, ref, computed } from 'vue'
import Translate from './Translate/index.vue'
import Review from './Review/index.vue'
import WordList from './WordList/index.vue'
import TagManage from './TagManage/index.vue'
import Settings from './Settings/index.vue'
import Statistics from './Statistics/index.vue'

const route = ref('')
const enterAction = ref({})

// 是否显示导航栏(始终显示)
const showNav = computed(() => {
  return typeof window !== 'undefined'
})

// 切换路由
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
    window.utools.onPluginOut(() => {
      route.value = ''
    })
  }
})
</script>

<template>
  <div class="app-container">
    <!-- 导航栏 -->
    <div v-if="showNav" class="nav-bar">
      <span class="logo-text">单词日记</span>
      <button :class="{ active: route === 'translate' }" @click="switchRoute('translate')">翻译</button>
      <button :class="{ active: route === 'review' }" @click="switchRoute('review')">复习</button>
      <button :class="{ active: route === 'wordlist' }" @click="switchRoute('wordlist')">单词本</button>
      <button :class="{ active: route === 'tags' }" @click="switchRoute('tags')">标签</button>
      <button :class="{ active: route === 'statistics' }" @click="switchRoute('statistics')">统计</button>
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
    <template v-if="route === 'statistics'">
      <Statistics :enterAction="enterAction"></Statistics>
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

/* 导航栏样式 */
.nav-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--primary-gradient);
  box-shadow: var(--shadow-md);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--border-light);
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1px;
  margin-right: 12px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.nav-bar button {
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.3px;
}

.nav-bar button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.nav-bar button.active {
  background: #fff;
  color: var(--primary-color);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}
</style>
