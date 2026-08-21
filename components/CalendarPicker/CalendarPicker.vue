<template>
  <view class="cal-mask" v-if="visible" @tap="onMaskTap">
    <view class="cal-panel" @tap.stop>
      <!-- 顶部年月切换 -->
      <view class="cal-header">
        <view class="cal-arrow" @tap="prevPage"><text>‹</text></view>
        <view class="cal-title-wrap" @tap="switchMode">
          <text class="cal-title">{{ headerTitle }}</text>
          <text class="cal-title-arrow" v-if="mode === 'date'">▾</text>
        </view>
        <view class="cal-arrow" @tap="nextPage" v-if="mode !== 'year' || canNextYearPage"><text>›</text></view>
        <view class="cal-arrow placeholder" v-else><text>›</text></view>
      </view>

      <!-- 日期模式：日历网格 -->
      <view v-if="mode === 'date' && !showMonthPicker">
        <!-- 星期表头 -->
        <view class="cal-weekdays">
          <text class="cal-wd" v-for="w in weekdays" :key="w">{{ w }}</text>
        </view>
        <!-- 日期网格 -->
        <view class="cal-days-grid">
          <view
            v-for="(day, i) in dayCells"
            :key="i"
            class="cal-day-cell"
            :class="{ 'other-month': !day.curMonth, today: day.isToday, selected: day.isSelected, disabled: day.isFuture }"
            @tap="onDayTap(day)"
          >
            <text class="cal-day-num">{{ day.num }}</text>
          </view>
        </view>
      </view>

      <!-- 月份模式：12月网格 -->
      <view v-if="mode === 'month' || (mode === 'date' && showMonthPicker)" class="cal-month-grid">
        <view
          v-for="m in 12"
          :key="m"
          class="cal-month-cell"
          :class="{ selected: isSelectedMonth(m), disabled: isFutureMonth(m) }"
          @tap="onMonthTap(m)"
        >
          <text class="cal-month-num">{{ m }}月</text>
        </view>
      </view>

      <!-- 年份模式：年份网格 -->
      <view v-if="mode === 'year'" class="cal-year-grid">
        <view
          v-for="y in yearCells"
          :key="y"
          class="cal-year-cell"
          :class="{ selected: y === selectedYear, disabled: y > currentYear, 'this-year': y === currentYear }"
          @tap="onYearTap(y)"
        >
          <text class="cal-year-num">{{ y }}年</text>
        </view>
      </view>

      <!-- 底部今日按钮 -->
      <view class="cal-today-btn" @tap="goToday">
        <text>回到今年</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getCurrentTheme } from '@/utils/themes.js'

export default {
  name: 'CalendarPicker',
  props: {
    visible: { type: Boolean, default: false },
    mode: { type: String, default: 'date' }, // 'date', 'month', or 'year'
    value: { type: String, default: '' } // 'YYYY-MM-DD', 'YYYY-MM', or 'YYYY'
  },
  data() {
    return {
      theme: getCurrentTheme(),
      weekdays: ['一', '二', '三', '四', '五', '六', '日'],
      viewYear: new Date().getFullYear(),
      viewMonth: new Date().getMonth() + 1,
      showMonthPicker: false,
      yearPageStart: 0 // 年份网格起始年（用于翻页）
    }
  },
  created() {
    uni.$on('themeChange', (theme) => { this.theme = theme })
  },
  computed: {
    currentYear() { return new Date().getFullYear() },
    canNextYearPage() {
      // 下一页第一个年份（yearPageStart+12-5）不超过当前年，才允许翻
      return this.yearPageStart + 12 - 5 <= this.currentYear
    },
    headerTitle() {
      if (this.mode === 'year') {
        return this.yearCells[0] + ' - ' + this.yearCells[this.yearCells.length - 1]
      }
      if (this.mode === 'month' || this.showMonthPicker) {
        return this.viewYear + '年'
      }
      return this.viewYear + '年' + this.viewMonth + '月'
    },
    yearCells() {
      const cells = []
      // 以 yearPageStart 为中心，前5后6共12个年份
      for (let i = -5; i <= 6; i++) {
        cells.push(this.yearPageStart + i)
      }
      return cells
    },
    selectedDate() { return this.value || '' },
    selectedYear() { return this.selectedDate ? parseInt(this.selectedDate.split('-')[0]) : 0 },
    selectedMonth() { return this.selectedDate ? parseInt(this.selectedDate.split('-')[1]) : 0 },
    dayCells() {
      const firstDay = new Date(this.viewYear, this.viewMonth - 1, 1)
      let offset = firstDay.getDay() - 1
      if (offset < 0) offset = 6
      const daysInMonth = new Date(this.viewYear, this.viewMonth, 0).getDate()
      const prevMonthDays = new Date(this.viewYear, this.viewMonth - 1, 0).getDate()
      const cells = []
      const today = this.getTodayStr()
      for (let i = offset - 1; i >= 0; i--) {
        cells.push({ num: prevMonthDays - i, curMonth: false, isToday: false, isSelected: false, isFuture: false, dateStr: '' })
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = this.viewYear + '-' + String(this.viewMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0')
        cells.push({ num: d, curMonth: true, isToday: dateStr === today, isSelected: dateStr === this.selectedDate, isFuture: dateStr > today, dateStr })
      }
      const remaining = 42 - cells.length
      for (let d = 1; d <= remaining; d++) {
        cells.push({ num: d, curMonth: false, isToday: false, isSelected: false, isFuture: false, dateStr: '' })
      }
      return cells
    }
  },
  watch: {
    visible(val) { if (val) this.initView() }
  },
  methods: {
    getTodayStr() {
      const d = new Date()
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    },
    initView() {
      this.showMonthPicker = false
      if (this.mode === 'year') {
        const y = this.value ? parseInt(this.value.split('-')[0]) : this.currentYear
        // 让选中年份出现在网格中间偏右位置
        this.yearPageStart = y
      } else if (this.mode === 'month') {
        if (this.value) {
          this.viewYear = parseInt(this.value.split('-')[0])
        } else {
          this.viewYear = this.currentYear
        }
      } else {
        if (this.value) {
          const parts = this.value.split('-')
          this.viewYear = parseInt(parts[0])
          this.viewMonth = parseInt(parts[1])
        } else {
          this.viewYear = this.currentYear
          this.viewMonth = new Date().getMonth() + 1
        }
      }
    },
    switchMode() {
      if (this.mode === 'date') this.showMonthPicker = !this.showMonthPicker
    },
    prevPage() {
      if (this.mode === 'year') {
        this.yearPageStart -= 12
      } else if (this.mode === 'month' || this.showMonthPicker) {
        this.viewYear--
      } else {
        if (this.viewMonth === 1) { this.viewMonth = 12; this.viewYear-- }
        else { this.viewMonth-- }
      }
    },
    nextPage() {
      if (this.mode === 'year') {
        if (!this.canNextYearPage) return
        this.yearPageStart += 12
      } else if (this.mode === 'month' || this.showMonthPicker) {
        this.viewYear++
      } else {
        if (this.viewMonth === 12) { this.viewMonth = 1; this.viewYear++ }
        else { this.viewMonth++ }
      }
    },
    isFutureMonth(m) {
      const now = new Date()
      const curY = now.getFullYear()
      const curM = now.getMonth() + 1
      return this.viewYear > curY || (this.viewYear === curY && m > curM)
    },
    isSelectedMonth(m) {
      return this.viewYear === this.selectedYear && m === this.selectedMonth
    },
    onMonthTap(m) {
      if (this.isFutureMonth(m)) return
      if (this.mode === 'month') {
        this.$emit('select', this.viewYear + '-' + String(m).padStart(2, '0'))
        this.$emit('close')
      } else {
        this.viewMonth = m
        this.showMonthPicker = false
      }
    },
    onYearTap(y) {
      if (y > this.currentYear) return
      this.$emit('select', String(y))
      this.$emit('close')
    },
    onDayTap(day) {
      if (!day.curMonth || day.isFuture) return
      this.$emit('select', day.dateStr)
      this.$emit('close')
    },
    goToday() {
      if (this.mode === 'year') {
        this.$emit('select', String(this.currentYear))
        this.$emit('close')
      } else {
        const d = new Date()
        this.viewYear = d.getFullYear()
        this.viewMonth = d.getMonth() + 1
        if (this.mode === 'month') {
          this.$emit('select', this.viewYear + '-' + String(d.getMonth() + 1).padStart(2, '0'))
        } else {
          this.$emit('select', this.getTodayStr())
        }
        this.$emit('close')
      }
    },
    onMaskTap() { this.$emit('close') }
  }
}
</script>

<style scoped>
.cal-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4); z-index: 999;
  display: flex; align-items: center; justify-content: center;
}
.cal-panel {
  width: 640rpx; background: var(--theme-card-bg); border-radius: 28rpx; padding: 32rpx 28rpx 28rpx;
  box-shadow: 0 8rpx 40rpx rgba(0,0,0,0.15);
}
.cal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16rpx 24rpx;
}
.cal-arrow {
  width: 56rpx; height: 56rpx; border-radius: 50%; background: var(--theme-tag-bg);
  display: flex; align-items: center; justify-content: center;
}
.cal-arrow:active { background: var(--theme-tag-bg); }
.cal-arrow text { font-size: 40rpx; color: var(--theme-primary); line-height: 1; }
.cal-title-wrap { display: flex; align-items: center; gap: 8rpx; flex-wrap: nowrap; }
.cal-title { font-size: 34rpx; font-weight: 700; color: var(--theme-text-main); white-space: nowrap; }
.cal-title-arrow { font-size: 20rpx; color: var(--theme-text-hint); flex-shrink: 0; }

.cal-weekdays { display: flex; padding: 0 0 12rpx; }
.cal-wd { flex: 1; text-align: center; font-size: 22rpx; color: var(--theme-text-hint); }

.cal-days-grid { display: flex; flex-wrap: wrap; }
.cal-day-cell {
  width: calc(100% / 7); height: 84rpx;
  display: flex; align-items: center; justify-content: center;
}
.cal-day-num { font-size: 28rpx; color: var(--theme-text-sub); }
.cal-day-cell.other-month .cal-day-num { color: var(--theme-text-disabled); }
.cal-day-cell.today .cal-day-num { color: var(--theme-primary); font-weight: 700; }
.cal-day-cell.selected .cal-day-num {
  background: var(--theme-gradient); color: #fff;
  width: 56rpx; height: 56rpx; border-radius: 50%; line-height: 56rpx; text-align: center;
}
.cal-day-cell.disabled .cal-day-num { color: var(--theme-text-disabled); }

.cal-month-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.cal-month-cell {
  width: calc((100% - 32rpx) / 3); height: 100rpx;
  border-radius: 16rpx; background: var(--theme-tag-bg);
  display: flex; align-items: center; justify-content: center;
}
.cal-month-cell:active { background: var(--theme-tag-bg); }
.cal-month-num { font-size: 28rpx; color: var(--theme-text-sub); font-weight: 500; }
.cal-month-cell.selected { background: var(--theme-gradient); }
.cal-month-cell.selected .cal-month-num { color: #fff; }
.cal-month-cell.disabled { opacity: 0.3; }

/* 年份网格 */
.cal-year-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.cal-year-cell {
  width: calc((100% - 32rpx) / 3); height: 100rpx;
  border-radius: 16rpx; background: var(--theme-tag-bg);
  display: flex; align-items: center; justify-content: center;
}
.cal-year-cell:active { background: var(--theme-tag-bg); }
.cal-year-num { font-size: 28rpx; color: var(--theme-text-sub); font-weight: 500; }
.cal-year-cell.selected { background: var(--theme-gradient); }
.cal-year-cell.selected .cal-year-num { color: #fff; }
.cal-year-cell.this-year { border: 2rpx solid var(--theme-primary); }
.cal-year-cell.disabled { opacity: 0.3; }

.cal-today-btn {
  margin-top: 24rpx; height: 72rpx; border-radius: 16rpx;
  background: var(--theme-tag-bg); display: flex; align-items: center; justify-content: center;
}
.cal-today-btn:active { background: var(--theme-tag-bg); }
.cal-today-btn text { font-size: 26rpx; color: var(--theme-primary); font-weight: 600; }
</style>
