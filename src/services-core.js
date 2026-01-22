/**
 * 核心服务层逻辑
 * 在 uTools 环境和浏览器开发环境之间共享
 */

// ==================== 常量定义 ====================

/** 记忆状态阈值（天数） */
export const MEMORY_INTERVALS = {
  NEW: 0,
  LEARNING: 7,
  CONSOLIDATING: 21
}

/** 记忆质量等级（SM-2 算法） */
export const QUALITY_LEVELS = {
  COMPLETELY_FORGOTTEN: 0,
  HARDLY_REMEMBERED: 1,
  DIFFICULT_TO_RECALL: 2,
  SOMEWHAT_REMEMBERED: 3,
  CLEARLY_REMEMBERED: 4,
  PERFECTLY_REMEMBERED: 5
}

/** 默认 SM-2 参数 */
export const DEFAULT_SM2_PARAMS = {
  EASE_FACTOR: 2.5,
  MIN_EASE_FACTOR: 1.3,
  INITIAL_INTERVAL: 0,
  FIRST_REVIEW_INTERVAL: 1,
  SECOND_REVIEW_INTERVAL: 6
}

/** 预设颜色列表 */
export const PRESET_COLORS = [
  '#f56c6c', '#e6a23c', '#67c23a', '#409eff', '#909399',
  '#f06595', '#845ef7', '#5c7cfa', '#22b8cf', '#20c997',
  '#fab005', '#fd7e14', '#ff6b6b', '#cc5de8', '#7950f2',
  '#be4bdb', '#4c6ef5', '#15aabf', '#12b886', '#82c91e'
]

/** 存储键名 */
export const STORAGE_KEYS = {
  API_KEY: 'niutrans_apikey',
  APP_ID: 'niutrans_appid',
  WORD_PREFIX: 'word_',
  TAG_PREFIX: 'tag_',
  DEV_DATA: 'word_diary_dev_data'
}

// ==================== 工具函数 ====================

/**
 * 生成唯一ID
 * @param {string} prefix - ID 前缀
 * @returns {string} 唯一ID
 */
export function generateId(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9)
}

/**
 * 获取随机颜色
 * @returns {string} 颜色值
 */
export function getRandomColor() {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]
}

/**
 * 获取记忆状态描述
 * @param {number} interval - 复习间隔（天数）
 * @returns {{text: string, color: string}} 记忆状态
 */
export function getMemoryStatus(interval) {
  if (!interval || interval === 0) {
    return { text: '新', color: '#909399' }
  }
  if (interval < MEMORY_INTERVALS.LEARNING) {
    return { text: '学习', color: '#e6a23c' }
  }
  if (interval < MEMORY_INTERVALS.CONSOLIDATING) {
    return { text: '巩固', color: '#409eff' }
  }
  return { text: '掌握', color: '#67c23a' }
}

/**
 * 格式化时间戳
 * @param {number} timestamp - 时间戳
 * @returns {string} 格式化的日期字符串
 */
export function formatDate(timestamp) {
  if (!timestamp) return '从未'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ==================== SM-2 算法实现 ====================

/**
 * 计算 SM-2 间隔重复算法的下次复习时间
 * @param {Object} params - 算法参数
 * @param {number} params.quality - 记忆质量 (0-5)
 * @param {number} params.easeFactor - 当前难度因子
 * @param {number} params.interval - 当前间隔（天）
 * @returns {Object} 更新后的参数
 */
export function calculateSM2({ quality, easeFactor, interval }) {
  // 确保有初始值
  easeFactor = easeFactor || DEFAULT_SM2_PARAMS.EASE_FACTOR
  interval = interval || DEFAULT_SM2_PARAMS.INITIAL_INTERVAL

  let newInterval = interval
  let newEaseFactor = easeFactor

  if (quality >= QUALITY_LEVELS.SOMEWHAT_REMEMBERED) {
    // 记住了
    if (interval === 0) {
      newInterval = DEFAULT_SM2_PARAMS.FIRST_REVIEW_INTERVAL
    } else if (interval === 1) {
      newInterval = DEFAULT_SM2_PARAMS.SECOND_REVIEW_INTERVAL
    } else {
      newInterval = Math.round(interval * easeFactor)
    }

    // 更新难度因子
    newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    if (newEaseFactor < DEFAULT_SM2_PARAMS.MIN_EASE_FACTOR) {
      newEaseFactor = DEFAULT_SM2_PARAMS.MIN_EASE_FACTOR
    }
  } else {
    // 忘记了，重置间隔
    newInterval = DEFAULT_SM2_PARAMS.FIRST_REVIEW_INTERVAL
    // 难度因子不变
  }

  return {
    easeFactor: newEaseFactor,
    interval: newInterval
  }
}

// ==================== 数据库缓存层 ====================

class DatabaseCache {
  constructor() {
    this.wordCache = null
    this.tagCache = null
    this.wordIndex = null // 单词名到 ID 的索引
    this.cacheTimestamp = 0
    this.cacheTTL = 5000 // 缓存有效期 5 秒
  }

  /**
   * 检查缓存是否有效
   * @returns {boolean}
   */
  isCacheValid() {
    return Date.now() - this.cacheTimestamp < this.cacheTTL
  }

  /**
   * 清除缓存
   */
  invalidate() {
    this.wordCache = null
    this.tagCache = null
    this.wordIndex = null
    this.cacheTimestamp = 0
  }

  /**
   * 获取所有单词（带缓存）
   * @param {Function} dbGetter - 数据库获取函数
   * @returns {Array} 单词列表
   */
  getAllWords(dbGetter) {
    if (this.isCacheValid() && this.wordCache) {
      return this.wordCache
    }

    const result = dbGetter()
    this.wordCache = result
    this.cacheTimestamp = Date.now()
    return result
  }

  /**
   * 获取所有标签（带缓存）
   * @param {Function} dbGetter - 数据库获取函数
   * @returns {Array} 标签列表
   */
  getAllTags(dbGetter) {
    if (this.isCacheValid() && this.tagCache) {
      return this.tagCache
    }

    const result = dbGetter()
    this.tagCache = result
    this.cacheTimestamp = Date.now()
    return result
  }

  /**
   * 通过单词名查找（使用索引）
   * @param {string} word - 单词
   * @param {Function} dbGetter - 数据库获取函数
   * @returns {Object|null} 单词对象
   */
  findWordByName(word, dbGetter) {
    // 重建索引（如果需要）
    if (!this.wordIndex || !this.isCacheValid()) {
      this.buildWordIndex(dbGetter)
    }

    const lowerWord = word.toLowerCase()
    return this.wordIndex[lowerWord] || null
  }

  /**
   * 构建单词索引
   * @param {Function} dbGetter - 数据库获取函数
   */
  buildWordIndex(dbGetter) {
    const words = this.getAllWords(dbGetter)
    this.wordIndex = {}

    for (const word of words) {
      if (word.word) {
        this.wordIndex[word.word.toLowerCase()] = word
      }
    }
  }
}

// 导出单例
export const dbCache = new DatabaseCache()

// ==================== 单词操作服务 ====================

/**
 * 单词服务类
 */
export class WordService {
  constructor(db) {
    this.db = db
  }

  /**
   * 获取所有单词
   * @returns {Array} 单词列表
   */
  getAllWords() {
    const result = this.db.allDocs(STORAGE_KEYS.WORD_PREFIX)
    return result.map(item => item.data).sort((a, b) => b.createTime - a.createTime)
  }

  /**
   * 从缓存获取所有单词
   * @returns {Array} 单词列表
   */
  getAllWordsCached() {
    return dbCache.getAllWords(() => this.getAllWords())
  }

  /**
   * 保存单词
   * @param {Object} wordData - 单词数据
   * @returns {Object|null} 保存后的单词对象
   */
  saveWord(wordData) {
    const id = wordData._id || generateId(STORAGE_KEYS.WORD_PREFIX)
    const now = Date.now()

    // 如果是更新，先获取原有数据
    let existingWord = null
    if (wordData._id) {
      const result = this.db.get(wordData._id)
      if (result) {
        existingWord = result
      }
    }

    const word = {
      _id: id,
      _rev: existingWord?._rev,
      data: {
        _id: id,
        word: wordData.word,
        translation: wordData.translation,
        tags: wordData.tags || [],
        createTime: existingWord?.data?.createTime || now,
        updateTime: now,
        reviewCount: wordData.reviewCount ?? existingWord?.data?.reviewCount ?? 0,
        nextReviewTime: wordData.nextReviewTime ?? existingWord?.data?.nextReviewTime ?? now,
        easeFactor: wordData.easeFactor ?? existingWord?.data?.easeFactor ?? DEFAULT_SM2_PARAMS.EASE_FACTOR,
        interval: wordData.interval ?? existingWord?.data?.interval ?? DEFAULT_SM2_PARAMS.INITIAL_INTERVAL,
        lastReviewTime: wordData.lastReviewTime ?? existingWord?.data?.lastReviewTime ?? null
      }
    }

    const result = this.db.put(word)

    // 清除缓存
    dbCache.invalidate()

    return result.ok ? word.data : null
  }

  /**
   * 删除单词
   * @param {string} id - 单词ID
   * @returns {boolean} 是否删除成功
   */
  deleteWord(id) {
    const result = this.db.remove(id)

    if (result.ok) {
      dbCache.invalidate()
    }

    return result.ok
  }

  /**
   * 根据条件获取单词
   * @param {Object} options - 查询选项
   * @returns {Array} 过滤后的单词列表
   */
  getWords(options = {}) {
    let filtered = this.getAllWordsCached()

    // 按标签过滤
    if (options.includeTags && options.includeTags.length > 0) {
      filtered = filtered.filter(word =>
        word.tags.some(tag => options.includeTags.includes(tag))
      )
    }

    // 排除标签
    if (options.excludeTags && options.excludeTags.length > 0) {
      filtered = filtered.filter(word =>
        !word.tags.some(tag => options.excludeTags.includes(tag))
      )
    }

    // 按创建时间过滤（几天前的单词）
    if (options.minDaysOld !== undefined && options.minDaysOld !== null) {
      const startTime = Date.now() - options.minDaysOld * 24 * 60 * 60 * 1000
      filtered = filtered.filter(word => word.createTime <= startTime)
    }

    // 按下次复习时间过滤（需要复习的单词）
    if (options.needReview) {
      const now = Date.now()
      filtered = filtered.filter(word => word.nextReviewTime <= now)
    }

    return filtered
  }

  /**
   * 搜索单词
   * @param {string} keyword - 搜索关键词
   * @returns {Array} 匹配的单词列表
   */
  searchWords(keyword) {
    const allWords = this.getAllWordsCached()
    const lowerKeyword = keyword.toLowerCase()
    return allWords.filter(word =>
      word.word.toLowerCase().includes(lowerKeyword) ||
      word.translation.toLowerCase().includes(lowerKeyword)
    )
  }

  /**
   * 获取需要复习的单词（基于记忆曲线）
   * @param {Object} options - 筛选选项
   * @returns {Array} 需要复习的单词列表
   */
  getReviewWords(options = {}) {
    const now = Date.now()
    let words = this.getAllWordsCached()

    // 排除标签
    if (options.excludeTags && options.excludeTags.length > 0) {
      words = words.filter(word =>
        !word.tags.some(tag => options.excludeTags.includes(tag))
      )
    }

    // 只包含特定标签
    if (options.includeTags && options.includeTags.length > 0) {
      words = words.filter(word =>
        word.tags.some(tag => options.includeTags.includes(tag))
      )
    }

    // 筛选几天前添加的单词
    if (options.minDaysOld !== undefined && options.minDaysOld > 0) {
      const cutoffTime = now - options.minDaysOld * 24 * 60 * 60 * 1000
      words = words.filter(word => word.createTime <= cutoffTime)
    }

    // 筛选需要复习的（到期的）
    if (options.onlyDue !== false) {
      words = words.filter(word => word.nextReviewTime <= now)
    }

    // 按下次复习时间排序
    words.sort((a, b) => a.nextReviewTime - b.nextReviewTime)

    return words
  }

  /**
   * 更新单词复习状态（基于SM-2算法）
   * @param {string} wordId - 单词ID
   * @param {number} quality - 记忆质量 0-5
   * @returns {Object|null} 更新后的单词对象
   */
  updateReviewStatus(wordId, quality) {
    const result = this.db.get(wordId)
    if (!result) return null

    const word = result.data
    const now = Date.now()

    // 使用 SM-2 算法计算新的参数
    const { easeFactor, interval } = calculateSM2({
      quality,
      easeFactor: word.easeFactor,
      interval: word.interval
    })

    const reviewCount = (word.reviewCount || 0) + 1
    const nextReviewTime = now + interval * 24 * 60 * 60 * 1000

    return this.saveWord({
      ...word,
      easeFactor,
      interval,
      reviewCount,
      nextReviewTime,
      lastReviewTime: now
    })
  }

  /**
   * 检查单词是否已存在（优化版，使用索引）
   * @param {string} word - 单词
   * @returns {Object|null} 单词对象或null
   */
  wordExists(word) {
    return dbCache.findWordByName(word, () => this.getAllWords())
  }

  /**
   * 获取统计数据
   * @returns {Object} 统计信息
   */
  getStatistics() {
    const allWords = this.getAllWordsCached()
    const now = Date.now()
    const today = new Date().setHours(0, 0, 0, 0)

    return {
      totalWords: allWords.length,
      todayAdded: allWords.filter(w => w.createTime >= today).length,
      needReview: allWords.filter(w => w.nextReviewTime <= now).length,
      mastered: allWords.filter(w => w.interval >= MEMORY_INTERVALS.CONSOLIDATING).length,
      todayReviewed: allWords.filter(w => w.lastReviewTime && w.lastReviewTime >= today).length
    }
  }
}

// ==================== 标签操作服务 ====================

/**
 * 标签服务类
 */
export class TagService {
  constructor(db, wordService) {
    this.db = db
    this.wordService = wordService
  }

  /**
   * 获取所有标签
   * @returns {Array} 标签列表
   */
  getAllTags() {
    const result = this.db.allDocs(STORAGE_KEYS.TAG_PREFIX)
    return result.map(item => item.data).sort((a, b) => (a.order || 0) - (b.order || 0) || a.createTime - b.createTime)
  }

  /**
   * 从缓存获取所有标签
   * @returns {Array} 标签列表
   */
  getAllTagsCached() {
    return dbCache.getAllTags(() => this.getAllTags())
  }

  /**
   * 保存标签
   * @param {Object} tagData - 标签数据
   * @returns {Object|null} 保存后的标签对象
   */
  saveTag(tagData) {
    const id = tagData._id || STORAGE_KEYS.TAG_PREFIX + tagData.name
    const now = Date.now()

    // 如果是更新，先获取原有数据
    let existingTag = null
    let oldName = null
    if (tagData._id) {
      const result = this.db.get(tagData._id)
      if (result) {
        existingTag = result
        oldName = result.data?.name
      }
    }

    const tag = {
      _id: id,
      _rev: existingTag?._rev,
      data: {
        _id: id,
        name: tagData.name,
        color: tagData.color || getRandomColor(),
        createTime: existingTag?.data?.createTime || now,
        order: tagData.order ?? existingTag?.data?.order ?? 0
      }
    }

    const result = this.db.put(tag)

    // 如果标签名称发生变化，级联更新所有使用该标签的单词
    if (result.ok && oldName && oldName !== tagData.name) {
      this.cascadeUpdateTagName(oldName, tagData.name)
    }

    // 清除缓存
    dbCache.invalidate()

    return result.ok ? tag.data : null
  }

  /**
   * 删除标签
   * @param {string} id - 标签ID
   * @param {string} tagName - 标签名称（用于级联更新单词）
   * @returns {boolean} 是否删除成功
   */
  deleteTag(id, tagName) {
    // 先删除标签本身
    const result = this.db.remove(id)

    if (result.ok && tagName) {
      // 级联更新：从所有使用该标签的单词中移除
      this.cascadeRemoveTagFromWords(tagName)
    }

    if (result.ok) {
      dbCache.invalidate()
    }

    return result.ok
  }

  /**
   * 级联更新：当标签改名时，更新所有使用该标签的单词
   * @param {string} oldName - 旧标签名
   * @param {string} newName - 新标签名
   */
  cascadeUpdateTagName(oldName, newName) {
    const allWords = this.wordService.getAllWords()
    allWords.forEach(word => {
      if (word.tags && word.tags.includes(oldName)) {
        const newTags = word.tags.map(t => t === oldName ? newName : t)
        this.wordService.saveWord({ ...word, tags: newTags })
      }
    })
  }

  /**
   * 级联删除：从所有使用该标签的单词中移除标签
   * @param {string} tagName - 标签名
   */
  cascadeRemoveTagFromWords(tagName) {
    const allWords = this.wordService.getAllWords()
    allWords.forEach(word => {
      if (word.tags && word.tags.includes(tagName)) {
        const newTags = word.tags.filter(t => t !== tagName)
        this.wordService.saveWord({ ...word, tags: newTags })
      }
    })
  }

  /**
   * 获取标签使用次数
   * @param {string} tagName - 标签名称
   * @returns {number} 使用次数
   */
  getTagUsageCount(tagName) {
    const allWords = this.wordService.getAllWordsCached()
    return allWords.filter(w => w.tags?.includes(tagName)).length
  }
}

// ==================== 数据导出/导入 ====================

/**
 * 数据服务类
 */
export class DataService {
  constructor(db) {
    this.db = db
  }

  /**
   * 导出所有数据为 JSON
   * @returns {string} JSON 字符串
   */
  exportToJSON() {
    const wordService = new WordService(this.db)
    const tagService = new TagService(this.db, wordService)

    return JSON.stringify({
      version: '1.0',
      exportTime: new Date().toISOString(),
      words: wordService.getAllWords(),
      tags: tagService.getAllTags()
    }, null, 2)
  }

  /**
   * 导出所有数据为 CSV（仅单词）
   * @returns {string} CSV 字符串
   */
  exportToCSV() {
    const wordService = new WordService(this.db)
    const words = wordService.getAllWords()

    const headers = ['单词', '翻译', '标签', '创建时间', '复习次数', '记忆间隔(天)', '难度因子']
    const rows = words.map(word => [
      word.word,
      `"${word.translation.replace(/"/g, '""')}"`, // 转义引号
      word.tags.join('; '),
      new Date(word.createTime).toLocaleDateString('zh-CN'),
      word.reviewCount || 0,
      word.interval || 0,
      word.easeFactor?.toFixed(2) || DEFAULT_SM2_PARAMS.EASE_FACTOR
    ])

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  /**
   * 从 JSON 导入数据
   * @param {string} jsonData - JSON 字符串
   * @param {Object} options - 导入选项
   * @returns {Object} 导入结果
   */
  importFromJSON(jsonData, options = {}) {
    try {
      const data = JSON.parse(jsonData)
      const wordService = new WordService(this.db)
      const tagService = new TagService(this.db, wordService)

      let importedWords = 0
      let importedTags = 0
      let skippedWords = 0

      // 导入标签
      if (data.tags && options.importTags !== false) {
        for (const tag of data.tags) {
          const existing = this.db.get(tag._id)
          if (!existing || options.overwrite) {
            tagService.saveTag(tag)
            importedTags++
          }
        }
      }

      // 导入单词
      if (data.words) {
        for (const word of data.words) {
          const existing = wordService.wordExists(word.word)
          if (!existing || options.overwrite) {
            wordService.saveWord(word)
            if (!existing) {
              importedWords++
            } else {
              skippedWords++
            }
          } else {
            skippedWords++
          }
        }
      }

      // 清除缓存
      dbCache.invalidate()

      return {
        success: true,
        importedWords,
        importedTags,
        skippedWords,
        total: importedWords + importedTags + skippedWords
      }
    } catch (e) {
      return {
        success: false,
        error: e.message
      }
    }
  }
}
