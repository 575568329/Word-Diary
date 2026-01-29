/**
 * 发音服务
 * 使用浏览器内置Web Speech API
 * 完全免费，无需API密钥
 */

export class PronunciationService {
  constructor() {
    this.voices = []
    this.currentUtterance = null
    this.isInitialized = false

    // 初始化
    this.init()
  }

  /**
   * 初始化服务
   */
  init() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // 加载语音列表
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => {
          this.loadVoices()
        }
      }

      // 立即加载一次
      this.loadVoices()

      this.isInitialized = true
    } else {
      console.warn('浏览器不支持语音合成')
    }
  }

  /**
   * 加载可用语音列表
   */
  loadVoices() {
    this.voices = speechSynthesis.getVoices() || []
    console.log(`已加载 ${this.voices.length} 种语音`)
  }

  /**
   * 检查浏览器支持
   * @returns {boolean} 是否支持
   */
  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window
  }

  /**
   * 播放发音
   * @param {string} text - 要朗读的文本
   * @param {Object} options - 选项
   * @returns {SpeechSynthesisUtterance|null} 语音实例
   */
  speak(text, options = {}) {
    if (!this.isSupported()) {
      throw new Error('浏览器不支持语音合成')
    }

    if (!text || text.trim() === '') {
      throw new Error('朗读文本不能为空')
    }

    // 停止当前播放
    this.stop()

    const {
      lang = 'en-US',  // en-US 美式, en-GB 英式
      rate = 0.9,      // 语速 0.1-10
      pitch = 1,       // 音调 0-2
      volume = 1,      // 音量 0-1
      voice = null,    // 指定语音
      onStart = null,  // 开始回调
      onEnd = null,    // 结束回调
      onError = null   // 错误回调
    } = options

    // 创建语音实例
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    // 选择语音
    if (voice) {
      utterance.voice = this.voices.find(v => v.name === voice) || null
    } else {
      // 自动选择最佳语音
      const bestVoice = this.findBestVoice(lang)
      if (bestVoice) {
        utterance.voice = bestVoice
      }
    }

    // 设置事件回调
    utterance.onstart = () => {
      console.log('开始播放:', text)
      if (onStart) onStart()
    }

    utterance.onend = () => {
      console.log('播放完成:', text)
      this.currentUtterance = null
      if (onEnd) onEnd()
    }

    utterance.onerror = (event) => {
      console.error('播放出错:', event.error)
      this.currentUtterance = null
      if (onError) onError(event.error)
    }

    // 播放
    speechSynthesis.speak(utterance)
    this.currentUtterance = utterance

    return utterance
  }

  /**
   * 查找最佳语音
   * @param {string} lang - 语言代码
   * @returns {SpeechSynthesisVoice|null} 最佳语音
   */
  findBestVoice(lang) {
    // 优先完全匹配
    let voice = this.voices.find(v => v.lang === lang)

    // 如果没有完全匹配，尝试前缀匹配
    if (!voice) {
      const langPrefix = lang.split('-')[0]
      voice = this.voices.find(v => v.lang.startsWith(langPrefix))
    }

    // 如果还是没有，使用第一个可用的英语语音
    if (!voice) {
      voice = this.voices.find(v => v.lang.startsWith('en'))
    }

    return voice || null
  }

  /**
   * 播放单词发音（快捷方法）
   * @param {string} word - 单词
   * @param {string} accent - 口音 'us' | 'uk'
   */
  speakWord(word, accent = 'us') {
    const lang = accent === 'uk' ? 'en-GB' : 'en-US'
    return this.speak(word, { lang })
  }

  /**
   * 播放例句发音
   * @param {string} sentence - 例句
   * @param {Object} options - 选项
   */
  speakSentence(sentence, options = {}) {
    const defaultOptions = {
      lang: 'en-US',
      rate: 0.85,  // 例句稍慢一些
      ...options
    }
    return this.speak(sentence, defaultOptions)
  }

  /**
   * 停止播放
   */
  stop() {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
      this.currentUtterance = null
    }
  }

  /**
   * 暂停播放
   */
  pause() {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause()
    }
  }

  /**
   * 继续播放
   */
  resume() {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
    }
  }

  /**
   * 检查是否正在播放
   * @returns {boolean} 是否正在播放
   */
  isPlaying() {
    return speechSynthesis.speaking && !speechSynthesis.paused
  }

  /**
   * 检查是否已暂停
   * @returns {boolean} 是否已暂停
   */
  isPaused() {
    return speechSynthesis.paused
  }

  /**
   * 获取可用语音列表
   * @param {string} langFilter - 语言过滤器（可选）
   * @returns {Array} 语音列表
   */
  getVoices(langFilter = null) {
    if (langFilter) {
      return this.voices.filter(v => v.lang.startsWith(langFilter))
    }
    return this.voices
  }

  /**
   * 获取英语语音列表
   * @returns {Array} 英语语音列表
   */
  getEnglishVoices() {
    return this.voices
      .filter(v => v.lang.startsWith('en'))
      .map(v => ({
        name: v.name,
        lang: v.lang,
        label: `${v.name} (${v.lang})`
      }))
  }

  /**
   * 测试发音
   * @param {string} text - 测试文本
   * @param {string} voiceName - 语音名称
   */
  testVoice(text, voiceName) {
    const voice = this.voices.find(v => v.name === voiceName)
    if (voice) {
      return this.speak(text, { voice: voiceName, lang: voice.lang })
    }
    throw new Error(`未找到语音: ${voiceName}`)
  }

  /**
   * 设置默认语音
   * @param {string} voiceName - 语音名称
   */
  setDefaultVoice(voiceName) {
    if (window.utools) {
      window.utools.db.put({
        _id: 'settings',
        defaultVoice: voiceName
      }).catch(err => console.warn('保存默认语音失败:', err))
    }
    localStorage.setItem('defaultVoice', voiceName)
  }

  /**
   * 获取默认语音
   * @returns {string|null} 默认语音名称
   */
  async getDefaultVoice() {
    // 优先从数据库读取
    if (window.utools) {
      try {
        const settings = await window.utools.db.get('settings')
        if (settings && settings.defaultVoice) {
          return settings.defaultVoice
        }
      } catch (error) {
        // 继续尝试localStorage
      }
    }

    // 从localStorage读取
    return localStorage.getItem('defaultVoice')
  }

  /**
   * 播放音效（用于答题正确/错误等反馈）
   * @param {string} type - 音效类型 'correct' | 'wrong' | 'complete'
   */
  playSoundEffect(type) {
    const sounds = {
      correct: '✓ Correct!',
      wrong: '✗ Try again',
      complete: '✓ Complete!'
    }

    const soundText = sounds[type]
    if (soundText) {
      this.speak(soundText, { rate: 1.2, volume: 0.7 })
    }
  }

  /**
   * 批量朗读（用于测试或学习）
   * @param {Array<string>} texts - 文本数组
   * @param {number} interval - 间隔时间（毫秒）
   * @param {Object} options - 选项
   */
  async speakBatch(texts, interval = 1000, options = {}) {
    for (let i = 0; i < texts.length; i++) {
      await new Promise((resolve) => {
        const utterance = this.speak(texts[i], {
          ...options,
          onEnd: () => {
            setTimeout(resolve, interval)
          },
          onError: () => {
            setTimeout(resolve, interval)
          }
        })
      })
    }
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.stop()
    this.voices = []
    this.currentUtterance = null
    this.isInitialized = false
  }
}

// 导出单例
export const pronunciationService = new PronunciationService()
