<template>
  <view class="search-page">
    <!-- 顶部搜索栏 -->
    <view class="search-bar">
      <view class="back-btn" @tap="goBack">
        <AppIcon name="arrow-left" :size="40" :color="theme.textMain" />
      </view>
      <view class="search-input-wrap">
        <AppIcon name="search" :size="32" :color="theme.textHint" />
        <input
          class="search-input"
          :value="keyword"
          placeholder="搜索分类名称或备注"
          placeholder-class="search-placeholder"
          confirm-type="search"
          :focus="autoFocus"
          @input="onInput"
          @confirm="doSearch"
        />
        <view v-if="keyword" class="clear-btn" @tap="clearKeyword">
          <AppIcon name="close" :size="28" :color="theme.textHint" />
        </view>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view v-if="keyword && hasSearched" class="results-section">
      <!-- 结果统计 -->
      <view class="results-header">
        <text class="results-count">共 {{ totalCount }} 条结果</text>
      </view>

      <!-- 按日期分组的结果列表 -->
      <view v-if="groupedRecords.length > 0">
        <view class="record-day" v-for="group in groupedRecords" :key="group.date">
          <view class="day-header">
            <view class="day-info">
              <text class="day-date">{{ formatFullDate(group.date) }}</text>
              <text class="day-week">{{ getWeekdayText(group.date) }}</text>
            </view>
            <text class="day-summary">支 ¥{{ formatMoney(group.dayExpense) }}</text>
          </view>
          <view class="day-card">
            <view class="list-item" v-for="record in group.items" :key="record.id" @tap="goEdit(record)">
              <view class="category-icon" :style="{ background: getCategoryById(record.category_id).color + '22' }">
                <AppIcon :name="getCategoryById(record.category_id).icon || 'other'" :size="40" :color="getCategoryById(record.category_id).color" />
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

      <!-- 无结果 -->
      <view v-else class="empty-results">
        <text class="empty-icon">🔍</text>
        <text class="empty-text">没有找到相关账单</text>
        <text class="empty-hint">试试搜索其他关键词</text>
      </view>
    </view>

    <!-- 初始状态：搜索提示 -->
    <view v-else class="initial-state">
      <view class="tip-card">
        <text class="tip-title">搜索账单</text>
        <view class="tip-list">
          <view class="tip-row"><text class="tip-dot">·</text><text>输入分类名称，如"餐饮"、"交通"</text></view>
          <view class="tip-row"><text class="tip-dot">·</text><text>输入备注关键词，如"午餐"、"打车"</text></view>
          <view class="tip-row"><text class="tip-dot">·</text><text>搜索结果按日期倒序排列</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import db from '@/utils/db.js'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { getCategoryById } from '@/utils/categories.js'
import { getCurrentTheme } from '@/utils/themes.js'
import { formatMoney, formatFullDate, getWeekdayText } from '@/utils/format.js'

export default {
  components: { AppIcon },
  data() {
    return {
      theme: getCurrentTheme(),
      keyword: '',
      autoFocus: true,
      hasSearched: false,
      results: [],
      groupedRecords: [],
      totalCount: 0,
      timer: null
    }
  },
  created() {
    uni.$on('themeChange', (theme) => { this.theme = theme })
  },
  onUnload() {
    uni.$off('themeChange')
    if (this.timer) clearTimeout(this.timer)
  },
  methods: {
    formatMoney, getCategoryById, formatFullDate, getWeekdayText,
    goBack() { uni.navigateBack({ delta: 1 }) },
    onInput(e) {
      this.keyword = e.detail.value
      this.hasSearched = true
      // 防抖 300ms
      if (this.timer) clearTimeout(this.timer)
      this.timer = setTimeout(() => {
        this.doSearch()
      }, 300)
    },
    async doSearch() {
      const kw = (this.keyword || '').trim()
      if (!kw) {
        this.hasSearched = false
        this.results = []
        this.groupedRecords = []
        this.totalCount = 0
        return
      }
      try {
        const records = await db.searchRecords(kw)
        this.results = records
        this.totalCount = records.length
        this.groupRecords()
      } catch (e) {
        console.error('搜索失败', e)
        this.results = []
        this.groupedRecords = []
        this.totalCount = 0
      }
    },
    groupRecords() {
      const map = {}
      for (const r of this.results) {
        if (!map[r.date]) map[r.date] = { date: r.date, items: [], dayExpense: 0 }
        map[r.date].items.push(r)
        if (r.type === 'expense') map[r.date].dayExpense += r.amount
      }
      this.groupedRecords = Object.values(map).sort((a, b) => b.date.localeCompare(a.date))
    },
    clearKeyword() {
      this.keyword = ''
      this.hasSearched = false
      this.results = []
      this.groupedRecords = []
      this.totalCount = 0
    },
    goEdit(record) {
      uni.navigateTo({ url: '/pages/add/index?id=' + record.id })
    },
    previewRecordImages(record) {
      let images = record.images
      if (!images || !Array.isArray(images) || images.length === 0) {
        if (typeof record.images === 'string') {
          try { images = JSON.parse(record.images) } catch (e) { images = [] }
        }
        if (!images || images.length === 0) return
      }
      uni.previewImage({ urls: images, current: images[0] })
    }
  }
}
</script>

<style scoped>
.search-page { min-height: 100vh; background: var(--theme-bg-gradient); padding-top: var(--status-bar-height); }

/* 搜索栏 */
.search-bar {
  display: flex; align-items: center;
  padding: 16rpx 24rpx 16rpx;
  gap: 16rpx;
}
.back-btn { display: flex; align-items: center; justify-content: center; width: 64rpx; height: 64rpx; flex-shrink: 0; }
.search-input-wrap {
  flex: 1; display: flex; align-items: center; gap: 12rpx;
  background: var(--theme-card-bg); border-radius: 100rpx; padding: 16rpx 28rpx;
  border: 1rpx solid var(--theme-divider);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
}
.search-input { flex: 1; font-size: 28rpx; color: var(--theme-text-main); }
.search-placeholder { color: var(--theme-text-hint); font-size: 28rpx; }
.clear-btn { display: flex; align-items: center; justify-content: center; width: 40rpx; height: 40rpx; flex-shrink: 0; }

/* 结果统计 */
.results-section { padding-bottom: 160rpx; }
.results-header { padding: 16rpx 40rpx; }
.results-count { font-size: 24rpx; color: var(--theme-text-hint); }

/* 按日期分组 */
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
.category-icon { width: 80rpx; height: 80rpx; border-radius: 24rpx; display: flex; align-items: center; justify-content: center; margin-right: 24rpx; flex-shrink: 0; }
.income-text { color: var(--theme-income); }
.expense-text { color: var(--theme-expense); }

/* 无结果 */
.empty-results { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; }
.empty-icon { font-size: 80rpx; margin-bottom: 24rpx; }
.empty-text { font-size: 30rpx; color: var(--theme-text-sub); margin-bottom: 12rpx; }
.empty-hint { font-size: 24rpx; color: var(--theme-text-hint); }

/* 初始状态 */
.initial-state { padding: 40rpx 24rpx; }
.tip-card { background: var(--theme-card-bg); border-radius: 24rpx; padding: 40rpx 36rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04); }
.tip-title { font-size: 32rpx; font-weight: 600; color: var(--theme-text-main); margin-bottom: 24rpx; display: block; }
.tip-list { display: flex; flex-direction: column; gap: 16rpx; }
.tip-row { display: flex; align-items: center; }
.tip-dot { color: var(--theme-primary); font-size: 36rpx; margin-right: 12rpx; line-height: 1; }
.tip-row text:last-child { font-size: 26rpx; color: var(--theme-text-sub); line-height: 1.6; }
</style>
