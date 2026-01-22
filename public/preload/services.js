/**
 * uTools 环境服务层
 * 使用核心服务逻辑 + uTools 数据库实现
 */

const https = require('https')

// ==================== 导入核心服务 ====================
// 在 uTools 环境中，我们需要动态导入核心服务
// 由于是 CommonJS 环境，这里会通过 utools 动态注入

// ==================== 小牛翻译配置 ====================
const API_URL = 'https://api.niutrans.com/NiuTransServer/translation'
const DEFAULT_API_KEY = '5e690ed1f4cbdb16d88a3f6a07e9f185' // 默认共享密钥
const { STORAGE_KEYS } = window.servicesCore || {}

// 获取当前API密钥
function getApiKey() {
  try {
    // 首先尝试获取用户配置的密钥
    if (window.utools?.db && window.servicesCore?.STORAGE_KEYS) {
      const doc = window.utools.db.get(window.servicesCore.STORAGE_KEYS.API_KEY)
      if (doc?.data) return doc.data
    }
  } catch (e) {
    console.error('获取API密钥失败:', e)
  }
  // 返回默认密钥
  return DEFAULT_API_KEY
}

// 更新API配置（供设置页面调用）
function updateApiConfig(apiKey, appId) {
  console.log('API配置已更新')
}

// ==================== 翻译服务 ====================

/**
 * 使用小牛翻译 API 进行翻译
 * @param {string} text - 要翻译的文本
 * @param {string} from - 源语言 (auto, zh, en)
 * @param {string} to - 目标语言 (zh, en)
 */
function translate(text, from = 'auto', to = 'zh') {
  return new Promise((resolve, reject) => {
    const currentApiKey = getApiKey()

    // 构建请求体
    const postData = new URLSearchParams({
      from: from,
      to: to,
      apikey: currentApiKey,
      src_text: text
    }).toString()

    const urlObj = new URL(API_URL)

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        try {
          const result = JSON.parse(data)

          // 检查是否有错误
          if (result.error_code || result.errorCode) {
            reject({
              success: false,
              error: `翻译失败: ${result.error_msg || result.errorMsg || result.error_code || result.errorCode}`
            })
            return
          }

          resolve({
            success: true,
            translation: result.tgt_text || '',
            dict: [],  // 小牛翻译不返回词典信息
            src: result.from || from
          })
        } catch (e) {
          reject({ success: false, error: '解析翻译结果失败' })
        }
      })
    })

    req.on('error', (e) => {
      reject({ success: false, error: '网络请求失败: ' + e.message })
    })

    req.write(postData)
    req.end()
  })
}

// ==================== 数据库适配器 ====================

/**
 * uTools 数据库适配器
 * 将 uTools 的数据库 API 统一封装
 */
const utoolsDb = {
  allDocs: (prefix) => {
    return window.utools.db.allDocs(prefix)
  },

  get: (id) => {
    return window.utools.db.get(id)
  },

  put: (doc) => {
    return window.utools.db.put(doc)
  },

  remove: (id) => {
    return window.utools.db.remove(id)
  }
}

// ==================== 初始化服务 ====================

function initServices() {
  const core = window.servicesCore

  if (!core) {
    console.error('核心服务模块未加载')
    return
  }

  // 创建服务实例
  const wordService = new core.WordService(utoolsDb)
  const tagService = new core.TagService(utoolsDb, wordService)
  const dataService = new core.DataService(utoolsDb)

  // 导出服务到 window 对象
  window.services = {
    // 核心工具
    ...core,

    // 翻译服务
    translate,
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

  console.log('✅ uTools 服务层已初始化')
}

// 延迟初始化，等待核心模块加载
if (window.servicesCore) {
  initServices()
} else {
  // 如果核心模块还未加载，监听加载事件
  document.addEventListener('servicesCoreReady', initServices)
}
