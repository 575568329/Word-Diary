/**
 * uTools 环境服务层
 * 使用核心服务逻辑 + uTools 数据库实现
 */

const https = require('https')

// ==================== 导入核心服务 ====================
// 在 uTools 环境中，我们需要动态导入核心服务
// 由于是 CommonJS 环境，这里会通过 utools 动态注入

// ==================== 翻译配置 ====================

// LibreTranslate API（默认）
const LIBRETRANSLATE_API = 'https://libretranslate.com/translate'

// 小牛翻译 API（可选）
const NIUTRANS_API = 'https://api.niutrans.com/NiuTransServer/translation'
const NIUTRANS_DEFAULT_API_KEY = '5e690ed1f4cbdb16d88a3f6a07e9f185' // 默认共享密钥

const { STORAGE_KEYS } = window.servicesCore || {}

// 获取用户配置的小牛翻译密钥
function getNiuTransApiKey() {
  try {
    if (window.utools?.db && window.servicesCore?.STORAGE_KEYS) {
      const doc = window.utools.db.get(window.servicesCore.STORAGE_KEYS.API_KEY)
      return doc?.data || null
    }
  } catch (e) {
    console.error('获取小牛翻译API密钥失败:', e)
  }
  return null
}

// 更新API配置（供设置页面调用）
function updateApiConfig(apiKey, appId) {
  console.log('API配置已更新')
}

// ==================== LibreTranslate 翻译服务 ====================

/**
 * 使用 LibreTranslate API 进行翻译（默认）
 * @param {string} text - 要翻译的文本
 * @param {string} from - 源语言 (en, zh)
 * @param {string} to - 目标语言 (zh, en)
 */
function translateWithLibre(text, from, to) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      q: text,
      source: from,
      target: to,
      format: 'text'
    })

    const urlObj = new URL(LIBRETRANSLATE_API)

    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
          if (result.error) {
            reject({
              success: false,
              error: `翻译失败: ${result.error}`
            })
            return
          }

          resolve({
            success: true,
            translation: result.translatedText || '',
            dict: [],
            src: from
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

// ==================== 小牛翻译服务 ====================

/**
 * 使用小牛翻译 API 进行翻译（可选）
 * @param {string} text - 要翻译的文本
 * @param {string} from - 源语言 (auto, zh, en)
 * @param {string} to - 目标语言 (zh, en)
 * @param {string} apiKey - API密钥
 */
function translateWithNiuTrans(text, from, to, apiKey) {
  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      from: from,
      to: to,
      apikey: apiKey,
      src_text: text
    }).toString()

    const urlObj = new URL(NIUTRANS_API)

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
            dict: [],
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

// ==================== 统一翻译接口 ====================

/**
 * 翻译服务（自动选择 API）
 * 优先使用用户配置的小牛翻译，如果未配置则使用 LibreTranslate
 * @param {string} text - 要翻译的文本
 * @param {string} from - 源语言 (auto, zh, en)
 * @param {string} to - 目标语言 (zh, en)
 */
function translate(text, from = 'auto', to = 'zh') {
  // 检查用户是否配置了小牛翻译的 API key
  const niuTransApiKey = getNiuTransApiKey()

  if (niuTransApiKey && niuTransApiKey.trim()) {
    // 使用小牛翻译
    console.log('使用小牛翻译 API')
    return translateWithNiuTrans(text, from, to, niuTransApiKey.trim())
  } else {
    // 使用 LibreTranslate（默认）
    // LibreTranslate 不支持 auto，需要检测语言
    let detectFrom = from
    if (from === 'auto') {
      // 简单检测：如果是中文则从 zh 翻译，否则从 en 翻译
      detectFrom = /[\u4e00-\u9fa5]/.test(text) ? 'zh' : 'en'
    }

    console.log('使用 LibreTranslate API')
    return translateWithLibre(text, detectFrom, to)
  }
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
