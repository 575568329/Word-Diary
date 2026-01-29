/**
 * 翻译服务
 * 优先使用国内免费API：腾讯翻译API + 百度翻译API
 *
 * 免费额度：
 * - 腾讯翻译：500万字符/月
 * - 百度翻译：100万字符/月
 */

import CryptoJS from 'crypto-js'

export class TranslationService {
  constructor() {
    // API配置
    this.config = {
      tencent: {
        secretId: null,
        secretKey: null,
        region: 'ap-guangzhou',
        endpoint: 'tmt.tencentcloudapi.com'
      },
      baidu: {
        appId: null,
        secretKey: null
      }
    }

    // 使用计数器（用于切换API）
    this.tencentUsage = 0
    this.baiduUsage = 0
    this.tencentLimit = 5000000  // 500万字符/月
    this.baiduLimit = 1000000    // 100万字符/月

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
        if (settings) {
          if (settings.tencentSecretId) {
            this.config.tencent.secretId = settings.tencentSecretId
          }
          if (settings.tencentSecretKey) {
            this.config.tencent.secretKey = settings.tencentSecretKey
          }
          if (settings.baiduAppId) {
            this.config.baidu.appId = settings.baiduAppId
          }
          if (settings.baiduSecretKey) {
            this.config.baidu.secretKey = settings.baiduSecretKey
          }
        }
      } catch (error) {
        console.warn('加载API配置失败:', error)
      }
    }
  }

  /**
   * 智能翻译（自动选择API）
   * @param {string} text - 要翻译的文本
   * @param {string} from - 源语言
   * @param {string} to - 目标语言
   * @returns {Promise<Object>} 翻译结果
   */
  async translate(text, from = 'auto', to = 'zh') {
    if (!text || text.trim() === '') {
      throw new Error('翻译文本不能为空')
    }

    const textLength = text.length

    // 1. 优先使用腾讯翻译（500万字符/月）
    if (this.config.tencent.secretId && this.config.tencent.secretKey) {
      if (this.tencentUsage + textLength < this.tencentLimit) {
        try {
          const result = await this.translateWithTencent(text, from, to)
          this.tencentUsage += textLength
          return result
        } catch (error) {
          console.warn('腾讯翻译失败，尝试百度翻译:', error.message)
        }
      }
    }

    // 2. 备用百度翻译（100万字符/月）
    if (this.config.baidu.appId && this.config.baidu.secretKey) {
      if (this.baiduUsage + textLength < this.baiduLimit) {
        try {
          const result = await this.translateWithBaidu(text, from, to)
          this.baiduUsage += textLength
          return result
        } catch (error) {
          console.error('百度翻译失败:', error.message)
        }
      }
    }

    throw new Error('所有翻译API均不可用或配额已用完')
  }

  /**
   * 腾讯云翻译实现
   * @param {string} text - 要翻译的文本
   * @param {string} from - 源语言
   * @param {string} to - 目标语言
   * @returns {Promise<Object>} 翻译结果
   */
  async translateWithTencent(text, from, to) {
    const service = 'tmt'
    const version = '2018-03-21'
    const action = 'TextTranslate'
    const timestamp = Math.floor(Date.now() / 1000)

    // 构造请求参数
    const params = {
      SourceText: text,
      Source: from === 'auto' ? 'auto' : from,
      Target: to,
      ProjectId: 0
    }

    try {
      // 生成签名
      const authorization = this.generateTencentAuthorization(
        service,
        action,
        version,
        timestamp,
        JSON.stringify(params)
      )

      // 发送请求
      const response = await fetch(`https://${this.config.tencent.endpoint}/`, {
        method: 'POST',
        headers: {
          'Authorization': authorization,
          'Content-Type': 'application/json',
          'Host': this.config.tencent.endpoint,
          'X-TC-Action': action,
          'X-TC-Timestamp': timestamp.toString(),
          'X-TC-Version': version,
          'X-TC-Region': this.config.tencent.region
        },
        body: JSON.stringify(params)
      })

      const data = await response.json()

      if (data.Response.Error) {
        throw new Error(data.Response.Error.Message)
      }

      return {
        text: data.Response.TargetText,
        source: data.Response.Source || from,
        target: to,
        provider: 'tencent'
      }
    } catch (error) {
      console.error('腾讯翻译请求失败:', error)
      throw error
    }
  }

  /**
   * 生成腾讯云API签名
   * 使用TC3-HMAC-SHA256签名算法
   */
  generateTencentAuthorization(service, action, version, timestamp, payload) {
    const secretId = this.config.tencent.secretId
    const secretKey = this.config.tencent.secretKey

    // 1. 构造规范请求串
    const httpRequestMethod = 'POST'
    const canonicalUri = '/'
    const canonicalQueryString = ''
    const canonicalHeaders = `content-type:application/json\nhost:${this.config.tencent.endpoint}\n`
    const signedHeaders = 'content-type;host'
    const hashedRequestPayload = CryptoJS.SHA256(payload).toString(CryptoJS.enc.Hex)
    const canonicalRequest = `${httpRequestMethod}\n${canonicalUri}\n${canonicalQueryString}\n${canonicalHeaders}\n${signedHeaders}\n${hashedRequestPayload}`

    // 2. 构造待签名字符串
    const algorithm = 'TC3-HMAC-SHA256'
    const currentDate = this.formatDate(timestamp)
    const credentialScope = `${currentDate}/${service}/tc3_request`
    const hashedCanonicalRequest = CryptoJS.SHA256(canonicalRequest).toString(CryptoJS.enc.Hex)
    const stringToSign = `${algorithm}\n${timestamp}\n${credentialScope}\n${hashedCanonicalRequest}`

    // 3. 计算签名
    const secretDate = CryptoJS.HmacSHA256(currentDate, 'TC3' + secretKey).toString()
    const secretService = CryptoJS.HmacSHA256(service, CryptoJS.enc.Hex.parse(secretDate)).toString()
    const secretSigning = CryptoJS.HmacSHA256('tc3_request', CryptoJS.enc.Hex.parse(secretService)).toString()
    const signature = CryptoJS.HmacSHA256(stringToSign, CryptoJS.enc.Hex.parse(secretSigning)).toString(CryptoJS.enc.Hex)

    // 4. 构造Authorization
    const authorization = `${algorithm} Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

    return authorization
  }

  /**
   * 格式化日期为UTC格式
   */
  formatDate(timestamp) {
    const date = new Date(timestamp * 1000)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * 百度翻译实现
   * @param {string} text - 要翻译的文本
   * @param {string} from - 源语言
   * @param {string} to - 目标语言
   * @returns {Promise<Object>} 翻译结果
   */
  async translateWithBaidu(text, from, to) {
    const appId = this.config.baidu.appId
    const key = this.config.baidu.secretKey
    const salt = Date.now()

    // 生成签名
    const signStr = appId + text + salt + key
    const sign = CryptoJS.MD5(signStr).toString()

    const params = new URLSearchParams({
      q: text,
      from: from,
      to: to,
      appid: appId,
      salt: salt,
      sign: sign
    })

    try {
      const response = await fetch(
        `https://fanyi-api.baidu.com/api/trans/vip/translate?${params}`
      )

      const data = await response.json()

      if (data.error_code) {
        throw new Error(`百度翻译错误 (${data.error_code}): ${data.error_msg}`)
      }

      return {
        text: data.trans_result[0].dst,
        source: data.from,
        target: data.to,
        provider: 'baidu'
      }
    } catch (error) {
      console.error('百度翻译请求失败:', error)
      throw error
    }
  }

  /**
   * 批量翻译
   * @param {Array<string>} texts - 文本数组
   * @param {string} from - 源语言
   * @param {string} to - 目标语言
   * @returns {Promise<Array<Object>>} 翻译结果数组
   */
  async batchTranslate(texts, from = 'auto', to = 'zh') {
    const results = []

    for (const text of texts) {
      try {
        const result = await this.translate(text, from, to)
        results.push({
          original: text,
          translated: result.text,
          success: true
        })
      } catch (error) {
        results.push({
          original: text,
          error: error.message,
          success: false
        })
      }
    }

    return results
  }

  /**
   * 检测语言
   * @param {string} text - 文本
   * @returns {Promise<string>} 检测到的语言代码
   */
  async detectLanguage(text) {
    // 简单实现：调用翻译API并返回检测到的语言
    try {
      const result = await this.translate(text, 'auto', 'zh')
      return result.source
    } catch (error) {
      // 如果API失败，使用简单规则检测
      return this.simpleDetect(text)
    }
  }

  /**
   * 简单语言检测（备用方案）
   * @param {string} text - 文本
   * @returns {string} 语言代码
   */
  simpleDetect(text) {
    // 检测是否包含中文字符
    const chineseRegex = /[\u4e00-\u9fa5]/
    if (chineseRegex.test(text)) {
      return 'zh'
    }

    // 默认为英语
    return 'en'
  }

  /**
   * 获取使用统计
   * @returns {Object} 使用统计信息
   */
  getUsageStats() {
    return {
      tencent: {
        used: this.tencentUsage,
        limit: this.tencentLimit,
        remaining: this.tencentLimit - this.tencentUsage,
        percentage: (this.tencentUsage / this.tencentLimit * 100).toFixed(2)
      },
      baidu: {
        used: this.baiduUsage,
        limit: this.baiduLimit,
        remaining: this.baiduLimit - this.baiduUsage,
        percentage: (this.baiduUsage / this.baiduLimit * 100).toFixed(2)
      }
    }
  }

  /**
   * 重置使用计数（仅用于测试或新月份开始）
   */
  resetUsage() {
    this.tencentUsage = 0
    this.baiduUsage = 0
  }
}

// 导出单例
export const translationService = new TranslationService()
