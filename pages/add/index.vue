<template>
  <view class="add-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-back" @tap="goBack">
        <AppIcon name="arrow-left" :size="22" :color="theme.textMain" />
      </view>
      <text class="navbar-title">{{ isEdit ? '编辑' : '记一笔' }}</text>
      <view class="navbar-placeholder"></view>
    </view>
    <!-- 收入/支出切换 -->
    <view class="type-tabs">
      <view class="type-tab" :class="{ active: type === 'expense', expense: type === 'expense' }" @tap="switchType('expense')">支出</view>
      <view class="type-tab" :class="{ active: type === 'income', income: type === 'income' }" @tap="switchType('income')">收入</view>
    </view>

    <!-- 金额展示区 -->
    <view class="amount-display" :class="type">
      <text class="currency">¥</text>
      <text class="amount-text">{{ amount || '0' }}</text>
    </view>

    <!-- 分类选择 -->
    <view class="category-section">
      <view class="section-title">选择分类</view>
      <view class="category-grid">
        <view
          v-for="cat in currentCategories"
          :key="cat.id"
          class="cat-item"
          :class="{ active: selectedCategory && selectedCategory.id === cat.id }"
          @tap="selectCategory(cat)"
        >
          <view class="cat-icon" :style="{ background: selectedCategory && selectedCategory.id === cat.id ? cat.color : cat.color + '22' }">
            <AppIcon :name="cat.icon" :size="36" :color="selectedCategory && selectedCategory.id === cat.id ? '#fff' : cat.color" :src="cat.customIcon" />
          </view>
          <text class="cat-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <!-- 备注和日期 -->
    <view class="detail-section">
      <view class="detail-row" @tap="showRemarkInput = !showRemarkInput">
        <view class="detail-label-row">
          <AppIcon name="note" :size="32" :color="theme.textSub" />
          <text class="detail-label">备注</text>
        </view>
        <view class="detail-value-row">
          <text class="detail-value" :class="{ 'placeholder': !note }">{{ note || '点击添加备注' }}</text>
          <text class="detail-arrow">{{ showRemarkInput ? '▲' : '▼' }}</text>
        </view>
      </view>
      <view class="remark-input-wrap" v-if="showRemarkInput">
        <input class="remark-input" v-model="note" placeholder="写点什么..." maxlength="50" />
      </view>
      <!-- 图片选择区（只支持一张） -->
      <view class="image-section" v-if="showRemarkInput">
        <view class="image-list">
          <view class="image-thumb" v-if="images.length > 0">
            <image :src="images[0]" mode="aspectFill" class="thumb-img" @tap="previewImage" />
            <view class="thumb-delete" @tap.stop="removeImage">×</view>
          </view>
          <view class="image-add" v-if="images.length === 0" @tap="chooseImage">
            <AppIcon name="plus" :size="36" :color="theme.isDark ? 'rgba(255,255,255,0.2)' : theme.textDisabled" />
            <text class="image-add-text">添加图片</text>
          </view>
        </view>
      </view>
      <view class="detail-row" style="border-top: 1rpx solid rgba(0,0,0,0.06);">
        <view class="detail-label-row">
          <AppIcon name="calendar" :size="32" :color="theme.textSub" />
          <text class="detail-label">日期</text>
        </view>
        <view class="detail-value-row" @tap="showDatePicker = true">
          <text class="detail-value">{{ date }}</text>
          <text class="detail-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 日历日期选择弹窗 -->
    <CalendarPicker
      :visible="showDatePicker"
      mode="date"
      :value="date"
      @select="onCalendarDateSelect"
      @close="showDatePicker = false"
    />

    <!-- 自定义数字键盘 -->
    <view class="keypad">
      <view class="keypad-row">
        <view class="key" @tap="inputKey('1')">1</view>
        <view class="key" @tap="inputKey('2')">2</view>
        <view class="key" @tap="inputKey('3')">3</view>
        <view class="key key-del" @tap="deleteKey">⌫</view>
      </view>
      <view class="keypad-row">
        <view class="key" @tap="inputKey('4')">4</view>
        <view class="key" @tap="inputKey('5')">5</view>
        <view class="key" @tap="inputKey('6')">6</view>
        <view class="key key-ok" @tap="save">
          <text class="key-ok-text">{{ isEdit ? '修改' : '保存' }}</text>
        </view>
      </view>
      <view class="keypad-row">
        <view class="key" @tap="inputKey('7')">7</view>
        <view class="key" @tap="inputKey('8')">8</view>
        <view class="key" @tap="inputKey('9')">9</view>
      </view>
      <view class="keypad-row">
        <view class="key key-zero" @tap="inputKey('0')">0</view>
        <view class="key" @tap="inputKey('.')">.</view>
      </view>
    </view>
  </view>
</template>

<script>
import db from '@/utils/db.js'
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import CalendarPicker from '@/components/CalendarPicker/CalendarPicker.vue'
import { getCategoriesByType, getCategoryById } from '@/utils/categories.js'
import { getCurrentTheme } from '@/utils/themes.js'
import { getToday, getCurrentMonth } from '@/utils/format.js'

export default {
  components: { AppIcon, CalendarPicker },
  data() {
    return {
      theme: getCurrentTheme(),
      isEdit: false,
      editId: null,
      type: 'expense',
      amount: '',
      selectedCategory: null,
      note: '',
      images: [],
      date: '',
      today: '',
      showRemarkInput: false,
      catVersion: 0,
      showDatePicker: false
    }
  },
  computed: {
    currentCategories() { this.catVersion; return getCategoriesByType(this.type) }
  },
  created() {
    uni.$on('themeChange', (theme) => { this.theme = theme })
  },
  onShow() {
    // 从分类管理页返回时刷新分类列表
    this.catVersion++
    if (this.isEdit && this.editId) {
      this.loadRecord()
    } else if (!this.selectedCategory || !this.currentCategories.find(c => c.id === this.selectedCategory.id)) {
      this.selectedCategory = this.currentCategories[0]
    }
  },
  onLoad(options) {
    this.today = getToday()

    if (options.id) {
      // 编辑模式：加载已有记录
      this.isEdit = true
      this.editId = Number(options.id)
      console.log('[add/index] 进入编辑模式，editId =', this.editId, '（类型:', typeof this.editId, '）')
      this.loadRecord()
    } else {
      // 新增模式
      this.date = getToday()
      this.selectedCategory = this.currentCategories[0]

      // 如果带了 month 参数，日期默认为该月1号（如果早于今天用今天，否则用该月最后一天）
      if (options.month) {
        const [y, m] = options.month.split('-').map(Number)
        const lastDay = new Date(y, m, 0).getDate()
        const day = Math.min(new Date().getDate(), lastDay)
        // 如果是当前月，用今天；如果是过去月，用该月最后一天
        if (options.month === getCurrentMonth()) {
          this.date = getToday()
        } else {
          this.date = `${options.month}-${String(day).padStart(2, '0')}`
        }
      }
    }
  },
  methods: {
    goBack() { uni.navigateBack({ delta: 1 }) },
    async loadRecord() {
      try {
        const record = await db.getRecordById(this.editId)
        if (record) {
          this.type = record.type
          this.amount = String(record.amount)
          this.note = record.note || ''
          this.images = record.images || []
          this.date = record.date
          this.selectedCategory = getCategoryById(record.category_id)
          console.log('[add/index] loadRecord 成功:', JSON.stringify(record))
        } else {
          console.warn('[add/index] loadRecord: 未找到 id =', this.editId, '的记录')
          uni.showToast({ title: '未找到该记录', icon: 'none' })
        }
      } catch (e) {
        console.error('[add/index] loadRecord 异常:', e)
        uni.showToast({ title: '加载失败', icon: 'none' })
      }
    },
    switchType(newType) {
      if (this.type === newType) return
      this.type = newType
      this.selectedCategory = this.currentCategories[0]
    },
    selectCategory(cat) { this.selectedCategory = cat },
    onCalendarDateSelect(val) { this.date = val },
    chooseImage() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const path = res.tempFilePaths[0]
          // #ifdef H5
          const canvas = document.createElement('canvas')
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const maxW = 800
            const scale = img.width > maxW ? maxW / img.width : 1
            canvas.width = img.width * scale
            canvas.height = img.height * scale
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            try {
              this.images = [canvas.toDataURL('image/jpeg', 0.7)]
            } catch (e) {
              this.images = [path]
            }
          }
          img.src = path
          // #endif
          // #ifndef H5
          uni.compressImage({
            src: path,
            quality: 70,
            success: (compRes) => {
              this.images = [compRes.tempFilePath]
            },
            fail: () => {
              this.images = [path]
            }
          })
          // #endif
        }
      })
    },
    removeImage() {
      this.images = []
    },
    previewImage() {
      uni.previewImage({
        current: this.images[0],
        urls: this.images
      })
    },
    inputKey(key) {
      if (key === '.') {
        if (this.amount.includes('.')) return
        if (!this.amount) { this.amount = '0.'; return }
        this.amount += '.'
        return
      }
      if (this.amount === '0') {
        this.amount = key
        return
      }
      if (this.amount.includes('.') && this.amount.split('.')[1].length >= 2) return
      if (this.amount.replace('.', '').length >= 10) return
      this.amount += key
    },
    deleteKey() {
      this.amount = this.amount.slice(0, -1)
    },
    async save() {
      const amt = parseFloat(this.amount)
      if (!amt || amt <= 0) {
        uni.showToast({ title: '请输入金额', icon: 'none' })
        return
      }
      if (!this.selectedCategory) {
        uni.showToast({ title: '请选择分类', icon: 'none' })
        return
      }
      try {
        console.log('[save] 开始保存, isEdit =', this.isEdit, 'amount =', amt, 'category =', this.selectedCategory.name, 'date =', this.date)
        if (this.isEdit) {
          // 修改已有记录
          await db.updateRecord(this.editId, {
            type: this.type,
            amount: amt,
            category: this.selectedCategory.name,
            category_id: this.selectedCategory.id,
            note: this.note,
            images: this.images,
            date: this.date
          })
          console.log('[save] 修改成功')
          uni.showToast({ title: '已修改', icon: 'none' })
        } else {
          // 新增记录
          await db.addRecord({
            type: this.type,
            amount: amt,
            category: this.selectedCategory.name,
            category_id: this.selectedCategory.id,
            note: this.note,
            images: this.images,
            date: this.date
          })
          console.log('[save] 新增成功')
          uni.showToast({ title: '已记录', icon: 'none' })
        }
        setTimeout(() => uni.navigateBack(), 800)
      } catch (e) {
        console.error('[save] 保存失败:', e)
        uni.showToast({ title: '保存失败: ' + (e.message || JSON.stringify(e)), icon: 'none', duration: 3000 })
      }
    }
  }
}
</script>

<style scoped>
.add-page { min-height: 100vh; background: var(--theme-page-bg); display: flex; flex-direction: column; }

/* 自定义导航栏 */
.custom-navbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: calc(var(--status-bar-height) + 16rpx) 24rpx 16rpx;
  background: var(--theme-page-bg);
}
.navbar-back {
  width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: var(--theme-card-bg); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.navbar-title { font-size: 34rpx; font-weight: 600; color: var(--theme-text-main); }
.navbar-placeholder { width: 64rpx; }

.type-tabs { display: flex; background: var(--theme-tag-bg); border-radius: 24rpx; margin: 24rpx; padding: 6rpx; }
.type-tab { flex: 1; text-align: center; height: 72rpx; line-height: 72rpx; font-size: 30rpx; border-radius: 20rpx; color: var(--theme-text-sub); transition: all 0.3s; font-weight: 500; }
.type-tab.active.expense { background: linear-gradient(135deg, #ef4444, #f87171); color: #fff; box-shadow: 0 2rpx 8rpx rgba(239,68,68,0.3); }
.type-tab.active.income { background: linear-gradient(135deg, #10b981, #34d399); color: #fff; box-shadow: 0 2rpx 8rpx rgba(16,185,129,0.3); }

.amount-display { display: flex; align-items: baseline; justify-content: center; padding: 32rpx 0; }
.amount-display.expense .currency, .amount-display.expense .amount-text { color: var(--theme-expense); }
.amount-display.income .currency, .amount-display.income .amount-text { color: var(--theme-income); }
.currency { font-size: 48rpx; font-weight: bold; margin-right: 8rpx; }
.amount-text { font-size: 72rpx; font-weight: bold; min-width: 100rpx; }

.category-section { padding: 0 24rpx; margin-bottom: 20rpx; }
.section-title { font-size: 26rpx; color: var(--theme-text-hint); margin-bottom: 16rpx; }
.category-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.cat-item { width: calc((100% - 32rpx) / 3); display: flex; flex-direction: column; align-items: center; padding: 16rpx 0; border-radius: 20rpx; background: var(--theme-card-bg); transition: all 0.2s; }
.cat-item.active { background: var(--theme-gradient-soft); box-shadow: 0 0 0 2rpx var(--theme-primary) inset; }
.cat-icon { width: 72rpx; height: 72rpx; border-radius: 22rpx; display: flex; align-items: center; justify-content: center; font-size: 36rpx; margin-bottom: 8rpx; }
.cat-name { font-size: 24rpx; color: var(--theme-text-sub); }

.detail-section { background: var(--theme-card-bg); border-radius: 20rpx; margin: 0 24rpx; padding: 0 32rpx; }
.detail-row { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 0; }
.detail-label-row { display: flex; align-items: center; gap: 12rpx; }
.detail-label { font-size: 28rpx; color: var(--theme-text-sub); }
.detail-value-row { display: flex; align-items: center; }
.detail-value { font-size: 28rpx; color: var(--theme-text-main); }
.detail-value.placeholder { color: var(--theme-text-disabled); }
.detail-arrow { font-size: 24rpx; color: var(--theme-text-disabled); margin-left: 12rpx; }
.remark-input-wrap { padding: 0 0 16rpx; }
.remark-input { height: 72rpx; background: var(--theme-tag-bg); border-radius: 16rpx; padding: 0 24rpx; font-size: 28rpx; color: var(--theme-text-main); }

/* 图片选择区 */
.image-section { padding: 0 0 20rpx; }
.image-list { display: flex; flex-wrap: wrap; gap: 16rpx; }
.image-thumb { position: relative; width: 140rpx; height: 140rpx; border-radius: 16rpx; overflow: hidden; }
.thumb-img { width: 100%; height: 100%; }
.thumb-delete {
  position: absolute; top: 0; right: 0;
  width: 40rpx; height: 40rpx; border-radius: 0 16rpx 0 16rpx;
  background: rgba(0,0,0,0.5); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; line-height: 1;
}
.image-add {
  width: 140rpx; height: 140rpx; border-radius: 16rpx;
  background: var(--theme-tag-bg); border: 2rpx dashed var(--theme-text-disabled);
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
}
.image-add-text { font-size: 20rpx; color: var(--theme-text-hint); margin-top: 4rpx; }

.keypad { margin-top: auto; background: var(--theme-card-bg); border-radius: 24rpx 24rpx 0 0; padding: 16rpx 12rpx; box-shadow: 0 -4rpx 20rpx rgba(0,0,0,0.06); }
.keypad-row { display: flex; gap: 12rpx; margin-bottom: 12rpx; }
.keypad-row:last-child { margin-bottom: 0; }
.key {
  flex: 1; height: 96rpx; border-radius: 16rpx; background: var(--theme-tag-bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 40rpx; font-weight: 600; color: var(--theme-text-main);
  transition: all 0.1s;
}
.key:active { background: var(--theme-tag-bg); transform: scale(0.95); }
.key-del { background: #fef3c7; color: #f59e0b; }
.key-ok {
  flex: 1; background: var(--theme-gradient);
  color: #fff; border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx var(--theme-shadow);
}
.key-ok:active { transform: scale(0.95); }
.key-ok-text { font-size: 32rpx; font-weight: 600; }
.key-zero { flex: 2; }
</style>

