<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  enterAction: {
    type: Object,
    required: true
  }
})

// 展开收起状态
const expandedSections = ref({
  apiConfig: true,
  apiGuide: false,
  speechConfig: false,
  dataManagement: false
})

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section]
}

// API配置
const apiKey = ref('')
const appId = ref('')
const isSaving = ref(false)
const testResult = ref('')
const isTesting = ref(false)

// 发音配置
const speechRate = ref(0.9)
const speechPitch = ref(1.0)

// 数据导出导入
const showImportModal = ref(false)
const importData = ref('')
const importResult = ref(null)
const isImporting = ref(false)
const overwriteExisting = ref(false)

// Toast 提示
const showToast = ref(false)
const toastMessage = ref('')
const toastType = ref('success') // success, error

// 存储键名
const STORAGE_KEY_APIKEY = 'niutrans_apikey'
const STORAGE_KEY_APPID = 'niutrans_appid'
const STORAGE_KEY_SPEECH_RATE = 'speech_rate'
const STORAGE_KEY_SPEECH_PITCH = 'speech_pitch'

// 显示 Toast 提示
const showNotification = (message, type = 'success') => {
  toastMessage.value = message
  toastType.value = type
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

// 加载配置
const loadConfig = () => {
  if (window.utools?.db) {
    const keyDoc = window.utools.db.get(STORAGE_KEY_APIKEY)
    const appIdDoc = window.utools.db.get(STORAGE_KEY_APPID)
    const rateDoc = window.utools.db.get(STORAGE_KEY_SPEECH_RATE)
    const pitchDoc = window.utools.db.get(STORAGE_KEY_SPEECH_PITCH)
    apiKey.value = keyDoc?.data || ''
    appId.value = appIdDoc?.data || ''
    speechRate.value = rateDoc?.data ?? 0.9
    speechPitch.value = pitchDoc?.data ?? 1.0
  } else {
    // 开发环境使用 localStorage
    apiKey.value = localStorage.getItem(STORAGE_KEY_APIKEY) || ''
    appId.value = localStorage.getItem(STORAGE_KEY_APPID) || ''
    speechRate.value = parseFloat(localStorage.getItem(STORAGE_KEY_SPEECH_RATE)) || 0.9
    speechPitch.value = parseFloat(localStorage.getItem(STORAGE_KEY_SPEECH_PITCH)) || 1.0
  }
}

// 保存配置
const saveConfig = () => {
  isSaving.value = true

  try {
    if (window.utools?.db) {
      // uTools 环境
      const keyDoc = window.utools.db.get(STORAGE_KEY_APIKEY)
      const appIdDoc = window.utools.db.get(STORAGE_KEY_APPID)
      const rateDoc = window.utools.db.get(STORAGE_KEY_SPEECH_RATE)
      const pitchDoc = window.utools.db.get(STORAGE_KEY_SPEECH_PITCH)

      window.utools.db.put({
        _id: STORAGE_KEY_APIKEY,
        _rev: keyDoc?._rev,
        data: apiKey.value.trim()
      })

      window.utools.db.put({
        _id: STORAGE_KEY_APPID,
        _rev: appIdDoc?._rev,
        data: appId.value.trim()
      })

      window.utools.db.put({
        _id: STORAGE_KEY_SPEECH_RATE,
        _rev: rateDoc?._rev,
        data: speechRate.value
      })

      window.utools.db.put({
        _id: STORAGE_KEY_SPEECH_PITCH,
        _rev: pitchDoc?._rev,
        data: speechPitch.value
      })
    } else {
      // 开发环境
      localStorage.setItem(STORAGE_KEY_APIKEY, apiKey.value.trim())
      localStorage.setItem(STORAGE_KEY_APPID, appId.value.trim())
      localStorage.setItem(STORAGE_KEY_SPEECH_RATE, speechRate.value.toString())
      localStorage.setItem(STORAGE_KEY_SPEECH_PITCH, speechPitch.value.toString())
    }

    // 更新全局配置
    if (window.services?.updateApiConfig) {
      window.services.updateApiConfig(apiKey.value.trim(), appId.value.trim())
    }

    showNotification('✅ 配置已保存')
    testResult.value = ''
  } catch (e) {
    showNotification('❌ 保存失败: ' + e.message, 'error')
  } finally {
    isSaving.value = false
  }
}

// 测试API连接
const testConnection = async () => {
  isTesting.value = true
  testResult.value = '测试中...'

  try {
    const testApiKey = apiKey.value.trim() || '5e690ed1f4cbdb16d88a3f6a07e9f185' // 使用输入的密钥或默认密钥

    const postData = new URLSearchParams({
      from: 'en',
      to: 'zh',
      apikey: testApiKey,
      src_text: 'hello'
    }).toString()
    
    const response = await fetch('https://api.niutrans.com/NiuTransServer/translation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: postData
    })
    
    const result = await response.json()
    
    if (result.error_code || result.errorCode) {
      testResult.value = `❌ 连接失败: ${result.error_msg || result.errorMsg || '未知错误'}`
    } else if (result.tgt_text) {
      testResult.value = `✅ 连接成功！测试翻译: hello → ${result.tgt_text}`
    } else {
      testResult.value = '❌ 返回数据异常'
    }
  } catch (e) {
    testResult.value = `❌ 网络错误: ${e.message}`
  } finally {
    isTesting.value = false
  }
}

// 清除配置
const clearConfig = () => {
  apiKey.value = ''
  appId.value = ''
  testResult.value = ''
  saveConfig()
}

// 打开申请页面
const openApplyPage = () => {
  const url = 'https://niutrans.com/cloud/account/register'
  if (window.utools?.shellOpenExternal) {
    window.utools.shellOpenExternal(url)
  } else {
    window.open(url, '_blank')
  }
}

// 测试发音
const testSpeech = () => {
  if (!window.speechSynthesis) {
    showNotification('当前环境不支持语音合成', 'error')
    return
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance('Hello, 这是一个测试发音')
  utterance.lang = 'en-US'
  utterance.rate = speechRate.value
  utterance.pitch = speechPitch.value

  window.speechSynthesis.speak(utterance)
  showNotification('🔊 正在测试发音...')
}

// 导出数据
const exportData = (format) => {
  try {
    let data, filename, mimeType

    if (format === 'json') {
      data = window.services.exportToJSON()
      filename = `单词日记_备份_${new Date().toISOString().slice(0, 10)}.json`
      mimeType = 'application/json'
    } else if (format === 'csv') {
      data = window.services.exportToCSV()
      filename = `单词日记_单词表_${new Date().toISOString().slice(0, 10)}.csv`
      mimeType = 'text/csv'
    }

    // 创建 Blob 并下载
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    showNotification(`✅ 已导出 ${format.toUpperCase()}`)
  } catch (e) {
    showNotification('❌ 导出失败: ' + e.message, 'error')
  }
}

// 打开导入弹窗
const openImportModal = () => {
  importData.value = ''
  importResult.value = null
  overwriteExisting.value = false
  showImportModal.value = true
}

// 执行导入
const doImport = () => {
  if (!importData.value.trim()) {
    showNotification('❌ 请输入数据', 'error')
    return
  }

  isImporting.value = true
  importResult.value = null

  try {
    const result = window.services.importFromJSON(importData.value, {
      importTags: true,
      overwrite: overwriteExisting.value
    })

    importResult.value = result

    if (result.success) {
      showNotification(
        `✅ 导入成功！单词: ${result.importedWords}，标签: ${result.importedTags}`
      )
    } else {
      showNotification('❌ 导入失败: ' + result.error, 'error')
    }
  } catch (e) {
    importResult.value = {
      success: false,
      error: e.message
    }
    showNotification('❌ 导入失败: ' + e.message, 'error')
  } finally {
    isImporting.value = false
  }
}

// 关闭导入弹窗
const closeImportModal = () => {
  showImportModal.value = false
  importData.value = ''
  importResult.value = null
}

onMounted(() => {
  loadConfig()
  window.utools?.setExpendHeight?.(600)
})
</script>

<template>
  <div class="settings-container">
    <h1 class="title">⚙️ API 设置</h1>

    <!-- API配置表单 -->
    <div class="settings-card">
      <div class="section-header" @click="toggleSection('apiConfig')">
        <h3>小牛翻译 API 配置</h3>
        <span class="toggle-icon" :class="{ expanded: expandedSections.apiConfig }">▼</span>
      </div>
      <div class="section-content" :class="{ collapsed: !expandedSections.apiConfig }">
      
      <div class="form-group">
        <label>API-KEY <span class="optional">(可选，留空使用默认密钥)</span></label>
        <input
          v-model="apiKey"
          type="text"
          class="form-input"
          placeholder="留空使用默认共享密钥，或输入您自己的 API-KEY"
        >
      </div>
      
      <div class="form-group">
        <label>APPID <span class="optional">(可选)</span></label>
        <input 
          v-model="appId"
          type="text"
          class="form-input"
          placeholder="请输入您的 APPID"
        >
      </div>
      
      <!-- 测试结果 -->
      <div v-if="testResult" class="test-result" :class="{ success: testResult.startsWith('✅'), error: testResult.startsWith('❌') }">
        {{ testResult }}
      </div>
      
      <div class="form-actions">
        <button class="btn-secondary" @click="testConnection" :disabled="isTesting">
          {{ isTesting ? '测试中...' : '🔗 测试连接' }}
        </button>
        <button class="btn-primary" @click="saveConfig" :disabled="isSaving">
          {{ isSaving ? '保存中...' : '💾 保存配置' }}
        </button>
      </div>
      
      <button class="btn-text-danger" @click="clearConfig" v-if="apiKey || appId">
        恢复默认密钥
      </button>
      </div>
    </div>

    <!-- 申请指南 -->
    <div class="guide-card">
      <div class="section-header" @click="toggleSection('apiGuide')">
        <h3>📝 如何申请 API 密钥</h3>
        <span class="toggle-icon" :class="{ expanded: expandedSections.apiGuide }">▼</span>
      </div>
      <div class="section-content" :class="{ collapsed: !expandedSections.apiGuide }">
      
      <div class="steps">
        <div class="step">
          <span class="step-num">1</span>
          <div class="step-content">
            <strong>注册账号</strong>
            <p>访问小牛翻译官网注册账号</p>
          </div>
        </div>
        
        <div class="step">
          <span class="step-num">2</span>
          <div class="step-content">
            <strong>登录控制台</strong>
            <p>登录后进入「个人中心」→「我的密钥」</p>
          </div>
        </div>
        
        <div class="step">
          <span class="step-num">3</span>
          <div class="step-content">
            <strong>获取密钥</strong>
            <p>复制页面上显示的 API-KEY 和 APPID</p>
          </div>
        </div>
        
        <div class="step">
          <span class="step-num">4</span>
          <div class="step-content">
            <strong>免费额度</strong>
            <p>新用户赠送 100万字符，每日签到可领取更多</p>
          </div>
        </div>
      </div>
      
      <button class="btn-link" @click="openApplyPage">
        🔗 前往小牛翻译申请 →
      </button>
      
      <div class="tip">
        <strong>💡 提示：</strong>使用默认共享密钥即可正常翻译，配置自己的密钥可获得更好的服务稳定性
      </div>
      </div>
    </div>

    <!-- 发音配置 -->
    <div class="settings-card">
      <div class="section-header" @click="toggleSection('speechConfig')">
        <h3>🔊 发音设置</h3>
        <span class="toggle-icon" :class="{ expanded: expandedSections.speechConfig }">▼</span>
      </div>
      <div class="section-content" :class="{ collapsed: !expandedSections.speechConfig }">

      <div class="form-group">
        <label>语速: {{ speechRate.toFixed(1) }}</label>
        <input
          v-model.number="speechRate"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          class="slider"
        >
        <div class="slider-labels">
          <span>慢</span>
          <span>快</span>
        </div>
      </div>

      <div class="form-group">
        <label>音调: {{ speechPitch.toFixed(1) }}</label>
        <input
          v-model.number="speechPitch"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          class="slider"
        >
        <div class="slider-labels">
          <span>低</span>
          <span>高</span>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn-secondary" @click="testSpeech">
          🔊 测试发音
        </button>
        <button class="btn-primary" @click="saveConfig" :disabled="isSaving">
          💾 保存配置
        </button>
      </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="settings-card">
      <div class="section-header" @click="toggleSection('dataManagement')">
        <h3>💾 数据管理</h3>
        <span class="toggle-icon" :class="{ expanded: expandedSections.dataManagement }">▼</span>
      </div>
      <div class="section-content" :class="{ collapsed: !expandedSections.dataManagement }">

      <div class="export-section">
        <p class="section-desc">导出您的数据以备份或迁移</p>
        <div class="export-buttons">
          <button class="btn-secondary" @click="exportData('json')">
            📄 导出 JSON
          </button>
          <button class="btn-secondary" @click="exportData('csv')">
            📊 导出 CSV
          </button>
        </div>
      </div>

      <div class="divider"></div>

      <div class="import-section">
        <p class="section-desc">从备份文件导入数据</p>
        <button class="btn-primary" @click="openImportModal">
          📥 导入数据
        </button>
      </div>
      </div>
    </div>

    <!-- 导入弹窗 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="closeImportModal">
      <div class="modal-content">
        <h3>导入数据</h3>

        <div class="form-group">
          <label>粘贴 JSON 数据</label>
          <textarea
            v-model="importData"
            class="form-textarea"
            placeholder='粘贴之前导出的 JSON 数据，例如: {"version":"1.0",...}'
            rows="10"
          ></textarea>
        </div>

        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="overwriteExisting">
            覆盖已存在的单词和标签
          </label>
        </div>

        <!-- 导入结果 -->
        <div v-if="importResult" class="import-result" :class="{ success: importResult.success, error: !importResult.success }">
          <div v-if="importResult.success">
            <p>✅ 导入成功！</p>
            <p>单词: {{ importResult.importedWords }} 个</p>
            <p>标签: {{ importResult.importedTags }} 个</p>
            <p v-if="importResult.skippedWords > 0">跳过: {{ importResult.skippedWords }} 个（已存在）</p>
          </div>
          <div v-else>
            <p>❌ 导入失败</p>
            <p>{{ importResult.error }}</p>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-secondary" @click="closeImportModal">取消</button>
          <button
            class="btn-primary"
            @click="doImport"
            :disabled="isImporting || !importData.trim()"
          >
            {{ isImporting ? '导入中...' : '开始导入' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Toast 提示 -->
    <transition name="toast-fade">
      <div v-if="showToast" class="toast" :class="toastType">
        {{ toastMessage }}
      </div>
    </transition>
  </div>
</template>

<style scoped>
.settings-container {
  padding: 12px;
  box-sizing: border-box;
  max-height: 100%;
  overflow-y: auto;
}

.title {
  font-size: 18px;
  margin: 0 0 12px 0;
  text-align: center;
}

.settings-card,
.guide-card {
  background: var(--card-bg, #fff);
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 展开收起样式 */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
  margin-bottom: 14px;
}

.section-header h3 {
  margin: 0;
  font-size: 14px;
  color: var(--text-primary, #303133);
}

.toggle-icon {
  font-size: 12px;
  color: var(--text-secondary, #909399);
  transition: transform 0.3s ease;
  transform: rotate(-90deg);
}

.toggle-icon.expanded {
  transform: rotate(0deg);
}

.section-content {
  overflow: hidden;
  transition: max-height 0.3s ease, opacity 0.3s ease;
  max-height: 2000px;
  opacity: 1;
}

.section-content.collapsed {
  max-height: 0;
  opacity: 0;
  margin-bottom: 0;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #606266;
}

.required {
  color: #f56c6c;
}

.optional {
  color: #909399;
  font-size: 12px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 6px;
  font-size: 13px;
  background: var(--input-bg, #fff);
  color: inherit;
  box-sizing: border-box;
  font-family: monospace;
}

.form-input:focus {
  outline: none;
  border-color: #FF9F43;
}

.test-result {
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  margin-bottom: 14px;
  background: #f5f7fa;
}

.test-result.success {
  background: #f0f9eb;
  color: #67c23a;
}

.test-result.error {
  background: #fef0f0;
  color: #f56c6c;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #FF9F43, #FFB347);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.4);
}

.btn-secondary {
  background: var(--btn-bg, #f5f7fa);
  color: #606266;
}

.btn-secondary:hover:not(:disabled) {
  background: var(--btn-hover-bg, #e6e8eb);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-text-danger {
  background: none;
  border: none;
  color: #f56c6c;
  font-size: 12px;
  cursor: pointer;
  padding: 6px 0;
}

.btn-text-danger:hover {
  text-decoration: underline;
}

/* 申请指南 */
.steps {
  margin-bottom: 14px;
}

.step {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 12px;
}

.step:last-child {
  margin-bottom: 0;
}

.step-num {
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, #FF9F43, #FFB347);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
}

.step-content strong {
  display: block;
  font-size: 13px;
  color: var(--text-primary, #303133);
  margin-bottom: 2px;
}

.step-content p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.btn-link {
  width: 100%;
  padding: 10px 16px;
  background: #ecf5ff;
  border: 1px solid #409eff;
  border-radius: 6px;
  color: #FF9F43;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.btn-link:hover {
  background: #409eff;
  color: #fff;
}

.tip {
  padding: 10px 12px;
  background: #fdf6ec;
  border-radius: 6px;
  font-size: 12px;
  color: #e6a23c;
}

.tip strong {
  color: #e6a23c;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .settings-container {
    --card-bg: #3a3a3c;
    --border-color: #4a4a4c;
    --input-bg: #4a4a4c;
    --btn-bg: #4a4a4c;
    --btn-hover-bg: #5a5a5c;
    --text-primary: #fff;
  }
  
  .test-result {
    background: #4a4a4c;
  }

  .tip {
    background: #4a3a2a;
  }
}

/* 滑块样式 */
.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--border-color);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  transition: transform 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
}

.slider::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
  transition: transform 0.2s;
}

.slider::-moz-range-thumb:hover {
  transform: scale(1.2);
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 导出导入部分 */
.section-desc {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: var(--text-secondary);
}

.export-buttons {
  display: flex;
  gap: 10px;
}

.export-buttons button {
  flex: 1;
}

.import-section {
  margin-top: 16px;
}

/* 复选框样式 */
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-regular);
}

.checkbox-label input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* 导入结果 */
.import-result {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.import-result.success {
  background: rgba(103, 194, 58, 0.1);
  color: #67c23a;
  border: 1px solid #67c23a;
}

.import-result.error {
  background: rgba(245, 108, 108, 0.1);
  color: #f56c6c;
  border: 1px solid #f56c6c;
}

.import-result p {
  margin: 4px 0;
}

/* Toast 提示 */
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  justify-content: center;
}

.toast.success {
  background: linear-gradient(135deg, #67c23a, #85ce61);
  color: #fff;
}

.toast.error {
  background: linear-gradient(135deg, #f56c6c, #f78989);
  color: #fff;
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}

.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

.toast-fade-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}

/* 深色模式下的 Toast */
@media (prefers-color-scheme: dark) {
  .toast {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
}
</style>
