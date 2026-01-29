<script setup>
import { ref, watch, onMounted, computed } from 'vue'

const props = defineProps({
  enterAction: {
    type: Object,
    required: true
  }
})

const inputText = ref('')
const translation = ref('')
const dictInfo = ref([])
const isLoading = ref(false)
const error = ref('')
const isSaved = ref(false)
const existingWord = ref(null)
const inputRef = ref(null)

// 手动输入模式
const isManualMode = ref(false)
const manualTranslation = ref('')
const MANUAL_TAG_NAME = '手动输入'

// 标签相关
const allTags = ref([])
const selectedTags = ref([])
const showTagSelector = ref(false)

// 标签管理相关
const newTagName = ref('')
const editingTag = ref(null)
const editTagName = ref('')
const editTagColor = ref('')
const showColorPicker = ref(false)

// 删除确认弹窗
const showDeleteConfirm = ref(false)
const tagToDelete = ref(null)

// 防抖定时器
let translateTimer = null

// 预设颜色
const presetColors = [
  '#f56c6c', '#e6a23c', '#67c23a', '#409eff', '#909399',
  '#f06595', '#845ef7', '#5c7cfa', '#22b8cf', '#20c997',
  '#fab005', '#fd7e14', '#ff6b6b', '#cc5de8', '#7950f2'
]

// 加载所有标签
const loadTags = () => {
  allTags.value = window.services.getAllTags()
}

// 翻译
const doTranslate = async () => {
  if (!inputText.value.trim()) {
    translation.value = ''
    dictInfo.value = []
    error.value = ''
    return
  }
  
  const text = inputText.value.trim()
  error.value = ''
  
  // 先检查本地是否已有该单词
  const existing = window.services.wordExists(text)
  if (existing) {
    // 本地已有，直接使用本地数据，不请求接口
    translation.value = existing.translation
    dictInfo.value = []
    existingWord.value = existing
    selectedTags.value = existing.tags || []
    isSaved.value = true
    return
  }
  
  // 本地没有，请求翻译接口
  isLoading.value = true
  isSaved.value = false
  existingWord.value = null
  
  try {
    // 检测输入语言，判断翻译方向
    const isChinese = /[\u4e00-\u9fa5]/.test(text)
    const from = 'auto'
    const to = isChinese ? 'en' : 'zh'
    
    const result = await window.services.translate(text, from, to)
    
    if (result.success) {
      translation.value = result.translation
      dictInfo.value = result.dict || []
      selectedTags.value = []
    } else {
      error.value = result.error || '翻译失败'
    }
  } catch (e) {
    error.value = e.error || '翻译服务暂时不可用'
  } finally {
    isLoading.value = false
  }
}

// 切换到手动输入模式
const enableManualMode = () => {
  isManualMode.value = true
  manualTranslation.value = ''
  error.value = ''
}

// 取消手动输入
const cancelManualMode = () => {
  isManualMode.value = false
  manualTranslation.value = ''
}

// 确认手动输入的翻译
const confirmManualTranslation = () => {
  if (!manualTranslation.value.trim()) {
    window.utools?.showNotification?.('请输入翻译内容')
    return
  }
  
  translation.value = manualTranslation.value.trim()
  isManualMode.value = false
  
  // 确保"手动输入"标签存在
  ensureManualTag()
  
  // 自动添加"手动输入"标签
  if (!selectedTags.value.includes(MANUAL_TAG_NAME)) {
    selectedTags.value.push(MANUAL_TAG_NAME)
  }
}

// 确保"手动输入"标签存在
const ensureManualTag = () => {
  const exists = allTags.value.some(t => t.name === MANUAL_TAG_NAME)
  if (!exists) {
    window.services.saveTag({ 
      name: MANUAL_TAG_NAME, 
      color: '#909399' 
    })
    loadTags()
  }
}

// 同步API翻译（用于手动输入的单词）
const syncApiTranslation = async () => {
  if (!inputText.value.trim()) return
  
  isLoading.value = true
  error.value = ''
  
  try {
    const text = inputText.value.trim()
    const isChinese = /[\u4e00-\u9fa5]/.test(text)
    const from = 'auto'
    const to = isChinese ? 'en' : 'zh'
    
    const result = await window.services.translate(text, from, to)
    
    if (result.success) {
      translation.value = result.translation
      
      // 移除"手动输入"标签
      const tagIndex = selectedTags.value.indexOf(MANUAL_TAG_NAME)
      if (tagIndex > -1) {
        selectedTags.value.splice(tagIndex, 1)
      }
      
      // 如果已保存，更新单词
      if (existingWord.value) {
        saveWord()
        window.utools?.showNotification?.('翻译已同步')
      }
    } else {
      error.value = result.error || '同步失败'
    }
  } catch (e) {
    error.value = e.error || '翻译服务暂时不可用'
  } finally {
    isLoading.value = false
  }
}

// 检查是否是手动输入的单词
const isManualWord = computed(() => {
  return selectedTags.value.includes(MANUAL_TAG_NAME)
})

// 发音相关
const isSpeaking = ref(false)

// 发音功能 - 使用浏览器内置 Web Speech API
const speak = (text) => {
  if (!text || isSpeaking.value) return
  
  // 检查浏览器是否支持 Speech Synthesis
  if (!window.speechSynthesis) {
    window.utools?.showNotification?.('当前环境不支持语音合成')
    return
  }
  
  // 取消之前的发音
  window.speechSynthesis.cancel()
  
  const utterance = new SpeechSynthesisUtterance(text)
  
  // 判断是中文还是英文
  const isChinese = /[\u4e00-\u9fa5]/.test(text)
  utterance.lang = isChinese ? 'zh-CN' : 'en-US'
  utterance.rate = 0.9 // 语速稍慢一点
  utterance.pitch = 1
  
  utterance.onstart = () => {
    isSpeaking.value = true
  }
  
  utterance.onend = () => {
    isSpeaking.value = false
  }
  
  utterance.onerror = () => {
    isSpeaking.value = false
  }
  
  window.speechSynthesis.speak(utterance)
}

// 发音原文
const speakSource = () => {
  speak(inputText.value.trim())
}

// 发音翻译结果
const speakTranslation = () => {
  speak(translation.value)
}

// 保存单词
const saveWord = () => {
  if (!inputText.value.trim() || !translation.value) return
  
  // 转换为普通对象，避免 Vue 响应式代理对象无法被 Electron IPC 序列化
  const wordData = {
    _id: existingWord.value?._id || undefined,
    word: inputText.value.trim(),
    translation: translation.value,
    tags: [...selectedTags.value]  // 转换为普通数组
  }
  
  const result = window.services.saveWord(wordData)
  if (result) {
    existingWord.value = result
    isSaved.value = true
    window.utools?.showNotification?.('单词已保存')
  }
}

// 切换标签
const toggleTag = (tagName) => {
  const index = selectedTags.value.indexOf(tagName)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tagName)
  }
  
  // 如果已保存，自动更新标签
  if (existingWord.value) {
    saveWord()
  }
}

// 获取标签颜色
const getTagColor = (tagName) => {
  const tag = allTags.value.find(t => t.name === tagName)
  return tag?.color || '#909399'
}

// 新增标签
const addNewTag = () => {
  const name = newTagName.value.trim()
  if (!name) return
  
  // 检查是否重名
  if (allTags.value.some(t => t.name === name)) {
    window.utools?.showNotification?.('标签已存在')
    return
  }
  
  const result = window.services.saveTag({ name })
  if (result) {
    loadTags()
    newTagName.value = ''
    // 自动选中新标签
    selectedTags.value.push(name)
    if (existingWord.value) {
      saveWord()
    }
  }
}

// 开始编辑标签
const startEditTag = (tag, event) => {
  event.stopPropagation()
  editingTag.value = tag
  editTagName.value = tag.name
  editTagColor.value = tag.color
  showColorPicker.value = false
}

// 保存编辑的标签
const saveEditTag = () => {
  if (!editingTag.value) return
  
  const newName = editTagName.value.trim()
  if (!newName) {
    window.utools?.showNotification?.('标签名不能为空')
    return
  }
  
  // 检查是否重名（排除自身）
  if (newName !== editingTag.value.name && allTags.value.some(t => t.name === newName)) {
    window.utools?.showNotification?.('标签已存在')
    return
  }
  
  const oldName = editingTag.value.name
  
  // 更新标签
  const result = window.services.saveTag({
    _id: editingTag.value._id,
    name: newName,
    color: editTagColor.value
  })
  
  if (result) {
    // 更新已选标签中的名称
    const idx = selectedTags.value.indexOf(oldName)
    if (idx > -1) {
      selectedTags.value[idx] = newName
      if (existingWord.value) {
        saveWord()
      }
    }
    
    loadTags()
    cancelEditTag()
  }
}

// 取消编辑
const cancelEditTag = () => {
  editingTag.value = null
  editTagName.value = ''
  editTagColor.value = ''
  showColorPicker.value = false
}

// 显示删除确认弹窗
const confirmDeleteTag = (tag, event) => {
  event.stopPropagation()
  tagToDelete.value = tag
  showDeleteConfirm.value = true
}

// 确认删除标签
const deleteTag = () => {
  if (!tagToDelete.value) return
  
  const tag = tagToDelete.value
  const result = window.services.deleteTag(tag._id, tag.name)
  if (result) {
    // 从已选标签中移除（级联更新会处理数据库中的单词，这里只处理当前UI状态）
    const idx = selectedTags.value.indexOf(tag.name)
    if (idx > -1) {
      selectedTags.value.splice(idx, 1)
    }
    
    loadTags()
    
    // 如果正在编辑这个标签，取消编辑
    if (editingTag.value?._id === tag._id) {
      cancelEditTag()
    }
    
    window.utools?.showNotification?.('标签已删除')
  }
  
  // 关闭弹窗
  showDeleteConfirm.value = false
  tagToDelete.value = null
}

// 取消删除
const cancelDeleteTag = () => {
  showDeleteConfirm.value = false
  tagToDelete.value = null
}

// 选择颜色
const selectColor = (color) => {
  editTagColor.value = color
  showColorPicker.value = false
}

// 页面输入框内容变化时
const handlePageInput = () => {
  // 页面输入时不同步到 uTools 输入框，各自独立
  // 防抖翻译
  clearTimeout(translateTimer)
  translateTimer = setTimeout(() => {
    doTranslate()
  }, 500)
}

// 处理回车键
const handleKeydown = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    clearTimeout(translateTimer)
    doTranslate()
  }
}

// 清空输入
const clearInput = () => {
  inputText.value = ''
  translation.value = ''
  dictInfo.value = []
  error.value = ''
  isSaved.value = false
  existingWord.value = null
  selectedTags.value = []
  
  // 同步清空 uTools 子输入框
  if (window.utools?.setSubInputValue) {
    window.utools.setSubInputValue('')
  }
  
  // 聚焦输入框
  inputRef.value?.focus()
}

// 监听进入参数
watch(() => props.enterAction, (action) => {
  if (action.type === 'over' && action.payload) {
    inputText.value = action.payload
    doTranslate()
  }
}, { immediate: true })

// 设置子输入框
onMounted(() => {
  loadTags()
  window.utools?.setExpendHeight?.(600)
  
  // 检查是否在 uTools 环境中，uTools 输入框单向同步到页面输入框
  if (window.utools?.setSubInput) {
    window.utools.setSubInput(({ text }) => {
      // uTools 输入的内容同步到页面输入框
      inputText.value = text
      
      // 防抖处理
      clearTimeout(translateTimer)
      translateTimer = setTimeout(() => {
        doTranslate()
      }, 500)
    }, '输入单词或中文进行翻译...', false)
  }
  
  // 聚焦页面输入框
  setTimeout(() => {
    inputRef.value?.focus()
  }, 200)
})
</script>

<template>
  <div class="translate-container">
    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-wrapper">
        <input
          ref="inputRef"
          v-model="inputText"
          type="text"
          class="search-input"
          placeholder="输入单词、短语或中文..."
          @input="handlePageInput"
          @keydown="handleKeydown"
        >
        <button 
          v-if="inputText" 
          class="btn-clear" 
          @click="clearInput"
          title="清空"
        >
          ✕
        </button>
        <button 
          class="btn-search" 
          @click="doTranslate"
          :disabled="!inputText.trim() || isLoading"
        >
          {{ isLoading ? '...' : '翻译' }}
        </button>
      </div>
    </div>
    
    <!-- 主内容区 -->
    <div class="content-area">
      <!-- 翻译结果 -->
      <div v-if="isLoading" class="loading">
        <div class="loading-spinner"></div>
        <span>翻译中...</span>
      </div>
      
      <!-- 错误状态 + 手动输入选项 -->
      <div v-else-if="error && !isManualMode" class="error-area">
        <div class="error-message">
          <span class="error-icon">⚠️</span>
          {{ error }}
        </div>
        <button class="btn-manual" @click="enableManualMode">
          ✏️ 手动输入翻译
        </button>
      </div>
      
      <!-- 手动输入模式 -->
      <div v-else-if="isManualMode" class="manual-input-area">
        <div class="manual-card">
          <h3>手动输入翻译</h3>
          <p class="manual-word">{{ inputText }}</p>
          <textarea 
            v-model="manualTranslation"
            class="manual-textarea"
            placeholder="请输入翻译内容..."
            rows="3"
            autofocus
          ></textarea>
          <div class="manual-actions">
            <button class="btn-secondary" @click="cancelManualMode">取消</button>
            <button class="btn-primary" @click="confirmManualTranslation">确认</button>
          </div>
        </div>
      </div>
      
      <div v-else-if="translation" class="result-area">
        <div class="translation-card">
          <div class="word-header">
            <h2 class="source-word">{{ inputText }}</h2>
            <div class="action-buttons">
              <button 
                type="button"
                class="btn-icon btn-speak" 
                :class="{ speaking: isSpeaking }"
                @click.stop.prevent="speakSource"
                title="朗读单词"
              >
                <span class="icon-speaker"></span>
              </button>
              <button
                type="button"
                class="btn-icon"
                :class="{ saved: isSaved }"
                @click.stop.prevent="saveWord"
                :title="isSaved ? '已保存' : '保存单词'"
              >
                <span class="icon-star" :class="{ filled: isSaved }">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"/>
                  </svg>
                </span>
              </button>
              <button 
                type="button"
                class="btn-icon"
                @click.stop.prevent="showTagSelector = !showTagSelector"
                title="添加标签"
              >
                <span class="icon-tag"></span>
              </button>
            </div>
          </div>
          
          <div class="translation-text">
            {{ translation }}
            <button 
              type="button"
              class="btn-speak-inline" 
              :class="{ speaking: isSpeaking }"
              @click.stop.prevent="speakTranslation"
              title="朗读翻译"
            >
              <span class="icon-speaker small"></span>
            </button>
            <!-- 同步API翻译按钮 -->
            <button 
              v-if="isManualWord && !isLoading"
              type="button"
              class="btn-sync"
              @click.stop.prevent="syncApiTranslation"
              title="同步API翻译"
            >
              🔄 同步翻译
            </button>
          </div>
          
          <!-- 已选标签显示 -->
          <div v-if="selectedTags.length > 0" class="selected-tags">
            <span 
              v-for="tag in selectedTags" 
              :key="tag"
              class="tag"
              :style="{ backgroundColor: getTagColor(tag) }"
              @click="toggleTag(tag)"
            >
              {{ tag }} ×
            </span>
          </div>
          
          <!-- 标签选择器 -->
          <div v-if="showTagSelector" class="tag-selector">
            <!-- 标签列表 -->
            <div class="tag-list">
              <div 
                v-for="tag in allTags" 
                :key="tag._id"
                class="tag-item"
              >
                <span 
                  class="tag"
                  :class="{ selected: selectedTags.includes(tag.name) }"
                  :style="{ 
                    backgroundColor: selectedTags.includes(tag.name) ? tag.color : 'transparent',
                    borderColor: tag.color,
                    color: selectedTags.includes(tag.name) ? '#fff' : tag.color
                  }"
                  @click="toggleTag(tag.name)"
                >
                  {{ tag.name }}
                </span>
                <button 
                  class="tag-action-btn edit-btn"
                  @click="startEditTag(tag, $event)"
                  title="编辑标签"
                >
                  ✎
                </button>
                <button 
                  class="tag-action-btn delete-btn"
                  @click="confirmDeleteTag(tag, $event)"
                  title="删除标签"
                >
                  ×
                </button>
              </div>
              <span v-if="allTags.length === 0" class="no-tags">
                暂无标签
              </span>
            </div>
            
            <!-- 新增标签 -->
            <div class="add-tag-section">
              <input
                v-model="newTagName"
                type="text"
                class="tag-input"
                placeholder="输入新标签名..."
                @keydown.enter="addNewTag"
                maxlength="20"
              >
              <button 
                class="btn-add-tag"
                @click="addNewTag"
                :disabled="!newTagName.trim()"
              >
                添加
              </button>
            </div>
            
            <!-- 编辑标签弹窗 -->
            <div v-if="editingTag" class="edit-tag-modal">
              <div class="edit-tag-content">
                <div class="edit-tag-header">
                  <span>编辑标签</span>
                  <button class="btn-close" @click="cancelEditTag">×</button>
                </div>
                <div class="edit-tag-body">
                  <div class="form-group">
                    <label>标签名称</label>
                    <input
                      v-model="editTagName"
                      type="text"
                      class="tag-input"
                      maxlength="20"
                      @keydown.enter="saveEditTag"
                    >
                  </div>
                  <div class="form-group">
                    <label>标签颜色</label>
                    <div class="color-preview-wrapper">
                      <div 
                        class="color-preview"
                        :style="{ backgroundColor: editTagColor }"
                        @click="showColorPicker = !showColorPicker"
                      ></div>
                      <span class="color-value">{{ editTagColor }}</span>
                    </div>
                    <div v-if="showColorPicker" class="color-picker">
                      <div 
                        v-for="color in presetColors" 
                        :key="color"
                        class="color-option"
                        :class="{ active: editTagColor === color }"
                        :style="{ backgroundColor: color }"
                        @click="selectColor(color)"
                      ></div>
                    </div>
                  </div>
                </div>
                <div class="edit-tag-footer">
                  <button class="btn-cancel" @click="cancelEditTag">取消</button>
                  <button class="btn-save" @click="saveEditTag">保存</button>
                </div>
              </div>
            </div>
            
            <!-- 删除确认弹窗 -->
            <div v-if="showDeleteConfirm" class="delete-confirm-modal">
              <div class="delete-confirm-content">
                <div class="delete-confirm-icon">⚠️</div>
                <p>确定删除标签 "{{ tagToDelete?.name }}" 吗？</p>
                <p class="delete-hint">使用此标签的单词将自动移除该标签</p>
                <div class="delete-confirm-actions">
                  <button class="btn-cancel" @click="cancelDeleteTag">取消</button>
                  <button class="btn-danger" @click="deleteTag">删除</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 词典信息 -->
          <div v-if="dictInfo.length > 0" class="dict-info">
            <div v-for="(item, index) in dictInfo" :key="index" class="dict-item">
              <span class="pos">{{ item.pos }}</span>
              <span class="terms">{{ item.terms?.join(', ') }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <div class="empty-icon">📖</div>
        <p>输入单词或中文开始翻译</p>
        <p class="hint">支持单词、短语、句子 · 回车快速翻译</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.translate-container {
  padding: 12px;
  box-sizing: border-box;
  max-height: 100%;
  overflow-y: auto;
}

/* 输入区域 - 温暖柔和 */
.input-area {
  max-width: 100%;
  margin: 0 auto 16px;
}

.input-wrapper {
  display: flex;
  align-items: center;
  background: var(--card-bg, #fff);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
  padding: 6px;
  border: 2px solid var(--border-light, transparent);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.input-wrapper:focus-within {
  box-shadow: 0 0 0 4px rgba(255, 159, 67, 0.15), var(--shadow-lg);
  border-color: #FF9F43;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--text-primary, #303133);
  outline: none;
}

.search-input::placeholder {
  color: #c0c4cc;
}

.btn-clear {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: #c0c4cc;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-clear:hover {
  background: #f5f7fa;
  color: #909399;
}

.btn-search {
  padding: 12px 24px;
  background: var(--primary-gradient);
  color: #FFF;
  border: none;
  border-radius: var(--radius-lg);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  margin-right: 6px;
  box-shadow: var(--shadow-sm);
}

.btn-search:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.btn-search:active:not(:disabled) {
  transform: translateY(0);
}

.btn-search:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.content-area {
  max-width: 100%;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top-color: #FF9F43;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.error-message {
  background: #fef0f0;
  border: 1px solid #fbc4c4;
  border-radius: 8px;
  padding: 12px 16px;
  color: #f56c6c;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.btn-manual {
  padding: 10px 16px;
  background: var(--btn-bg, #f5f7fa);
  border: 1px dashed var(--border-color, #dcdfe6);
  border-radius: 8px;
  color: #606266;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-manual:hover {
  background: #ecf5ff;
  border-color: #FF9F43;
  color: #FF9F43;
}

/* 手动输入模式 */
.manual-input-area {
  animation: fadeIn 0.3s ease;
}

.manual-card {
  background: var(--card-bg, #fff);
  border-radius: 10px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.manual-card h3 {
  margin: 0 0 12px 0;
  font-size: 15px;
  color: var(--text-primary, #303133);
}

.manual-word {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #FF9F43;
}

.manual-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  font-family: inherit;
  background: var(--input-bg, #fff);
  color: inherit;
  box-sizing: border-box;
}

.manual-textarea:focus {
  outline: none;
  border-color: #409eff;
}

.manual-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 12px;
}

.manual-actions .btn-primary,
.manual-actions .btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.manual-actions .btn-primary {
  background: linear-gradient(135deg, #FF9F43, #FFB347);
  color: #fff;
}

.manual-actions .btn-secondary {
  background: var(--btn-bg, #f5f7fa);
  color: #606266;
}

/* 同步按钮 */
.btn-sync {
  padding: 4px 10px;
  background: #ecf5ff;
  border: 1px solid #409eff;
  border-radius: 12px;
  color: #FF9F43;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 8px;
}

.btn-sync:hover {
  background: #FF9F43;
  color: #fff;
}

.result-area {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.translation-card {
  background: var(--card-bg, #fff);
  border-radius: var(--radius-xl);
  padding: 20px;
  box-shadow: var(--shadow-md);
  border: 1px solid var(--border-light, transparent);
  transition: all 0.3s ease;
}

.translation-card:hover {
  box-shadow: var(--shadow-lg);
}

.word-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.source-word {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  word-break: break-word;
  letter-spacing: -0.5px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--btn-bg, #f5f7fa);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: var(--text-secondary, #606266);
}

.btn-icon:hover {
  background: var(--btn-hover-bg, #e6e8eb);
}

/* 星形图标 - 使用 SVG */
.icon-star {
  width: 18px;
  height: 18px;
  display: inline-block;
  position: relative;
  color: var(--text-secondary, #606266);
}

.icon-star svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
}

.icon-star.filled {
  color: #f7ba2a;
}

.icon-star.filled svg {
  fill: #f7ba2a;
  stroke: #f7ba2a;
}

/* 标签图标 */
.icon-tag {
  width: 14px;
  height: 14px;
  display: inline-block;
  border: 2px solid currentColor;
  border-radius: 2px 6px 6px 2px;
  position: relative;
  transform: rotate(-45deg);
}

.icon-tag::before {
  content: '';
  position: absolute;
  width: 3px;
  height: 3px;
  background: currentColor;
  border-radius: 50%;
  top: 2px;
  left: 2px;
}

/* 发音图标 */
.icon-speaker {
  width: 16px;
  height: 16px;
  display: inline-block;
  position: relative;
}

.icon-speaker::before {
  content: '🔊';
  font-size: 14px;
  line-height: 1;
}

.icon-speaker.small {
  width: 14px;
  height: 14px;
}

.icon-speaker.small::before {
  font-size: 12px;
}

.btn-speak.speaking .icon-speaker::before,
.btn-speak-inline.speaking .icon-speaker::before {
  animation: pulse 0.6s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.btn-speak-inline {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px 4px;
  margin-left: 6px;
  border-radius: 4px;
  vertical-align: middle;
  transition: all 0.2s;
  color: var(--text-secondary, #909399);
}

.btn-speak-inline:hover {
  background: var(--btn-bg, #f5f7fa);
  color: #FF9F43;
}

.translation-text {
  font-size: 16px;
  color: var(--text-secondary, #606266);
  line-height: 1.5;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color, #ebeef5);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 0;
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

.tag:hover {
  opacity: 0.85;
}

.tag-selector {
  padding: 10px;
  background: var(--selector-bg, #f5f7fa);
  border-radius: 8px;
  margin-top: 10px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.tag-list .tag {
  border-width: 2px;
  border-style: solid;
}

.tag-list .tag.selected {
  color: #fff !important;
}

.tag-action-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 50%;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s;
  color: #909399;
}

.tag-item:hover .tag-action-btn {
  opacity: 1;
}

.tag-action-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.edit-btn:hover {
  color: #FF9F43;
}

.delete-btn:hover {
  color: #f56c6c;
}

.no-tags {
  color: #909399;
  font-size: 13px;
}

/* 新增标签区域 */
.add-tag-section {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color, #ebeef5);
}

.tag-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 6px;
  font-size: 13px;
  background: var(--input-bg, #fff);
  color: var(--text-primary, #303133);
  outline: none;
  transition: border-color 0.2s;
}

.tag-input:focus {
  border-color: #409eff;
}

.btn-add-tag {
  padding: 8px 16px;
  background: #FF9F43;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-tag:hover:not(:disabled) {
  background: #FFB347;
}

.btn-add-tag:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 编辑标签弹窗 */
.edit-tag-modal {
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

.edit-tag-content {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  width: 320px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.edit-tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color, #ebeef5);
  font-weight: 600;
  color: var(--text-primary, #303133);
}

.btn-close {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: #909399;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: var(--btn-bg, #f5f7fa);
  color: #606266;
}

.edit-tag-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--text-secondary, #606266);
}

.color-preview-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-preview {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  border: 2px solid rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.color-preview:hover {
  transform: scale(1.05);
}

.color-value {
  font-size: 13px;
  color: var(--text-secondary, #909399);
  font-family: monospace;
}

.color-picker {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 12px;
  padding: 12px;
  background: var(--selector-bg, #f5f7fa);
  border-radius: 8px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.active {
  border-color: var(--text-primary, #303133);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.edit-tag-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color, #ebeef5);
  justify-content: flex-end;
}

.btn-cancel {
  padding: 8px 20px;
  background: var(--btn-bg, #f5f7fa);
  color: var(--text-primary, #606266);
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: var(--btn-hover-bg, #e6e8eb);
}

.btn-save {
  padding: 8px 20px;
  background: #FF9F43;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-save:hover {
  background: #FFB347;
}

.dict-info {
  padding-top: 16px;
}

.dict-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 0;
}

.pos {
  background: #FF9F43;
  color: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  flex-shrink: 0;
}

.terms {
  color: var(--text-secondary, #606266);
  font-size: 14px;
  line-height: 1.6;
}

.empty-state {
  text-align: center;
  padding: 30px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.empty-state p {
  margin: 6px 0;
  font-size: 14px;
}

.empty-state .hint {
  font-size: 12px;
  opacity: 0.7;
}

/* 删除确认弹窗 */
.delete-confirm-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.delete-confirm-content {
  background: var(--card-bg, #fff);
  border-radius: 12px;
  padding: 24px;
  width: 280px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.delete-confirm-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.delete-confirm-content p {
  margin: 0 0 8px 0;
  color: var(--text-primary, #303133);
  font-size: 14px;
}

.delete-hint {
  color: #909399 !important;
  font-size: 12px !important;
  margin-bottom: 16px !important;
}

.delete-confirm-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-danger {
  padding: 8px 20px;
  background: #f56c6c;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-danger:hover {
  background: #f78989;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .translate-container {
    --card-bg: #3a3a3c;
    --text-primary: #fff;
    --text-secondary: #a0a0a0;
    --border-color: #4a4a4c;
    --btn-bg: #4a4a4c;
    --btn-hover-bg: #5a5a5c;
    --selector-bg: #4a4a4c;
    --input-bg: #2c2c2e;
  }
  
  .input-wrapper {
    background: #3a3a3c;
  }
  
  .search-input {
    color: #fff;
  }
  
  .btn-clear:hover {
    background: #4a4a4c;
    color: #fff;
  }
  
  .error-message {
    background: #3a2020;
    border-color: #5a3030;
  }
  
  .tag-input {
    background: var(--input-bg);
    border-color: var(--border-color);
    color: var(--text-primary);
  }
  
  .tag-action-btn {
    color: #a0a0a0;
  }
  
  .tag-action-btn:hover {
    background: rgba(255, 255, 255, 0.1);
  }
  
  .color-option.active {
    box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.5);
  }
}
</style>
