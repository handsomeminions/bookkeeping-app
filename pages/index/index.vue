<template>
  <view class="home">
    <!-- 顶部导航行 -->
    <view class="top-nav">
      <view class="nav-left" @longpress="showTitleEditor">
        <text class="app-title">{{ appTitle }}</text>
        <text class="app-subtitle">{{ appSubtitle }}</text>
      </view>
      <view class="nav-right">
        <view class="search-btn" @tap="goSearch">
          <AppIcon name="search" :size="36" :color="theme.isDark ? 'rgba(255,255,255,0.7)' : theme.textSub" />
        </view>
        <view class="month-picker" @tap="showMonthCalendar = true">
          <AppIcon name="calendar" :size="28" :color="theme.isDark ? 'rgba(255,255,255,0.6)' : theme.textSub" />
          <text class="month-picker-text">{{ monthDisplay }}</text>
          <text class="month-picker-arrow">▾</text>
        </view>
      </view>
    </view>

<!-- 核心数据大卡片 -->
    <view class="hero-card">
      <!-- 上半部分：本月总支出 -->
      <view class="hero-top">
        <view class="hero-top-left">
          <view class="hero-label-row">
            <text class="hero-label">本月总支出</text>
          </view>
          <view class="hero-amount-row">
            <text class="hero-amount-symbol">¥</text>
            <text class="hero-amount" :class="{ 'expense-text': balance < 0 }">{{ formatMoney(summary.expense) }}</text>
          </view>
          <view class="hero-sub" v-if="balance >= 0">
            <text class="hero-sub-text">收入大于支出，继续保持</text>
          </view>
          <view class="hero-sub" v-else>
            <text class="hero-sub-text negative">支出超过收入，注意控制</text>
          </view>
        </view>
<view class="hero-top-right">
          <view class="hero-pet-wrap" v-if="petEnabled">
            <PetSprite :pet-size="200" />
          </view>
          <view class="hero-circle" v-else>
            <AppIcon name="wallet" :size="48" :color="theme.primary" />
          </view>
        </view>
      </view>

      <!-- 下半部分：三栏数据 -->
      <view class="hero-bottom">
        <!-- 收入 -->
        <view class="hero-stat">
          <view class="hero-stat-icon income-bg">
            <AppIcon name="arrow-down" :size="24" :color="theme.income" />
          </view>
          <view class="hero-stat-text">
            <text class="hero-stat-label">本月收入</text>
            <text class="hero-stat-value income-text">¥{{ formatMoney(summary.income) }}</text>
          </view>
        </view>
        <view class="hero-stat-divider"></view>
        <!-- 预算 -->
        <view class="hero-stat">
          <view class="hero-stat-icon budget-bg">
            <AppIcon name="wallet" :size="24" :color="theme.income" />
          </view>
          <view class="hero-stat-text">
            <text class="hero-stat-label">本月预算</text>
            <text class="hero-stat-value">¥{{ formatMoney(budget) }}</text>
          </view>
        </view>
        <view class="hero-stat-divider"></view>
        <!-- 剩余预算 -->
        <view class="hero-stat">
          <view class="remain-ring-wrap">
            <image class="remain-ring-img" :src="remainRingSvg" mode="aspectFit" />
            <view class="hero-stat-icon remain-icon-inner">
              <AppIcon name="wallet" :size="24" :color="theme.primary" />
            </view>
          </view>
          <view class="hero-stat-text">
            <text class="hero-stat-label">剩余预算</text>
            <text class="hero-stat-value" :class="budget - summary.expense < 0 ? 'expense-text' : ''">¥{{ formatMoney(budget > 0 ? budget - summary.expense : 0) }}</text>
          </view>
        </view>
      </view>
    </view>


    <!-- 有数据时：今日小结 + 账单列表 -->
    <block v-if="records.length > 0">
      <!-- 今日小结卡片 -->
      <view class="today-card" v-if="todaySummary.count > 0 || todaySummary.income > 0">
        <view class="today-left">
          <view class="today-icon">
            <AppIcon name="calendar" :size="32" :color="theme.primary" />
          </view>
          <view class="today-text">
            <text class="today-label">今日</text>
            <text class="today-detail">{{ todaySummary.count }}笔支出 ¥{{ formatMoney(todaySummary.expense) }}</text>
          </view>
        </view>
        <text class="today-income" v-if="todaySummary.income > 0">+¥{{ formatMoney(todaySummary.income) }}</text>
      </view>

      <!-- 账单列表 -->
      <view class="records-section">
        <view class="record-day" v-for="group in groupedRecords" :key="group.date">
          <view class="day-header">
            <view class="day-info">
              <text class="day-date">{{ formatShortDate(group.date) }}</text>
              <text class="day-week">{{ getWeekdayText(group.date) }}</text>
            </view>
            <text class="day-summary">支 ¥{{ formatMoney(group.dayExpense) }}</text>
          </view>
          <view class="day-card">
            <view class="list-item" v-for="record in group.items" :key="record.id" @tap="goEdit(record)" @longpress="onLongPress(record)">
            <view class="category-icon" :style="{ background: getCategoryById(record.category_id).color + '22' }">
              <AppIcon :name="getCategoryById(record.category_id).icon || 'other'" :size="40" :color="getCategoryById(record.category_id).color" :src="getCategoryById(record.category_id).customIcon" />
            </view>
              <view class="record-info">
                <view class="record-info-top">
                  <text class="record-category">{{ record.category }}</text>
                  <view class="record-image-badge" v-if="record.images && record.images.length > 0" @tap.stop="previewRecordImages(record)">
                    <AppIcon name="note" :size="24" :color="theme.primary" />
                    <text class="record-image-count">{{ record.images.length }}</text>
                  </view>
                </view>
                <text class="record-note" v-if="record.note">{{ record.note }}</text>
              </view>
              <view class="record-amount-wrap">
                <text class="record-amount" :class="record.type === 'income' ? 'income-text' : 'expense-text'">
                  {{ record.type === 'income' ? '+' : '-' }}{{ formatMoney(record.amount) }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </block>

<!-- 无数据时：记账小贴士 + 本月概览 -->
    <block v-else>
      <view class="empty-state-wrap">
        <!-- 记账小贴士 -->
        <view class="tips-card">
          <view class="tips-title">
            <AppIcon name="bulb" :size="32" :color="theme.primary" />
            <text>记账小贴士</text>
          </view>
          <view class="tips-content">
            <view class="tip-row"><text class="tip-dot">·</text><text>坚持记账，清楚每一笔钱花在哪</text></view>
            <view class="tip-row"><text class="tip-dot">·</text><text>设置月度预算，超支会自动提醒</text></view>
            <view class="tip-row"><text class="tip-dot">·</text><text>统计页查看收支饼图和趋势图</text></view>
            <view class="tip-row"><text class="tip-dot">·</text><text>点击账单可以编辑，长按可以删除</text></view>
          </view>
        </view>

        <!-- 本月概览卡片 -->
        <view class="empty-overview">
          <view class="empty-overview-title">本月概览</view>
          <view class="empty-overview-row">
            <view class="eo-item">
              <text class="eo-num">{{ currentMonth.split('-')[1] }}</text>
              <text class="eo-label">当前月份</text>
            </view>
            <view class="eo-item">
              <text class="eo-num">¥0</text>
              <text class="eo-label">本月支出</text>
            </view>
            <view class="eo-item">
              <text class="eo-num">¥0</text>
              <text class="eo-label">本月收入</text>
            </view>
          </view>
        </view>
      </view>
    </block>

    <!-- 日历式月份选择弹窗 -->
    <CalendarPicker
      :visible="showMonthCalendar"
      mode="month"
      :value="currentMonth"
      @select="onCalendarSelect"
      @close="showMonthCalendar = false"
    />

    <!-- 标题编辑弹窗 -->
    <view class="title-modal-mask" v-if="showTitleModal" @tap="showTitleModal = false">
      <view class="title-modal" @tap.stop>
        <text class="title-modal-title">自定义标题</text>
        <view class="title-modal-field">
          <text class="title-modal-label">标题</text>
          <input class="title-modal-input" v-model="editTitle" placeholder="如：记账本" maxlength="10" />
        </view>
        <view class="title-modal-field">
          <text class="title-modal-label">话语</text>
          <input class="title-modal-input" v-model="editSubtitle" placeholder="如：记录每一笔，生活更有序" maxlength="20" />
        </view>
        <view class="title-modal-btns">
          <view class="title-modal-btn cancel" @tap="showTitleModal = false"><text>取消</text></view>
          <view class="title-modal-btn confirm" @tap="saveTitle"><text>保存</text></view>
        </view>
      </view>
    </view>

    <!-- 自定义底部导航栏 -->
    <AppTabBar :current="0" />
  </view>
</template>

<script>
import db from '@/utils/db.js'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import AppTabBar from '@/components/AppTabBar/AppTabBar.vue'
import CalendarPicker from '@/components/CalendarPicker/CalendarPicker.vue'
import PetSprite from '@/components/PetSprite/PetSprite.vue'
import { getCategoryById } from '@/utils/categories.js'
import { getCurrentTheme } from '@/utils/themes.js'
import { formatMoney, getCurrentMonth, formatShortDate, getWeekdayText, formatMonthChinese, getToday } from '@/utils/format.js'

export default {
  components: { AppIcon, AppTabBar, CalendarPicker, PetSprite },
  data() {
    return {
      theme: getCurrentTheme(),
      petEnabled: uni.getStorageSync('pet_enabled') !== false,
      currentMonth: '',
      monthDisplay: '',
      summary: { income: 0, expense: 0 },
      budget: 0,
      todaySummary: { income: 0, expense: 0, count: 0 },
      records: [],
      groupedRecords: [],
      todayStr: '',
      appTitle: '记账本',
      appSubtitle: '记录每一笔，生活更有序',
      showTitleModal: false,
      editTitle: '',
      editSubtitle: '',
      showMonthCalendar: false
    }
  },
  computed: {
    balance() { return this.summary.income - this.summary.expense },
    remainPercent() {
      if (this.budget <= 0) return 0
      const remain = this.budget - this.summary.expense
      const pct = (remain / this.budget) * 100
      return Math.max(0, Math.min(100, pct))
    },
    remainRingColor() {
      if (this.budget <= 0) return '#d1d5db'
      const remain = this.budget - this.summary.expense
      if (remain < 0) return '#fca5a5'
      const pct = (remain / this.budget) * 100
      if (pct >= 50) return '#6ee7b7'
      if (pct >= 20) return '#fcd34d'
      return '#fca5a5'
    },
    remainRingSvg() {
      const r = 16.5
      const c = 2 * Math.PI * r
      const offset = c * (1 - this.remainPercent / 100)
      const color = this.remainRingColor
      const bg = 'rgba(0,0,0,0.04)'
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">'
        + '<circle cx="18" cy="18" r="' + r + '" fill="none" stroke="' + bg + '" stroke-width="2"/>'
        + '<circle cx="18" cy="18" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="2" '
        + 'stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '" '
        + 'transform="rotate(-90 18 18)" stroke-linecap="round"/>'
        + '</svg>'
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    }
  },
  created() {
    uni.$on('themeChange', (theme) => { this.theme = theme })
    uni.$on('petToggle', (enabled) => { this.petEnabled = enabled })
  },
  onLoad() { this.currentMonth = getCurrentMonth(); this.todayStr = getToday(); this.loadAppTitle() },
  onShow() {
    // #ifdef APP-PLUS
    if (uni.hideTabBar) uni.hideTabBar({ animation: false })
    // #endif
    this.loadData()
  },
  onPullDownRefresh() { this.loadData().finally(() => uni.stopPullDownRefresh()) },
  onUnload() {
    uni.$off('themeChange')
    uni.$off('petToggle')
  },
  methods: {
    formatMoney, getCategoryById, formatShortDate, getWeekdayText,
    loadAppTitle() {
      const saved = uni.getStorageSync('appTitle')
      if (saved) this.appTitle = saved
      const savedSub = uni.getStorageSync('appSubtitle')
      if (savedSub) this.appSubtitle = savedSub
    },
    showTitleEditor() {
      this.editTitle = this.appTitle
      this.editSubtitle = this.appSubtitle
      this.showTitleModal = true
    },
    saveTitle() {
      this.appTitle = this.editTitle.trim() || '记账本'
      this.appSubtitle = this.editSubtitle.trim() || '记录每一笔，生活更有序'
      uni.setStorageSync('appTitle', this.appTitle)
      uni.setStorageSync('appSubtitle', this.appSubtitle)
      this.showTitleModal = false
      uni.showToast({ title: '已保存', icon: 'none' })
    },
    onCalendarSelect(val) {
      this.currentMonth = val
      this.showMonthCalendar = false
      this.loadData()
    },
    async loadData() {
      this.monthDisplay = formatMonthChinese(this.currentMonth)
      try {
        const [summary, budget, today, records] = await Promise.all([
          db.getMonthSummary(this.currentMonth),
          db.getBudget(this.currentMonth),
          db.getTodaySummary(),
          db.getRecordsByMonth(this.currentMonth)
        ])
        this.summary = summary
        this.budget = budget
        this.todaySummary = today
        this.records = records
        this.groupRecords()
      } catch (e) { console.error('加载数据失败', e) }
    },
    groupRecords() {
      const map = {}
      for (const r of this.records) {
        if (!map[r.date]) map[r.date] = { date: r.date, items: [], dayExpense: 0 }
        map[r.date].items.push(r)
        if (r.type === 'expense') map[r.date].dayExpense += r.amount
      }
      this.groupedRecords = Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
    },
    goAdd() { uni.navigateTo({ url: '/pages/add/index?month=' + this.currentMonth }) },
    goSearch() { uni.navigateTo({ url: '/pages/search/index' }) },
    goEdit(record) { uni.navigateTo({ url: '/pages/add/index?id=' + record.id }) },
    previewRecordImages(record) {
      let images = record.images
      if (!images || !Array.isArray(images) || images.length === 0) {
        // try parse if string
        if (typeof record.images === 'string') {
          try { images = JSON.parse(record.images) } catch (e) { images = [] }
        }
        if (!images || images.length === 0) return
      }
      uni.previewImage({ urls: images, current: images[0] })
    },
    onLongPress(record) {
      uni.showActionSheet({
        itemList: ['删除此条记录'],
        success: (res) => { if (res.tapIndex === 0) this.confirmDelete(record) }
      })
    },
    confirmDelete(record) {
      uni.showModal({
        title: '删除确认',
        content: `删除「${record.category} ¥${formatMoney(record.amount)}」？`,
        confirmColor: '#ef4444',
        success: async (res) => {
          if (res.confirm) {
            try { await db.deleteRecord(record.id); uni.showToast({ title: '已删除', icon: 'none' }); this.loadData() }
            catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }) }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.home { min-height: 100vh; background: var(--theme-bg-gradient); padding-top: var(--status-bar-height); padding-bottom: 160rpx; }

/* ====== 顶部导航行 ====== */
.top-nav {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16rpx 32rpx 0;
}
.nav-left { display: flex; flex-direction: column; }
.nav-right { display: flex; align-items: center; gap: 16rpx; }
.search-btn {
  display: flex; align-items: center; justify-content: center;
  width: 64rpx; height: 64rpx; border-radius: 50%;
  background: var(--theme-card-bg);
  border: 1rpx solid var(--theme-divider);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
}
.app-title { font-size: 40rpx; font-weight: 800; color: var(--theme-text-main); letter-spacing: 1rpx; }
.app-subtitle { font-size: 22rpx; color: var(--theme-text-hint); margin-top: 4rpx; }
.month-picker {
  display: flex; align-items: center; gap: 8rpx;
  background: var(--theme-card-bg); border-radius: 100rpx; padding: 12rpx 24rpx;
  border: 1rpx solid var(--theme-divider);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
}
.month-picker-text { font-size: 26rpx; color: var(--theme-text-main); font-weight: 600; }
.month-picker-arrow { font-size: 20rpx; color: var(--theme-text-hint); }

/* ====== 核心数据大卡片 ====== */
.hero-card {
  margin: 16rpx 24rpx 0; padding: 0;
  background: var(--theme-card-bg); border-radius: 28rpx;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
  overflow: hidden;
}
/* 上半部分 */
.hero-top {
  display: flex; align-items: center; justify-content: space-between;
  padding: 40rpx 36rpx 32rpx;
  background: var(--theme-gradient-soft);
}
.hero-top-left { display: flex; flex-direction: column; flex: 1; }
.hero-label-row { display: flex; align-items: center; gap: 8rpx; }
.hero-label { font-size: 26rpx; color: var(--theme-text-sub); }
.hero-amount-row { display: flex; align-items: baseline; margin: 12rpx 0 8rpx; }
.hero-amount-symbol { font-size: 36rpx; color: var(--theme-text-sub); margin-right: 6rpx; font-weight: 700; }
.hero-amount { font-size: 68rpx; font-weight: 800; color: var(--theme-text-main); letter-spacing: -1rpx; }
.hero-amount.expense-text { color: var(--theme-expense); }
.hero-sub-text { font-size: 22rpx; color: var(--theme-text-hint); }
.hero-sub-text.negative { color: var(--theme-expense); }
.hero-top-right { display: flex; align-items: center; justify-content: center; margin-right: 40rpx; }
.hero-pet-wrap {
  display: flex; align-items: center; justify-content: center;
  width: 260rpx; height: 260rpx;
}
.hero-circle {
  width: 96rpx; height: 96rpx; border-radius: 50%;
  background: var(--theme-tag-bg);
  display: flex; align-items: center; justify-content: center;
}
/* 下半部分三栏 */
.hero-bottom {
  display: flex; align-items: center;
  padding: 28rpx 24rpx;
  background: var(--theme-card-bg);
}
.hero-stat { flex: 1; display: flex; align-items: center; justify-content: center; }
.hero-stat-icon {
  width: 56rpx; height: 56rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  margin-right: 12rpx; flex-shrink: 0;
}
.income-bg { background: rgba(16,185,129,0.1); }
.budget-bg { background: rgba(245,158,11,0.1); }
.remain-bg { background: rgba(99,102,241,0.1); }
.remain-ring-wrap {
  position: relative;
  width: 76rpx; height: 76rpx;
  display: flex; align-items: center; justify-content: center;
  margin-right: 12rpx; flex-shrink: 0;
}
.remain-ring-img {
  position: absolute;
  top: 0; left: 0;
  width: 76rpx; height: 76rpx;
}
.remain-icon-inner {
  width: 52rpx; height: 52rpx;
  margin-right: 0;
}
.hero-stat-text { display: flex; flex-direction: column; }
.hero-stat-label { font-size: 20rpx; color: var(--theme-text-hint); }
.hero-stat-value { font-size: 28rpx; font-weight: 700; color: var(--theme-text-main); margin-top: 2rpx; }
.hero-stat-divider { width: 1rpx; height: 56rpx; background: var(--theme-tag-bg); }
.income-text { color: var(--theme-income); }
.expense-text { color: var(--theme-expense); }

/* ====== 今日小结卡片 ====== */
.today-card {
  display: flex; align-items: center; justify-content: space-between;
  margin: 16rpx 24rpx 0; padding: 24rpx 32rpx;
  background: var(--theme-card-bg); border-radius: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}
.today-left { display: flex; align-items: center; }
.today-icon { width: 56rpx; height: 56rpx; border-radius: 16rpx; background: var(--theme-tag-bg); display: flex; align-items: center; justify-content: center; margin-right: 16rpx; }
.today-text { display: flex; flex-direction: column; }
.today-label { font-size: 22rpx; color: var(--theme-text-hint); }
.today-detail { font-size: 28rpx; color: var(--theme-text-main); font-weight: 600; margin-top: 4rpx; }
.today-income { font-size: 30rpx; color: var(--theme-income); font-weight: 600; }

/* ====== 账单列表 ====== */
.records-section { padding: 0 0 20rpx; }
.record-day { margin-bottom: 8rpx; }
.day-header { display: flex; align-items: center; justify-content: space-between; padding: 20rpx 40rpx 8rpx; }
.day-info { display: flex; align-items: baseline; }
.day-date { font-size: 28rpx; color: var(--theme-text-sub); font-weight: 600; }
.day-week { font-size: 24rpx; color: var(--theme-text-hint); margin-left: 16rpx; }
.day-summary { font-size: 24rpx; color: var(--theme-text-hint); }
.day-card { background: var(--theme-card-bg); border-radius: 20rpx; margin: 0 24rpx; padding: 8rpx 32rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03); }
.list-item { display: flex; align-items: center; padding: 20rpx 0; border-bottom: 1rpx solid var(--theme-divider); }
.list-item:last-child { border-bottom: none; }
.record-info { flex: 1; display: flex; flex-direction: column; }
.record-info-top { display: flex; align-items: center; gap: 8rpx; }
.record-category { font-size: 30rpx; color: var(--theme-text-main); font-weight: 500; }
.record-note { font-size: 24rpx; color: var(--theme-text-hint); margin-top: 6rpx; }
.record-image-badge { display: flex; align-items: center; gap: 4rpx; background: var(--theme-tag-bg); border-radius: 8rpx; padding: 4rpx 8rpx; }
.record-image-count { font-size: 20rpx; color: var(--theme-primary); font-weight: 600; }
.record-amount-wrap { display: flex; align-items: center; justify-content: flex-end; min-width: 200rpx; }
.record-amount { font-size: 34rpx; font-weight: 700; }
.category-icon { width: 80rpx; height: 80rpx; border-radius: 24rpx; display: flex; align-items: center; justify-content: center; font-size: 40rpx; margin-right: 24rpx; flex-shrink: 0; }

/* 记账小贴士 */
.tips-card { margin: 16rpx 24rpx 20rpx; padding: 32rpx; background: var(--theme-card-bg); border-radius: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
/* 空状态容器：给底部留足空间，避免被悬浮底部导航遮挡 */
.empty-state-wrap { padding-bottom: 220rpx; }
.tips-title { font-size: 30rpx; color: var(--theme-text-main); font-weight: 600; margin-bottom: 20rpx; display: flex; align-items: center; gap: 12rpx; }
.tips-content { display: flex; flex-direction: column; gap: 12rpx; }
.tip-row { display: flex; align-items: center; }
.tip-dot { color: var(--theme-primary); font-size: 32rpx; margin-right: 12rpx; }
.tip-row text:last-child { font-size: 26rpx; color: var(--theme-text-sub); line-height: 1.6; }

/* 本月概览 */
.empty-overview { margin: 16rpx 24rpx; padding: 32rpx; background: var(--theme-card-bg); border-radius: 24rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.empty-overview-title { font-size: 30rpx; color: var(--theme-text-main); font-weight: 600; margin-bottom: 24rpx; }
.empty-overview-row { display: flex; }
.eo-item { flex: 1; display: flex; flex-direction: column; align-items: center; }
.eo-num { font-size: 36rpx; font-weight: bold; color: var(--theme-primary); margin-bottom: 8rpx; }
.eo-label { font-size: 22rpx; color: var(--theme-text-hint); }

/* ====== 标题编辑弹窗 ====== */
.title-modal-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 999;
  display: flex; align-items: center; justify-content: center;
}
.title-modal {
  width: 600rpx; background: var(--theme-card-bg); border-radius: 28rpx; padding: 40rpx 36rpx;
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,0.15);
}
.title-modal-title { font-size: 32rpx; font-weight: 700; color: var(--theme-text-main); text-align: center; margin-bottom: 32rpx; }
.title-modal-field { margin-bottom: 24rpx; }
.title-modal-label { font-size: 24rpx; color: var(--theme-text-sub); margin-bottom: 8rpx; display: block; }
.title-modal-input {
  width: 100%; height: 80rpx; border: 1rpx solid var(--theme-divider); border-radius: 16rpx;
  padding: 0 24rpx; font-size: 28rpx; color: var(--theme-text-main); background: var(--theme-tag-bg);
}
.title-modal-btns { display: flex; gap: 20rpx; margin-top: 32rpx; }
.title-modal-btn { flex: 1; height: 80rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; }
.title-modal-btn.cancel { background: var(--theme-tag-bg); }
.title-modal-btn.cancel text { font-size: 28rpx; color: var(--theme-text-sub); }
.title-modal-btn.confirm { background: var(--theme-gradient); }
.title-modal-btn.confirm text { font-size: 28rpx; color: #fff; font-weight: 600; }
</style>

