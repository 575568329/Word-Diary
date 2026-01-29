# 单词日记 - 快速实施指南

> 版本：v2.0
> 基于 FEATURE_UPGRADE_PLAN.md 的精简版
> 预计开发周期：10-16周

---

## 🚀 快速开始

### 第一步：环境准备（1天）

```bash
# 安装必要的依赖
npm install echarts vue-echarts
npm install dayjs
npm install pinia
npm install @vueuse/core

# 开发依赖
npm install -D vitest @playwright/test
```

### 第二步：项目架构调整（2-3天）

#### 1. 创建新的目录结构

```bash
src/
├── services/          # 业务服务层
├── stores/            # 状态管理
├── components/
│   ├── charts/        # 图表组件
│   ├── review/        # 复习组件
│   └── shared/        # 共享组件
└── utils/
```

#### 2. 升级数据结构

在 [services-core.js](src/services-core.js) 中扩展单词数据：

```javascript
// 在现有的单词数据中添加新字段
export const DEFAULT_WORD_DATA = {
  // 现有字段...
  word: '',
  translation: '',
  tags: [],

  // 新增字段
  phonetic: { uk: '', us: '' },
  examples: [],
  difficulty: 3,
  star_rating: 0,
  notes: '',
  notebook_id: null
}
```

---

## 📊 第一阶段：核心功能开发

### Week 1-2: 学习数据可视化

#### 优先级：⭐⭐⭐⭐⭐

**开发清单：**

```yaml
Day 1-2: 数据收集
  - [ ] 创建 StudyLog 服务
  - [ ] 记录用户每次学习行为
  - [ ] 存储学习日志

Day 3-4: 统计服务
  - [ ] 实现 StatisticsService
  - [ ] 学习日历算法
  - [ ] 数据聚合计算

Day 5-7: 图表组件
  - [ ] 安装 ECharts
  - [ ] 学习日历热力图
  - [ ] 掌握度饼图
  - [ ] 学习趋势折线图

Day 8-9: UI整合
  - [ ] 创建统计页面
  - [ ] 数据卡片展示
  - [ ] 响应式布局

Day 10: 测试
  - [ ] 数据准确性测试
  - [ ] 性能测试
```

**核心代码示例：**

```javascript
// src/services/StatisticsService.js
export class StatisticsService {
  async getTodayProgress() {
    const today = new Date().toISOString().split('T')[0]
    const logs = await window.utools.db.allDocs('log_')

    return logs
      .filter(log => log.date === today)
      .reduce((acc, log) => ({
        added: acc.added + log.summary.new_words,
        reviewed: acc.reviewed + log.summary.reviewed_words,
        time: acc.time + log.summary.practice_time
      }), { added: 0, reviewed: 0, time: 0 })
  }

  async getLearningCalendar(days = 365) {
    // 返回热力图数据
    const data = []
    const logs = await this.getRecentLogs(days)

    for (const log of logs) {
      data.push({
        date: log.date,
        count: log.summary.new_words + log.summary.reviewed_words,
        level: this.calculateLevel(log)
      })
    }

    return data
  }
}
```

---

### Week 3-4: 单词例句系统

#### 优先级：⭐⭐⭐⭐⭐

**开发清单：**

```yaml
Day 1-2: API集成准备
  - [ ] 调研可用API（有道/ICIBA）
  - [ ] 申请API密钥
  - [ ] 创建 ExampleService

Day 3-4: API集成
  - [ ] 实现有道API调用
  - [ ] 实现ICIBA API调用
  - [ ] 数据合并去重

Day 5-6: UI组件
  - [ ] 例句展示组件
  - [ ] 发音播放按钮
  - [ ] 收藏/标记功能

Day 7: 本地功能
  - [ ] 用户自定义例句
  - [ ] 例句编辑/删除
  - [ ] 例句搜索

Day 8-9: 性能优化
  - [ ] 例句缓存机制
  - [ ] 懒加载实现
  - [ ] 离线支持

Day 10: 测试
```

**核心代码示例：**

```javascript
// src/services/ExampleService.js
export class ExampleService {
  async getExamples(word) {
    // 1. 检查缓存
    const cached = await this.getCachedExamples(word)
    if (cached?.length >= 2) return cached

    // 2. 调用API
    const examples = await Promise.all([
      this.fetchYoudao(word),
      this.fetchICIBA(word)
    ])

    // 3. 保存缓存
    const merged = this.mergeExamples(examples.flat())
    await this.cacheExamples(word, merged)

    return merged
  }

  async fetchYoudao(word) {
    // TODO: 实现有道API调用
    // 临时返回假数据
    return [{
      sentence_en: `${word} is an example.`,
      sentence_zh: "这是一个例子。",
      source: "youdao"
    }]
  }
}
```

---

### Week 5-7: 多种复习模式

#### 优先级：⭐⭐⭐⭐⭐

**开发清单：**

```yaml
Day 1-2: 模式框架
  - [ ] 设计复习模式基类
  - [ ] 实现模式管理器
  - [ ] 复习会话管理

Day 3-4: 拼写模式
  - [ ] SpellingMode 类
  - [ ] 拼写检查逻辑
  - [ ] 提示系统

Day 5-6: 听音模式
  - [ ] ListeningMode 类
  - [ ] 音频播放控制
  - [ ] 选项生成

Day 7-8: 选择题模式
  - [ ] MultipleChoiceMode 类
  - [ ] 干扰项生成
  - [ ] 即时反馈

Day 9: 填空模式
  - [ ] FillBlankMode 类
  - [ ] 例句挖空算法
  - [ ] 上下文提示

Day 10-11: UI整合
  - [ ] 模式选择器
  - [ ] 统一复习界面
  - [ ] 结果反馈弹窗

Day 12: 测试
```

**核心代码示例：**

```javascript
// src/services/review/SpellingMode.js
export class SpellingMode extends ReviewMode {
  constructor(word, options = {}) {
    super(word, options)
    this.maxAttempts = 3
    this.attempts = 0
    this.hintLevel = 0
  }

  render() {
    const hint = this.generateHint()
    return {
      type: 'spelling',
      question: this.word.translation,
      hint: hint,
      length: this.word.word.length
    }
  }

  generateHint() {
    const word = this.word.word
    switch (this.hintLevel) {
      case 0:
        return '______'
      case 1:
        return word[0] + '_____'
      case 2:
        return word[0] + word.slice(1, -1) + '_'
      default:
        return word
    }
  }

  checkAnswer(userInput) {
    this.attempts++
    const isCorrect = userInput.toLowerCase().trim() === this.word.word.toLowerCase()

    if (!isCorrect && this.attempts < this.maxAttempts) {
      this.hintLevel++
      return {
        isCorrect: false,
        canRetry: true,
        hint: this.generateHint()
      }
    }

    return {
      isCorrect,
      canRetry: false,
      correctAnswer: this.word.word
    }
  }
}
```

---

### Week 8-9: 智能复习提醒

#### 优先级：⭐⭐⭐⭐

**开发清单：**

```yaml
Day 1-2: 提醒服务
  - [ ] ReminderService 基础
  - [ ] 提醒调度算法
  - [ ] 通知集成

Day 3-4: 提醒逻辑
  - [ ] 基于遗忘曲线的提醒
  - [ ] 每日目标提醒
  - [ ] 批量复习提醒

Day 5-6: 设置页面
  - [ ] 提醒开关
  - [ ] 时间设置
  - [ ] 免打扰时段

Day 7: 测试
```

**核心代码示例：**

```javascript
// src/services/ReminderService.js
export class ReminderService {
  constructor() {
    this.timers = []
    this.settings = {
      enabled: true,
      dailyTime: '09:00',
      dailyGoal: 20
    }
  }

  start() {
    // 每分钟检查一次
    this.checkInterval = setInterval(() => {
      this.checkReminders()
    }, 60 * 1000)
  }

  async checkReminders() {
    const now = Date.now()

    // 1. 检查每日目标提醒
    const dailyTime = this.parseTime(this.settings.dailyTime)
    if (this.isTimeMatch(dailyTime)) {
      await this.sendDailyGoalReminder()
    }

    // 2. 检查复习提醒
    const dueWords = await this.getDueWords()
    if (dueWords.length > 0) {
      await this.sendReviewReminder(dueWords.length)
    }
  }

  async sendDailyGoalReminder() {
    const progress = await this.getTodayProgress()
    if (progress.completed < this.settings.dailyGoal) {
      window.utools?.notify(
        '🎯 每日学习提醒',
        `今日已完成 ${progress.completed}/${this.settings.dailyGoal} 个单词，加油！`
      )
    }
  }

  stop() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
    }
  }
}
```

---

### Week 10: 单词本功能

#### 优先级：⭐⭐⭐⭐

**开发清单：**

```yaml
Day 1-2: 单词本管理
  - [ ] NotebookService
  - [ ] 创建/删除/重命名
  - [ ] 文件夹管理

Day 3-4: 单词分配
  - [ ] 添加到单词本
  - [ ] 批量移动
  - [ ] 单词本视图

Day 5-6: 导入导出
  - [ ] Anki格式导入
  - [ ] CSV导入
  - [ ] 分享码生成

Day 7: UI开发
  - [ ] 单词本管理器
  - [ ] 拖拽排序
  - [ ] 图标选择

Day 8: 测试
```

---

## 🎮 第二阶段：增强功能

### 成就系统（1周）

```javascript
// src/services/AchievementService.js
export const ACHIEVEMENTS = [
  {
    id: 'streak_7',
    name: '坚持到底',
    description: '连续学习7天',
    icon: '🔥',
    check: (stats) => stats.consecutiveDays >= 7
  },
  {
    id: 'words_100',
    name: '初学者',
    description: '学会100个单词',
    icon: '📚',
    check: (stats) => stats.totalWords >= 100
  }
]

export class AchievementService {
  async checkAchievements() {
    const stats = await this.getUserStats()
    const unlocked = []

    for (const achievement of ACHIEVEMENTS) {
      if (achievement.check(stats)) {
        unlocked.push(achievement)
      }
    }

    return unlocked
  }

  async unlockAchievement(achievementId) {
    // 保存成就解锁记录
    await window.utools.db.put({
      _id: `achievement_${achievementId}`,
      unlocked_at: Date.now()
    })

    // 显示成就通知
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    window.utools?.notify(
      '🏆 成就解锁！',
      `${achievement.icon} ${achievement.name}`
    )
  }
}
```

---

## 📝 开发检查清单

### 每个功能开发完成后

- [ ] 功能正常工作
- [ ] 数据持久化正确
- [ ] UI响应式适配
- [ ] 错误处理完善
- [ ] 性能测试通过
- [ ] 代码注释完整
- [ ] 更新文档

### 每周结束时

- [ ] 代码review
- [ ] 更新开发日志
- [ ] 测试覆盖率检查
- [ ] 性能评估
- [ ] 下周计划调整

---

## 🐛 常见问题

### Q1: API调用失败怎么办？
```javascript
// 实现降级策略
async getExamples(word) {
  try {
    return await this.fetchAPI(word)
  } catch (error) {
    console.warn('API失败，使用本地数据')
    return await this.getLocalExamples(word) || []
  }
}
```

### Q2: 数据量大了性能下降？
```javascript
// 使用虚拟滚动
import { useVirtualList } from '@vueuse/core'

const { list: containerProps, containerProps, wrapperProps } = useVirtualList(
  largeDataList,
  { itemHeight: 60 }
)
```

### Q3: 如何离线使用？
```javascript
// 实现离线缓存
async cacheWords(words) {
  if ('serviceWorker' in navigator) {
    const cache = await caches.open('word-cache-v1')
    await cache.put(new Request('/api/words'), new Response(JSON.stringify(words)))
  }
}
```

---

## 📦 快速命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 测试
npm run test

# 代码检查
npm run lint

# 格式化
npm run format
```

---

## 🎯 里程碑

- [ ] **里程碑1**: 数据可视化完成 (Week 2)
- [ ] **里程碑2**: 例句系统上线 (Week 4)
- [ ] **里程碑3**: 多模式复习完成 (Week 7)
- [ ] **里程碑4**: 提醒系统启用 (Week 9)
- [ ] **里程碑5**: 单词本功能发布 (Week 10)
- [ ] **里程碑6**: v2.0 正式发布 (Week 16)

---

## 📞 支持

- 问题反馈: GitHub Issues
- 技术交流: 查看README
- 功能建议: 提交Feature Request

---

**祝开发顺利！** 🎉
