/**
 * 统计服务
 * 收集学习数据，生成统计报告
 */

import dayjs from 'dayjs'

export class StatisticsService {
  constructor() {
    this.currentSession = null
  }

  /**
   * 记录学习活动
   * @param {string} type - 活动类型 'add' | 'review' | 'practice'
   * @param {string} wordId - 单词ID
   * @param {Object} result - 结果
   */
  async logActivity(type, wordId, result = {}) {
    if (!window.utools) {
      return
    }

    const today = dayjs().format('YYYY-MM-DD')
    const logId = `log_${today}`

    try {
      // 获取或创建今日日志
      let log
      try {
        log = await window.utools.db.get(logId)
      } catch (error) {
        // 创建新日志
        log = {
          _id: logId,
          date: today,
          activities: [],
          summary: this.createEmptySummary()
        }
      }

      // 添加活动记录
      log.activities.push({
        type,
        word_id: wordId,
        timestamp: Date.now(),
        result
      })

      // 更新汇总
      log.summary = this.calculateSummary(log.activities)

      // 保存日志
      await window.utools.db.put(log)

      console.log('学习活动已记录:', { type, wordId })
    } catch (error) {
      console.error('记录学习活动失败:', error)
    }
  }

  /**
   * 创建空汇总
   */
  createEmptySummary() {
    return {
      total_activities: 0,
      new_words: 0,
      reviewed_words: 0,
      practice_time: 0, // 秒
      correct_count: 0,
      wrong_count: 0,
      accuracy: 0
    }
  }

  /**
   * 计算汇总数据
   */
  calculateSummary(activities) {
    const summary = this.createEmptySummary()

    activities.forEach(activity => {
      summary.total_activities++

      switch (activity.type) {
        case 'add':
          summary.new_words++
          break
        case 'review':
          summary.reviewed_words++
          if (activity.result) {
            if (activity.result.isCorrect) {
              summary.correct_count++
            } else {
              summary.wrong_count++
            }
          }
          break
        case 'practice':
          summary.practice_time += (activity.result.duration || 0)
          break
      }
    })

    // 计算正确率
    const totalAttempts = summary.correct_count + summary.wrong_count
    if (totalAttempts > 0) {
      summary.accuracy = (summary.correct_count / totalAttempts * 100).toFixed(2)
    }

    return summary
  }

  /**
   * 获取今日学习进度
   * @returns {Promise<Object>} 今日进度
   */
  async getTodayProgress() {
    if (!window.utools) {
      return this.createEmptySummary()
    }

    const today = dayjs().format('YYYY-MM-DD')
    const logId = `log_${today}`

    try {
      const log = await window.utools.db.get(logId)
      return log.summary || this.createEmptySummary()
    } catch (error) {
      return this.createEmptySummary()
    }
  }

  /**
   * 获取学习日历数据
   * @param {number} days - 天数
   * @returns {Promise<Array>} 日历数据
   */
  async getLearningCalendar(days = 365) {
    if (!window.utools) {
      return []
    }

    const data = []
    const endDate = dayjs()
    const startDate = endDate.subtract(days - 1, 'day')

    // 获取指定天数内的所有日志
    for (let i = 0; i < days; i++) {
      const date = startDate.add(i, 'day')
      const dateStr = date.format('YYYY-MM-DD')
      const logId = `log_${dateStr}`

      try {
        const log = await window.utools.db.get(logId)
        const intensity = this.calculateIntensity(log.summary)

        data.push({
          date: dateStr,
          intensity,
          summary: log.summary
        })
      } catch (error) {
        // 当天没有记录
        data.push({
          date: dateStr,
          intensity: 0,
          summary: this.createEmptySummary()
        })
      }
    }

    return data
  }

  /**
   * 计算学习强度（0-5级）
   */
  calculateIntensity(summary) {
    if (!summary) return 0

    const score =
      (summary.new_words * 2) +
      (summary.reviewed_words * 1) +
      (summary.practice_time / 60) * 0.5

    return Math.min(5, Math.floor(score / 20))
  }

  /**
   * 计算连续打卡天数
   * @returns {Promise<number>} 连续天数
   */
  async calculateStreak() {
    if (!window.utools) {
      return 0
    }

    let streak = 0
    let currentDate = dayjs()

    for (let i = 0; i < 365; i++) {
      const dateStr = currentDate.format('YYYY-MM-DD')
      const logId = `log_${dateStr}`

      try {
        const log = await window.utools.db.get(logId)
        if (log.summary && log.summary.total_activities > 0) {
          streak++
          currentDate = currentDate.subtract(1, 'day')
        } else {
          break
        }
      } catch (error) {
        break
      }
    }

    return streak
  }

  /**
   * 生成周报
   * @returns {Promise<Object>} 周报数据
   */
  async generateWeeklyReport() {
    const calendarData = await this.getLearningCalendar(7)

    const summary = {
      total_words: 0,
      new_words: 0,
      reviewed_words: 0,
      practice_time: 0,
      active_days: 0,
      best_day: null,
      best_day_count: 0,
      streak: await this.calculateStreak(),
      daily_avg: 0
    }

    // 计算本周数据
    calendarData.forEach(day => {
      if (day.summary.total_activities > 0) {
        summary.active_days++
        summary.new_words += day.summary.new_words
        summary.reviewed_words += day.summary.reviewed_words
        summary.practice_time += day.summary.practice_time

        const dayTotal = day.summary.new_words + day.summary.reviewed_words
        if (dayTotal > summary.best_day_count) {
          summary.best_day_count = dayTotal
          summary.best_day = day.date
        }
      }
    })

    summary.total_words = summary.new_words + summary.reviewed_words

    // 计算日均
    if (summary.active_days > 0) {
      summary.daily_avg = (summary.total_words / summary.active_days).toFixed(1)
    }

    return summary
  }

  /**
   * 生成月报
   * @returns {Promise<Object>} 月报数据
   */
  async generateMonthlyReport() {
    const daysInMonth = dayjs().daysInMonth()
    const calendarData = await this.getLearningCalendar(daysInMonth)

    const summary = {
      total_words: 0,
      new_words: 0,
      reviewed_words: 0,
      practice_time: 0,
      active_days: 0,
      total_hours: 0,
      avg_daily: 0
    }

    calendarData.forEach(day => {
      if (day.summary.total_activities > 0) {
        summary.active_days++
        summary.new_words += day.summary.new_words
        summary.reviewed_words += day.summary.reviewed_words
        summary.practice_time += day.summary.practice_time
      }
    })

    summary.total_words = summary.new_words + summary.reviewed_words
    summary.total_hours = (summary.practice_time / 3600).toFixed(1)

    if (summary.active_days > 0) {
      summary.avg_daily = (summary.total_words / summary.active_days).toFixed(1)
    }

    return summary
  }

  /**
   * 获取单词掌握度分布
   * @returns {Promise<Object>} 掌握度分布
   */
  async getMasteryDistribution() {
    if (!window.utools) {
      return { new: 0, learning: 0, familiar: 0, mastered: 0 }
    }

    const distribution = {
      new: 0,        // 新词（review_count = 0）
      learning: 0,    // 学习中（review_count 1-3）
      familiar: 0,    // 熟悉（review_count 4-7）
      mastered: 0     // 掌握（review_count > 7）
    }

    try {
      const words = await window.utools.db.allDocs('word_')

      words.forEach(word => {
        const reviewCount = word.review_count || 0

        if (reviewCount === 0) {
          distribution.new++
        } else if (reviewCount <= 3) {
          distribution.learning++
        } else if (reviewCount <= 7) {
          distribution.familiar++
        } else {
          distribution.mastered++
        }
      })
    } catch (error) {
      console.error('获取掌握度分布失败:', error)
    }

    return distribution
  }

  /**
   * 获取学习趋势（最近N天）
   * @param {number} days - 天数
   * @returns {Promise<Array>} 趋势数据
   */
  async getLearningTrend(days = 30) {
    const calendarData = await this.getLearningCalendar(days)

    return calendarData.map(day => ({
      date: day.date,
      new_words: day.summary.new_words,
      reviewed_words: day.summary.reviewed_words,
      total: day.summary.new_words + day.summary.reviewed_words
    }))
  }

  /**
   * 获取总统计
   * @returns {Promise<Object>} 总统计
   */
  async getTotalStats() {
    if (!window.utools) {
      return {
        total_words: 0,
        total_reviews: 0,
        total_time: 0,
        streak: 0
      }
    }

    try {
      const words = await window.utools.db.allDocs('word_')
      const totalWords = words.length

      let totalReviews = 0
      words.forEach(word => {
        totalReviews += (word.review_count || 0)
      })

      // 获取总学习时间
      const logs = await window.utools.db.allDocs('log_')
      let totalTime = 0
      logs.forEach(log => {
        totalTime += (log.summary?.practice_time || 0)
      })

      const streak = await this.calculateStreak()

      return {
        total_words: totalWords,
        total_reviews,
        total_time: totalTime,
        total_hours: (totalTime / 3600).toFixed(1),
        streak
      }
    } catch (error) {
      console.error('获取总统计失败:', error)
      return {
        total_words: 0,
        total_reviews: 0,
        total_time: 0,
        streak: 0
      }
    }
  }

  /**
   * 开始学习会话
   */
  startSession() {
    this.currentSession = {
      start_time: Date.now(),
      words_reviewed: 0,
      correct_count: 0,
      wrong_count: 0
    }
  }

  /**
   * 结束学习会话
   * @returns {Promise<Object>} 会话统计
   */
  async endSession() {
    if (!this.currentSession) {
      return null
    }

    const session = {
      ...this.currentSession,
      end_time: Date.now(),
      duration: Date.now() - this.currentSession.start_time
    }

    // 记录会话
    await this.logActivity('practice', 'session', {
      duration: session.duration / 1000, // 转换为秒
      words_reviewed: session.words_reviewed,
      correct_count: session.correct_count,
      wrong_count: session.wrong_count
    })

    this.currentSession = null

    return session
  }

  /**
   * 记录复习结果
   * @param {string} wordId - 单词ID
   * @param {boolean} isCorrect - 是否正确
   */
  async recordReviewResult(wordId, isCorrect) {
    if (this.currentSession) {
      this.currentSession.words_reviewed++
      if (isCorrect) {
        this.currentSession.correct_count++
      } else {
        this.currentSession.wrong_count++
      }
    }

    await this.logActivity('review', wordId, {
      isCorrect,
      timestamp: Date.now()
    })
  }
}

// 导出单例
export const statisticsService = new StatisticsService()
