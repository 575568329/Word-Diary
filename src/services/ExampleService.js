/**
 * 例句服务
 * 优先使用国内免费API：金山词霸API
 */

export class ExampleService {
  constructor() {
    // 金山词霸API密钥（需要在设置中配置）
    this.icibaApiKey = null

    // 例句缓存
    this.cache = new Map()
    this.cacheExpiry = 24 * 60 * 60 * 1000 // 24小时

    // 加载API配置
    this.loadConfig()
  }

  /**
   * 加载API配置
   */
  async loadConfig() {
    if (window.utools) {
      try {
        const settings = await window.utools.db.get('settings')
        if (settings && settings.icibaApiKey) {
          this.icibaApiKey = settings.icibaApiKey
        }
      } catch (error) {
        console.warn('加载API配置失败:', error)
      }
    }
  }

  /**
   * 获取单词例句
   * @param {string} word - 单词
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 例句列表
   */
  async getExamples(word, options = {}) {
    const { forceRefresh = false, maxResults = 5 } = options

    // 1. 检查缓存
    if (!forceRefresh) {
      const cached = this.getCachedExamples(word)
      if (cached && cached.length > 0) {
        console.log('使用缓存的例句:', word)
        return cached.slice(0, maxResults)
      }
    }

    // 2. 从本地数据库获取用户自定义例句
    const userExamples = await this.getUserExamples(word)

    // 3. 调用金山词霸API
    let apiExamples = []
    if (this.icibaApiKey) {
      try {
        apiExamples = await this.fetchFromICIBA(word)
      } catch (error) {
        console.warn('金山词霸API调用失败:', error)
      }
    }

    // 4. 合并例句（用户例句优先）
    const allExamples = [...userExamples, ...apiExamples]

    // 5. 缓存结果
    if (allExamples.length > 0) {
      this.setCachedExamples(word, allExamples)
    }

    return allExamples.slice(0, maxResults)
  }

  /**
   * 从金山词霸API获取例句
   * @param {string} word - 单词
   * @returns {Promise<Array>} 例句列表
   */
  async fetchFromICIBA(word) {
    if (!this.icibaApiKey) {
      console.warn('未配置金山词霸API密钥')
      return []
    }

    const url = `http://dict-co.iciba.com/api/dictionary.php?w=${encodeURIComponent(word)}&key=${this.icibaApiKey}&type=json`

    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return this.parseICIBAData(data)
    } catch (error) {
      console.error('金山词霸API请求失败:', error)
      throw error
    }
  }

  /**
   * 解析金山词霸API返回的数据
   * @param {Object} data - API返回数据
   * @returns {Array} 例句列表
   */
  parseICIBAData(data) {
    const examples = []

    try {
      if (!data.symbols || !data.symbols[0]) {
        return []
      }

      const symbol = data.symbols[0]

      // 解析例句
      if (symbol.parts) {
        symbol.parts.forEach(part => {
          if (part.part_mean) {
            part.part_mean.forEach(item => {
              if (item.sentences && item.sentences[0]) {
                item.sentences.forEach(sentenceGroup => {
                  if (sentenceGroup.sents) {
                    sentenceGroup.sents.forEach(sent => {
                      examples.push({
                        id: `iciba_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        sentence_en: sent.sent || '',
                        sentence_zh: sent.sent_trans || '',
                        source: 'iciba',
                        audio_url: null,
                        difficulty: this.estimateDifficulty(sent.sent || ''),
                        created_at: Date.now(),
                        is_favorite: false
                      })
                    })
                  }
                })
              }
            })
          }
        })
      }
    } catch (error) {
      console.error('解析金山词霸数据失败:', error)
    }

    return examples
  }

  /**
   * 从本地数据库获取用户自定义例句
   * @param {string} word - 单词
   * @returns {Promise<Array>} 用户例句列表
   */
  async getUserExamples(word) {
    if (!window.utools) {
      return []
    }

    try {
      const wordData = await window.utools.db.get(`word_${word}`)
      if (wordData && wordData.examples) {
        return wordData.examples
          .filter(ex => ex.source === 'user')
          .map(ex => ({
            ...ex,
            is_favorite: ex.is_favorite || false
          }))
      }
    } catch (error) {
      // 单词不存在，返回空数组
    }

    return []
  }

  /**
   * 添加用户自定义例句
   * @param {string} word - 单词
   * @param {string} sentenceEn - 英文例句
   * @param {string} sentenceZh - 中文翻译
   * @returns {Promise<Object>} 添加的例句
   */
  async addUserExample(word, sentenceEn, sentenceZh) {
    if (!window.utools) {
      throw new Error('数据库不可用')
    }

    const example = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sentence_en: sentenceEn,
      sentence_zh: sentenceZh,
      source: 'user',
      audio_url: null,
      difficulty: 3, // 默认中等难度
      created_at: Date.now(),
      is_favorite: false
    }

    try {
      // 获取单词数据
      let wordData
      try {
        wordData = await window.utools.db.get(`word_${word}`)
      } catch (error) {
        // 单词不存在，创建新的
        wordData = {
          _id: `word_${word}`,
          word: word,
          examples: []
        }
      }

      // 初始化examples字段
      if (!wordData.examples) {
        wordData.examples = []
      }

      // 添加例句
      wordData.examples.push(example)

      // 保存到数据库
      await window.utools.db.put(wordData)

      // 清除缓存
      this.clearCache(word)

      return example
    } catch (error) {
      console.error('添加用户例句失败:', error)
      throw error
    }
  }

  /**
   * 删除例句
   * @param {string} word - 单词
   * @param {string} exampleId - 例句ID
   * @returns {Promise<boolean>} 是否成功
   */
  async deleteExample(word, exampleId) {
    if (!window.utools) {
      throw new Error('数据库不可用')
    }

    try {
      const wordData = await window.utools.db.get(`word_${word}`)
      if (!wordData || !wordData.examples) {
        return false
      }

      // 删除例句
      wordData.examples = wordData.examples.filter(ex => ex.id !== exampleId)

      // 保存到数据库
      await window.utools.db.put(wordData)

      // 清除缓存
      this.clearCache(word)

      return true
    } catch (error) {
      console.error('删除例句失败:', error)
      throw error
    }
  }

  /**
   * 切换例句收藏状态
   * @param {string} word - 单词
   * @param {string} exampleId - 例句ID
   * @returns {Promise<boolean>} 新的收藏状态
   */
  async toggleFavorite(word, exampleId) {
    if (!window.utools) {
      throw new Error('数据库不可用')
    }

    try {
      const wordData = await window.utools.db.get(`word_${word}`)
      if (!wordData || !wordData.examples) {
        return false
      }

      // 查找并切换收藏状态
      const example = wordData.examples.find(ex => ex.id === exampleId)
      if (example) {
        example.is_favorite = !example.is_favorite

        // 保存到数据库
        await window.utools.db.put(wordData)

        // 清除缓存
        this.clearCache(word)

        return example.is_favorite
      }

      return false
    } catch (error) {
      console.error('切换收藏状态失败:', error)
      throw error
    }
  }

  /**
   * 获取缓存的例句
   * @param {string} word - 单词
   * @returns {Array|null} 缓存的例句或null
   */
  getCachedExamples(word) {
    const cached = this.cache.get(word)
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.examples
    }
    return null
  }

  /**
   * 设置缓存的例句
   * @param {string} word - 单词
   * @param {Array} examples - 例句列表
   */
  setCachedExamples(word, examples) {
    this.cache.set(word, {
      examples,
      timestamp: Date.now()
    })
  }

  /**
   * 清除指定单词的缓存
   * @param {string} word - 单词
   */
  clearCache(word) {
    this.cache.delete(word)
  }

  /**
   * 清除所有缓存
   */
  clearAllCache() {
    this.cache.clear()
  }

  /**
   * 估算例句难度（基于单词长度和复杂度）
   * @param {string} sentence - 例句
   * @returns {number} 难度等级 1-5
   */
  estimateDifficulty(sentence) {
    if (!sentence) return 3

    const words = sentence.split(/\s+/).filter(w => w.length > 0)
    const avgLength = words.reduce((sum, w) => sum + w.length, 0) / words.length

    // 简单估算：平均单词长度
    if (avgLength < 4) return 1
    if (avgLength < 5) return 2
    if (avgLength < 6) return 3
    if (avgLength < 7) return 4
    return 5
  }
}

// 导出单例
export const exampleService = new ExampleService()
