<template>
  <div class="example-section">
    <div class="section-header">
      <h4 class="section-title">📚 例句</h4>
      <button @click="showAddDialog = true" class="btn-add">
        + 添加
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载例句中...</p>
    </div>

    <!-- 例句列表 -->
    <div v-else-if="examples.length > 0" class="example-list">
      <div
        v-for="ex in examples"
        :key="ex.id"
        class="example-item"
        :class="{ favorite: ex.is_favorite }"
      >
        <div class="example-content">
          <!-- 难度等级 -->
          <span class="difficulty-badge" :data-level="ex.difficulty">
            {{ '★'.repeat(ex.difficulty || 3) }}
          </span>

          <!-- 英文例句 -->
          <p class="sentence-en">{{ ex.sentence_en }}</p>

          <!-- 中文翻译 -->
          <p class="sentence-zh">{{ ex.sentence_zh }}</p>

          <!-- 来源标签 -->
          <span class="source-badge">{{ getSourceLabel(ex.source) }}</span>
        </div>

        <!-- 操作按钮 -->
        <div class="example-actions">
          <button
            @click="playAudio(ex)"
            class="btn-icon"
            title="播放发音"
          >
            🔊
          </button>
          <button
            @click="toggleFavorite(ex)"
            class="btn-icon"
            :title="ex.is_favorite ? '取消收藏' : '收藏'"
          >
            {{ ex.is_favorite ? '⭐' : '☆' }}
          </button>
          <button
            v-if="ex.source === 'user'"
            @click="editExample(ex)"
            class="btn-icon"
            title="编辑"
          >
            ✏️
          </button>
          <button
            v-if="ex.source === 'user'"
            @click="confirmDelete(ex)"
            class="btn-icon danger"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📝</div>
      <p>暂无例句</p>
      <p class="hint">点击"添加"按钮自定义例句</p>
    </div>

    <!-- 添加例句对话框 -->
    <div v-if="showAddDialog" class="modal-overlay" @click.self="showAddDialog = false">
      <div class="modal-content">
        <h3>添加例句</h3>
        <form @submit.prevent="addExample">
          <div class="form-group">
            <label>英文例句</label>
            <textarea
              v-model="newExample.sentence_en"
              class="form-textarea"
              placeholder="输入英文例句..."
              required
            ></textarea>
          </div>
          <div class="form-group">
            <label>中文翻译</label>
            <textarea
              v-model="newExample.sentence_zh"
              class="form-textarea"
              placeholder="输入中文翻译..."
              required
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showAddDialog = false" class="btn-secondary">
              取消
            </button>
            <button type="submit" class="btn-primary">
              添加
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 编辑例句对话框 -->
    <div v-if="showEditDialog" class="modal-overlay" @click.self="showEditDialog = false">
      <div class="modal-content">
        <h3>编辑例句</h3>
        <form @submit.prevent="updateExample">
          <div class="form-group">
            <label>英文例句</label>
            <textarea
              v-model="editingExample.sentence_en"
              class="form-textarea"
              placeholder="输入英文例句..."
              required
            ></textarea>
          </div>
          <div class="form-group">
            <label>中文翻译</label>
            <textarea
              v-model="editingExample.sentence_zh"
              class="form-textarea"
              placeholder="输入中文翻译..."
              required
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showEditDialog = false" class="btn-secondary">
              取消
            </button>
            <button type="submit" class="btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteDialog" class="modal-overlay" @click.self="showDeleteDialog = false">
      <div class="modal-content">
        <h3>确认删除</h3>
        <p>确定要删除这条例句吗？</p>
        <div class="modal-actions">
          <button @click="showDeleteDialog = false" class="btn-secondary">
            取消
          </button>
          <button @click="deleteExample" class="btn-danger">
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { exampleService } from '../../services/ExampleService.js'
import { pronunciationService } from '../../services/PronunciationService.js'

const props = defineProps({
  word: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['refresh'])

// 状态
const loading = ref(false)
const examples = ref([])
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)

// 新例句表单
const newExample = ref({
  sentence_en: '',
  sentence_zh: ''
})

// 编辑中的例句
const editingExample = ref(null)
const deletingExample = ref(null)

// 加载例句
const loadExamples = async () => {
  if (!props.word) return

  loading.value = true
  try {
    const results = await exampleService.getExamples(props.word)
    examples.value = results
  } catch (error) {
    console.error('加载例句失败:', error)
  } finally {
    loading.value = false
  }
}

// 播放发音
const playAudio = (example) => {
  try {
    pronunciationService.speakSentence(example.sentence_en)
  } catch (error) {
    console.error('播放失败:', error)
  }
}

// 切换收藏
const toggleFavorite = async (example) => {
  try {
    const newState = await exampleService.toggleFavorite(props.word, example.id)
    example.is_favorite = newState
  } catch (error) {
    console.error('切换收藏失败:', error)
  }
}

// 编辑例句
const editExample = (example) => {
  editingExample.value = { ...example }
  showEditDialog.value = true
}

// 更新例句
const updateExample = async () => {
  try {
    // 先删除旧的
    await exampleService.deleteExample(props.word, editingExample.value.id)

    // 添加新的
    await exampleService.addUserExample(
      props.word,
      editingExample.value.sentence_en,
      editingExample.value.sentence_zh
    )

    showEditDialog.value = false
    await loadExamples()
    emit('refresh')
  } catch (error) {
    console.error('更新例句失败:', error)
  }
}

// 确认删除
const confirmDelete = (example) => {
  deletingExample.value = example
  showDeleteDialog.value = true
}

// 删除例句
const deleteExample = async () => {
  try {
    await exampleService.deleteExample(props.word, deletingExample.value.id)
    showDeleteDialog.value = false
    await loadExamples()
    emit('refresh')
  } catch (error) {
    console.error('删除例句失败:', error)
  }
}

// 添加例句
const addExample = async () => {
  try {
    await exampleService.addUserExample(
      props.word,
      newExample.value.sentence_en,
      newExample.value.sentence_zh
    )

    // 重置表单
    newExample.value = {
      sentence_en: '',
      sentence_zh: ''
    }

    showAddDialog.value = false
    await loadExamples()
    emit('refresh')
  } catch (error) {
    console.error('添加例句失败:', error)
  }
}

// 获取来源标签
const getSourceLabel = (source) => {
  const labels = {
    iciba: '金山词霸',
    youdao: '有道',
    user: '自定义',
    tatoeba: 'Tatoeba'
  }
  return labels[source] || source
}

// 监听word变化
watch(() => props.word, () => {
  loadExamples()
})

// 组件挂载时加载例句
onMounted(() => {
  loadExamples()
})
</script>

<style scoped>
.example-section {
  margin-top: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-regular);
}

.btn-add {
  padding: 6px 16px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--primary-gradient);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-add:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.example-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.example-item {
  padding: 16px;
  background: var(--card-bg);
  border: 2px solid var(--border-light);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
}

.example-item:hover {
  border-color: var(--border-color);
  box-shadow: var(--shadow-sm);
}

.example-item.favorite {
  border-color: #FBBF24;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(251, 191, 36, 0.02) 100%);
}

.example-content {
  margin-bottom: 12px;
}

.difficulty-badge {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(255, 159, 67, 0.1);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: #F59E0B;
  margin-bottom: 8px;
}

.sentence-en {
  margin: 0 0 8px 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--text-primary);
}

.sentence-zh {
  margin: 0 0 8px 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
}

.source-badge {
  display: inline-block;
  padding: 2px 8px;
  background: var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 11px;
  color: var(--text-secondary);
}

.example-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.btn-icon {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: rgba(255, 159, 67, 0.1);
  transform: scale(1.1);
}

.btn-icon.danger:hover {
  background: rgba(239, 68, 68, 0.1);
}
</style>
