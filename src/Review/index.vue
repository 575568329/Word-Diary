<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

const props = defineProps({
  enterAction: {
    type: Object,
    required: true
  }
})

// 状态
const currentView = ref('settings') // settings, review, complete
const reviewWords = ref([])
const currentIndex = ref(0)
const showAnswer = ref(false)
const isLoading = ref(false)
const isSpeaking = ref(false)

// 输入验证模式相关
const typingMode = ref('word') // word: 看翻译写单词, translation: 看单词写翻译
const userInput = ref('')
const inputVerified = ref(false) // 是否已验证
const inputCorrect = ref(false) // 验证结果是否正确

// 发音功能 - 使用浏览器内置 Web Speech API
const speak = (text) => {
  if (!text || isSpeaking.value) return
  
  if (!window.speechSynthesis) {
    window.utools?.showNotification?.('当前环境不支持语音合成')
    return
  }
  
  window.speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  const isChinese = /[\u4e00-\u9fa5]/.test(text)
  utterance.lang = isChinese ? 'zh-CN' : 'en-US'
  utterance.rate = 0.9
  utterance.pitch = 1
  
  utterance.onstart = () => { isSpeaking.value = true }
  utterance.onend = () => { isSpeaking.value = false }
  utterance.onerror = () => { isSpeaking.value = false }
  
  window.speechSynthesis.speak(utterance)
}

// 设置选项
const allTags = ref([])
const excludeTags = ref([])
const minDaysOld = ref(0)
const reviewMode = ref('spaced') // spaced (记忆曲线), all (全部)
const reviewMethod = ref('normal') // normal (普通模式), typing (拼写验证)
const showFilterModal = ref(false)

// 统计
const statistics = ref({})
const reviewResults = ref({
  total: 0,
  remembered: 0,
  forgotten: 0
})

// 当前单词
const currentWord = computed(() => {
  return reviewWords.value[currentIndex.value] || null
})

// 进度
const progress = computed(() => {
  if (reviewWords.value.length === 0) return 0
  return Math.round((currentIndex.value / reviewWords.value.length) * 100)
})

// 加载标签
const loadTags = () => {
  allTags.value = window.services.getAllTags()
}

// 加载统计
const loadStatistics = () => {
  statistics.value = window.services.getStatistics()
}

// 切换排除标签
const toggleExcludeTag = (tagName) => {
  const index = excludeTags.value.indexOf(tagName)
  if (index > -1) {
    excludeTags.value.splice(index, 1)
  } else {
    excludeTags.value.push(tagName)
  }
}

// 开始复习
const startReview = () => {
  isLoading.value = true
  showFilterModal.value = false
  
  const options = {
    excludeTags: excludeTags.value,
    minDaysOld: minDaysOld.value || undefined,
    onlyDue: reviewMode.value === 'spaced'
  }
  
  reviewWords.value = window.services.getReviewWords(options)
  currentIndex.value = 0
  showAnswer.value = false
  resetInputState()
  reviewResults.value = { total: reviewWords.value.length, remembered: 0, forgotten: 0 }
  
  isLoading.value = false
  
  if (reviewWords.value.length > 0) {
    currentView.value = 'review'
  } else {
    window.utools?.showNotification?.('暂无需要复习的单词')
  }
}

// 显示答案
const revealAnswer = () => {
  showAnswer.value = true
}

// 验证用户输入
const verifyInput = () => {
  if (!currentWord.value || !userInput.value.trim()) return
  
  const input = userInput.value.trim().toLowerCase()
  let correct = false
  
  if (typingMode.value === 'word') {
    // 看翻译写单词：验证英文单词（精确匹配）
    correct = input === currentWord.value.word.toLowerCase()
  } else {
    // 看单词写翻译：验证中文翻译
    const translation = currentWord.value.translation.toLowerCase()
    
    // 将翻译按分隔符拆分成多个词义
    const meanings = translation.split(/[,，;；、]/).map(m => m.trim()).filter(m => m)
    
    // 用户输入需要完全匹配其中一个词义，或者翻译完全匹配输入
    correct = meanings.some(m => m === input) || translation === input
    
    // 额外支持：如果用户输入包含了第一个词义（允许更详细的回答）
    if (!correct && meanings.length > 0) {
      const firstMeaning = meanings[0]
      // 用户输入必须以第一个词义开头或等于它
      correct = input.startsWith(firstMeaning) || firstMeaning.startsWith(input)
    }
  }
  
  inputVerified.value = true
  inputCorrect.value = correct
  showAnswer.value = true
}

// 输入框回车事件
const handleInputKeyup = (e) => {
  if (e.key === 'Enter' && !inputVerified.value) {
    verifyInput()
  }
}

// 重置输入状态
const resetInputState = () => {
  userInput.value = ''
  inputVerified.value = false
  inputCorrect.value = false
}

// 评估记忆（0-5）
const rateMemory = (quality) => {
  if (!currentWord.value) return
  
  // 更新复习状态
  window.services.updateReviewStatus(currentWord.value._id, quality)
  
  // 记录结果
  if (quality >= 3) {
    reviewResults.value.remembered++
  } else {
    reviewResults.value.forgotten++
  }
  
  // 下一个单词
  nextWord()
}

// 下一个单词
const nextWord = () => {
  if (currentIndex.value < reviewWords.value.length - 1) {
    currentIndex.value++
    showAnswer.value = false
    resetInputState()
  } else {
    currentView.value = 'complete'
    loadStatistics()
  }
}

// 跳过
const skipWord = () => {
  nextWord()
}

// 重新开始
const restartReview = () => {
  currentView.value = 'settings'
  reviewWords.value = []
  currentIndex.value = 0
  showAnswer.value = false
  resetInputState()
}

// 退出复习
const exitReview = () => {
  currentView.value = 'settings'
  reviewWords.value = []
  currentIndex.value = 0
  showAnswer.value = false
  resetInputState()
}

// 标签相关
const wordTags = ref([])
const showTagEditor = ref(false)

// 编辑标签
const editWordTags = () => {
  if (!currentWord.value) return
  wordTags.value = [...(currentWord.value.tags || [])]
  showTagEditor.value = true
}

// 切换单词标签
const toggleWordTag = (tagName) => {
  const index = wordTags.value.indexOf(tagName)
  if (index > -1) {
    wordTags.value.splice(index, 1)
  } else {
    wordTags.value.push(tagName)
  }
}

// 保存标签
const saveWordTags = () => {
  if (!currentWord.value) return
  
  const updatedWord = {
    ...currentWord.value,
    tags: [...wordTags.value]  // 创建新数组避免引用问题
  }
  
  const result = window.services.saveWord(updatedWord)
  
  // 更新 reviewWords 数组中对应单词的数据
  if (result) {
    const idx = currentIndex.value
    reviewWords.value[idx] = { ...reviewWords.value[idx], tags: [...wordTags.value] }
  }
  
  showTagEditor.value = false
  window.utools?.showNotification?.('标签已更新')
}

// 获取标签颜色
const getTagColor = (tagName) => {
  const tag = allTags.value.find(t => t.name === tagName)
  return tag?.color || '#909399'
}

// 格式化日期
const formatDate = (timestamp) => {
  if (!timestamp) return '从未'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 获取记忆状态描述
const getMemoryStatus = (word) => {
  if (!word.interval || word.interval === 0) return '新单词'
  if (word.interval < 7) return '学习中'
  if (word.interval < 21) return '巩固中'
  return '已掌握'
}

// 键盘快捷键处理
const handleKeydown = (e) => {
  // 如果正在编辑标签或输入框聚焦时，不处理某些快捷键
  const isInputFocused = document.activeElement?.tagName === 'INPUT' || 
                         document.activeElement?.tagName === 'TEXTAREA' ||
                         document.activeElement?.tagName === 'SELECT'
  
  // 如果弹窗打开，不处理
  if (showFilterModal.value || showTagEditor.value) return
  
  // 只在复习页面处理
  if (currentView.value !== 'review') return
  
  // 拼写验证模式
  if (reviewMethod.value === 'typing') {
    // 如果输入框聚焦，只处理特定键
    if (isInputFocused) {
      // Enter 键验证（已在 input 的 keyup 事件处理）
      return
    }
    
    // 验证后的快捷键
    if (inputVerified.value) {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        e.preventDefault()
        // 先评分再下一个
        rateMemory(inputCorrect.value ? 4 : 2)
      }
    }
    return
  }
  
  // 普通模式（翻卡自评）
  if (isInputFocused) return
  
  // 显示答案
  if (!showAnswer.value) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      revealAnswer()
    } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 's') {
      e.preventDefault()
      skipWord()
    } else if (e.key.toLowerCase() === 'p') {
      // P 键朗读单词
      e.preventDefault()
      if (currentWord.value) speak(currentWord.value.word)
    }
    return
  }
  
  // 已显示答案，评分快捷键
  if (e.key === '1') {
    e.preventDefault()
    rateMemory(1) // 完全忘记
  } else if (e.key === '2') {
    e.preventDefault()
    rateMemory(2) // 很难想起
  } else if (e.key === '3') {
    e.preventDefault()
    rateMemory(3) // 有点印象
  } else if (e.key === '4') {
    e.preventDefault()
    rateMemory(4) // 记得清楚
  } else if (e.key === '5') {
    e.preventDefault()
    rateMemory(5) // 完全掌握
  } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 's') {
    e.preventDefault()
    skipWord()
  } else if (e.key.toLowerCase() === 'p') {
    // P 键朗读翻译
    e.preventDefault()
    if (currentWord.value) speak(currentWord.value.translation)
  }
}

onMounted(() => {
  loadTags()
  loadStatistics()
  window.utools?.setExpendHeight?.(600)
  
  // 添加键盘事件监听
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  // 移除键盘事件监听
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="review-container">
    <!-- 设置页面 -->
    <div v-if="currentView === 'settings'" class="settings-view">
      <h1 class="title">📚 复习单词</h1>
      
      <!-- 统计卡片 -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ statistics.totalWords || 0 }}</div>
          <div class="stat-label">总单词</div>
        </div>
        <div class="stat-card highlight">
          <div class="stat-value">{{ statistics.needReview || 0 }}</div>
          <div class="stat-label">待复习</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.mastered || 0 }}</div>
          <div class="stat-label">已掌握</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ statistics.todayReviewed || 0 }}</div>
          <div class="stat-label">今日已复习</div>
        </div>
      </div>
      
      <!-- 复习模式选择 -->
      <div class="settings-section">
        <h3>复习范围</h3>
        <div class="mode-selector">
          <label class="mode-option" :class="{ active: reviewMode === 'spaced' }">
            <input type="radio" v-model="reviewMode" value="spaced">
            <span class="mode-icon">🧠</span>
            <span class="mode-text">
              <strong>记忆曲线</strong>
              <small>只复习到期的单词</small>
            </span>
          </label>
          <label class="mode-option" :class="{ active: reviewMode === 'all' }">
            <input type="radio" v-model="reviewMode" value="all">
            <span class="mode-icon">📋</span>
            <span class="mode-text">
              <strong>全部单词</strong>
              <small>复习所有保存的单词</small>
            </span>
          </label>
        </div>
      </div>
      
      <!-- 复习方式选择 -->
      <div class="settings-section">
        <h3>复习方式</h3>
        <div class="method-selector">
          <label class="method-option" :class="{ active: reviewMethod === 'normal' }">
            <input type="radio" v-model="reviewMethod" value="normal">
            <span class="method-icon">👁️</span>
            <span>翻卡自评</span>
          </label>
          <label class="method-option" :class="{ active: reviewMethod === 'typing' }">
            <input type="radio" v-model="reviewMethod" value="typing">
            <span class="method-icon">⌨️</span>
            <span>拼写验证</span>
          </label>
        </div>
        
        <!-- 拼写验证方向选择 -->
        <div class="typing-direction" v-if="reviewMethod === 'typing'">
          <label class="typing-option" :class="{ active: typingMode === 'word' }">
            <input type="radio" v-model="typingMode" value="word">
            <span>📖 看翻译写单词</span>
          </label>
          <label class="typing-option" :class="{ active: typingMode === 'translation' }">
            <input type="radio" v-model="typingMode" value="translation">
            <span>🔤 看单词写翻译</span>
          </label>
        </div>
      </div>
      
      <button class="btn-primary" @click="showFilterModal = true" :disabled="isLoading">
        开始复习
      </button>
    </div>
    
    <!-- 筛选条件弹窗 -->
    <div v-if="showFilterModal" class="modal-overlay" @click.self="showFilterModal = false">
      <div class="modal-content filter-modal">
        <div class="modal-header">
          <h3>筛选条件</h3>
          <button class="btn-close" @click="showFilterModal = false">×</button>
        </div>
        
        <div class="modal-body">
          <div class="setting-item">
            <label>复习几天前添加的单词</label>
            <select v-model="minDaysOld" class="select-input">
              <option :value="0">不限制</option>
              <option :value="1">1天前</option>
              <option :value="3">3天前</option>
              <option :value="7">7天前</option>
              <option :value="14">14天前</option>
              <option :value="30">30天前</option>
            </select>
          </div>
          
          <div class="setting-item" v-if="allTags.length > 0">
            <label>排除以下标签的单词</label>
            <div class="tag-list">
              <span 
                v-for="tag in allTags" 
                :key="tag._id"
                class="tag"
                :class="{ excluded: excludeTags.includes(tag.name) }"
                :style="{ 
                  backgroundColor: excludeTags.includes(tag.name) ? '#ddd' : tag.color,
                  textDecoration: excludeTags.includes(tag.name) ? 'line-through' : 'none'
                }"
                @click="toggleExcludeTag(tag.name)"
              >
                {{ tag.name }}
              </span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <button class="btn-secondary" @click="showFilterModal = false">取消</button>
          <button class="btn-primary" @click="startReview">确定开始</button>
        </div>
      </div>
    </div>
    
    <!-- 复习页面 -->
    <div v-else-if="currentView === 'review'" class="review-view">
      <!-- 进度条 -->
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-text">{{ currentIndex + 1 }} / {{ reviewWords.length }}</div>
      
      <!-- 单词卡片 -->
      <div class="word-card" v-if="currentWord">
        <div class="word-status">{{ getMemoryStatus(currentWord) }}</div>
        
        <div class="word-content">
          <!-- 拼写验证模式 - 看翻译写单词 -->
          <template v-if="reviewMethod === 'typing' && typingMode === 'word'">
            <div class="typing-question">
              <span class="question-label">翻译：</span>
              <span class="question-text">{{ currentWord.translation }}</span>
              <button 
                type="button"
                class="btn-speak" 
                :class="{ speaking: isSpeaking }"
                @click="speak(currentWord.translation)"
                title="朗读翻译"
              >
                🔊
              </button>
            </div>
            
            <!-- 输入区域 -->
            <div class="typing-input-area">
              <input 
                v-model="userInput"
                type="text"
                class="typing-input"
                :class="{ 
                  correct: inputVerified && inputCorrect, 
                  wrong: inputVerified && !inputCorrect 
                }"
                placeholder="请输入对应的英文单词... [回车验证]"
                @keyup="handleInputKeyup"
                :disabled="inputVerified"
                autofocus
              >
              <button 
                v-if="!inputVerified"
                class="btn-verify" 
                @click="verifyInput"
                :disabled="!userInput.trim()"
              >
                验证
              </button>
            </div>
            
            <!-- 验证结果 -->
            <div v-if="inputVerified" class="verify-result" :class="{ correct: inputCorrect, wrong: !inputCorrect }">
              <span v-if="inputCorrect">✅ 正确！</span>
              <span v-else>❌ 错误，正确答案是：<strong>{{ currentWord.word }}</strong></span>
            </div>
          </template>
          
          <!-- 拼写验证模式 - 看单词写翻译 -->
          <template v-else-if="reviewMethod === 'typing' && typingMode === 'translation'">
            <h2 class="word-text">
              {{ currentWord.word }}
              <button 
                type="button"
                class="btn-speak" 
                :class="{ speaking: isSpeaking }"
                @click="speak(currentWord.word)"
                title="朗读单词"
              >
                🔊
              </button>
            </h2>
            
            <!-- 输入区域 -->
            <div class="typing-input-area">
              <input 
                v-model="userInput"
                type="text"
                class="typing-input"
                :class="{ 
                  correct: inputVerified && inputCorrect, 
                  wrong: inputVerified && !inputCorrect 
                }"
                placeholder="请输入中文翻译... [回车验证]"
                @keyup="handleInputKeyup"
                :disabled="inputVerified"
                autofocus
              >
              <button 
                v-if="!inputVerified"
                class="btn-verify" 
                @click="verifyInput"
                :disabled="!userInput.trim()"
              >
                验证
              </button>
            </div>
            
            <!-- 验证结果 -->
            <div v-if="inputVerified" class="verify-result" :class="{ correct: inputCorrect, wrong: !inputCorrect }">
              <span v-if="inputCorrect">✅ 正确！</span>
              <span v-else>❌ 错误，正确答案是：<strong>{{ currentWord.translation }}</strong></span>
            </div>
          </template>
          
          <!-- 普通复习模式 -->
          <template v-else>
            <h2 class="word-text">
              {{ currentWord.word }}
              <button 
                type="button"
                class="btn-speak" 
                :class="{ speaking: isSpeaking }"
                @click="speak(currentWord.word)"
                title="朗读单词"
              >
                🔊
              </button>
            </h2>
            
            <!-- 标签 -->
            <div class="word-tags" v-if="currentWord.tags?.length">
              <span 
                v-for="tag in currentWord.tags" 
                :key="tag"
                class="tag small"
                :style="{ backgroundColor: getTagColor(tag) }"
              >
                {{ tag }}
              </span>
            </div>
            
            <!-- 答案区域 -->
            <div v-if="showAnswer" class="answer-area">
              <div class="translation">
                {{ currentWord.translation }}
                <button 
                  type="button"
                  class="btn-speak" 
                  :class="{ speaking: isSpeaking }"
                  @click="speak(currentWord.translation)"
                  title="朗读翻译"
                >
                  🔊
                </button>
              </div>
              <div class="word-meta">
                <span>上次复习: {{ formatDate(currentWord.lastReviewTime) }}</span>
                <span>复习次数: {{ currentWord.reviewCount || 0 }}</span>
              </div>
            </div>
            
            <button v-else class="btn-reveal" @click="revealAnswer">
              点击显示答案 <span class="shortcut-hint">[空格]</span>
            </button>
          </template>
          
          <!-- 标签（拼写验证模式下也显示） -->
          <div class="word-tags" v-if="reviewMethod === 'typing' && currentWord.tags?.length && inputVerified">
            <span 
              v-for="tag in currentWord.tags" 
              :key="tag"
              class="tag small"
              :style="{ backgroundColor: getTagColor(tag) }"
            >
              {{ tag }}
            </span>
          </div>
        </div>
        
        <!-- 操作按钮 - 拼写验证模式 -->
        <div v-if="reviewMethod === 'typing' && inputVerified" class="rating-buttons">
          <div class="typing-actions">
            <button 
              class="btn-rate" 
              :class="inputCorrect ? 'easy' : 'hard'"
              @click="rateMemory(inputCorrect ? 4 : 2)"
            >
              <span class="rate-icon">{{ inputCorrect ? '👍' : '💪' }}</span>
              <span>{{ inputCorrect ? '继续保持' : '需要加强' }}</span>
            </button>
            <button class="btn-next" @click="rateMemory(inputCorrect ? 4 : 2)">
              下一个 <span class="shortcut-hint">[空格/→]</span>
            </button>
          </div>
        </div>
        
        <!-- 操作按钮 - 普通模式 -->
        <div v-else-if="showAnswer && reviewMethod !== 'typing'" class="rating-buttons">
          <p class="rating-hint">你记住这个单词了吗？<span class="shortcut-hint">按数字键 1-5 快速评分</span></p>
          <div class="rating-grid">
            <button class="btn-rate forgot" @click="rateMemory(1)">
              <span class="rate-icon">😰</span>
              <span>完全忘记</span>
              <span class="key-hint">1</span>
            </button>
            <button class="btn-rate hard" @click="rateMemory(2)">
              <span class="rate-icon">😓</span>
              <span>很难想起</span>
              <span class="key-hint">2</span>
            </button>
            <button class="btn-rate good" @click="rateMemory(3)">
              <span class="rate-icon">🤔</span>
              <span>有点印象</span>
              <span class="key-hint">3</span>
            </button>
            <button class="btn-rate easy" @click="rateMemory(4)">
              <span class="rate-icon">😊</span>
              <span>记得清楚</span>
              <span class="key-hint">4</span>
            </button>
            <button class="btn-rate perfect" @click="rateMemory(5)">
              <span class="rate-icon">🎉</span>
              <span>完全掌握</span>
              <span class="key-hint">5</span>
            </button>
          </div>
        </div>
        
        <!-- 底部操作 -->
        <div class="card-actions">
          <button class="btn-text" @click="editWordTags">🏷️ 编辑标签</button>
          <button class="btn-text" @click="skipWord">跳过 →</button>
          <button class="btn-text btn-exit" @click="exitReview">退出复习</button>
        </div>
      </div>
      
      <!-- 标签编辑弹窗 -->
      <div v-if="showTagEditor" class="modal-overlay" @click.self="showTagEditor = false">
        <div class="modal-content">
          <h3>编辑标签</h3>
          <div class="tag-list">
            <span 
              v-for="tag in allTags" 
              :key="tag._id"
              class="tag"
              :class="{ selected: wordTags.includes(tag.name) }"
              :style="{ 
                backgroundColor: wordTags.includes(tag.name) ? tag.color : 'transparent',
                borderColor: tag.color,
                color: wordTags.includes(tag.name) ? '#fff' : tag.color
              }"
              @click="toggleWordTag(tag.name)"
            >
              {{ tag.name }}
            </span>
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" @click="showTagEditor = false">取消</button>
            <button class="btn-primary" @click="saveWordTags">保存</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 完成页面 -->
    <div v-else-if="currentView === 'complete'" class="complete-view">
      <div class="complete-icon">🎊</div>
      <h1>复习完成！</h1>
      
      <div class="result-stats">
        <div class="result-item">
          <span class="result-value">{{ reviewResults.total }}</span>
          <span class="result-label">总计</span>
        </div>
        <div class="result-item success">
          <span class="result-value">{{ reviewResults.remembered }}</span>
          <span class="result-label">记住了</span>
        </div>
        <div class="result-item danger">
          <span class="result-value">{{ reviewResults.forgotten }}</span>
          <span class="result-label">需加强</span>
        </div>
      </div>
      
      <div class="accuracy">
        正确率: {{ reviewResults.total > 0 ? Math.round(reviewResults.remembered / reviewResults.total * 100) : 0 }}%
      </div>
      
      <button class="btn-primary" @click="restartReview">继续复习</button>
    </div>
  </div>
</template>

<style scoped>
.review-container {
  padding: 12px;
  box-sizing: border-box;
  max-height: 100%;
  overflow-y: auto;
}

/* 设置页面 */
.settings-view {
  max-width: 100%;
}

.title {
  text-align: center;
  font-size: 18px;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.stat-card {
  background: var(--card-bg, #fff);
  border-radius: 8px;
  padding: 8px 4px;
  text-align: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.stat-card.highlight {
  background: linear-gradient(135deg, #FF9F43, #FFB347);
  color: #fff;
}

.stat-card.highlight .stat-value {
  color: #fff;
}

.stat-card.highlight .stat-label {
  color: rgba(255, 255, 255, 0.9);
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary-color, #409eff);
}

.stat-label {
  font-size: 11px;
  opacity: 0.8;
}

.settings-section {
  background: var(--card-bg, #fff);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.settings-section h3 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #606266;
}

.mode-selector {
  display: flex;
  gap: 8px;
}

.mode-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 2px solid var(--border-color, #e4e7ed);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover {
  border-color: #FF9F43;
}

.mode-option.active {
  border-color: #FF9F43;
  background: rgba(64, 158, 255, 0.05);
}

.mode-option input {
  display: none;
}

.mode-icon {
  font-size: 20px;
}

.mode-text {
  display: flex;
  flex-direction: column;
}

.mode-text strong {
  font-size: 13px;
}

.mode-text small {
  color: #909399;
  font-size: 11px;
}

/* 复习方式选择 */
.method-selector {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.method-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px;
  border: 2px solid var(--border-color, #e4e7ed);
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.method-option:hover {
  border-color: #FF9F43;
}

.method-option.active {
  border-color: #FF9F43;
  background: rgba(64, 158, 255, 0.1);
  color: #FF9F43;
}

.method-option input {
  display: none;
}

.method-icon {
  font-size: 16px;
}

/* 拼写验证方向选择 */
.typing-direction {
  display: flex;
  gap: 10px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-color, #e4e7ed);
}

.typing-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px;
  border: 1px solid var(--border-color, #e4e7ed);
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
  background: var(--btn-secondary-bg, #f5f7fa);
}

.typing-option:hover {
  border-color: #FF9F43;
}

.typing-option.active {
  border-color: #FF9F43;
  background: rgba(64, 158, 255, 0.1);
  color: #FF9F43;
}

.typing-option input {
  display: none;
}

.setting-item {
  margin-bottom: 10px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-item label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #606266;
}

.select-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 6px;
  font-size: 13px;
  background: var(--input-bg, #fff);
  color: inherit;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.tag.small {
  padding: 2px 8px;
  font-size: 11px;
}

.tag.excluded {
  color: #999 !important;
}

.tag.selected {
  color: #fff !important;
}

.btn-primary {
  width: 100%;
  padding: 10px 20px;
  background: linear-gradient(135deg, #FF9F43, #FFB347);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 复习页面 */
.review-view {
  max-width: 100%;
}

.progress-bar {
  height: 4px;
  background: var(--progress-bg, #e0e0e0);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a);
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 11px;
  color: #909399;
  margin-bottom: 10px;
}

.word-card {
  background: var(--card-bg, #fff);
  border-radius: 10px;
  padding: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.word-status {
  display: inline-block;
  padding: 2px 8px;
  background: #f0f9eb;
  color: #67c23a;
  border-radius: 8px;
  font-size: 11px;
  margin-bottom: 8px;
}

.word-content {
  text-align: center;
  padding: 10px 0;
}

.word-text {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  word-break: break-word;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 发音按钮 */
.btn-speak {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.6;
}

.btn-speak:hover {
  opacity: 1;
  background: var(--btn-bg, #f5f7fa);
}

.btn-speak.speaking {
  animation: pulse 0.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.word-tags {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 10px;
}

.btn-reveal {
  padding: 10px 24px;
  background: var(--reveal-bg, #f5f7fa);
  border: 2px dashed var(--border-color, #dcdfe6);
  border-radius: 8px;
  font-size: 14px;
  color: #909399;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reveal:hover {
  background: var(--reveal-hover-bg, #ecf5ff);
  border-color: #FF9F43;
  color: #FF9F43;
}

.answer-area {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.translation {
  font-size: 18px;
  color: #FF9F43;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.word-meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 11px;
  color: #909399;
}

.rating-buttons {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color, #ebeef5);
}

.rating-hint {
  text-align: center;
  color: #606266;
  margin-bottom: 10px;
  font-size: 13px;
}

.rating-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}

.btn-rate {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 4px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 10px;
  background: var(--rate-bg, #f5f7fa);
  color: #606266;
}

.btn-rate:hover {
  transform: translateY(-1px);
}

.rate-icon {
  font-size: 18px;
}

.btn-rate.forgot:hover { background: #fef0f0; color: #f56c6c; }
.btn-rate.hard:hover { background: #fdf6ec; color: #e6a23c; }
.btn-rate.good:hover { background: #f0f9eb; color: #67c23a; }
.btn-rate.easy:hover { background: #ecf5ff; color: #409eff; }
.btn-rate.perfect:hover { background: #f4ecff; color: #9b59b6; }

/* 快捷键提示 */
.shortcut-hint {
  font-size: 10px;
  opacity: 0.6;
  font-weight: normal;
}

.key-hint {
  display: block;
  width: 16px;
  height: 16px;
  line-height: 16px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  font-size: 10px;
  margin-top: 2px;
}

.rating-hint .shortcut-hint {
  display: block;
  font-size: 11px;
  margin-top: 2px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border-color, #ebeef5);
  gap: 8px;
}

.btn-text {
  background: none;
  border: none;
  color: #909399;
  cursor: pointer;
  padding: 6px 10px;
  font-size: 12px;
}

.btn-text:hover {
  color: #FF9F43;
}

.btn-exit {
  color: #f56c6c;
  font-weight: 500;
}

.btn-exit:hover {
  color: #f78989;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  width: 90%;
  max-width: 320px;
}

.modal-content h3 {
  margin: 0;
  font-size: 15px;
}

.modal-content .tag-list {
  margin-bottom: 16px;
}

.modal-content .tag {
  border-width: 2px;
  border-style: solid;
}

/* 筛选弹窗 */
.filter-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #ebeef5);
}

.filter-modal .btn-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.filter-modal .btn-close:hover {
  color: #606266;
}

.filter-modal .modal-body {
  padding: 16px;
}

.filter-modal .modal-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--border-color, #ebeef5);
}

.filter-modal .modal-footer .btn-primary {
  width: auto;
  padding: 8px 16px;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 8px 16px;
  background: var(--btn-secondary-bg, #f5f7fa);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: #606266;
  font-size: 13px;
}

.modal-actions .btn-primary {
  width: auto;
  padding: 8px 16px;
  font-size: 13px;
}

/* 完成页面 */
.complete-view {
  max-width: 100%;
  text-align: center;
  padding-top: 20px;
}

.complete-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.complete-view h1 {
  margin-bottom: 20px;
  font-size: 20px;
}

.result-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
}

.result-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-value {
  font-size: 28px;
  font-weight: 700;
}

.result-label {
  font-size: 12px;
  color: #909399;
}

.result-item.success .result-value {
  color: #67c23a;
}

.result-item.danger .result-value {
  color: #f56c6c;
}

.accuracy {
  font-size: 15px;
  color: #606266;
  margin-bottom: 20px;
}

/* 拼写验证模式样式 */
.typing-question {
  text-align: center;
  margin-bottom: 16px;
}

.question-label {
  font-size: 12px;
  color: #909399;
  display: block;
  margin-bottom: 4px;
}

.question-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.typing-input-area {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.typing-input {
  flex: 1;
  padding: 12px 14px;
  border: 2px solid var(--border-color, #dcdfe6);
  border-radius: 8px;
  font-size: 15px;
  text-align: center;
  background: var(--input-bg, #fff);
  color: inherit;
  transition: border-color 0.2s;
}

.typing-input:focus {
  outline: none;
  border-color: #FF9F43;
}

.typing-input.correct {
  border-color: #67c23a;
  background: rgba(103, 194, 58, 0.1);
}

.typing-input.wrong {
  border-color: #f56c6c;
  background: rgba(245, 108, 108, 0.1);
}

.typing-input:disabled {
  cursor: not-allowed;
}

.btn-verify {
  padding: 12px 20px;
  background: linear-gradient(135deg, #FF9F43, #FFB347);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-verify:hover:not(:disabled) {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.btn-verify:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.verify-result {
  text-align: center;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 12px;
}

.verify-result.correct {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
}

.verify-result.wrong {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
}

.verify-result strong {
  color: #FF9F43;
}

.typing-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.typing-actions .btn-rate {
  flex: none;
  min-width: 120px;
}

.btn-next {
  padding: 12px 24px;
  background: var(--btn-secondary-bg, #f5f7fa);
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  color: #606266;
  transition: all 0.2s;
}

.btn-next:hover {
  background: #e6e8eb;
  color: #FF9F43;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .review-container {
    --card-bg: #3a3a3c;
    --border-color: #4a4a4c;
    --input-bg: #4a4a4c;
    --progress-bg: #4a4a4c;
    --reveal-bg: #4a4a4c;
    --reveal-hover-bg: #3a4a5c;
    --rate-bg: #4a4a4c;
    --btn-secondary-bg: #4a4a4c;
  }
  
  .word-status {
    background: #2a3a2a;
  }
  
  .stat-card:not(.highlight) {
    background: #3a3a3c;
  }
}
</style>
