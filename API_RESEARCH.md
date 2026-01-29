# 第三方API调研报告

> 单词日记项目 - 功能升级所需API
> 更新时间：2026-01-29

---

## 📊 API总览对比（优先国内免费API）

| API名称 | 类型 | 免费额度 | 价格 | 推荐度 | 国内 |
|--------|------|---------|------|--------|------|
| **腾讯翻译API** | 翻译 | 500万字符/月 | 按量付费 | ⭐⭐⭐⭐⭐ | ✅ |
| **百度翻译API** | 翻译 | 100万字符/月 | ¥48/百万字符 | ⭐⭐⭐⭐⭐ | ✅ |
| **金山词霸API** | 词典+例句 | 免费使用 | 需申请 | ⭐⭐⭐⭐ | ✅ |
| **有道翻译API** | 翻译 | 50元体验金 | ¥48/百万字符 | ⭐⭐⭐⭐ | ✅ |
| **浏览器TTS** | 发音 | 完全免费 | 免费 | ⭐⭐⭐⭐ | ✅ |
| **Free Dictionary API** | 例句 | 无限免费 | 完全免费 | ⭐⭐⭐ | ❌ |
| **Wordnik API** | 例句 | 限制较多 | $询问 | ⭐⭐ | ❌ |
| **Forvo API** | 发音 | 500次/天免费 | $2+/月起 | ⭐⭐ | ❌ |
| **Tatoeba** | 例句 | 完全免费 | 免费 | ⭐⭐⭐ | ❌ |

---

## 🌟 一、例句API（高优先级）

### 1. Free Dictionary API ⭐⭐⭐⭐⭐

**官方网站**: https://dictionaryapi.dev/

**API文档**: https://dictionaryapi.dev/api/v2/

**申请方式**:
- ✅ 无需注册，直接使用
- ✅ 无需API密钥
- ✅ 完全免费，无限次调用

**免费额度**:
- ✅ **无限次**调用
- ✅ 无速率限制
- ✅ 永久免费

**API示例**:
```
GET https://api.dictionaryapi.dev/api/v2/entries/en/hello
```

**返回数据**:
```json
{
  "word": "hello",
  "meanings": ["used as a greeting"],
  "pronunciations": {
    "text": "həˈloʊ",
    "audio": "https://..."
  },
  "examples": [
    {
      "definition": "Used as a greeting",
      "example": "hello world"
    }
  ]
}
```

**优点**:
- 🎁 完全免费
- 🚀 无需注册
- 📖 包含定义、音标、例句、发音
- 🔄 稳定可靠
- 📚 基于开源数据

**缺点**:
- ⚠️ 例句数量相对较少
- ⚠️ 功能相对简单

**推荐使用场景**:
- MVP快速开发
- 个人项目
- 初创应用

---

### 2. Wordnik API ⭐⭐⭐⭐

**官方网站**: https://developer.wordnik.com/

**申请地址**: https://developer.wordnik.com/

**免费额度**:
- 📊 超过1000万个单词的真实例句
- 🔊 提供音频发音
- ⚠️ 需要API密钥

**申请流程**:
1. 注册开发者账号
2. 创建应用获取API密钥
3. 查看文档和示例

**价格**: 需联系商务

**优点**:
- 📚 例句资源丰富
- 🔊 音频发音质量高
- 🌍 支持多语言

**缺点**:
- 💰 需要付费
- ⚠️ 免费额度有限

---

### 3. Tatoeba ⭐⭐⭐⭐⭐

**官方网站**: https://tatoeba.org/

**数据导出**: https://tatoeba.org/downloads

**使用方式**:
- ✅ 完全免费，API未公开但可下载完整数据集
- ✅ 提供600万+例句
- ✅ 支持多语言

**推荐使用方式**:
```
// 1. 下载完整数据集
// 2. 导入到本地数据库
// 3. 实现本地查询API
```

**数据集详情**:
- 📦 CSV格式
- 🌍 英语-中文对译
- 🏷️ 包含用户评分和质量标记
- 📄 定期更新

**优点**:
- 🎁 完全免费
- 📚 例句质量高
- 🌍 多语言支持
- 🔄 持续更新

**缺点**:
- 💾 需要自己搭建服务器
- ⚙️ 需要定期更新数据

---

## 🔤 二、翻译API（必需）

### 1. 百度翻译API ⭐⭐⭐⭐

**官方平台**: https://api.fanyi.baidu.com/api/trans

**文档地址**: [百度翻译开放平台](https://api.fanyi.baidu.com/api/trans)

**申请流程**:
1. 注册百度翻译开放平台账号
2. 创建应用
3. 获取API Key
4. 实名认证（个人或企业）

**免费额度**:
- 🎁 **100万字符/月**（需个人认证）
- 📊 标准版: 5万字符/月
- 🏢 企业版: 100万字符/月

**价格**:
- 💰 **¥48元/百万字符**（按量付费）
- 资源包更优惠

**API地址**:
```
https://fanyi-api.baidu.com/api/trans/vip/translate
```

**优点**:
- ✅ 免费额度最高
- ✅ 中文翻译质量好
- ✅ 稳定可靠
- ✅ 文档完善

**缺点**:
- ⚠️ 需要实名认证
- ⚠️ 超额后收费较高

---

### 2. 腾讯翻译API ⭐⭐⭐⭐

**官方平台**: https://cloud.tencent.com/product/tmt

**文档地址**: [腾讯云机器翻译](https://cloud.tencent.com/document/product/277)

**免费额度**:
- 🎁 **500万字符/月**（最慷慨）
- ⚠️ 注意：腾讯翻译君API将于2025年4月15日关闭
- 🔗 需迁移到腾讯云机器翻译

**申请流程**:
1. 注册腾讯云账号
2. 开通机器翻译服务
3. 获取API密钥
4. 配置调用限额

**价格**:
- 💰 后付费按量计费
- 📦 支持资源包购买

**API地址**:
```
https://tmt.tencent-cloudapi.com/v3/tmt
```

**优点**:
- ✅ 免费额度最高
- ✅ 翻译质量好
- ✅ 服务稳定

**缺点**:
- ⚠️ 旧API即将关闭
- ⚠️ 需要云服务知识

---

### 3. 有道翻译API ⭐⭐⭐

**官方平台**: https://ai.youdao.com/

**文档地址**: [自然语言翻译服务](https://ai.youdao.com/DOCSIRMA/html/transapi/trans/price/dmxfy/index.html)

**免费体验**:
- 🎁 **50元体验金**（注册时赠送）
- 📊 新用户每月100万字符额度
- 💰 可翻译200万+字符

**价格**:
- 💰 **¥48元/百万字符**（按量付费）
- 📦 资源包：
  - 1000万tokens: ¥285
  - 5000万tokens: ¥1350
  - 1亿tokens: ¥2550

**API地址**:
```
https://openapi.youdao.com/api
```

**优点**:
- ✅ 提供体验金
- ✅ 翻译质量高
- ✅ 支持多语言

**缺点**:
- ⚠️ 免费额度用完需付费

---

### 4. 金山词霸API ⭐⭐⭐

**官方平台**: https://open.iciba.com/

**文档地址**: [金山词霸开放平台](https://open.iciba.com/)

**申请方式**:
1. 访问 http://open.iciba.com/
2. 填写申请表
3. 等待审核
4. 获取API密钥

**免费额度**:
- ✅ 免费使用（有调用限制）
- ⚠️ 具体限制需查看官方文档

**API地址**:
```
http://dict-co.iciba.com/api/dictionary.php?w={word}&key={key}
```

**优点**:
- ✅ 提供音标、例句
- ✅ 支持多语言
- ✅ 数据权威（整合牛津词典）

**缺点**:
- ⚠️ API较老
- ⚠️ 文档不够完善

---

## 🔊 三、发音API（推荐使用浏览器内置）

### 1. 浏览器内置TTS ⭐⭐⭐⭐⭐（强烈推荐）

**API类型**: Web Speech API

**官方文档**: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

**申请方式**:
- ✅ 无需注册
- ✅ 无需API密钥
- ✅ 完全免费
- ✅ 所有现代浏览器支持

**免费额度**:
- ✅ **无限次**调用
- ✅ 无速率限制
- ✅ 永久免费
- ✅ 支持多种语音

**使用示例**:
```javascript
// 播放单词发音
function speakWord(word, lang = 'en-US') {
  // 检查浏览器支持
  if (!('speechSynthesis' in window)) {
    console.error('浏览器不支持语音合成')
    return
  }

  // 创建语音实例
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = lang
  utterance.rate = 0.9  // 语速（0.1-10）
  utterance.pitch = 1   // 音调（0-2）
  utterance.volume = 1  // 音量（0-1）

  // 选择英语语音
  const voices = speechSynthesis.getVoices()
  const enVoice = voices.find(v => v.lang.startsWith('en'))
  if (enVoice) {
    utterance.voice = enVoice
  }

  // 播放
  speechSynthesis.speak(utterance)
}

// 使用示例
speakWord('hello')  // 美式英语
speakWord('hello', 'en-GB')  // 英式英语
```

**优点**:
- 🎁 完全免费
- 🚀 无需注册
- 📱 所有浏览器支持
- 🔄 稳定可靠
- 🌍 支持多种语言
- ⚡️ 响应速度快
- 🔊 发音质量不错

**缺点**:
- ⚠️ 发音为机器合成（非真人）
- ⚠️ 不同浏览器声音不同
- ⚠️ 需要用户交互才能播放

**适用场景**:
- MVP快速开发
- 个人项目
- 成本敏感项目
- 对发音要求不极高的场景

---

### 2. Forvo API ⭐⭐（备用方案）

**官方网站**: https://forvo.com/
**API文档**: https://api.forvo.com/

**定价方案**:

| 方案 | 每日请求 | 商业使用 | 归属要求 | 价格 |
|------|---------|---------|---------|------|
| Non-Profit | 500次 | 不允许 | Forvo | $2/月 |
| Small Business | 10,000次 | 允许 | Forvo | $28.95/月 |
| Corporate | 100,000次 | 不要求归属 | 是 | 联系 |

**申请方式**:
1. 访问 https://api.forvo.com/
2. 注册账号
3. 选择合适的计划
4. 获取API密钥

**优点**:
- 🔊 真人发音（非TTS）
- 🌍 200+语言
- 📚 400万+单词

**缺点**:
- 💰 付费服务
- ⚠️ 免费版限制严格

---

## 💡 推荐方案（优先国内免费API）

### 方案A：国内纯免费方案 ⭐⭐⭐⭐⭐（强烈推荐）

```
翻译API: 腾讯翻译API（500万字符/月免费）
例句API: 金山词霸API（免费，含例句）
发音API: 浏览器内置TTS（免费）
备用翻译: 百度翻译API（100万字符/月免费）
```

**优点**:
- 💰 完全免费
- 🇨🇳 全部国内API，速度快
- ✅ 免费额度充足（500万+100万字符/月）
- 🚀 无需复杂申请
- 📱 稳定可靠

**适用场景**:
- 个人学习项目
- MVP开发
- 初创应用
- 中小型应用

**注意**: 腾讯翻译君API将于2025年4月15日关闭，需迁移到腾讯云机器翻译

---

### 方案B：国内增强方案

```
翻译API: 百度翻译API（100万字符/月）+ 腾讯翻译API（500万字符/月）
例句API: 金山词霸API + 有道词典API
发音API: 浏览器TTS + 有道TTS
```

**成本**:
- 💰 完全免费
- ⭐ 性价比最高
- 🔄 多API备份

**适用场景**:
- 中小型应用
- 需要高可用性
- 用户量<5000

---

### 方案C：混合方案（国内外结合）

```
主要翻译: 腾讯翻译API（500万字符/月）
备用翻译: 百度翻译API（100万字符/月）
例句API: 金山词霸API（主要）+ Free Dictionary API（备用）
发音API: 浏览器TTS
```

**成本**:
- 💰 完全免费
- 🌍 国内外API互备
- ✅ 功能最完整

**适用场景**:
- 追求高质量
- 需要海外用户
- 大型应用

---

## 📝 快速开始（国内免费API）

### 1. 腾讯翻译API申请步骤（推荐）

**优势**: 500万字符/月免费额度

**申请流程**:
1. 访问: https://cloud.tencent.com/product/tmt
2. 注册腾讯云账号
3. 实名认证（个人或企业）
4. 开通机器翻译服务
5. 获取SecretId和SecretKey
6. 开始使用

**API调用示例**:
```javascript
// 使用腾讯翻译API
async function translateWithTencent(text, from = 'auto', to = 'zh') {
  const apiUrl = 'https://tmt.tencentcloudapi.com/v3/tmt'

  // 需要实现腾讯云签名算法
  const params = {
    Action: 'TextTranslate',
    Version: '2018-03-21',
    Region: 'ap-guangzhou',
    SourceText: text,
    Source: from,
    Target: to,
    ProjectId: 0,
    SecretId: 'YOUR_SECRET_ID',
    Timestamp: Math.floor(Date.now() / 1000),
    Nonce: Math.random().toString(36).substr(2)
  }

  // 实现签名（参考腾讯云文档）
  const signature = generateTencentSignature(params)
  params.Signature = signature

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(params)
  })

  return await response.json()
}
```

---

### 2. 百度翻译API申请步骤（备用）

**优势**: 100万字符/月免费额度

**申请流程**:
1. 访问: https://api.fanyi.baidu.com/api/trans
2. 注册并登录
3. 实名认证（个人）
4. 创建应用
5. 获取AppID和密钥
6. 开始使用

**API调用示例**:
```javascript
// 使用百度翻译API
async function translateWithBaidu(text, from, to) {
  const apiUrl = 'https://fanyi-api.baidu.com/api/trans/vip/translate'
  const appid = 'YOUR_APP_ID'
  const key = 'YOUR_SECRET_KEY'
  const salt = Date.now()

  // 生成签名
  const sign = generateBaiduSign(text, appid, salt, key)

  const params = new URLSearchParams({
    q: text,
    from: from,
    to: to,
    appid: appid,
    salt: salt,
    sign: sign
  })

  const response = await fetch(`${apiUrl}?${params}`)
  return await response.json()
}

// 百度API签名算法
function generateBaiduSign(query, appid, salt, key) {
  const str = appid + query + salt + key
  return CryptoJS.MD5(str).toString()
}
```

---

### 3. 金山词霸API申请步骤（例句）

**优势**: 免费使用，包含例句和音标

**申请流程**:
1. 访问: http://open.iciba.com/
2. 填写申请表
3. 等待审核（通常1-3天）
4. 获取API密钥
5. 开始使用

**API调用示例**:
```javascript
// 获取单词详情（含例句）
async function getWordDetails(word) {
  const apiKey = 'YOUR_ICIBA_KEY'
  const apiUrl = `http://dict-co.iciba.com/api/dictionary.php?w=${word}&key=${apiKey}&type=json`

  const response = await fetch(apiUrl)
  const data = await response.json()

  return {
    word: data.word_name,
    symbols: data.symbols?.map(symbol => ({
      phonetic: symbol.phonetic,
      parts: symbol.parts?.map(part => ({
        part: part.part_name,
        means: part.means?.map(m => m.word_mean)
      }))
    })),
    examples: data.symbols?.[0]?.parts?.flatMap(p =>
      p.part_mean?.map(m => ({
        en: m?.sentences?.[0]?.sents?.[0]?.sent,
        zh: m?.sentences?.[0]?.sents?.[0]?.sent_trans
      }))
    ).filter(Boolean)
  }
}
```

---

### 4. 浏览器TTS使用（发音）

**无需申请API，直接使用**

```javascript
// 播放单词发音
function playPronunciation(word, options = {}) {
  const {
    lang = 'en-US',  // en-US 美式, en-GB 英式
    rate = 0.9,      // 语速 0.1-10
    pitch = 1,       // 音调 0-2
    volume = 1       // 音量 0-1
  } = options

  // 检查支持
  if (!('speechSynthesis' in window)) {
    console.error('浏览器不支持语音合成')
    return
  }

  // 停止当前播放
  speechSynthesis.cancel()

  // 创建语音
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = lang
  utterance.rate = rate
  utterance.pitch = pitch
  utterance.volume = volume

  // 选择最佳语音
  const voices = speechSynthesis.getVoices()
  const bestVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]))
  if (bestVoice) utterance.voice = bestVoice

  // 播放
  speechSynthesis.speak(utterance)
}

// 使用示例
playPronunciation('hello', { lang: 'en-US' })
```

---

## ⚠️ 重要提醒

### 腾讯翻译API迁移
- ⚠️ **2025年4月15日**腾讯翻译君API关闭
- 🔗 必须迁移到腾讯云机器翻译
- 📧 咨询: AIcloud_Business@corp.youdao.com

### API密钥管理
```javascript
// 安全存储API密钥
const API_KEYS = {
  BAIDU: process.env.BAIDU_TRANSLATE_KEY,
  TENCENT: process.env.TENCENT_TRANSLATE_KEY,
  YOUDAO: process.env.YOUDAO_TRANSLATE_KEY
}
```

### 速率限制处理
```javascript
class RateLimiter {
  constructor(maxRequests, perMinutes) {
    this.maxRequests = maxRequests
    this.perMinutes = perMinutes
    this.requests = []
  }

  async checkLimit() {
    const now = Date.now()
    const oneMinuteAgo = now - 60000

    // 清除旧记录
    this.requests = this.requests.filter(r => r > oneMinuteAgo)

    // 检查限制
    if (this.requests.length >= this.maxRequests) {
      throw new Error('超过速率限制')
    }

    // 记录本次请求
    this.requests.push(now)
  }
}
```

---

## 🇨🇳 国内免费API完整实现方案

### 方案架构

```
单词翻译
├─ 主要: 腾讯翻译API（500万字符/月）
└─ 备份: 百度翻译API（100万字符/月）

单词例句
├─ 主要: 金山词霸API（免费）
└─ 备份: 有道词典API（体验金）

单词发音
└─ 浏览器TTS（完全免费）
```

### 实现代码

```javascript
// src/services/TranslationService.js
export class TranslationService {
  constructor() {
    // API配置
    this.config = {
      tencent: {
        secretId: process.env.VUE_APP_TENCENT_SECRET_ID,
        secretKey: process.env.VUE_APP_TENCENT_SECRET_KEY,
        region: 'ap-guangzhou'
      },
      baidu: {
        appId: process.env.VUE_APP_BAIDU_APP_ID,
        secretKey: process.env.VUE_APP_BAIDU_SECRET_KEY
      }
    }

    // 使用计数器（用于切换API）
    this.tencentUsage = 0
    this.baiduUsage = 0
    this.tencentLimit = 5000000  // 500万字符
    this.baiduLimit = 1000000    // 100万字符
  }

  // 智能翻译（自动选择API）
  async translate(text, from = 'auto', to = 'zh') {
    const textLength = text.length

    // 优先使用腾讯翻译
    if (this.tencentUsage + textLength < this.tencentLimit) {
      try {
        const result = await this.translateWithTencent(text, from, to)
        this.tencentUsage += textLength
        return result
      } catch (error) {
        console.warn('腾讯翻译失败，切换到百度', error)
      }
    }

    // 备用百度翻译
    if (this.baiduUsage + textLength < this.baiduLimit) {
      try {
        const result = await this.translateWithBaidu(text, from, to)
        this.baiduUsage += textLength
        return result
      } catch (error) {
        console.error('百度翻译失败', error)
      }
    }

    throw new Error('所有翻译API配额已用完')
  }

  // 腾讯翻译实现
  async translateWithTencent(text, from, to) {
    const params = {
      Action: 'TextTranslate',
      Version: '2018-03-21',
      Region: this.config.tencent.region,
      SourceText: text,
      Source: from,
      Target: to,
      ProjectId: 0
    }

    // 实现腾讯云签名（需要TC3-HMAC-SHA256算法）
    const signature = this.generateTencentSignature(params)

    const response = await fetch('https://tmt.tencentcloudapi.com/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': signature
      },
      body: new URLSearchParams(params)
    })

    const data = await response.json()

    if (data.Response.Error) {
      throw new Error(data.Response.Error.Message)
    }

    return {
      text: data.Response.TargetText,
      source: data.Response.Source,
      target: to
    }
  }

  // 百度翻译实现
  async translateWithBaidu(text, from, to) {
    const appId = this.config.baidu.appId
    const key = this.config.baidu.secretKey
    const salt = Date.now()

    // MD5签名
    const signStr = appId + text + salt + key
    const sign = this.md5(signStr)

    const params = new URLSearchParams({
      q: text,
      from: from,
      to: to,
      appid: appId,
      salt: salt,
      sign: sign
    })

    const response = await fetch(
      `https://fanyi-api.baidu.com/api/trans/vip/translate?${params}`
    )

    const data = await response.json()

    if (data.error_code) {
      throw new Error(data.error_msg)
    }

    return {
      text: data.trans_result[0].dst,
      source: data.from,
      target: data.to
    }
  }

  // 辅助方法：MD5
  md5(string) {
    // 使用crypto-js或其他MD5库
    return CryptoJS.MD5(string).toString()
  }
}

// 导出单例
export const translationService = new TranslationService()
```

```javascript
// src/services/ExampleService.js
export class ExampleService {
  constructor() {
    this.icibaApiKey = process.env.VUE_APP_ICIBA_API_KEY
    this.youdaoApiKey = process.env.VUE_APP_YOUDAO_API_KEY
  }

  // 获取单词例句
  async getExamples(word) {
    try {
      // 优先使用金山词霸
      return await this.fetchFromICIBA(word)
    } catch (error) {
      console.warn('金山词霸失败，尝试有道', error)
      return await this.fetchFromYoudao(word)
    }
  }

  // 金山词霸API
  async fetchFromICIBA(word) {
    const url = `http://dict-co.iciba.com/api/dictionary.php?w=${word}&key=${this.icibaApiKey}&type=json`

    const response = await fetch(url)
    const data = await response.json()

    // 提取例句
    const examples = []
    if (data.symbols && data.symbols[0]) {
      const symbol = data.symbols[0]
      if (symbol.parts) {
        symbol.parts.forEach(part => {
          if (part.part_mean) {
            part.part_mean.forEach(item => {
              if (item.sentences) {
                item.sentences.forEach(sentence => {
                  if (sentence.sents) {
                    sentence.sents.forEach(sent => {
                      examples.push({
                        en: sent.sent,
                        zh: sent.sent_trans
                      })
                    })
                  }
                })
              }
            })
          }
        })
      }
    }

    return examples
  }

  // 有道词典API（备用）
  async fetchFromYoudao(word) {
    const url = `https://openapi.youdao.com/api`

    const params = new URLSearchParams({
      q: word,
      appKey: this.youdaoApiKey,
      salt: Date.now(),
      sign: this.generateYoudaoSign(word),
      type: 'EN2ZH_CN'
    })

    const response = await fetch(`${url}?${params}`)
    const data = await response.json()

    // 提取例句
    return data.basic?.explains?.map(explain => ({
      en: word,
      zh: explain
    })) || []
  }
}

export const exampleService = new ExampleService()
```

```javascript
// src/services/PronunciationService.js
export class PronunciationService {
  // 播放发音
  speak(word, options = {}) {
    const {
      lang = 'en-US',  // en-US 美式, en-GB 英式
      rate = 0.9,
      pitch = 1,
      volume = 1
    } = options

    if (!('speechSynthesis' in window)) {
      throw new Error('浏览器不支持语音合成')
    }

    // 停止当前播放
    speechSynthesis.cancel()

    // 创建语音
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.lang = lang
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume

    // 选择最佳语音
    const voices = speechSynthesis.getVoices()
    const bestVoice = voices.find(v => v.lang.startsWith(lang.split('-')[0]))
    if (bestVoice) {
      utterance.voice = bestVoice
    }

    // 播放
    speechSynthesis.speak(utterance)

    return utterance
  }

  // 停止播放
  stop() {
    speechSynthesis.cancel()
  }

  // 暂停播放
  pause() {
    speechSynthesis.pause()
  }

  // 继续播放
  resume() {
    speechSynthesis.resume()
  }

  // 获取可用语音列表
  getVoices() {
    return speechSynthesis.getVoices()
  }
}

export const pronunciationService = new PronunciationService()
```

### 环境变量配置

```env
# .env.development
# 腾讯翻译API
VUE_APP_TENCENT_SECRET_ID=your_secret_id
VUE_APP_TENCENT_SECRET_KEY=your_secret_key

# 百度翻译API
VUE_APP_BAIDU_APP_ID=your_app_id
VUE_APP_BAIDU_SECRET_KEY=your_secret_key

# 金山词霸API
VUE_APP_ICIBA_API_KEY=your_iciba_key

# 有道词典API（可选）
VUE_APP_YOUDAO_APP_KEY=your_youdao_key
VUE_APP_YOUDAO_APP_SECRET=your_youdao_secret
```

### 使用示例

```javascript
// 在Vue组件中使用
import { translationService } from '@/services/TranslationService'
import { exampleService } from '@/services/ExampleService'
import { pronunciationService } from '@/services/PronunciationService'

export default {
  methods: {
    async translateWord(word) {
      const result = await translationService.translate(word, 'auto', 'zh')
      this.translation = result.text
    },

    async loadExamples(word) {
      const examples = await exampleService.getExamples(word)
      this.examples = examples
    },

    playAudio(word) {
      pronunciationService.speak(word, { lang: 'en-US' })
    }
  }
}
```

### 优势总结

1. **完全免费**: 所有API都有足够的免费额度
2. **国内服务**: 响应速度快，稳定性好
3. **高可用性**: 多API备份，自动切换
4. **易于实现**: 无需复杂的基础设施
5. **可扩展**: 用户量增长后可轻松升级到付费版

---

## 📞 技术支持

**百度翻译**:
- 开发者社区: https://community.fanyi.baidu.com/
- 技术文档: https://api.fanyi.baidu.com/api/trans

**腾讯翻译**:
- 技术文档: https://cloud.tencent.com/document/product/277
- 支持论坛: https://cloud.tencent.com/product/277

**有道翻译**:
- 开发者平台: https://ai.youdao.com/
- 商务咨询: AIcloud_Business@corp.youdao.com

**Free Dictionary API**:
- GitHub: https://github.com/meetDeveloper/freeDictionaryAPI
- 文档: https://dictionaryapi.dev/

**Tatoeba**:
- 官网: https://tatoeba.org/
- 数据下载: https://tatoeba.org/downloads

---

## 📊 总结建议（优先国内API）

### 最优组合（国内免费API）

```
✅ 翻译: 腾讯翻译API（500万字符/月，免费额度最高）
✅ 备用翻译: 百度翻译API（100万字符/月）
✅ 例句: 金山词霸API（免费，包含例句和音标）
✅ 发音: 浏览器内置TTS（完全免费，无需API）
```

### 成本估算

| 方案 | 月成本 | 年成本 | 适用场景 | API来源 |
|------|--------|--------|----------|---------|
| 国内纯免费方案 | ¥0 | ¥0 | 个人项目/中小应用 | 100%国内 |
| 国内增强方案 | ¥0 | ¥0 | 商业项目 | 100%国内 |
| 混合方案 | ¥0 | ¥0 | 大型项目 | 国内为主 |
| 国际付费方案 | $10-20 | $120-240 | 海外用户 | 混合 |

---

## 🎯 实施建议

### 第一阶段：纯免费国内API（推荐起点）

1. **申请腾讯翻译API**（500万字符/月）
   - 访问: https://cloud.tencent.com/product/tmt
   - 注册腾讯云账号
   - 开通机器翻译服务
   - 获取API密钥

2. **申请百度翻译API**（作为备用，100万字符/月）
   - 访问: https://api.fanyi.baidu.com/api/trans
   - 实名认证
   - 获取AppID和密钥

3. **申请金山词霸API**（免费例句）
   - 访问: http://open.iciba.com/
   - 填写申请表
   - 等待审核

4. **使用浏览器内置TTS**（发音）
   - 无需申请API
   - 使用 Web Speech API
   - 完全免费

**优势**:
- 💰 全部免费，零成本
- 🇨🇳 全部国内API，速度快
- 📊 600万字符/月免费额度
- ✅ 满足中小应用需求

---

**建议**: 优先使用国内免费API，等用户量增长后再考虑付费升级。国内API速度快、稳定性好、免费额度充足。

**Sources**:
- [腾讯云机器翻译](https://cloud.tencent.com/product/tmt) - 500万字符/月免费 ⭐⭐⭐⭐⭐
- [百度翻译开放平台](https://api.fanyi.baidu.com/api/trans) - 100万字符/月免费 ⭐⭐⭐⭐⭐
- [金山词霸开放平台](https://open.iciba.com/) - 免费例句API ⭐⭐⭐⭐
- [有道智云AI开放平台](https://ai.youdao.com/) - 50元体验金 ⭐⭐⭐⭐
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis) - 浏览器内置TTS ⭐⭐⭐⭐⭐
- [Free Dictionary API](https://dictionaryapi.dev/) - 国外备用方案 ⭐⭐⭐
- [Wordnik Developer](https://developer.wordnik.com/) - 付费API ⭐⭐
- [Forvo Pronunciation API](https://api.forvo.com/plans-and-pricing/) - 付费API ⭐⭐
- [Tatoeba](https://tatoeba.org/) - 数据集下载 ⭐⭐⭐

**重要提醒**:
- 优先使用国内免费API，速度快且稳定
- 腾讯翻译君API将于2025年4月15日关闭，需迁移到腾讯云机器翻译
- 浏览器TTS完全免费，无需申请API
