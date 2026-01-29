# 数据库结构设计文档

> 版本：v2.0
> 说明：详细定义所有数据表结构和关系

---

## 📊 数据库概览

### 数据表列表

| 表名 | 用途 | 记录数预估 |
|------|------|-----------|
| `word_*` | 单词数据 | 1000+ |
| `log_*` | 学习日志 | 365+ |
| `notebook_*` | 单词本 | 10+ |
| `folder_*` | 文件夹 | 5+ |
| `achievement_*` | 成就记录 | 50+ |
| `reminder_*` | 提醒配置 | 1 |
| `settings_*` | 用户设置 | 1 |

---

## 📋 详细表结构

### 1. 单词表 (word_*)

**用途**: 存储单词及其相关信息

**数据结构**:
```javascript
{
  // === 基本信息 ===
  "_id": "word_1706500800000_abcd1234",  // 唯一ID
  "word": "ephemeral",                    // 单词
  "translation": "短暂的，转瞬即逝的",      // 翻译
  "phonetic": {                           // 音标
    "uk": "/ɪˈfemərəl/",                 // 英音
    "us": "/ɪˈfemərəl/"                  // 美音
  },

  // === 例句 ===
  "examples": [
    {
      "id": "ex_001",                     // 例句ID
      "sentence_en": "Fashions are ephemeral, changing with every season.",
      "sentence_zh": "时尚是短暂的，每个季节都在变化。",
      "source": "youdao",                 // 来源: youdao|iciba|user|tatoeba
      "audio_url": "https://...",         // 音频URL
      "difficulty": 4,                    // 难度1-5
      "created_at": 1706500800000,
      "is_favorite": false                // 是否收藏
    }
  ],

  // === 单词属性 ===
  "etymology": "源自希腊语ephēmeros",     // 词源
  "part_of_speech": "adj",               // 词性
  "frequency": "B2",                     // 使用频率: A1-C2
  "difficulty": 4,                       // 难度等级1-5
  "tags": ["托福", "形容词", "高频"],     // 标签
  "synonyms": ["transient", "fleeting", "short-lived"],
  "antonyms": ["permanent", "lasting", "enduring"],
  "collocations": ["ephemeral pleasure", "ephemeral beauty"],
  "related_words": ["ephemerally", "ephemeralness"],

  // === 学习相关 ===
  "notes": "容易与eternal（永恒的）混淆", // 学习笔记
  "star_rating": 4,                      // 星级1-5
  "is_favorite": false,                  // 是否收藏
  "notebook_id": "notebook_001",         // 所属单词本
  "folder_id": "folder_001",             // 所属文件夹

  // === SM-2算法字段 ===
  "ease_factor": 2.5,                    // 易度因子
  "interval": 0,                         // 当前间隔（天）
  "repetitions": 0,                      // 重复次数
  "next_review_date": 1706587200000,    // 下次复习时间

  // === 统计字段 ===
  "review_count": 5,                     // 复习次数
  "correct_count": 4,                    // 正确次数
  "wrong_count": 1,                      // 错误次数
  "last_review_date": 1706500800000,    // 最后复习时间
  "average_quality": 4.2,                // 平均质量分

  // === 时间戳 ===
  "created_at": 1706500800000,           // 创建时间
  "updated_at": 1706500800000,           // 更新时间
  "first_review_date": 1706500800000,   // 首次复习时间

  // === 元数据 ===
  "source": "manual",                    // 来源: manual|import|api
  "import_source": null,                 // 导入源: anki|csv|txt
  "review_status": "new"                 // 复习状态: new|learning|mastered
}
```

**索引**:
- `_id` (primary)
- `word` (unique)
- `next_review_date` (for review query)
- `notebook_id`
- `review_status`

---

### 2. 学习日志表 (log_*)

**用途**: 记录用户每天的学习活动

**数据结构**:
```javascript
{
  "_id": "log_2025-01-29",              // 日期作为ID
  "date": "2025-01-29",                  // 日期 YYYY-MM-DD
  "user_id": "user_001",                 // 用户ID（预留）

  // === 活动记录 ===
  "activities": [
    {
      "id": "act_001",                   // 活动ID
      "type": "add",                     // 类型: add|review|practice|test
      "subtype": "manual",               // 子类型
      "word_id": "word_001",             // 单词ID
      "mode": "flashcard",               // 复习模式
      "result": "success",               // 结果: success|failed|partial
      "quality": 4,                      // 质量评分0-5
      "response_time": 3500,             // 响应时间(ms)
      "timestamp": 1706500800000,        // 时间戳
      "session_id": "session_001"        // 会话ID
    }
  ],

  // === 每日汇总 ===
  "summary": {
    "total_words": 150,                  // 总单词数
    "new_words": 20,                     // 新增单词
    "reviewed_words": 50,                // 复习单词
    "practice_time": 1800,               // 练习时长(秒)
    "accuracy": 0.85,                    // 准确率
    "average_quality": 4.2,              // 平均质量分
    "active_time": 3600                  // 活跃时长(秒)
  },

  // === 目标完成情况 ===
  "goals": {
    "daily_target": 20,                  // 每日目标
    "completed": 20,                     // 已完成
    "percentage": 100,                   // 完成百分比
    "streak": 7                          // 连续天数
  },

  // === 时间戳 ===
  "created_at": 1706500800000,
  "updated_at": 1706500800000
}
```

**索引**:
- `_id` (primary)
- `date` (unique)
- `created_at`

---

### 3. 单词本表 (notebook_*)

**用途**: 管理用户的单词分类

**数据结构**:
```javascript
{
  "_id": "notebook_001",
  "name": "托福核心词汇",                // 名称
  "description": "托福考试必备1000词",     // 描述
  "icon": "📖",                          // 图标emoji
  "color": "#FF9F43",                    // 主题色
  "cover_image": null,                   // 封面图片（预留）

  // === 组织结构 ===
  "folder_id": "folder_001",             // 所属文件夹
  "parent_id": null,                     // 父级ID（支持嵌套）
  "sort_order": 0,                       // 排序序号

  // === 单词列表 ===
  "words": ["word_001", "word_002"],     // 单词ID数组
  "word_count": 100,                     // 单词数量

  // === 共享相关 ===
  "is_public": false,                    // 是否公开
  "is_default": false,                   // 是否默认本
  "share_code": "ABC123XYZ",             // 分享码
  "share_count": 0,                      // 被分享次数
  "subscribe_count": 0,                  // 订阅数

  // === 学习统计 ===
  "total_reviews": 500,                  // 总复习次数
  "mastered_count": 80,                  // 已掌握数量
  "learning_count": 15,                  // 学习中数量
  "new_count": 5,                        // 新词数量

  // === 时间戳 ===
  "created_at": 1706500800000,
  "updated_at": 1706500800000,
  "last_study_date": 1706500800000      // 最后学习时间
}
```

**索引**:
- `_id` (primary)
- `folder_id`
- `share_code` (unique)

---

### 4. 文件夹表 (folder_*)

**用途**: 单词本的文件夹分组

**数据结构**:
```javascript
{
  "_id": "folder_001",
  "name": "考试词汇",                     // 文件夹名称
  "icon": "📁",                          // 图标
  "color": "#409eff",                    // 颜色
  "description": "各类考试词汇集合",      // 描述

  // === 组织 ===
  "parent_id": null,                     // 父文件夹ID
  "sort_order": 0,                       // 排序
  "notebook_count": 3,                   // 包含的单词本数量

  // === 时间戳 ===
  "created_at": 1706500800000,
  "updated_at": 1706500800000
}
```

**索引**:
- `_id` (primary)
- `parent_id`

---

### 5. 复习会话表 (session_*)

**用途**: 记录每次复习会话的详细信息

**数据结构**:
```javascript
{
  "_id": "session_20250129_001",
  "type": "review",                      // 类型: review|study|test
  "mode": "flashcard",                   // 模式: flashcard|spelling|listening...

  // === 会话配置 ===
  "config": {
    "word_count": 20,                    // 单词数量
    "filter": {                          // 筛选条件
      "notebook_id": "notebook_001",
      "tags": ["托福"],
      "difficulty": [3, 4, 5],
      "review_status": ["due"]
    },
    "auto_play_audio": true,             // 自动播放
    "show_hint": true                    // 显示提示
  },

  // === 单词列表 ===
  "words": ["word_001", "word_002"],     // 单词ID列表
  "word_details": [                      // 单词详情快照
    {
      "word_id": "word_001",
      "word": "ephemeral",
      "translation": "短暂的"
    }
  ],

  // === 结果记录 ===
  "results": [
    {
      "word_id": "word_001",
      "is_correct": true,
      "quality": 4,
      "response_time": 3500,
      "timestamp": 1706500800000
    }
  ],

  // === 会话统计 ===
  "statistics": {
    "total": 20,                         // 总数
    "completed": 18,                      // 已完成
    "skipped": 2,                        // 跳过
    "correct": 15,                       // 正确
    "wrong": 3,                          // 错误
    "accuracy": 0.833,                   // 准确率
    "average_time": 3200,                // 平均用时
    "total_time": 57600                  // 总用时
  },

  // === 时间戳 ===
  "started_at": 1706500800000,
  "completed_at": 1706500576000,
  "created_at": 1706500800000
}
```

---

### 6. 成就表 (achievement_*)

**用途**: 记录用户解锁的成就

**数据结构**:
```javascript
{
  "_id": "achievement_user_001_streak_7",
  "user_id": "user_001",
  "achievement_id": "streak_7",          // 成就ID

  // === 成就信息 ===
  "achievement": {
    "id": "streak_7",
    "name": "坚持到底",
    "description": "连续学习7天",
    "icon": "🔥",
    "category": "streak",                // 类别: streak|milestone|review|special
    "points": 100,                       // 积分
    "rarity": "common"                   // 稀有度: common|rare|epic|legendary
  },

  // === 解锁信息 ===
  "unlocked_at": 1706500800000,         // 解锁时间
  "progress": 7,                        // 进度
  "target": 7,                          // 目标

  // === 时间戳 ===
  "created_at": 1706500800000
}
```

---

### 7. 用户设置表 (settings_*)

**用途**: 存储用户的个性化设置

**数据结构**:
```javascript
{
  "_id": "settings_user_001",
  "user_id": "user_001",

  // === 学习设置 ===
  "study": {
    "daily_goal": 20,                    // 每日目标
    "preferred_mode": "flashcard",       // 首选模式
    "auto_play_audio": true,             // 自动播放
    "auto_advance": false,               // 自动前进
    "show_phonetic": true,               // 显示音标
    "show_example": true,                // 显示例句
    "speech_rate": 0.9,                  // 发音速率
    "speech_pitch": 1.0                  // 发音音调
  },

  // === 复习设置 ===
  "review": {
    "algorithm": "sm2",                  // 算法: sm2|custom
    "max_new_per_day": 20,               // 每日新词上限
    "review_order": "due",               // 复习顺序: due|random|difficulty
    "include_new_words": true,           // 包含新词
    "weighted_review": true              // 加权复习（优先复习困难词）
  },

  // === 提醒设置 ===
  "reminder": {
    "enabled": true,                     // 启用提醒
    "daily_time": "09:00",               // 每日提醒时间
    "frequency": "medium",               // 频率: low|medium|high
    "quiet_hours": {
      "start": "22:00",                  // 免打扰开始
      "end": "08:00"                     // 免打扰结束
    },
    "weekdays": [1, 2, 3, 4, 5, 6, 7]   // 提醒日 1-7
  },

  // === 界面设置 ===
  "ui": {
    "theme": "auto",                     // 主题: auto|light|dark
    "language": "zh-CN",                 // 语言
    "font_size": "medium",               // 字体大小
    "card_style": "simple",              // 卡片样式
    "show_mastery_badge": true,          // 显示掌握徽章
    "compact_mode": false                // 紧凑模式
  },

  // === 隐私设置 ===
  "privacy": {
    "allow_analytics": true,             // 允许数据分析
    "auto_backup": true,                 // 自动备份
    "sync_enabled": false,               // 启用同步
    "share_progress": false              // 分享进度
  },

  // === 时间戳 ===
  "updated_at": 1706500800000,
  "created_at": 1706500800000
}
```

---

### 8. 提醒配置表 (reminder_*)

**用途**: 存储提醒的调度信息

**数据结构**:
```javascript
{
  "_id": "reminder_001",
  "user_id": "user_001",
  "type": "review",                      // 类型: review|daily_goal|deadline

  // === 提醒内容 ===
  "title": "复习提醒",
  "message": "您有20个单词需要复习",
  "data": {
    "word_count": 20,
    "urgent_count": 5                    // 紧急数量（即将遗忘）
  },

  // === 调度信息 ===
  "scheduled_time": 1706500800000,      // 计划时间
  "sent": false,                        // 是否已发送
  "sent_at": null,                      // 发送时间

  // === 重复配置 ===
  "repeat": {
    "type": "daily",                    // 重复类型: daily|weekly|once
    "interval": 1,                      // 间隔
    "weekdays": [1, 2, 3, 4, 5]         // 星期几
  },

  // === 时间戳 ===
  "created_at": 1706500800000
}
```

---

## 🔄 数据关系图

```
用户设置 (settings)
    ↓
学习日志 (log) ←→ 复习会话 (session) ←→ 单词 (word)
    ↓               ↓
单词本 (notebook)    成就 (achievement)
    ↓
文件夹 (folder)
```

---

## 📈 数据迁移计划

### 从 v1.0 升级到 v2.0

#### 迁移脚本

```javascript
// migration/to-v2.js
export async function migrateToV2() {
  console.log('开始迁移到 v2.0...')

  // 1. 备份现有数据
  const backup = await backupData()
  console.log('数据备份完成')

  // 2. 升级单词数据结构
  const words = await window.utools.db.allDocs('word_')
  for (const word of words) {
    const updated = {
      ...word,
      // 添加新字段
      examples: [],
      phonetic: { uk: '', us: '' },
      difficulty: 3,
      star_rating: 0,
      notes: '',
      notebook_id: null
    }
    await window.utools.db.put(updated)
  }
  console.log(`升级 ${words.length} 个单词`)

  // 3. 创建默认单词本
  const defaultNotebook = await createDefaultNotebook()
  console.log('创建默认单词本')

  // 4. 初始化用户设置
  await initDefaultSettings()
  console.log('初始化用户设置')

  console.log('迁移完成！')
}

async function createDefaultNotebook() {
  return await window.utools.db.put({
    _id: 'notebook_default',
    name: '默认单词本',
    description: '我的第一个单词本',
    icon: '📖',
    color: '#FF9F43',
    words: [],
    word_count: 0,
    is_default: true,
    created_at: Date.now()
  })
}
```

---

## 🔍 查询优化

### 常用查询索引

```javascript
// 需要复习的单词
async function getDueWords() {
  const now = Date.now()
  const words = await window.utools.db.allDocs('word_')

  return words.filter(word =>
    word.next_review_date &&
    word.next_review_date <= now
  ).sort((a, b) => a.next_review_date - b.next_review_date)
}

// 按单词本获取单词
async function getWordsByNotebook(notebookId) {
  const notebook = await window.utools.db.get(notebookId)
  const words = []

  for (const wordId of notebook.words) {
    const word = await window.utools.db.get(wordId)
    if (word) words.push(word)
  }

  return words
}

// 统计数据
async function getStatistics() {
  const words = await window.utools.db.allDocs('word_')

  return {
    total: words.length,
    new: words.filter(w => w.review_count === 0).length,
    learning: words.filter(w => w.interval < 7).length,
    consolidated: words.filter(w => w.interval >= 7 && w.interval < 21).length,
    mastered: words.filter(w => w.interval >= 21).length
  }
}
```

---

## 💾 备份与恢复

### 备份格式

```javascript
{
  "version": "2.0",
  "exported_at": "2025-01-29T00:00:00.000Z",
  "data": {
    "words": [...],           // 所有单词
    "notebooks": [...],       // 所有单词本
    "folders": [...],        // 所有文件夹
    "logs": [...],           // 最近30天日志
    "achievements": [...],   // 成就记录
    "settings": {...}        // 用户设置
  }
}
```

---

## 📊 性能优化建议

### 1. 分页加载
```javascript
async function getWordsPaginated(page = 1, pageSize = 50) {
  const allWords = await window.utools.db.allDocs('word_')
  const start = (page - 1) * pageSize
  const end = start + pageSize

  return {
    words: allWords.slice(start, end),
    total: allWords.length,
    page,
    pageSize,
    totalPages: Math.ceil(allWords.length / pageSize)
  }
}
```

### 2. 缓存策略
```javascript
class CacheManager {
  constructor() {
    this.cache = new Map()
    this.maxSize = 100
  }

  get(key) {
    return this.cache.get(key)
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }

  clear() {
    this.cache.clear()
  }
}
```

---

## 🔒 数据安全

### 加密存储（可选）

```javascript
// 敏感数据加密
const crypto = require('crypto')

function encryptData(data, key) {
  const algorithm = 'aes-256-cbc'
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(algorithm, key, iv)

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return {
    data: encrypted,
    iv: iv.toString('hex')
  }
}
```

---

**文档版本**: v1.0
**最后更新**: 2026-01-29
