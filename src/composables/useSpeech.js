/**
 * 发音功能 composable
 * 提供统一的语音合成接口，支持用户自定义配置
 */

import { ref, onUnmounted } from 'vue'

// 存储键名
const STORAGE_KEY_SPEECH_RATE = 'speech_rate'
const STORAGE_KEY_SPEECH_PITCH = 'speech_pitch'

// 默认配置
const DEFAULT_SPEECH_RATE = 0.9
const DEFAULT_SPEECH_PITCH = 1.0

/**
 * 获取发音配置
 * @returns {{ rate: number, pitch: number }}
 */
export function getSpeechConfig() {
  if (typeof window === 'undefined') {
    return { rate: DEFAULT_SPEECH_RATE, pitch: DEFAULT_SPEECH_PITCH }
  }

  let rate = DEFAULT_SPEECH_RATE
  let pitch = DEFAULT_SPEECH_PITCH

  try {
    if (window.utools?.db) {
      const rateDoc = window.utools.db.get(STORAGE_KEY_SPEECH_RATE)
      const pitchDoc = window.utools.db.get(STORAGE_KEY_SPEECH_PITCH)
      rate = rateDoc?.data ?? DEFAULT_SPEECH_RATE
      pitch = pitchDoc?.data ?? DEFAULT_SPEECH_PITCH
    } else {
      // 开发环境使用 localStorage
      rate = parseFloat(localStorage.getItem(STORAGE_KEY_SPEECH_RATE)) || DEFAULT_SPEECH_RATE
      pitch = parseFloat(localStorage.getItem(STORAGE_KEY_SPEECH_PITCH)) || DEFAULT_SPEECH_PITCH
    }
  } catch (e) {
    console.error('获取发音配置失败:', e)
  }

  return { rate, pitch }
}

/**
 * 检测文本语言
 * @param {string} text - 要检测的文本
 * @returns {string} 语言代码 ('zh-CN' 或 'en-US')
 */
export function detectLanguage(text) {
  // 检测是否包含中文字符
  const hasChinese = /[\u4e00-\u9fa5]/.test(text)
  return hasChinese ? 'zh-CN' : 'en-US'
}

/**
 * 朗读文本
 * @param {string} text - 要朗读的文本
 * @param {Object} options - 可选配置
 * @param {number} options.rate - 语速 (0.5-2)
 * @param {number} options.pitch - 音调 (0.5-2)
 * @param {string} options.lang - 语言代码
 * @returns {boolean} 是否成功开始朗读
 */
export function speak(text, options = {}) {
  if (!text || typeof window === 'undefined') {
    return false
  }

  if (!window.speechSynthesis) {
    console.warn('当前环境不支持语音合成')
    return false
  }

  // 取消之前的发音
  window.speechSynthesis.cancel()

  // 获取配置
  const config = getSpeechConfig()
  const rate = options.rate ?? config.rate
  const pitch = options.pitch ?? config.pitch
  const lang = options.lang || detectLanguage(text)

  // 创建语音实例
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = rate
  utterance.pitch = pitch

  // 播放
  window.speechSynthesis.speak(utterance)

  return true
}

/**
 * 使用发音功能的 composable
 * @returns {Object}
 */
export function useSpeech() {
  const isSpeaking = ref(false)
  const currentUtterance = ref(null)

  /**
   * 朗读文本
   * @param {string} text - 要朗读的文本
   * @param {Object} options - 可选配置
   */
  const speakText = (text, options = {}) => {
    if (!text || isSpeaking.value) {
      return false
    }

    if (!window.speechSynthesis) {
      console.warn('当前环境不支持语音合成')
      return false
    }

    // 取消之前的发音
    window.speechSynthesis.cancel()

    // 获取配置
    const config = getSpeechConfig()
    const rate = options.rate ?? config.rate
    const pitch = options.pitch ?? config.pitch
    const lang = options.lang || detectLanguage(text)

    // 创建语音实例
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch

    // 事件监听
    utterance.onstart = () => {
      isSpeaking.value = true
    }

    utterance.onend = () => {
      isSpeaking.value = false
      currentUtterance.value = null
    }

    utterance.onerror = () => {
      isSpeaking.value = false
      currentUtterance.value = null
    }

    currentUtterance.value = utterance
    window.speechSynthesis.speak(utterance)

    return true
  }

  /**
   * 停止朗读
   */
  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
      isSpeaking.value = false
      currentUtterance.value = null
    }
  }

  // 组件卸载时停止朗读
  onUnmounted(() => {
    stopSpeaking()
  })

  return {
    isSpeaking,
    speak: speakText,
    stop: stopSpeaking
  }
}
