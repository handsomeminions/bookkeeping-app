<template>
  <view class="stats-page">
    <!-- 顶部控制区：粒度选择 + 周期切换 -->
    <view class="control-card">
      <view class="granularity-bar">
        <text class="gran-item" :class="{ active: granularity === 'year' }" @tap="switchGranularity('year')">年</text>
        <text class="gran-item" :class="{ active: granularity === 'month' }" @tap="switchGranularity('month')">月</text>
        <text class="gran-item" :class="{ active: granularity === 'week' }" @tap="switchGranularity('week')">周</text>
      </view>
      <view class="period-bar">
        <view class="period-arrow" @tap="prevPeriod"><text>‹</text></view>
        <view class="period-pill" @tap="showCalendarPicker = true">
          <AppIcon name="calendar" :size="28" :color="theme.isDark ? 'rgba(255,255,255,0.6)' : theme.textSub" />
          <text class="period-pill-text">{{ periodTitle }}</text>
          <text class="period-pill-arrow">▾</text>
        </view>
        <view class="period-arrow" @tap="nextPeriod" v-if="canNextPeriod"><text>›</text></view>
        <view class="period-arrow placeholder" v-else><text>›</text></view>
      </view>
    </view>

    <!-- 日历选择弹窗 -->
    <CalendarPicker
      :visible="showCalendarPicker"
      :mode="granularity === 'week' ? 'date' : granularity === 'year' ? 'year' : 'month'"
      :value="calendarPickerValue"
      @select="onCalendarSelect"
      @close="showCalendarPicker = false"
    />

    <!-- 数据统计 -->
    <view class="section-title">数据统计</view>
    <view class="stat-dual-card">
      <!-- 左卡片：总支出 -->
      <view class="stat-half-card">
        <view class="stat-card-top">
          <view class="stat-half-icon">
            <view class="stat-half-circle expense-bg">
              <AppIcon name="arrow-up" :size="26" color="#fff" />
            </view>
            <text class="stat-half-label expense-text">总支出</text>
          </view>
        </view>
        <text class="stat-half-amount">¥{{ formatMoney(periodExpense) }}</text>
        <view class="stat-half-sub">
          <view class="stat-half-sub-line">
            <text class="stat-half-sub-label">总收入</text>
            <text class="stat-half-sub-value">¥{{ formatMoney(periodIncome) }}</text>
          </view>
          <view class="stat-half-sub-line">
            <text class="stat-half-sub-label">结余</text>
            <text class="stat-half-sub-value" :class="periodBalance >= 0 ? 'income-text' : 'expense-text'">¥{{ formatMoney(Math.abs(periodBalance)) }}</text>
          </view>
        </view>
      </view>
      <!-- 右卡片：剩余预算 -->
      <view class="stat-half-card" @tap="goBudget">
        <view class="stat-card-top">
          <view class="stat-half-icon">
            <view class="stat-half-circle income-bg">
              <AppIcon name="arrow-down" :size="26" color="#fff" />
            </view>
            <text class="stat-half-label income-text">剩余预算</text>
          </view>
          <view class="stat-half-arrow"><text class="stat-half-arrow-icon">›</text></view>
        </view>
        <text class="stat-half-amount" :class="periodBudgetRemaining >= 0 ? '' : 'expense-text'">{{ periodBudgetRemaining >= 0 ? '' : '-' }}¥{{ formatMoney(Math.abs(periodBudgetRemaining)) }}</text>
        <view class="stat-half-sub">
          <view class="stat-half-sub-line">
            <text class="stat-half-sub-label">总预算</text>
            <text class="stat-half-sub-value">¥{{ formatMoney(periodBudget) }}</text>
          </view>
          <view class="stat-half-sub-line">
            <text class="stat-half-sub-label">剩余日均</text>
            <text class="stat-half-sub-value">¥{{ formatMoney(periodBudgetDailyAvg) }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 每日支出趋势 折线图 -->
    <view class="chart-card">
      <text class="card-title">{{ trendChartTitle }}</text>
      <image v-if="dailyExpenses.length > 0 && hasChartData" :src="lineChartSrc" mode="widthFix" class="chart-img" />
      <view v-else class="chart-empty">
        <text class="chart-empty-text">暂无数据</text>
      </view>
    </view>

    <!-- 周期收支视图 -->
    <view class="calendar-card">
      <view class="calendar-header">
        <text class="cal-title">{{ calendarTitle }}</text>
        <view class="cal-legend">
          <text class="cal-dot" :style="{color: theme.expense}">●</text>
          <text class="cal-legend-text">支出</text>
          <text class="cal-dot" :style="{color: theme.income}">●</text>
          <text class="cal-legend-text">收入</text>
        </view>
      </view>

      <!-- 月粒度：日历网格 -->
      <template v-if="granularity === 'month'">
        <view class="cal-weekdays">
          <text class="cal-wd" v-for="w in ['日','一','二','三','四','五','六']" :key="w">{{ w }}</text>
        </view>
        <view class="cal-grid">
          <view class="cal-cell" v-for="(cell, i) in calendarCells" :key="i" :class="{ empty: !cell.day, today: cell.isToday }">
            <view class="cal-cell-inner" v-if="cell.day" :class="{ 'has-data': cell.expense > 0 || cell.income > 0 }">
              <text class="cal-day">{{ cell.day }}</text>
              <text class="cal-expense" v-if="cell.expense > 0">-{{ formatMoney(cell.expense) }}</text>
              <text class="cal-income" v-if="cell.income > 0">+{{ formatMoney(cell.income) }}</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 年粒度：12个月网格 -->
      <template v-else-if="granularity === 'year'">
        <view class="cal-grid-year">
          <view class="cal-cell-year" v-for="(cell, i) in yearCalendarCells" :key="i" :class="{ today: cell.isCurrentMonth }">
            <view class="cal-cell-inner-year" :class="{ 'has-data': cell.expense > 0 || cell.income > 0 }">
              <text class="cal-day">{{ cell.label }}</text>
              <text class="cal-expense" v-if="cell.expense > 0">-{{ formatMoney(cell.expense) }}</text>
              <text class="cal-income" v-if="cell.income > 0">+{{ formatMoney(cell.income) }}</text>
            </view>
          </view>
        </view>
      </template>

      <!-- 周粒度：7天网格 -->
      <template v-else>
        <view class="cal-weekdays">
          <text class="cal-wd" v-for="w in ['一','二','三','四','五','六','日']" :key="w">{{ w }}</text>
        </view>
        <view class="cal-grid">
          <view class="cal-cell" v-for="(cell, i) in weekCalendarCells" :key="i" :class="{ today: cell.isToday }">
            <view class="cal-cell-inner" :class="{ 'has-data': cell.expense > 0 || cell.income > 0 }">
              <text class="cal-day">{{ cell.dateLabel }}</text>
              <text class="cal-expense" v-if="cell.expense > 0">-{{ formatMoney(cell.expense) }}</text>
              <text class="cal-income" v-if="cell.income > 0">+{{ formatMoney(cell.income) }}</text>
            </view>
          </view>
        </view>
      </template>
    </view>

    <!-- 收支分类统计 环形饼图 -->
    <view class="chart-card" v-if="categoryStats.length > 0">
      <view class="card-header">
        <text class="card-title">{{ type === 'expense' ? '支出' : '收入' }}分类统计</text>
        <view class="type-tabs-small">
          <text class="type-tab-small" :class="{ active: type === 'expense' }" @tap="switchType('expense')">支出</text>
          <text class="type-tab-small" :class="{ active: type === 'income' }" @tap="switchType('income')">收入</text>
        </view>
      </view>
      <image :src="pieChartSrc" mode="widthFix" class="chart-img" />
    </view>

    <!-- 分类排行列表 -->
    <view class="cat-rank-card" v-if="categoryStats.length > 0">
      <view class="cat-rank-item" v-for="(item, i) in categoryStats" :key="i">
        <!-- 主行：点击展开/收起 -->
        <view class="cat-rank-main" @tap="toggleCategoryExpand(item.category_id)">
          <view class="cat-rank-left">
            <view class="cat-rank-icon" :style="{ background: getColor(i) + '22' }">
              <AppIcon :name="getCategoryIcon(item.category_id)" :size="36" :color="getColor(i)" :src="getCategoryById(item.category_id).customIcon" />
            </view>
            <view class="cat-rank-info">
              <view class="cat-rank-name-row">
                <text class="cat-rank-name">{{ item.category }}</text>
                <text class="cat-rank-percent">{{ item.percent.toFixed(1) }}%</text>
              </view>
              <view class="cat-rank-progress-bg">
                <view class="cat-rank-progress" :style="{ width: item.percent + '%', background: getColor(i) }"></view>
              </view>
            </view>
          </view>
          <view class="cat-rank-right">
            <text class="cat-rank-amount" :class="type === 'expense' ? 'expense-text' : 'income-text'">¥{{ formatMoney(item.total) }}</text>
            <view class="cat-rank-count-row">
              <text class="cat-rank-count">{{ item.count }}笔</text>
              <text class="cat-rank-arrow" :class="{ expanded: expandedCategory === item.category_id }">›</text>
            </view>
          </view>
        </view>

        <!-- 展开子项：该分类下每笔记录 -->
        <view class="cat-rank-sub-list" v-if="expandedCategory === item.category_id">
          <view class="cat-rank-sub-item" v-for="(record, ri) in getCategoryRecords(item.category_id)" :key="ri">
            <view class="cat-rank-sub-left">
              <text class="cat-rank-sub-date">{{ record.date }}</text>
              <text class="cat-rank-sub-note" v-if="record.note">· {{ record.note }}</text>
            </view>
            <text class="cat-rank-sub-amount" :class="type === 'expense' ? 'expense-text' : 'income-text'">
              {{ type === 'expense' ? '-' : '+' }}¥{{ formatMoney(record.amount) }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 近6月趋势 -->
    <view class="section-title">收支趋势</view>
    <view class="trend-card" v-if="trendData.length > 0">
      <view class="trend-header">
        <text class="trend-title">{{ trendTitle }}</text>
        <view class="trend-legend">
          <view class="legend-item"><view class="legend-dot" :style="{background: theme.income}"></view><text class="legend-text">收入</text></view>
          <view class="legend-item"><view class="legend-dot" :style="{background: theme.expense}"></view><text class="legend-text">支出</text></view>
        </view>
      </view>
      <view class="bar-chart">
        <view class="bar-group" v-for="item in trendData" :key="item.month">
          <view class="bar-amounts">
            <text class="bar-amount income" v-if="item.income > 0">{{ formatMoney(item.income) }}</text>
            <text class="bar-amount expense" v-if="item.expense > 0">{{ formatMoney(item.expense) }}</text>
          </view>
          <view class="bars">
            <view class="bar bar-income" :style="{ height: getBarHeight(item.income) + 'rpx' }" v-if="item.income > 0"></view>
            <view class="bar bar-expense" :style="{ height: getBarHeight(item.expense) + 'rpx' }" v-if="item.expense > 0"></view>
          </view>
          <text class="bar-label">{{ getTrendLabel(item.month) }}</text>
        </view>
      </view>
    </view>

    <AppTabBar :current="1" />
  </view>
</template>

<script>
import db from '@/utils/db.js'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import AppTabBar from '@/components/AppTabBar/AppTabBar.vue'
import CalendarPicker from '@/components/CalendarPicker/CalendarPicker.vue'
import { getCategoryById } from '@/utils/categories.js'
import { getCurrentTheme } from '@/utils/themes.js'
import { formatMoney, getCurrentMonth, formatMonth, formatMonthChinese, getToday, parseDate } from '@/utils/format.js'

const PIE_COLORS = ['#3b82f6','#f59e0b','#8b5cf6','#ef4444','#10b981','#ec4899','#06b6d4','#84cc16','#f97316','#64748b','#a855f7','#14b8a6','#e11d48','#6366f1','#f43f5e']

export default {
  components: { AppIcon, AppTabBar, CalendarPicker },
  data() {
    return {
      theme: getCurrentTheme(),
      granularity: 'month',
      currentMonth: '',
      currentYear: 0,
      currentWeekStart: '',
      todayStr: '',
      type: 'expense',
      dailyExpenses: [],
      categoryStats: [],
      periodExpense: 0,
      periodIncome: 0,
      periodRecordDays: 0,
      periodRecordCount: 0,
      periodBudget: 0,
      periodBudgetRemaining: 0,
      periodBudgetDailyAvg: 0,
      allRecords: [],
      trendData: [],
      expandedCategory: null,
      periodRecords: [],
      showCalendarPicker: false
    }
  },
  computed: {
    periodBalance() { return this.periodIncome - this.periodExpense },
    calendarPickerValue() {
      if (this.granularity === 'week') return this.currentWeekStart
      if (this.granularity === 'month') return this.currentMonth
      return String(this.currentYear) + '-01'
    },
    hasChartData() {
      return this.dailyExpenses.some(d => d.value > 0)
    },
    periodTitle() {
      if (this.granularity === 'year') return this.currentYear + '年'
      if (this.granularity === 'week') {
        const ws = parseDate(this.currentWeekStart)
        const we = new Date(ws)
        we.setDate(ws.getDate() + 6)
        return (ws.getMonth() + 1) + '月' + ws.getDate() + '日-' + (we.getMonth() + 1) + '月' + we.getDate() + '日'
      }
      return formatMonthChinese(this.currentMonth)
    },
    periodSub() {
      if (this.granularity === 'year') return '年度统计'
      if (this.granularity === 'week') return '周度统计'
      return '月度统计'
    },
    trendChartTitle() {
      if (this.granularity === 'year') return '每月支出趋势'
      return '每日支出趋势'
    },
    trendTitle() {
      if (this.granularity === 'year') return '近3年收支趋势'
      if (this.granularity === 'week') return '近6周收支趋势'
      return '近6个月收支趋势'
    },
    canNextPeriod() {
      if (this.granularity === 'year') return this.currentYear < new Date().getFullYear()
      if (this.granularity === 'week') {
        const today = new Date()
        const weekStart = parseDate(this.currentWeekStart)
        weekStart.setDate(weekStart.getDate() + 7)
        return weekStart <= today
      }
      return this.currentMonth < getCurrentMonth()
    },
    maxTrend() {
      if (this.trendData.length === 0) return 1
      return Math.max(...this.trendData.map(d => Math.max(d.income, d.expense)), 1)
    },
    calendarCells() {
      if (this.granularity !== 'month' || !this.currentMonth) return []
      const cells = []
      const [y, m] = this.currentMonth.split('-').map(Number)
      const firstDay = new Date(y, m - 1, 1)
      const daysInMonth = new Date(y, m, 0).getDate()
      const startWeekday = firstDay.getDay()
      const today = new Date()
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
      const dayMap = {}
      for (const r of this.allRecords.filter(r => r.date.startsWith(this.currentMonth))) {
        if (!dayMap[r.date]) dayMap[r.date] = { expense: 0, income: 0 }
        if (r.type === 'expense') dayMap[r.date].expense += r.amount
        else dayMap[r.date].income += r.amount
      }
      for (let i = 0; i < startWeekday; i++) cells.push({ day: 0 })
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = this.currentMonth + '-' + String(d).padStart(2, '0')
        const data = dayMap[dateStr] || { expense: 0, income: 0 }
        cells.push({ day: d, expense: data.expense, income: data.income, isToday: dateStr === todayStr })
      }
      const remaining = (7 - (cells.length % 7)) % 7
      for (let i = 0; i < remaining; i++) cells.push({ day: 0 })
      return cells
    },
    calendarTitle() {
      if (this.granularity === 'year') return '年度收支'
      if (this.granularity === 'week') return '本周收支'
      return '日历收支'
    },
    yearCalendarCells() {
      if (this.granularity !== 'year') return []
      const yearStr = String(this.currentYear)
      const now = new Date()
      const isThisYear = now.getFullYear() === this.currentYear
      const cells = []
      for (let m = 1; m <= 12; m++) {
        const monthStr = yearStr + '-' + String(m).padStart(2, '0')
        const records = this.allRecords.filter(r => r.date.startsWith(monthStr))
        let expense = 0, income = 0
        records.forEach(r => {
          if (r.type === 'expense') expense += r.amount
          else income += r.amount
        })
        cells.push({
          label: m + '月',
          expense,
          income,
          isCurrentMonth: isThisYear && (now.getMonth() + 1) === m
        })
      }
      return cells
    },
    weekCalendarCells() {
      if (this.granularity !== 'week') return []
      const ws = parseDate(this.currentWeekStart)
      const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      const today = new Date()
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0')
      const cells = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(ws)
        d.setDate(ws.getDate() + i)
        const dateStr = this.fmtDate(d)
        const records = this.allRecords.filter(r => r.date === dateStr)
        let expense = 0, income = 0
        records.forEach(r => {
          if (r.type === 'expense') expense += r.amount
          else income += r.amount
        })
        cells.push({
          dateLabel: (d.getMonth() + 1) + '/' + d.getDate(),
          expense,
          income,
          isToday: dateStr === todayStr
        })
      }
      return cells
    },
    lineChartSrc() {
      const data = this.dailyExpenses
      if (!data || data.length === 0) return ''
      const w = 650, h = 280
      const padL = 55, padR = 15, padT = 25, padB = 35
      const cw = w - padL - padR, ch = h - padT - padB
      const maxVal = Math.max(...data.map(d => d.value), 1)
      const niceMax = this.niceMax(maxVal)
      const n = data.length
      const stepX = n > 1 ? cw / (n - 1) : 0

      const pts = data.map((d, i) => ({
        x: padL + (n > 1 ? i * stepX : cw / 2),
        y: padT + ch - (d.value / niceMax) * ch,
        label: d.label
      }))

      let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '">'
      svg += '<defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + this.theme.income + '" stop-opacity="0.25"/><stop offset="100%" stop-color="' + this.theme.income + '" stop-opacity="0"/></linearGradient></defs>'
      const yVals = [niceMax, niceMax / 2, 0]
      yVals.forEach(val => {
        const y = padT + ch - (val / niceMax) * ch
        svg += '<line x1="' + padL + '" y1="' + y + '" x2="' + (w - padR) + '" y2="' + y + '" stroke="' + (this.theme.isDark ? 'rgba(255,255,255,0.08)' : this.theme.divider) + '" stroke-width="1" stroke-dasharray="4,3"/>'
        svg += '<text x="5" y="' + (y + 4) + '" fill="' + this.theme.textHint + '" font-size="11">¥' + this.formatMoney(val) + '</text>'
      })
      if (n > 1) {
        const areaD = 'M ' + pts[0].x + ' ' + (padT + ch) + ' ' + pts.map(p => 'L ' + p.x + ' ' + p.y).join(' ') + ' L ' + pts[n-1].x + ' ' + (padT + ch) + ' Z'
        svg += '<path d="' + areaD + '" fill="url(#ag)"/>'
        const lineD = pts.map((p, i) => (i === 0 ? 'M' : 'L') + ' ' + p.x + ' ' + p.y).join(' ')
        svg += '<path d="' + lineD + '" stroke="' + this.theme.income + '" stroke-width="2" fill="none" stroke-linejoin="round" stroke-linecap="round"/>'
      } else {
        svg += '<circle cx="' + pts[0].x + '" cy="' + pts[0].y + '" r="4" fill="' + this.theme.income + '"/>'
      }
      pts.forEach(p => {
        svg += '<circle cx="' + p.x + '" cy="' + p.y + '" r="3" fill="' + this.theme.income + '"/>'
      })
      const labelStep = Math.max(1, Math.ceil(n / 7))
      pts.forEach((p, i) => {
        if (i % labelStep === 0 || i === n - 1) {
          svg += '<text x="' + p.x + '" y="' + (h - 8) + '" fill="' + this.theme.textHint + '" font-size="11" text-anchor="middle">' + p.label + '</text>'
        }
      })
      // X轴基线
      svg += '<line x1="' + padL + '" y1="' + (padT + ch) + '" x2="' + (w - padR) + '" y2="' + (padT + ch) + '" stroke="' + (this.theme.isDark ? 'rgba(255,255,255,0.08)' : this.theme.divider) + '" stroke-width="1"/>'
      svg += '</svg>'
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    },
    pieChartSrc() {
      const data = this.categoryStats
      if (!data || data.length === 0) return ''
      const total = data.reduce((s, d) => s + d.total, 0)
      if (total <= 0) return ''
      const cx = 350, cy = 300, r = 130, sw = 36
      const w = 700, h = 680
      let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '">'
      let startAngle = -90
      // 先收集每条需要标注的信息
      const labels = []
      data.forEach((item, i) => {
        if (item.percent < 0.1) return
        const color = this.getColor(i)
        const angle = (item.percent / 100) * 360
        const endAngle = startAngle + angle
        const sRad = startAngle * Math.PI / 180
        const eRad = endAngle * Math.PI / 180
        const x1 = cx + r * Math.cos(sRad)
        const y1 = cy + r * Math.sin(sRad)
        const x2 = cx + r * Math.cos(eRad)
        const y2 = cy + r * Math.sin(eRad)
        const largeArc = angle > 180 ? 1 : 0
        if (angle >= 359.9) {
          svg += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" stroke="' + color + '" stroke-width="' + sw + '" fill="none"/>'
        } else {
          svg += '<path d="M ' + x1 + ' ' + y1 + ' A ' + r + ' ' + r + ' 0 ' + largeArc + ' 1 ' + x2 + ' ' + y2 + '" stroke="' + color + '" stroke-width="' + sw + '" fill="none" stroke-linecap="butt"/>'
        }
        // 收集标注信息
        const midAngle = startAngle + angle / 2
        const midRad = midAngle * Math.PI / 180
        const lsx = cx + (r + sw/2) * Math.cos(midRad)
        const lsy = cy + (r + sw/2) * Math.sin(midRad)
        // 先按角度判断左右，后面会做均衡分配
        const isRight = Math.cos(midRad) > 0
        // 引线从环边沿角度方向短延伸的折点
        const bendLen = r + 20
        const bx = cx + bendLen * Math.cos(midRad)
        const by = cy + bendLen * Math.sin(midRad)
        labels.push({
          lsx, lsy,           // 引线起点（环边缘）
          bx, by,             // 折点（角度方向短延伸后）
          isRight,            // 初始左右分配（后面可能被均衡算法改变）
          anchor: isRight ? 'start' : 'end',
          hEndX: isRight ? cx + r + 110 : cx - r - 110,  // 水平段终点 x（后面随 isRight 更新）
          finalY: by,         // 标签的 y 坐标（后面会被防重叠调整）
          midRad,
          text: item.category + ' ' + item.percent.toFixed(1) + '%',
          color
        })
        startAngle = endAngle
      })
      // 均衡左右标签数量：如果一边比另一边多2个以上，把多的那边的标签按角度从中间分到另一边
      let rightCount = labels.filter(l => l.isRight).length
      let leftCount = labels.length - rightCount
      if (rightCount - leftCount > 1) {
        // 右边多，把右侧角度偏左的挪到左边
        const rights = labels.filter(l => l.isRight).sort((a, b) => a.midRad - b.midRad)
        const moveCount = Math.floor((rightCount - leftCount) / 2)
        for (let i = 0; i < moveCount; i++) {
          rights[i].isRight = false
          rights[i].anchor = 'end'
          rights[i].hEndX = cx - r - 110
        }
      } else if (leftCount - rightCount > 1) {
        // 左边多，把左侧角度偏右的挪到右边
        const lefts = labels.filter(l => !l.isRight).sort((a, b) => b.midRad - a.midRad)
        const moveCount = Math.floor((leftCount - rightCount) / 2)
        for (let i = 0; i < moveCount; i++) {
          lefts[i].isRight = true
          lefts[i].anchor = 'start'
          lefts[i].hEndX = cx + r + 110
        }
      }
      // 标签防重叠：按左右分组，各自按 y 坐标排序，相邻间距不足时下推
      const minGap = 22
      const groups = { right: [], left: [] }
      labels.forEach(l => { (l.isRight ? groups.right : groups.left).push(l) })
      ;['right', 'left'].forEach(side => {
        const arr = groups[side]
        arr.sort((a, b) => a.finalY - b.finalY)
        for (let i = 1; i < arr.length; i++) {
          if (arr[i].finalY - arr[i - 1].finalY < minGap) {
            arr[i].finalY = arr[i - 1].finalY + minGap
          }
        }
      })
      // 绘制引线和标签文字
      labels.forEach(l => {
        const tx = l.isRight ? l.hEndX + 8 : l.hEndX - 8
        const ty = l.finalY + 5
        svg += '<polyline points="' + l.lsx + ',' + l.lsy + ' ' + l.bx + ',' + l.by + ' ' + l.hEndX + ',' + l.finalY + '" stroke="' + (this.theme.isDark ? 'rgba(255,255,255,0.2)' : this.theme.textDisabled) + '" stroke-width="1.5" fill="none"/>'
        svg += '<text x="' + tx + '" y="' + ty + '" fill="' + this.theme.textSub + '" font-size="16" text-anchor="' + l.anchor + '">' + l.text + '</text>'
      })
      svg += '<text x="' + cx + '" y="' + (cy - 10) + '" text-anchor="middle" fill="' + this.theme.textHint + '" font-size="16">' + (this.type === 'expense' ? '总支出' : '总收入') + '</text>'
      svg += '<text x="' + cx + '" y="' + (cy + 22) + '" text-anchor="middle" fill="' + this.theme.textMain + '" font-size="28" font-weight="bold">¥' + this.formatMoney(total) + '</text>'
      svg += '</svg>'
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    },
  },
  onLoad() {
    this.todayStr = getToday()
    this.currentMonth = getCurrentMonth()
    this.currentYear = new Date().getFullYear()
    this.currentWeekStart = this.getWeekStart(getToday())
  },
  created() {
    uni.$on('themeChange', (theme) => { this.theme = theme })
  },
  onShow() {
    // #ifdef APP-PLUS
    if (uni.hideTabBar) uni.hideTabBar({ animation: false })
    // #endif
    // 切回页面时只刷新数据，不重建页面（switchTab 会缓存页面）
    this.loadData()
  },
  methods: {
    formatMoney, getCategoryById,
    getColor(i) { return PIE_COLORS[i % PIE_COLORS.length] },
    getCategoryIcon(categoryId) { return getCategoryById(categoryId).icon || 'other' },
    toggleCategoryExpand(categoryId) {
      this.expandedCategory = this.expandedCategory === categoryId ? null : categoryId
    },
    getCategoryRecords(categoryId) {
      return this.periodRecords
        .filter(r => r.category_id === categoryId && r.type === this.type)
        .sort((a, b) => b.date.localeCompare(a.date))
    },
    niceMax(val) {
      if (val <= 0) return 100
      const mag = Math.pow(10, Math.floor(Math.log10(val)))
      const norm = val / mag
      let nice
      if (norm <= 1) nice = 1
      else if (norm <= 2) nice = 2
      else if (norm <= 5) nice = 5
      else nice = 10
      return nice * mag
    },
    getWeekStart(dateStr) {
      const d = parseDate(dateStr)
      const day = d.getDay() || 7
      d.setDate(d.getDate() - day + 1)
      return this.fmtDate(d)
    },
    fmtDate(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
    },
    switchGranularity(g) {
      if (this.granularity === g) return
      this.granularity = g
      this.expandedCategory = null
      this.loadData()
    },
    onCalendarSelect(val) {
      this.showCalendarPicker = false
      this.expandedCategory = null
      if (this.granularity === 'week') {
        this.currentWeekStart = this.getWeekStart(val)
      } else if (this.granularity === 'month') {
        this.currentMonth = val
      } else {
        this.currentYear = parseInt(val.split('-')[0])
      }
      this.loadData()
    },
    switchType(t) {
      if (this.type !== t) {
        this.type = t
        this.expandedCategory = null
        this.loadData()
      }
    },
    prevPeriod() {
      if (this.granularity === 'year') {
        this.currentYear--
      } else if (this.granularity === 'month') {
        const [y, m] = this.currentMonth.split('-').map(Number)
        this.currentMonth = formatMonth(new Date(y, m - 2, 1))
      } else {
        const d = parseDate(this.currentWeekStart)
        d.setDate(d.getDate() - 7)
        this.currentWeekStart = this.fmtDate(d)
      }
      this.loadData()
    },
    nextPeriod() {
      if (!this.canNextPeriod) return
      if (this.granularity === 'year') {
        this.currentYear++
      } else if (this.granularity === 'month') {
        const [y, m] = this.currentMonth.split('-').map(Number)
        this.currentMonth = formatMonth(new Date(y, m, 1))
      } else {
        const d = parseDate(this.currentWeekStart)
        d.setDate(d.getDate() + 7)
        this.currentWeekStart = this.fmtDate(d)
      }
      this.loadData()
    },
    async loadData() {
      try {
        // 确保数据库已初始化
        await db.ensureDB()
        const allRecords = await db.getAllRecords()
        if (!allRecords) {
          console.warn('[statistics] getAllRecords 返回空')
          this.allRecords = []
        } else {
          this.allRecords = allRecords
        }

        // 获取当前周期的记录
        let periodRecords = []
        if (this.granularity === 'month') {
          periodRecords = allRecords.filter(r => r.date.startsWith(this.currentMonth))
          this.computeDailyExpensesMonth(periodRecords)
        } else if (this.granularity === 'week') {
          const ws = parseDate(this.currentWeekStart)
          const we = new Date(ws)
          we.setDate(ws.getDate() + 6)
          const start = this.fmtDate(ws)
          const end = this.fmtDate(we)
          periodRecords = allRecords.filter(r => r.date >= start && r.date <= end)
          this.computeDailyExpensesWeek(periodRecords)
        } else {
          const yearStr = String(this.currentYear)
          periodRecords = allRecords.filter(r => r.date.startsWith(yearStr))
          this.computeDailyExpensesYear(periodRecords)
        }
        this.periodRecords = periodRecords

        // 当前周期收支
        this.periodExpense = periodRecords.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
        this.periodIncome = periodRecords.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
        // 当前周期天数和笔数
        this.periodRecordDays = new Set(periodRecords.map(r => r.date)).size
        this.periodRecordCount = periodRecords.length

        // 预算（月粒度取当前月，周粒度取周所在月，年粒度取全年12个月预算总和）
        let budgetMonth = ''
        if (this.granularity === 'month') budgetMonth = this.currentMonth
        else if (this.granularity === 'week') budgetMonth = this.currentWeekStart.substring(0, 7)
        let budget = 0
        if (this.granularity === 'year') {
          // 年粒度：从数据库查该年所有月份的预算总和
          const yearBudget = await db.getBudgetsByYear(this.currentYear)
          budget = yearBudget.total
        } else if (budgetMonth) {
          budget = await db.getBudget(budgetMonth)
        }
        this.periodBudget = budget
        this.periodBudgetRemaining = budget - this.periodExpense
        // 剩余日均
        if (this.granularity === 'month' && budgetMonth) {
          const [y, m] = budgetMonth.split('-').map(Number)
          const daysInMonth = new Date(y, m, 0).getDate()
          const now = new Date()
          const isCurMonth = now.getFullYear() === y && now.getMonth() + 1 === m
          const remainingDays = isCurMonth ? (daysInMonth - now.getDate()) : 0
          this.periodBudgetDailyAvg = remainingDays > 0 ? (budget - this.periodExpense) / remainingDays : 0
        } else if (this.granularity === 'year' && this.currentYear === new Date().getFullYear()) {
          // 年粒度：当前年到年底的剩余天数
          const now = new Date()
          const endOfYear = new Date(this.currentYear, 11, 31)
          const remainingDays = Math.ceil((endOfYear - now) / 86400000)
          this.periodBudgetDailyAvg = remainingDays > 0 ? (budget - this.periodExpense) / remainingDays : 0
        } else {
          this.periodBudgetDailyAvg = 0
        }

        // 分类统计
        this.categoryStats = this.computeCategoryStats(periodRecords, this.type)

        // 趋势数据（跟随粒度和选中时间）
        this.trendData = this.computeTrendData(allRecords)
      } catch (e) {
        console.error('[statistics] loadData 加载失败', e)
        // 防止白屏：确保数据有默认值
        this.allRecords = this.allRecords || []
        this.dailyExpenses = this.dailyExpenses || []
        this.categoryStats = this.categoryStats || []
        this.trendData = this.trendData || []
      }
    },
    computeTrendData(allRecords) {
      // 根据粒度生成趋势数据，跟随选中的时间
      if (this.granularity === 'year') {
        // 年粒度：选中年 + 前2年，共3年
        const years = []
        for (let i = 2; i >= 0; i--) {
          years.push(this.currentYear - i)
        }
        return years.map(y => {
          const yStr = String(y)
          const recs = allRecords.filter(r => r.date.startsWith(yStr))
          const income = recs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
          const expense = recs.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
          return { month: String(y), income, expense }
        })
      } else if (this.granularity === 'week') {
        // 周粒度：选中周 + 前5周，共6周
        const weeks = []
        const ws = parseDate(this.currentWeekStart)
        for (let i = 5; i >= 0; i--) {
          const d = new Date(ws)
          d.setDate(d.getDate() - i * 7)
          const start = this.fmtDate(d)
          const endD = new Date(d)
          endD.setDate(endD.getDate() + 6)
          const end = this.fmtDate(endD)
          const recs = allRecords.filter(r => r.date >= start && r.date <= end)
          const income = recs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
          const expense = recs.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
          // 标签显示：月/日
          const label = (d.getMonth() + 1) + '/' + d.getDate()
          weeks.push({ month: label, income, expense })
        }
        return weeks
      } else {
        // 月粒度：选中月 + 前5个月，共6个月
        const months = []
        const [y, m] = this.currentMonth.split('-').map(Number)
        for (let i = 5; i >= 0; i--) {
          const d = new Date(y, m - 1 - i, 1)
          const yStr = d.getFullYear()
          const mStr = String(d.getMonth() + 1).padStart(2, '0')
          const monthKey = yStr + '-' + mStr
          const recs = allRecords.filter(r => r.date.startsWith(monthKey))
          const income = recs.filter(r => r.type === 'income').reduce((s, r) => s + r.amount, 0)
          const expense = recs.filter(r => r.type === 'expense').reduce((s, r) => s + r.amount, 0)
          months.push({ month: monthKey, income, expense })
        }
        return months
      }
    },
    computeCategoryStats(records, type) {
      const filtered = records.filter(r => r.type === type)
      const map = {}
      filtered.forEach(r => {
        if (!map[r.category_id]) map[r.category_id] = { category: r.category, category_id: r.category_id, total: 0, count: 0 }
        map[r.category_id].total += r.amount
        map[r.category_id].count++
      })
      const list = Object.values(map).sort((a, b) => b.total - a.total)
      const sum = list.reduce((s, item) => s + item.total, 0)
      list.forEach(item => { item.percent = sum > 0 ? (item.total / sum * 100) : 0 })
      return list
    },
    computeDailyExpensesMonth(records) {
      const [y, m] = this.currentMonth.split('-').map(Number)
      const days = new Date(y, m, 0).getDate()
      const dayMap = {}
      records.forEach(r => {
        if (r.type !== 'expense') return
        const day = parseInt(r.date.substring(8, 10))
        dayMap[day] = (dayMap[day] || 0) + r.amount
      })
      this.dailyExpenses = []
      for (let d = 1; d <= days; d++) {
        this.dailyExpenses.push({ label: d + '日', value: dayMap[d] || 0 })
      }
    },
    computeDailyExpensesWeek(records) {
      const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
      const ws = parseDate(this.currentWeekStart)
      this.dailyExpenses = []
      for (let i = 0; i < 7; i++) {
        const d = new Date(ws)
        d.setDate(ws.getDate() + i)
        const dateStr = this.fmtDate(d)
        const val = records.filter(r => r.date === dateStr && r.type === 'expense').reduce((s, r) => s + r.amount, 0)
        this.dailyExpenses.push({ label: dayNames[d.getDay()], value: val })
      }
    },
    computeDailyExpensesYear(records) {
      this.dailyExpenses = []
      for (let m = 0; m < 12; m++) {
        const monthStr = this.currentYear + '-' + String(m + 1).padStart(2, '0')
        const val = records.filter(r => r.date.startsWith(monthStr) && r.type === 'expense').reduce((s, r) => s + r.amount, 0)
        this.dailyExpenses.push({ label: (m + 1) + '月', value: val })
      }
    },
    getBarHeight(v) { return Math.max((v / this.maxTrend) * 180, 8) },
    getTrendLabel(month) {
      if (this.granularity === 'year') {
        // 年粒度：month 就是年份字符串如 "2024"
        return month + '年'
      } else if (this.granularity === 'week') {
        // 周粒度：month 是 "月/日" 格式
        return month
      } else {
        // 月粒度：month 是 "YYYY-MM" 格式
        return month.substring(5) + '月'
      }
    },
    goBudget() {
      // 把当前统计页查看的月份传给预算页
      let month = ''
      if (this.granularity === 'month') month = this.currentMonth
      else if (this.granularity === 'week') month = this.currentWeekStart.substring(0, 7)
      else if (this.granularity === 'year') month = this.currentYear + '-' + String(new Date().getMonth() + 1).padStart(2, '0')
      uni.reLaunch({ url: '/pages/budget/index?month=' + month })
    }
  }
}
</script>

<style scoped>
.stats-page {
  min-height: 100vh;
  background: var(--theme-bg-gradient);
  padding-top: var(--status-bar-height);
  padding-bottom: 160rpx;
}

/* 顶部控制区卡片 */
.control-card {
  background: var(--theme-card-bg);
  border-radius: 32rpx;
  margin: 20rpx 24rpx;
  padding: 24rpx 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.06);
}

/* 粒度选择 */
.granularity-bar {
  display: flex;
  background: var(--theme-tag-bg);
  border-radius: 20rpx;
  padding: 6rpx;
  margin-bottom: 20rpx;
}
.gran-item {
  flex: 1;
  text-align: center;
  height: 64rpx;
  line-height: 64rpx;
  font-size: 28rpx;
  border-radius: 16rpx;
  color: var(--theme-text-hint);
  font-weight: 500;
  transition: all 0.25s;
}
.gran-item.active {
  background: var(--theme-gradient);
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4rpx 16rpx var(--theme-shadow);
}

/* 周期切换 */
.period-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 40rpx;
  padding: 8rpx 0 0;
}
.period-arrow {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: var(--theme-tag-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.period-arrow:active { background: var(--theme-tag-bg); }
.period-arrow text { font-size: 44rpx; color: var(--theme-primary); }
.period-arrow.placeholder { background: transparent; opacity: 0.25; }
/* 周期选择胶囊按钮（同首页样式） */
.period-pill {
  display: flex; align-items: center; gap: 8rpx;
  background: var(--theme-card-bg); border-radius: 100rpx; padding: 12rpx 24rpx;
  border: 1rpx solid var(--theme-divider);
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.03);
}
.period-pill-text { font-size: 26rpx; color: var(--theme-text-main); font-weight: 600; }
.period-pill-arrow { font-size: 20rpx; color: var(--theme-text-hint); }

/* 图表卡片 */
.chart-card {
  background: var(--theme-card-bg);
  border-radius: 32rpx;
  margin: 16rpx 24rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.05);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}
.card-title {
  font-size: 28rpx;
  color: var(--theme-text-main);
  font-weight: 600;
  display: block;
  margin-bottom: 16rpx;
}
.card-header .card-title { margin-bottom: 0; }
.chart-img { width: 100%; }
.chart-empty { text-align: center; padding: 80rpx 0; }
.chart-empty-text { font-size: 26rpx; color: var(--theme-text-disabled); }

/* 段落标题 */
.section-title {
  font-size: 26rpx;
  color: var(--theme-text-hint);
  margin: 32rpx 32rpx 16rpx;
  font-weight: 500;
}

/* 饼图标题区小号收支切换 */
.type-tabs-small {
  display: flex;
  gap: 12rpx;
}
.type-tab-small {
  font-size: 24rpx;
  color: var(--theme-text-hint);
  padding: 6rpx 24rpx;
  border-radius: 16rpx;
  background: var(--theme-tag-bg);
  font-weight: 500;
}
.type-tab-small.active {
  background: #14b8a6;
  color: #fff;
  font-weight: 600;
}

/* 日历 */
.calendar-card {
  background: var(--theme-card-bg);
  border-radius: 32rpx;
  margin: 16rpx 24rpx;
  padding: 28rpx 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0,0,0,0.05);
}
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}
.cal-title { font-size: 28rpx; color: var(--theme-text-main); font-weight: 600; }
.cal-legend { display: flex; align-items: center; gap: 8rpx; }
.cal-dot { font-size: 16rpx; }
.cal-legend-text { font-size: 20rpx; color: var(--theme-text-hint); margin-right: 12rpx; }
.cal-weekdays { display: flex; margin-bottom: 8rpx; }
.cal-wd { flex: 1; text-align: center; font-size: 22rpx; color: var(--theme-text-hint); padding: 8rpx 0; }
.cal-grid { display: flex; flex-wrap: wrap; }
.cal-cell { width: calc(100% / 7); min-height: 100rpx; padding: 2rpx; box-sizing: border-box; }
.cal-cell-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 96rpx;
  border-radius: 12rpx;
  background: var(--theme-tag-bg);
  padding: 4rpx 0;
}
.cal-cell-inner.has-data { background: #f0fdf4; }
.cal-cell.today .cal-cell-inner { border: 2rpx solid #14b8a6; }
.cal-day { font-size: 22rpx; color: var(--theme-text-sub); font-weight: 600; }
.cal-cell.today .cal-day { color: #14b8a6; }
.cal-expense { font-size: 18rpx; color: var(--theme-expense); line-height: 1.3; }
.cal-income { font-size: 18rpx; color: var(--theme-income); line-height: 1.3; }

/* 年度收支网格（6列×2行） */
.cal-grid-year { display: flex; flex-wrap: wrap; }
.cal-cell-year { width: calc(100% / 6); padding: 3rpx; box-sizing: border-box; }
.cal-cell-inner-year {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 88rpx;
  border-radius: 12rpx;
  background: var(--theme-tag-bg);
  padding: 8rpx 0;
}
.cal-cell-inner-year.has-data { background: #f0fdf4; }
.cal-cell-year.today .cal-cell-inner-year { border: 2rpx solid #14b8a6; }
.cal-cell-year.today .cal-day { color: #14b8a6; }

/* 数据统计 - 双卡片式 */
.stat-dual-card {
  display: flex;
  gap: 20rpx;
  margin: 0 24rpx;
}
.stat-half-card {
  flex: 1;
  background: var(--theme-card-bg);
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
}
.stat-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.stat-half-icon {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.stat-half-circle {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-half-circle.expense-bg { background: #f87171; }
.stat-half-circle.income-bg { background: #34d399; }
.stat-half-symbol {
  color: #fff;
  font-size: 26rpx;
  font-weight: bold;
}
.stat-half-label {
  font-size: 26rpx;
  font-weight: 500;
}
.stat-half-arrow {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-half-arrow-icon {
  font-size: 28rpx;
  color: var(--theme-income);
}
.stat-half-amount {
  font-size: 48rpx;
  font-weight: 700;
  color: var(--theme-text-main);
  display: block;
  margin-bottom: 32rpx;
}
.stat-half-sub {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.stat-half-sub-line {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.stat-half-sub-label {
  font-size: 24rpx;
  color: var(--theme-text-hint);
  min-width: 96rpx;
}
.stat-half-sub-value {
  font-size: 24rpx;
  color: var(--theme-text-sub);
}
.expense-text { color: var(--theme-expense); }
.income-text { color: var(--theme-income); }

/* 趋势 */
.trend-card {
  background: var(--theme-card-bg);
  border-radius: 32rpx;
  margin: 0 24rpx;
  padding: 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.04);
}
.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}
.trend-title { font-size: 28rpx; color: var(--theme-text-sub); font-weight: 600; }
.trend-legend { display: flex; gap: 24rpx; }
.legend-item { display: flex; align-items: center; }
.legend-dot { width: 16rpx; height: 16rpx; border-radius: 4rpx; margin-right: 8rpx; }
.legend-text { font-size: 22rpx; color: var(--theme-text-hint); }
.bar-chart { display: flex; justify-content: space-around; align-items: flex-end; }
.bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; }
.bar-amounts { height: 40rpx; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
.bar-amount { font-size: 18rpx; line-height: 1.2; }
.bar-amount.income { color: var(--theme-income); }
.bar-amount.expense { color: var(--theme-expense); }
.bars { display: flex; align-items: flex-end; gap: 8rpx; height: 200rpx; }
.bar { width: 28rpx; border-radius: 8rpx 8rpx 0 0; min-height: 8rpx; }
.bar-income { background: linear-gradient(180deg, #34d399, var(--theme-income)); }
.bar-expense { background: linear-gradient(180deg, #f87171, var(--theme-expense)); }
.bar-label { font-size: 22rpx; color: var(--theme-text-hint); margin-top: 12rpx; }

/* 分类排行列表 */
.cat-rank-card {
  background: var(--theme-card-bg);
  border-radius: 32rpx;
  margin: 0 24rpx;
  padding: 8rpx 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
}
.cat-rank-item {
  border-bottom: 1rpx solid var(--theme-divider);
}
.cat-rank-item:last-child { border-bottom: none; }
.cat-rank-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
}
.cat-rank-left { display: flex; align-items: center; flex: 1; min-width: 0; }
.cat-rank-icon {
  width: 64rpx; height: 64rpx; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 32rpx; margin-right: 20rpx; flex-shrink: 0;
}
.cat-rank-info { flex: 1; min-width: 0; }
.cat-rank-name-row { display: flex; align-items: baseline; gap: 12rpx; }
.cat-rank-name { font-size: 28rpx; color: var(--theme-text-main); font-weight: 500; }
.cat-rank-percent { font-size: 24rpx; color: var(--theme-text-hint); }
.cat-rank-progress-bg {
  height: 10rpx; background: var(--theme-tag-bg); border-radius: 5rpx; margin-top: 10rpx; overflow: hidden;
}
.cat-rank-progress {
  height: 100%; border-radius: 5rpx; transition: width 0.3s;
}
.cat-rank-right { display: flex; flex-direction: column; align-items: flex-end; margin-left: 16rpx; }
.cat-rank-amount { font-size: 30rpx; font-weight: 700; }
.cat-rank-count-row { display: flex; align-items: center; gap: 8rpx; margin-top: 4rpx; }
.cat-rank-count { font-size: 22rpx; color: var(--theme-text-hint); }
.cat-rank-arrow {
  font-size: 28rpx; color: var(--theme-text-disabled); transition: transform 0.2s;
}
.cat-rank-arrow.expanded { transform: rotate(90deg); }

/* 展开子项 */
.cat-rank-sub-list {
  background: var(--theme-tag-bg);
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  padding: 0 24rpx;
}
.cat-rank-sub-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--theme-divider);
}
.cat-rank-sub-item:last-child { border-bottom: none; }
.cat-rank-sub-left { display: flex; align-items: center; gap: 8rpx; flex: 1; min-width: 0; }
.cat-rank-sub-date { font-size: 24rpx; color: var(--theme-text-sub); }
.cat-rank-sub-note { font-size: 22rpx; color: var(--theme-text-hint); }
.cat-rank-sub-amount { font-size: 26rpx; font-weight: 600; }
</style>




