// 开发环境模拟 uTools API 和 services
// 仅在浏览器开发时使用，uTools 环境中会被真实 API 覆盖

// ==================== 导入核心服务 ====================
// 在浏览器开发环境，直接从 services-core 导入

// ==================== 小牛翻译配置 ====================
const API_URL = 'https://api.niutrans.com/NiuTransServer/translation'
const DEFAULT_API_KEY = '5e690ed1f4cbdb16d88a3f6a07e9f185' // 默认共享密钥

// 本地存储 key
const STORAGE_KEY = 'word_diary_dev_data'

// ==================== 本地存储数据库适配器 ====================

/**
 * 获取存储数据
 */
function getStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : { words: {}, tags: {} }
  } catch {
    return { words: {}, tags: {} }
  }
}

/**
 * 保存存储数据
 */
function saveStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/**
 * 浏览器环境数据库适配器（使用 localStorage）
 */
const browserDb = {
  allDocs: (prefix) => {
    const storage = getStorage()
    const collection = prefix.includes('word') ? storage.words : storage.tags
    return Object.values(collection).filter(item => item._id.startsWith(prefix))
  },

  get: (id) => {
    const storage = getStorage()
    return storage.words[id] || storage.tags[id] || null
  },

  put: (doc) => {
    const storage = getStorage()
    const collection = doc._id.startsWith('word_') ? 'words' : 'tags'
    storage[collection][doc._id] = doc
    saveStorage(storage)
    return { ok: true, id: doc._id, rev: doc._rev }
  },

  remove: (id) => {
    const storage = getStorage()
    const collection = id.startsWith('word_') ? 'words' : 'tags'
    delete storage[collection][id]
    saveStorage(storage)
    return { ok: true }
  }
}

// ==================== 小牛翻译服务 ====================

/**
 * 使用小牛翻译 API 进行翻译（浏览器环境）
 * @param {string} text - 要翻译的文本
 * @param {string} from - 源语言 (auto, zh, en)
 * @param {string} to - 目标语言 (zh, en)
 */
async function niutransTranslate(text, from = 'auto', to = 'zh') {
  console.log('🔤 小牛翻译:', text)

  // 从核心服务获取配置
  const { STORAGE_KEYS } = window.servicesCore || {}
  if (!STORAGE_KEYS) {
    return {
      success: false,
      error: '核心服务未初始化'
    }
  }

  // 获取用户配置的密钥，如果没有则使用默认密钥
  let apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY)
  if (!apiKey) {
    apiKey = DEFAULT_API_KEY
  }

  // 构建请求体
  const postData = new URLSearchParams({
    from: from,
    to: to,
    apikey: apiKey,
    src_text: text
  }).toString()

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: postData
    })

    const result = await response.json()

    // 检查是否有错误
    if (result.error_code || result.errorCode) {
      console.error('翻译错误:', result)
      return {
        success: false,
        error: `翻译失败: ${result.error_msg || result.errorMsg || result.error_code || result.errorCode}`
      }
    }

    return {
      success: true,
      translation: result.tgt_text || '',
      dict: [],  // 小牛翻译不返回词典信息
      src: result.from || from
    }
  } catch (e) {
    console.error('翻译请求失败:', e)
    return {
      success: false,
      error: '网络请求失败: ' + e.message
    }
  }
}

// 更新API配置
function updateApiConfig(apiKey, appId) {
  console.log('API配置已更新')
}

// ==================== 模拟 uTools API ====================

let _pluginEnterCallback = null
let _subInputCallback = null

// 标记为开发环境 mock
window.__DEV_MOCK__ = true

// 模拟 uTools API
if (typeof window !== 'undefined' && !window.utools) {
  window.utools = {
    __isMock: true,  // 标记为 mock
    onPluginEnter: (callback) => {
      _pluginEnterCallback = callback
      // 开发环境自动触发，模拟进入插件
      setTimeout(() => {
        callback({ code: 'translate', type: 'text', payload: '' })
      }, 100)
    },
    onPluginOut: (callback) => {},
    setExpendHeight: (height) => true,
    setSubInput: (onChange, placeholder, isFocus) => {
      _subInputCallback = onChange
      return true
    },
    setSubInputValue: (text) => true,
    removeSubInput: () => true,
    subInputFocus: () => true,
    subInputBlur: () => true,
    showNotification: (msg) => {
      console.log('📢 通知:', msg)
      // 简单的 toast 提示
      const toast = document.createElement('div')
      toast.textContent = msg
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #303133;
        color: #fff;
        padding: 10px 20px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        animation: fadeInOut 2s ease;
      `
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    },
    shellOpenExternal: (url) => {
      console.log('🔗 打开外部链接:', url)
      window.open(url, '_blank')
    },
    db: browserDb
  }

  // 添加 CSS 动画
  const style = document.createElement('style')
  style.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
      15% { opacity: 1; transform: translateX(-50%) translateY(0); }
      85% { opacity: 1; transform: translateX(-50%) translateY(0); }
      100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
    }
  `
  document.head.appendChild(style)
}

// ==================== 初始化开发环境服务 ====================

function initDevServices() {
  const core = window.servicesCore

  if (!core) {
    console.error('核心服务模块未加载')
    return
  }

  // 创建服务实例
  const wordService = new core.WordService(browserDb)
  const tagService = new core.TagService(browserDb, wordService)
  const dataService = new core.DataService(browserDb)

  // 导出服务到 window 对象
  window.services = {
    // 核心工具
    ...core,

    // 翻译服务
    translate: niutransTranslate,
    updateApiConfig,

    // 单词操作
    getAllWords: () => wordService.getAllWordsCached(),
    saveWord: (data) => wordService.saveWord(data),
    deleteWord: (id) => wordService.deleteWord(id),
    getWords: (options) => wordService.getWords(options),
    searchWords: (keyword) => wordService.searchWords(keyword),
    getReviewWords: (options) => wordService.getReviewWords(options),
    updateReviewStatus: (id, quality) => wordService.updateReviewStatus(id, quality),
    wordExists: (word) => wordService.wordExists(word),
    getStatistics: () => wordService.getStatistics(),

    // 标签操作
    getAllTags: () => tagService.getAllTagsCached(),
    saveTag: (data) => tagService.saveTag(data),
    deleteTag: (id, name) => tagService.deleteTag(id, name),
    getTagUsageCount: (name) => tagService.getTagUsageCount(name),

    // 数据导出导入
    exportToJSON: () => dataService.exportToJSON(),
    exportToCSV: () => dataService.exportToCSV(),
    importFromJSON: (data, options) => dataService.importFromJSON(data, options)
  }

  console.log('🔧 开发环境 Mock 已加载')
}

// 延迟初始化，等待核心模块加载
if (window.servicesCore) {
  initDevServices()
} else {
  // 如果核心模块还未加载，监听加载事件
  document.addEventListener('servicesCoreReady', initDevServices)
}
