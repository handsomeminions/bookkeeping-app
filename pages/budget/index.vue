<template>
  <view class="budget-page">
    <!-- 月份选择 -->
    <view class="month-bar">
      <view class="month-arrow" @tap="prevMonth"><text>‹</text></view>
      <view class="month-title-wrap" @tap="showMonthCalendar = true">
        <text class="month-title">{{ monthDisplay }}</text>
        <text class="month-arrow-icon">▾</text>
      </view>
      <view class="month-arrow" @tap="nextMonth" v-if="canNext"><text>›</text></view>
      <view class="month-arrow placeholder" v-else><text>›</text></view>
    </view>

    <!-- 日历式月份选择弹窗 -->
    <CalendarPicker
      :visible="showMonthCalendar"
      mode="month"
      :value="currentMonth"
      @select="onCalendarSelect"
      @close="showMonthCalendar = false"
    />

    <!-- 预算概览 -->
    <view class="overview-card" :class="status">
      <view class="overview-top">
        <view class="overview-left">
          <text class="overview-label">本月预算</text>
          <text class="overview-amount">¥{{ formatMoney(budget) }}</text>
        </view>
        <view class="overview-right">
          <text class="overview-label">已支出</text>
          <text class="overview-amount">¥{{ formatMoney(summary.expense) }}</text>
        </view>
      </view>
      <view class="progress-area">
        <view class="progress-bar-bg">
          <view class="progress-bar" :style="{ width: percent + '%', background: barColor }"></view>
        </view>
        <view class="progress-info">
          <text class="progress-percent">{{ percent }}%</text>
          <text class="progress-remain" v-if="!isOver">剩余 ¥{{ formatMoney(remaining) }}</text>
          <text class="progress-remain over" v-else>超支 ¥{{ formatMoney(-remaining) }}</text>
        </view>
      </view>
      <view class="status-badge" :class="status">
        <text>{{ statusText }}</text>
      </view>
    </view>

    <!-- 快捷预设 -->
    <view class="section-title">快捷设置</view>
    <view class="preset-card">
      <view class="preset-item" v-for="amt in presets" :key="amt" @tap="setPreset(amt)">
        <text class="preset-amount">¥{{ amt }}</text>
      </view>
    </view>

    <!-- 自定义输入 -->
    <view class="section-title">自定义预算</view>
    <view class="input-card">
      <view class="input-row">
        <text class="input-symbol">¥</text>
        <text class="input-amount-text" :class="{ placeholder: !inputBudget }">{{ inputBudget || '0' }}</text>
      </view>
      <view class="mini-keypad">
        <view class="mk-row">
          <view class="mk-key" @tap="inputKey('1')">1</view>
          <view class="mk-key" @tap="inputKey('2')">2</view>
          <view class="mk-key" @tap="inputKey('3')">3</view>
          <view class="mk-key mk-del" @tap="deleteKey">⌫</view>
        </view>
        <view class="mk-row">
          <view class="mk-key" @tap="inputKey('4')">4</view>
          <view class="mk-key" @tap="inputKey('5')">5</view>
          <view class="mk-key" @tap="inputKey('6')">6</view>
          <view class="mk-key mk-ok" @tap="saveBudget()">
            <text class="mk-ok-text">保存</text>
          </view>
        </view>
        <view class="mk-row">
          <view class="mk-key" @tap="inputKey('7')">7</view>
          <view class="mk-key" @tap="inputKey('8')">8</view>
          <view class="mk-key" @tap="inputKey('9')">9</view>
        </view>
        <view class="mk-row">
          <view class="mk-key mk-zero" @tap="inputKey('0')">0</view>
          <view class="mk-key" @tap="inputKey('.')">.</view>
        </view>
      </view>
    </view>

    <!-- 清除预算 -->
    <view class="section-title">预算管理</view>
    <view class="danger-card">
      <view class="danger-item" v-if="budget > 0" @tap="clearBudget">
        <view class="danger-icon-wrap">
          <AppIcon name="trash" :size="36" :color="theme.expense" />
        </view>
        <view class="danger-info">
          <text class="danger-name">清除本月预算</text>
          <text class="danger-desc">删除 {{ monthDisplay }} 的预算设置</text>
        </view>
        <text class="func-arrow">›</text>
      </view>
      <view class="danger-item disabled" v-else>
        <view class="danger-icon-wrap">
          <AppIcon name="trash" :size="36" :color="theme.textDisabled" />
        </view>
        <view class="danger-info">
          <text class="danger-name" style="color: var(--theme-text-hint);">本月未设置预算</text>
          <text class="danger-desc">设置预算后可在此清除</text>
        </view>
      </view>
    </view>

    <!-- 统计 -->
    <view class="section-title">本月统计</view>
    <view class="stat-card">
      <view class="stat-item">
        <text class="stat-label">总支出</text>
        <text class="stat-value expense-text">¥{{ formatMoney(summary.expense) }}</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-label">日均支出</text>
        <text class="stat-value">¥{{ formatMoney(avgDaily) }}</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-label">剩余预算</text>
        <text class="stat-value" :class="{ 'expense-text': isOver }">¥{{ formatMoney(remaining) }}</text>
      </view>
    </view>

    <!-- 自定义底部导航栏 -->
    <AppTabBar :current="3" />
  </view>
</template>

<script>
import db from '@/utils/db.js'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import AppTabBar from '@/components/AppTabBar/AppTabBar.vue'
import CalendarPicker from '@/components/CalendarPicker/CalendarPicker.vue'
import { getCurrentTheme } from '@/utils/themes.js'
import { formatMoney, getCurrentMonth, formatMonth, formatMonthChinese } from '@/utils/format.js'

export default {
  components: { AppIcon, AppTabBar, CalendarPicker },
  data() {
    return {
      theme: getCurrentTheme(),
      currentMonth: '',
      monthDisplay: '',
      budget: 0,
      inputBudget: '',
      summary: { income: 0, expense: 0 },
      presets: [1000, 2000, 3000, 5000, 8000, 10000],
      showMonthCalendar: false
    }
  },
  computed: {
    percent() { return this.budget > 0 ? Math.min(100, Math.round(this.summary.expense / this.budget * 100)) : 0 },
    remaining() { return this.budget - this.summary.expense },
    isOver() { return this.remaining < 0 },
    status() { return this.isOver ? 'over' : this.percent > 80 ? 'warn' : 'good' },
    statusText() { return this.isOver ? '已超支' : this.percent > 80 ? '接近预算' : '消费正常' },
    barColor() { return this.isOver ? this.theme.expense : this.percent > 80 ? '#f59e0b' : this.theme.gradient },
    avgDaily() {
      const d = new Date()
      const day = d.getDate()
      return this.summary.expense / day
    },
    canNext() { return this.currentMonth < getCurrentMonth() }
  },
  created() {
    uni.$on('themeChange', (theme) => { this.theme = theme })
  },
  onLoad(options) {
    if (options && options.month) {
      this.currentMonth = options.month
    } else {
      this.currentMonth = getCurrentMonth()
    }
    this.loadData()
  },
  onShow() {
    // #ifdef APP-PLUS
    if (uni.hideTabBar) uni.hideTabBar({ animation: false })
    // #endif
    this.loadData()
  },
  methods: {
    formatMoney,
    async loadData() {
      this.monthDisplay = formatMonthChinese(this.currentMonth)
      try {
        const [budget, summary] = await Promise.all([
          db.getBudget(this.currentMonth),
          db.getMonthSummary(this.currentMonth)
        ])
        this.budget = budget
        this.inputBudget = budget > 0 ? String(budget) : ''
        this.summary = summary
      } catch (e) { console.error('加载失败', e) }
    },
    setPreset(amt) {
      this.inputBudget = String(amt)
      this.saveBudget(amt)
    },
    inputKey(key) {
      if (key === '.') {
        if (this.inputBudget.includes('.')) return
        if (!this.inputBudget) { this.inputBudget = '0.'; return }
        this.inputBudget += '.'
        return
      }
      if (this.inputBudget === '0') {
        this.inputBudget = key
        return
      }
      if (this.inputBudget.includes('.') && this.inputBudget.split('.')[1].length >= 2) return
      if (this.inputBudget.replace('.', '').length >= 10) return
      this.inputBudget += key
    },
    deleteKey() {
      this.inputBudget = this.inputBudget.slice(0, -1)
    },
    async saveBudget(amt) {
      // 如果 amt 是事件对象（点击按钮时传入），则忽略，使用 inputBudget
      if (amt && typeof amt !== 'number' && typeof amt !== 'string') amt = undefined
      const amount = parseFloat(amt !== undefined ? amt : this.inputBudget)
      console.log('[saveBudget] amt=', amt, 'inputBudget=', this.inputBudget, 'amount=', amount)
      if (!amount || amount <= 0) { uni.showToast({ title: '请输入金额', icon: 'none' }); return }
      try {
        await db.setBudget(this.currentMonth, amount)
        uni.showToast({ title: '预算已设置', icon: 'none' })
        this.loadData()
      } catch (e) { console.error('[saveBudget] 保存失败:', e); uni.showToast({ title: '设置失败', icon: 'none' }) }
    },
    prevMonth() { const [y,m] = this.currentMonth.split('-').map(Number); this.currentMonth = formatMonth(new Date(y, m-2, 1)); this.loadData() },
    nextMonth() { if (!this.canNext) return; const [y,m] = this.currentMonth.split('-').map(Number); this.currentMonth = formatMonth(new Date(y, m, 1)); this.loadData() },
    onCalendarSelect(val) { this.currentMonth = val; this.showMonthCalendar = false; this.loadData() },
    clearBudget() {
      uni.showModal({
        title: '清除预算',
        content: `确定要清除 ${this.monthDisplay} 的预算设置吗？`,
        confirmText: '清除', confirmColor: '#ef4444', cancelText: '取消',
        success: async (res) => {
          if (res.confirm) {
            try {
              await db.clearBudget(this.currentMonth)
              this.budget = 0
              this.inputBudget = ''
              uni.showToast({ title: '预算已清除', icon: 'none' })
              this.loadData()
            } catch (e) {
              console.error('清除预算失败', e)
              uni.showToast({ title: '清除失败', icon: 'none' })
            }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.budget-page { min-height: 100vh; background: var(--theme-bg-gradient); padding-top: var(--status-bar-height); padding-bottom: 160rpx; }

/* 月份选择 */
.month-bar { display: flex; align-items: center; justify-content: center; gap: 48rpx; padding: 24rpx 0; }
.month-title-wrap { display: flex; align-items: center; gap: 6rpx; }
.month-arrow-icon { font-size: 20rpx; color: var(--theme-text-hint); }
.month-arrow { width: 56rpx; height: 56rpx; display: flex; align-items: center; justify-content: center; }
.month-arrow text { font-size: 48rpx; color: var(--theme-primary); }
.month-arrow.placeholder { opacity: 0.3; }
.month-title { font-size: 30rpx; color: var(--theme-text-main); font-weight: 600; }

/* 概览卡片 */
.overview-card { margin: 16rpx 24rpx; padding: 32rpx; border-radius: 24rpx; box-shadow: 0 4rpx 20rpx rgba(0,0,0,0.06); }
.overview-card.good { background: var(--theme-gradient); }
.overview-card.warn { background: linear-gradient(135deg, #f59e0b, #f97316); }
.overview-card.over { background: linear-gradient(135deg, #ef4444, #f87171); }
.overview-top { display: flex; justify-content: space-between; margin-bottom: 24rpx; }
.overview-left, .overview-right { display: flex; flex-direction: column; }
.overview-label { font-size: 24rpx; color: rgba(255,255,255,0.7); }
.overview-amount { font-size: 36rpx; font-weight: bold; color: #fff; margin-top: 4rpx; }
.progress-area { margin-top: 16rpx; }
.overview-card .progress-bar-bg { background: rgba(255,255,255,0.2); height: 16rpx; }
.overview-card .progress-bar { height: 100%; border-radius: 8rpx; transition: width 0.3s; }
.progress-info { display: flex; justify-content: space-between; margin-top: 12rpx; }
.progress-percent { font-size: 26rpx; color: #fff; font-weight: 600; }
.progress-remain { font-size: 24rpx; color: rgba(255,255,255,0.8); }
.progress-remain.over { color: #fff; }
.status-badge { display: inline-block; margin-top: 16rpx; padding: 8rpx 24rpx; border-radius: 20rpx; background: rgba(255,255,255,0.2); }
.status-badge text { font-size: 24rpx; color: #fff; }

/* 段落标题 */
.section-title { font-size: 26rpx; color: var(--theme-text-hint); margin: 32rpx 32rpx 16rpx; }

/* 快捷预设 */
.preset-card { display: flex; flex-wrap: wrap; gap: 16rpx; margin: 0 24rpx; }
.preset-item { width: calc(33.33% - 16rpx); text-align: center; padding: 20rpx 0; background: var(--theme-card-bg); border-radius: 16rpx; box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03); }
.preset-item:active { background: var(--theme-tag-bg); }
.preset-amount { font-size: 30rpx; color: var(--theme-primary); font-weight: 600; }

/* 自定义输入 */
.input-card { background: var(--theme-card-bg); border-radius: 24rpx; margin: 0 24rpx; padding: 32rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03); }
.input-row { display: flex; align-items: baseline; justify-content: center; padding: 16rpx 0 28rpx; margin-bottom: 16rpx; border-bottom: 1rpx solid var(--theme-divider); }
.input-symbol { font-size: 40rpx; color: var(--theme-primary); font-weight: bold; margin-right: 8rpx; }
.input-amount-text { font-size: 64rpx; font-weight: bold; color: var(--theme-text-main); }
.input-amount-text.placeholder { color: var(--theme-text-disabled); }

/* 数字键盘 */
.mini-keypad { padding: 0; }
.mk-row { display: flex; gap: 12rpx; margin-bottom: 12rpx; }
.mk-row:last-child { margin-bottom: 0; }
.mk-key {
  flex: 1; height: 88rpx; border-radius: 16rpx; background: var(--theme-tag-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; font-weight: 600; color: var(--theme-text-main);
  transition: all 0.1s;
}
.mk-key:active { background: var(--theme-tag-bg); transform: scale(0.95); }
.mk-del { background: #fef3c7; color: #f59e0b; }
.mk-ok { background: var(--theme-gradient); color: #fff; box-shadow: 0 4rpx 16rpx var(--theme-shadow); }
.mk-ok:active { transform: scale(0.95); }
.mk-ok-text { font-size: 30rpx; font-weight: 600; }
.mk-zero { flex: 2; }

/* 统计 */
.stat-card { display: flex; background: var(--theme-card-bg); border-radius: 24rpx; margin: 0 24rpx; padding: 32rpx 0; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03); }
.stat-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.stat-label { font-size: 24rpx; color: var(--theme-text-hint); margin-bottom: 8rpx; }
.stat-value { font-size: 30rpx; font-weight: 600; color: var(--theme-text-main); }
.stat-divider { width: 1rpx; background: var(--theme-tag-bg); }

/* 清除预算 */
.danger-card { background: var(--theme-card-bg); border-radius: 24rpx; margin: 0 24rpx; padding: 0 32rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03); }
.danger-item { display: flex; align-items: center; padding: 28rpx 0; }
.danger-item.disabled { opacity: 0.6; }
.danger-icon-wrap { width: 72rpx; height: 72rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; background: var(--theme-expense-light); }
.danger-info { flex: 1; display: flex; flex-direction: column; }
.danger-name { font-size: 30rpx; color: var(--theme-expense); font-weight: 500; }
.danger-desc { font-size: 24rpx; color: var(--theme-text-hint); margin-top: 4rpx; }
.func-arrow { font-size: 36rpx; color: var(--theme-text-disabled); }
</style>
