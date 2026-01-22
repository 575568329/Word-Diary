<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  enterAction: {
    type: Object,
    required: true
  }
})

// 状态
const tags = ref([])
const words = ref([])

// 新建标签
const showCreateModal = ref(false)
const newTagName = ref('')
const newTagColor = ref('#409eff')

// 编辑标签
const showEditModal = ref(false)
const editingTag = ref(null)
const editTagName = ref('')
const editTagColor = ref('')

// 删除确认
const showDeleteConfirm = ref(false)
const tagToDelete = ref(null)

// 预设颜色
const presetColors = [
  '#f56c6c', '#e6a23c', '#67c23a', '#409eff', '#909399',
  '#f06595', '#845ef7', '#5c7cfa', '#22b8cf', '#20c997',
  '#fab005', '#fd7e14', '#ff6b6b', '#cc5de8', '#7950f2',
  '#be4bdb', '#4c6ef5', '#15aabf', '#12b886', '#82c91e'
]

// 加载数据
const loadTags = () => {
  tags.value = window.services.getAllTags()
}

const loadWords = () => {
  words.value = window.services.getAllWords()
}

// 获取标签使用次数
const getTagUsageCount = (tagName) => {
  return words.value.filter(w => w.tags?.includes(tagName)).length
}

// 统计
const statistics = computed(() => ({
  totalTags: tags.value.length,
  totalUsage: tags.value.reduce((sum, tag) => sum + getTagUsageCount(tag.name), 0)
}))

// 创建标签
const openCreateModal = () => {
  newTagName.value = ''
  newTagColor.value = presetColors[Math.floor(Math.random() * presetColors.length)]
  showCreateModal.value = true
}

const createTag = () => {
  const name = newTagName.value.trim()
  if (!name) {
    window.utools?.showNotification?.('请输入标签名称')
    return
  }
  
  // 检查是否已存在
  if (tags.value.some(t => t.name === name)) {
    window.utools?.showNotification?.('标签已存在')
    return
  }
  
  window.services.saveTag({
    name,
    color: newTagColor.value
  })
  
  loadTags()
  showCreateModal.value = false
  window.utools?.showNotification?.('标签已创建')
}

// 编辑标签
const openEditModal = (tag) => {
  editingTag.value = tag
  editTagName.value = tag.name
  editTagColor.value = tag.color
  showEditModal.value = true
}

const saveEditTag = () => {
  const name = editTagName.value.trim()
  if (!name) {
    window.utools?.showNotification?.('请输入标签名称')
    return
  }
  
  // 检查是否与其他标签重名
  if (tags.value.some(t => t.name === name && t._id !== editingTag.value._id)) {
    window.utools?.showNotification?.('标签名称已被使用')
    return
  }
  
  const oldName = editingTag.value.name
  const newName = name
  
  // 更新标签
  window.services.saveTag({
    _id: editingTag.value._id,
    name: newName,
    color: editTagColor.value
  })
  
  // 如果标签名称改变了，更新所有使用该标签的单词
  if (oldName !== newName) {
    words.value.forEach(word => {
      if (word.tags?.includes(oldName)) {
        const newTags = word.tags.map(t => t === oldName ? newName : t)
        window.services.saveWord({ ...word, tags: newTags })
      }
    })
    loadWords()
  }
  
  loadTags()
  showEditModal.value = false
  window.utools?.showNotification?.('标签已更新')
}

// 删除标签
const confirmDelete = (tag) => {
  tagToDelete.value = tag
  showDeleteConfirm.value = true
}

const deleteTag = () => {
  if (!tagToDelete.value) return
  
  const tagName = tagToDelete.value.name
  
  // 从所有单词中移除该标签
  words.value.forEach(word => {
    if (word.tags?.includes(tagName)) {
      const newTags = word.tags.filter(t => t !== tagName)
      window.services.saveWord({ ...word, tags: newTags })
    }
  })
  
  // 删除标签
  window.services.deleteTag(tagToDelete.value._id)
  
  loadTags()
  loadWords()
  showDeleteConfirm.value = false
  tagToDelete.value = null
  window.utools?.showNotification?.('标签已删除')
}

// 选择颜色
const selectColor = (color, target) => {
  if (target === 'new') {
    newTagColor.value = color
  } else {
    editTagColor.value = color
  }
}

onMounted(() => {
  loadTags()
  loadWords()
  window.utools?.setExpendHeight?.(600)
})
</script>

<template>
  <div class="tag-manage-container">
    <!-- 顶部 -->
    <div class="header">
      <div class="title-section">
        <h1 class="title">🏷️ 标签管理</h1>
        <div class="stats">
          共 {{ statistics.totalTags }} 个标签，{{ statistics.totalUsage }} 次使用
        </div>
      </div>
      <button class="btn-create" @click="openCreateModal">
        + 新建标签
      </button>
    </div>
    
    <!-- 标签列表 -->
    <div class="tag-grid">
      <div v-if="tags.length === 0" class="empty-state">
        <div class="empty-icon">🏷️</div>
        <p>还没有创建任何标签</p>
        <p class="hint">点击上方按钮创建第一个标签</p>
      </div>
      
      <div 
        v-for="tag in tags" 
        :key="tag._id" 
        class="tag-card"
      >
        <div class="tag-color" :style="{ backgroundColor: tag.color }"></div>
        <div class="tag-info">
          <div class="tag-name">{{ tag.name }}</div>
          <div class="tag-usage">{{ getTagUsageCount(tag.name) }} 个单词使用此标签</div>
        </div>
        <div class="tag-actions">
          <button class="btn-icon" @click="openEditModal(tag)" title="编辑">
            ✏️
          </button>
          <button class="btn-icon delete" @click="confirmDelete(tag)" title="删除">
            🗑️
          </button>
        </div>
      </div>
    </div>
    
    <!-- 创建标签弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <h3>新建标签</h3>
        
        <div class="form-group">
          <label>标签名称</label>
          <input 
            v-model="newTagName" 
            type="text" 
            class="form-input"
            placeholder="输入标签名称"
            maxlength="20"
            @keyup.enter="createTag"
          >
        </div>
        
        <div class="form-group">
          <label>标签颜色</label>
          <div class="color-preview">
            <div 
              class="color-sample" 
              :style="{ backgroundColor: newTagColor }"
            ></div>
            <span class="color-hex">{{ newTagColor }}</span>
          </div>
          <div class="color-palette">
            <div 
              v-for="color in presetColors" 
              :key="color"
              class="color-option"
              :class="{ selected: newTagColor === color }"
              :style="{ backgroundColor: color }"
              @click="selectColor(color, 'new')"
            ></div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showCreateModal = false">取消</button>
          <button class="btn-primary" @click="createTag">创建</button>
        </div>
      </div>
    </div>
    
    <!-- 编辑标签弹窗 -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
      <div class="modal-content">
        <h3>编辑标签</h3>
        
        <div class="form-group">
          <label>标签名称</label>
          <input 
            v-model="editTagName" 
            type="text" 
            class="form-input"
            placeholder="输入标签名称"
            maxlength="20"
            @keyup.enter="saveEditTag"
          >
        </div>
        
        <div class="form-group">
          <label>标签颜色</label>
          <div class="color-preview">
            <div 
              class="color-sample" 
              :style="{ backgroundColor: editTagColor }"
            ></div>
            <span class="color-hex">{{ editTagColor }}</span>
          </div>
          <div class="color-palette">
            <div 
              v-for="color in presetColors" 
              :key="color"
              class="color-option"
              :class="{ selected: editTagColor === color }"
              :style="{ backgroundColor: color }"
              @click="selectColor(color, 'edit')"
            ></div>
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showEditModal = false">取消</button>
          <button class="btn-primary" @click="saveEditTag">保存</button>
        </div>
      </div>
    </div>
    
    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content confirm-modal">
        <h3>确认删除</h3>
        <p>确定要删除标签 "<strong>{{ tagToDelete?.name }}</strong>" 吗？</p>
        <p class="usage-warning" v-if="getTagUsageCount(tagToDelete?.name) > 0">
          ⚠️ 此标签被 {{ getTagUsageCount(tagToDelete?.name) }} 个单词使用，删除后将从这些单词中移除
        </p>
        <p class="warning">此操作无法撤销</p>
        
        <div class="modal-actions">
          <button class="btn-secondary" @click="showDeleteConfirm = false">取消</button>
          <button class="btn-danger" @click="deleteTag">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tag-manage-container {
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
  max-width: 600px;
  margin: 0 auto;
}

/* 顶部 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.title {
  margin: 0;
  font-size: 24px;
}

.stats {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.btn-create {
  padding: 10px 20px;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-create:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.4);
}

/* 标签列表 */
.tag-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state .hint {
  font-size: 13px;
  opacity: 0.7;
}

.tag-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--card-bg, #fff);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: all 0.2s;
}

.tag-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.tag-color {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}

.tag-info {
  flex: 1;
  min-width: 0;
}

.tag-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary, #303133);
  margin-bottom: 4px;
}

.tag-usage {
  font-size: 13px;
  color: #909399;
}

.tag-actions {
  display: flex;
  gap: 8px;
}

.btn-icon {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 8px;
  background: var(--btn-bg, #f5f7fa);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 16px;
}

.btn-icon:hover {
  transform: scale(1.05);
  background: #ecf5ff;
}

.btn-icon.delete:hover {
  background: #fef0f0;
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
  max-width: 400px;
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

.confirm-modal .usage-warning {
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #e6a23c;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}

.form-input {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--border-color, #dcdfe6);
  border-radius: 10px;
  font-size: 15px;
  background: var(--input-bg, #fff);
  color: inherit;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: #409eff;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.color-sample {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.color-hex {
  font-family: monospace;
  font-size: 14px;
  color: #606266;
}

.color-palette {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 8px;
}

.color-option {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #fff;
  box-shadow: 0 0 0 2px #409eff;
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
  .tag-manage-container {
    --card-bg: #3a3a3c;
    --border-color: #4a4a4c;
    --input-bg: #4a4a4c;
    --btn-bg: #4a4a4c;
    --btn-hover-bg: #5a5a5c;
    --text-primary: #fff;
  }
  
  .confirm-modal .usage-warning {
    background: #3a3020;
    border-color: #4a4020;
  }
}
</style>
