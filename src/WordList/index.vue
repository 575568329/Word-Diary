<script setup>
import { ref, onMounted, computed, watch } from 'vue'

const props = defineProps({
  enterAction: {
    type: Object,
    required: true
  }
})

// 状态
const words = ref([])
const allTags = ref([])
const searchKeyword = ref('')
const filterTag = ref('')
const sortBy = ref('createTime') // createTime, word, reviewCount
const sortOrder = ref('desc')

// 编辑相关
const editingWord = ref(null)
const showEditModal = ref(false)
const editForm = ref({
  word: '',
  translation: '',
  tags: []
})

// 删除确认
const showDeleteConfirm = ref(false)
const wordToDelete = ref(null)

// 发音相关
const isSpeaking = ref(false)

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

// 手动输入标签名
const MANUAL_TAG_NAME = '手动输入'

// 同步状态
const isSyncing = ref(false)
const syncingWordId = ref(null)

// 加载数据
const loadWords = () => {
  words.value = window.services.getAllWords()
}

const loadTags = () => {
  allTags.value = window.services.getAllTags()
}

// 同步单个单词的API翻译
const syncWordTranslation = async (word) => {
  if (isSyncing.value) return
  
  isSyncing.value = true
  syncingWordId.value = word._id
  
  try {
    const text = word.word
    const isChinese = /[\u4e00-\u9fa5]/.test(text)
    const from = 'auto'
    const to = isChinese ? 'en' : 'zh'
    
    const result = await window.services.translate(text, from, to)
    
    if (result.success) {
      // 更新翻译并移除"手动输入"标签
      const newTags = (word.tags || []).filter(t => t !== MANUAL_TAG_NAME)
      
      window.services.saveWord({
        ...word,
        translation: result.translation,
        tags: newTags
      })
      
      loadWords()
      window.utools?.showNotification?.('翻译已同步')
    } else {
      window.utools?.showNotification?.(result.error || '同步失败')
    }
  } catch (e) {
    window.utools?.showNotification?.('翻译服务暂时不可用')
  } finally {
    isSyncing.value = false
    syncingWordId.value = null
  }
}

// 检查单词是否是手动输入的
const isManualWord = (word) => {
  return word.tags?.includes(MANUAL_TAG_NAME)
}

// 过滤和排序后的单词列表
const filteredWords = computed(() => {
  let result = [...words.value]
  
  // 搜索过滤
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(w => 
      w.word.toLowerCase().includes(keyword) ||
      w.translation.toLowerCase().includes(keyword)
    )
  }
  
  // 标签过滤
  if (filterTag.value) {
    result = result.filter(w => w.tags?.includes(filterTag.value))
  }
  
  // 排序
  result.sort((a, b) => {
    let aVal = a[sortBy.value]
    let bVal = b[sortBy.value]
    
    if (sortBy.value === 'word') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })
  
  return result
})

// 统计
const statistics = computed(() => {
  return {
    total: words.value.length,
    filtered: filteredWords.value.length
  }
})

// 获取标签颜色
const getTagColor = (tagName) => {
  const tag = allTags.value.find(t => t.name === tagName)
  return tag?.color || '#909399'
}

// 格式化日期
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', { 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取记忆状态
const getMemoryStatus = (word) => {
  if (!word.interval || word.interval === 0) return { text: '新', color: '#909399' }
  if (word.interval < 7) return { text: '学习', color: '#e6a23c' }
  if (word.interval < 21) return { text: '巩固', color: '#409eff' }
  return { text: '掌握', color: '#67c23a' }
}

// 编辑单词
const openEditModal = (word) => {
  editingWord.value = word
  editForm.value = {
    word: word.word,
    translation: word.translation,
    tags: [...(word.tags || [])]
  }
  showEditModal.value = true
}

// 切换编辑标签
const toggleEditTag = (tagName) => {
  const index = editForm.value.tags.indexOf(tagName)
  if (index > -1) {
    editForm.value.tags.splice(index, 1)
  } else {
    editForm.value.tags.push(tagName)
  }
}

// 保存编辑
const saveEdit = () => {
  if (!editForm.value.word.trim() || !editForm.value.translation.trim()) {
    window.utools?.showNotification?.('单词和翻译不能为空')
    return
  }
  
  const updatedWord = {
    ...editingWord.value,
    word: editForm.value.word.trim(),
    translation: editForm.value.translation.trim(),
    tags: editForm.value.tags
  }
  
  window.services.saveWord(updatedWord)
  loadWords()
  showEditModal.value = false
  window.utools?.showNotification?.('单词已更新')
}

// 删除单词
const confirmDelete = (word) => {
  wordToDelete.value = word
  showDeleteConfirm.value = true
}

const deleteWord = () => {
  if (wordToDelete.value) {
    window.services.deleteWord(wordToDelete.value._id)
    loadWords()
    showDeleteConfirm.value = false
    wordToDelete.value = null
    window.utools?.showNotification?.('单词已删除')
  }
}

// 切换排序
const toggleSort = (field) => {
  if (sortBy.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'desc'
  }
}

// 搜索处理
const handleSearch = (text) => {
  searchKeyword.value = text
}

onMounted(() => {
  loadWords()
  loadTags()
  window.utools?.setExpendHeight?.(600)
  
  // 设置子输入框
  if (window.utools?.setSubInput) {
    window.utools.setSubInput(({ text }) => {
      handleSearch(text)
    }, '搜索单词...', true)
  }
})
</script>

<template>
  <div class="wordlist-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="stats-info">
        <span class="total">共 {{ statistics.total }} 个单词</span>
        <span v-if="searchKeyword || filterTag" class="filtered">
          (筛选结果: {{ statistics.filtered }})
        </span>
      </div>
      
      <div class="filter-group">
        <select v-model="filterTag" class="filter-select">
          <option value="">全部标签</option>
          <option v-for="tag in allTags" :key="tag._id" :value="tag.name">
            {{ tag.name }}
          </option>
        </select>
        
        <div class="sort-buttons">
          <button 
            class="sort-btn" 
            :class="{ active: sortBy === 'createTime' }"
            @click="toggleSort('createTime')"
          >
            时间 {{ sortBy === 'createTime' ? (sortOrder === 'desc' ? '↓' : '↑') : '' }}
          </button>
          <button 
            class="sort-btn" 
            :class="{ active: sortBy === 'word' }"
            @click="toggleSort('word')"
          >
            字母 {{ sortBy === 'word' ? (sortOrder === 'desc' ? '↓' : '↑') : '' }}
          </button>
          <button 
            class="sort-btn" 
            :class="{ active: sortBy === 'reviewCount' }"
            @click="toggleSort('reviewCount')"
          >
            复习次数 {{ sortBy === 'reviewCount' ? (sortOrder === 'desc' ? '↓' : '↑') : '' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 单词列表 -->
    <div class="word-list">
      <div v-if="filteredWords.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p v-if="searchKeyword || filterTag">没有找到匹配的单词</p>
        <p v-else>还没有保存任何单词</p>
        <p class="hint">使用"翻译"功能添加单词</p>
      </div>
      
      <div 
        v-for="word in filteredWords" 
        :key="word._id" 
        class="word-item"
      >
        <div class="word-main">
          <div class="word-header">
            <span class="word-text">{{ word.word }}</span>
            <button 
              type="button"
              class="btn-speak" 
              :class="{ speaking: isSpeaking }"
              @click.stop="speak(word.word)"
              title="朗读单词"
            >
              🔊
            </button>
            <span 
              class="memory-badge" 
              :style="{ backgroundColor: getMemoryStatus(word).color }"
            >
              {{ getMemoryStatus(word).text }}
            </span>
          </div>
          <div class="word-translation">
            {{ word.translation }}
            <button 
              type="button"
              class="btn-speak" 
              :class="{ speaking: isSpeaking }"
              @click.stop="speak(word.translation)"
              title="朗读翻译"
            >
              🔊
            </button>
          </div>
          
          <!-- 标签 -->
          <div v-if="word.tags?.length" class="word-tags">
            <span 
              v-for="tag in word.tags" 
              :key="tag"
              class="tag"
              :style="{ backgroundColor: getTagColor(tag) }"
            >
              {{ tag }}
            </span>
          </div>
          
          <!-- 元信息 -->
          <div class="word-meta">
            <span>添加: {{ formatDate(word.createTime) }}</span>
            <span>复习: {{ word.reviewCount || 0 }} 次</span>
            <span v-if="word.interval">间隔: {{ word.interval }} 天</span>
          </div>
        </div>
        
        <div class="word-actions">
          <button 
            v-if="isManualWord(word)"
            class="btn-action sync" 
            :class="{ syncing: syncingWordId === word._id }"
            @click="syncWordTranslation(word)" 
            :title="syncingWordId === word._id ? '同步中...' : '同步API翻译'"
            :disabled="isSyncing"
          >
            {{ syncingWordId === word._id ? '⏳' : '🔄' }}
          </button>
          <button class="btn-action edit" @click="openEditModal(word)" title="编辑">
            ✏️
          </button>
          <button class="btn-action delete" @click="confirmDelete(word)" title="删除">
            🗑️
          </button>
        </div>
      </div>
    </div>
    
    <!-- 编辑弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <h3>编辑单词</h3>
        
        <div class="form-group">
          <label>单词/短语</label>
          <input 
            v-model="editForm.word" 
            type="text" 
            class="form-input"
            placeholder="输入单词或短语"
          >
        </div>
        
        <div class="form-group">
          <label>翻译</label>
          <textarea 
            v-model="editForm.translation" 
            class="form-textarea"
            placeholder="输入翻译"
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-group">
          <label>标签</label>
          <div class="tag-list">
            <span 
              v-for="tag in allTags" 
              :key="tag._id"
              class="tag"
              :class="{ selected: editForm.tags.includes(tag.name) }"
              :style="{ 
                backgroundColor: editForm.tags.includes(tag.name) ? tag.color : 'transparent',
                borderColor: tag.color,
                color: editForm.tags.includes(tag.name) ? '#fff' : tag.color
              }"
              @click="toggleEditTag(tag.name)"
            >
              {{ tag.name }}
            </span>
            <span v-if="allTags.length === 0" class="no-tags">暂无标签</span>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showEditModal = false">取消</button>
          <button class="btn-primary" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
    
    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content confirm-modal">
        <h3>确认删除</h3>
        <p>确定要删除单词 "<strong>{{ wordToDelete?.word }}</strong>" 吗？</p>
        <p class="warning">此操作无法撤销</p>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-danger" @click="deleteWord">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wordlist-container {
  padding: 12px;
  box-sizing: border-box;
  max-height: 100%;
  overflow-y: auto;
}

/* 工具栏 */
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-color, #ebeef5);
}

.stats-info {
  font-size: 12px;
  color: #606266;
}

.stats-info .total {
  font-weight: 600;
}

.stats-info .filtered {
  color: #409eff;
  margin-left: 6px;
}

.filter-group {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-select {
  padding: 6px 10px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 6px;
  font-size: 12px;
  background: var(--input-bg, #fff);
  color: inherit;
  cursor: pointer;
}

.sort-buttons {
  display: flex;
  gap: 3px;
}

.sort-btn {
  padding: 4px 8px;
  background: var(--btn-bg, #f5f7fa);
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  color: #606266;
}

.sort-btn:hover {
  background: var(--btn-hover-bg, #e6e8eb);
}

.sort-btn.active {
  background: #409eff;
  border-color: #409eff;
  color: #fff;
}

/* 单词列表 */
.word-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.empty-state .hint {
  font-size: 12px;
  opacity: 0.7;
}

.word-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  background: var(--card-bg, #fff);
  border-radius: 8px;
  padding: 10px 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.word-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.word-main {
  flex: 1;
  min-width: 0;
}

.word-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.word-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  word-break: break-word;
}

.memory-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  color: #fff;
  flex-shrink: 0;
}

.word-translation {
  font-size: 15px;
  color: var(--text-secondary, #606266);
  margin-bottom: 10px;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

/* 发音按钮 */
.btn-speak {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  font-size: 12px;
  border-radius: 4px;
  transition: all 0.2s;
  opacity: 0.5;
  flex-shrink: 0;
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
  50% { opacity: 0.3; }
}

.word-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.tag.selected {
  color: #fff !important;
}

.word-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 12px;
  color: #909399;
}

.word-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 12px;
}

.btn-action {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: var(--btn-bg, #f5f7fa);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-action:hover {
  transform: scale(1.1);
}

.btn-action.edit:hover {
  background: #ecf5ff;
}

.btn-action.delete:hover {
  background: #fef0f0;
}

.btn-action.sync:hover {
  background: #ecf5ff;
}

.btn-action.sync.syncing {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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
  border-radius: 16px;
  padding: 24px;
  width: 90%;
  max-width: 450px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
}

.confirm-modal p {
  margin: 12px 0;
  color: #606266;
}

.confirm-modal .warning {
  color: #f56c6c;
  font-size: 13px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 8px;
  font-size: 14px;
  background: var(--input-bg, #fff);
  color: inherit;
  box-sizing: border-box;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-list .tag {
  border-width: 2px;
  border-style: solid;
}

.no-tags {
  color: #909399;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
}

.btn-primary:hover {
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

.btn-secondary {
  background: var(--btn-bg, #f5f7fa);
  color: #606266;
}

.btn-secondary:hover {
  background: var(--btn-hover-bg, #e6e8eb);
}

.btn-danger {
  background: #f56c6c;
  color: #fff;
}

.btn-danger:hover {
  background: #f78989;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .wordlist-container {
    --card-bg: #3a3a3c;
    --border-color: #4a4a4c;
    --input-bg: #4a4a4c;
    --btn-bg: #4a4a4c;
    --btn-hover-bg: #5a5a5c;
    --text-primary: #fff;
    --text-secondary: #a0a0a0;
  }
}
</style>
