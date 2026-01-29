<template>
  <div class="statistics-page">
    <h2 class="page-title">📊 学习统计</h2>

    <!-- 今日进度 -->
    <div class="section">
      <h3 class="section-title">今日进度</h3>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ todayProgress.new_words }}</div>
          <div class="stat-label">新词</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ todayProgress.reviewed_words }}</div>
          <div class="stat-label">复习</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ todayProgress.correct_count }}</div>
          <div class="stat-label">正确</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ todayProgress.accuracy }}%</div>
          <div class="stat-label">正确率</div>
        </div>
      </div>
    </div>

    <!-- 连续打卡 -->
    <div class="section">
      <div class="streak-card">
        <div class="streak-icon">🔥</div>
        <div class="streak-info">
          <div class="streak-value">{{ streak }}天</div>
          <div class="streak-label">连续打卡</div>
        </div>
      </div>
    </div>

    <!-- 本周报告 -->
    <div class="section">
      <h3 class="section-title">📝 本周报告</h3>
      <div class="weekly-report">
        <div class="report-item">
          <span class="report-label">活跃天数</span>
          <span class="report-value">{{ weeklyReport.active_days }}天</span>
        </div>
        <div class="report-item">
          <span class="report-label">新增单词</span>
          <span class="report-value">{{ weeklyReport.new_words }}</span>
        </div>
        <div class="report-item">
          <span class="report-label">复习单词</span>
          <span class="report-value">{{ weeklyReport.reviewed_words }}</span>
        </div>
        <div class="report-item">
          <span class="report-label">日均学习</span>
          <span class="report-value">{{ weeklyReport.daily_avg }}</span>
        </div>
      </div>
    </div>

    <!-- 总统计 -->
    <div class="section">
      <h3 class="section-title">🎯 总统计</h3>
      <div class="total-stats">
        <div class="total-item">
          <div class="total-value">{{ totalStats.total_words }}</div>
          <div class="total-label">总单词数</div>
        </div>
        <div class="total-item">
          <div class="total-value">{{ totalStats.total_reviews }}</div>
          <div class="total-label">总复习次数</div>
        </div>
        <div class="total-item">
          <div class="total-value">{{ totalStats.total_hours }}h</div>
          <div class="total-label">学习时长</div>
        </div>
      </div>
    </div>

    <!-- 掌握度分布 -->
    <div class="section">
      <h3 class="section-title">📈 掌握度分布</h3>
      <div class="mastery-chart">
        <div class="mastery-item">
          <div class="mastery-bar">
            <div
              class="mastery-fill new"
              :style="{ width: getMasteryPercentage('new') + '%' }"
            ></div>
          </div>
          <div class="mastery-label">
            <span>新词</span>
            <span>{{ masteryDistribution.new }}</span>
          </div>
        </div>
        <div class="mastery-item">
          <div class="mastery-bar">
            <div
              class="mastery-fill learning"
              :style="{ width: getMasteryPercentage('learning') + '%' }"
            ></div>
          </div>
          <div class="mastery-label">
            <span>学习中</span>
            <span>{{ masteryDistribution.learning }}</span>
          </div>
        </div>
        <div class="mastery-item">
          <div class="mastery-bar">
            <div
              class="mastery-fill familiar"
              :style="{ width: getMasteryPercentage('familiar') + '%' }"
            ></div>
          </div>
          <div class="mastery-label">
            <span>熟悉</span>
            <span>{{ masteryDistribution.familiar }}</span>
          </div>
        </div>
        <div class="mastery-item">
          <div class="mastery-bar">
            <div
              class="mastery-fill mastered"
              :style="{ width: getMasteryPercentage('mastered') + '%' }"
            ></div>
          </div>
          <div class="mastery-label">
            <span>掌握</span>
            <span>{{ masteryDistribution.mastered }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statisticsService } from '../services/StatisticsService.js'

// 数据
const todayProgress = ref({})
const streak = ref(0)
const weeklyReport = ref({})
const totalStats = ref({})
const masteryDistribution = ref({
  new: 0,
  learning: 0,
  familiar: 0,
  mastered: 0
})

// 加载数据
const loadData = async () => {
  try {
    // 今日进度
    todayProgress.value = await statisticsService.getTodayProgress()

    // 连续打卡
    streak.value = await statisticsService.calculateStreak()

    // 本周报告
    weeklyReport.value = await statisticsService.generateWeeklyReport()

    // 总统计
    totalStats.value = await statisticsService.getTotalStats()

    // 掌握度分布
    masteryDistribution.value = await statisticsService.getMasteryDistribution()
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 获取掌握度百分比
const getMasteryPercentage = (type) => {
  const total =
    masteryDistribution.value.new +
    masteryDistribution.value.learning +
    masteryDistribution.value.familiar +
    masteryDistribution.value.mastered

  if (total === 0) return 0

  return (masteryDistribution.value[type] / total * 100).toFixed(1)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.statistics-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 24px 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.section {
  margin-bottom: 24px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-regular);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.streak-card {
  background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: #fff;
  box-shadow: var(--shadow-md);
}

.streak-icon {
  font-size: 48px;
}

.streak-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 4px;
}

.streak-label {
  font-size: 14px;
  opacity: 0.9;
}

.weekly-report {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.report-label {
  font-size: 14px;
  color: var(--text-secondary);
}

.report-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--primary-color);
}

.total-stats {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.total-item {
  text-align: center;
}

.total-value {
  font-size: 32px;
  font-weight: 700;
  background: var(--primary-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.total-label {
  font-size: 13px;
  color: var(--text-secondary);
}

.mastery-chart {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.mastery-item {
  margin-bottom: 16px;
}

.mastery-item:last-child {
  margin-bottom: 0;
}

.mastery-bar {
  height: 24px;
  background: var(--border-light);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 8px;
}

.mastery-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: var(--radius-sm);
}

.mastery-fill.new {
  background: linear-gradient(90deg, #9CA3AF 0%, #6B7280 100%);
}

.mastery-fill.learning {
  background: linear-gradient(90deg, #60A5FA 0%, #3B82F6 100%);
}

.mastery-fill.familiar {
  background: linear-gradient(90deg, #34D399 0%, #10B981 100%);
}

.mastery-fill.mastered {
  background: linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%);
}

.mastery-label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--text-secondary);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .weekly-report {
    grid-template-columns: 1fr;
  }

  .total-stats {
    grid-template-columns: 1fr;
  }
}
</style>
