<template>
  <view class="cat-manage-page">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-back" @tap="goBack">
        <AppIcon name="arrow-left" :size="22" :color="theme.textMain" />
      </view>
      <text class="navbar-title">分类管理</text>
      <view class="navbar-placeholder"></view>
    </view>
    <!-- 支出/收入切换 -->
    <view class="granularity-bar">
      <view class="gran-item" :class="{ active: type === 'expense' }" @tap="switchType('expense')">支出分类</view>
      <view class="gran-item" :class="{ active: type === 'income' }" @tap="switchType('income')">收入分类</view>
    </view>

    <!-- 提示 -->
    <view class="tip-bar">
      <text class="tip-text">勾选显示分类 · 长按拖动排序 · 点击编辑/删除</text>
    </view>

    <!-- 分类列表（可拖动排序） -->
    <view class="cat-list">
      <view
        v-for="(cat, index) in currentList"
        :key="cat.id"
        class="cat-row"
        :class="{ dragging: dragIndex === index, 'drag-over': dragOverIndex === index && dragIndex >= 0 && dragIndex !== index, hidden: cat.visible === false }"
        :data-index="index"
        @touchstart="onTouchStart($event, index)"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
        @longpress="onLongPress(index)"
      >
        <!-- 勾选框 -->
        <view class="check-box" :class="{ checked: cat.visible !== false }" @tap.stop="onToggleVisible(cat)">
          <text v-if="cat.visible !== false" class="check-icon">✓</text>
        </view>

        <!-- 拖动手柄 -->
        <view class="drag-handle">
          <AppIcon name="drag" :size="32" :color="theme.textHint" />
        </view>

        <!-- 图标 -->
        <view class="cat-icon" :style="{ background: cat.color + '22' }">
          <AppIcon :name="cat.icon || 'other'" :size="36" :color="cat.color" :src="cat.customIcon" />
        </view>

        <!-- 名称 -->
        <text class="cat-name">{{ cat.name }}</text>

        <!-- 操作按钮 -->
        <view class="cat-actions">
          <view class="action-btn edit-btn" @tap.stop="onEdit(cat)">
            <text>编辑</text>
          </view>
          <view class="action-btn delete-btn" @tap.stop="onDelete(cat)">
            <text>删除</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 添加新分类 -->
    <view class="add-card" @tap="onAdd">
      <view class="add-icon">＋</view>
      <text class="add-text">添加新分类</text>
    </view>

    <!-- 重置按钮 -->
    <view class="reset-btn" @tap="onReset">
      <text>恢复默认分类</text>
    </view>

    <!-- 添加/编辑弹窗 -->
    <view class="modal-mask" v-if="showModal" @tap="showModal = false">
      <view class="modal-content" @tap.stop>
        <text class="modal-title">{{ editingCat ? '编辑分类' : '添加分类' }}</text>

        <!-- 图标选择 -->
        <view class="modal-section">
          <text class="modal-label">选择图标</text>
          <view class="icon-picker">
            <!-- 自定义图片入口 -->
            <view class="icon-option custom-photo" :class="{ active: formData.customIcon }" @tap="choosePhoto">
              <image v-if="formData.customIcon" :src="formData.customIcon" mode="aspectFill" class="custom-photo-img" />
              <view v-else class="custom-photo-placeholder">
                <AppIcon name="plus" :size="28" :color="theme.textHint" />
                <text class="custom-photo-text">自定义</text>
              </view>
            </view>
            <!-- 预设图标 -->
            <view
              v-for="iconName in iconOptions"
              :key="iconName"
              class="icon-option"
              :class="{ active: !formData.customIcon && formData.icon === iconName }"
              @tap="selectPresetIcon(iconName)"
            >
              <AppIcon :name="iconName" :size="32" color="currentColor" />
            </view>
          </view>
          <text v-if="formData.customIcon" class="custom-photo-tip" @tap="formData.customIcon = ''">已选择自定义图片，点击移除</text>
        </view>

        <!-- 颜色选择 -->
        <view class="modal-section">
          <text class="modal-label">选择颜色</text>
          <view class="color-picker">
            <view
              v-for="color in colorOptions"
              :key="color"
              class="color-option"
              :style="{ background: color }"
              :class="{ active: formData.color === color }"
              @tap="formData.color = color"
            ></view>
          </view>
        </view>

        <!-- 名称输入 -->
        <view class="modal-section">
          <text class="modal-label">分类名称</text>
          <input class="modal-input" v-model="formData.name" placeholder="如：餐饮" maxlength="8" />
        </view>

        <!-- 预览 -->
        <view class="modal-section">
          <text class="modal-label">预览</text>
          <view class="preview-box">
            <view class="cat-icon" :style="{ background: formData.color + '22' }">
              <AppIcon :name="formData.icon || 'other'" :size="36" :color="formData.color" :src="formData.customIcon" />
            </view>
            <text class="cat-name">{{ formData.name || '分类名称' }}</text>
          </view>
        </view>

        <!-- 按钮 -->
        <view class="modal-actions">
          <view class="modal-btn cancel" @tap="showModal = false">取消</view>
          <view class="modal-btn confirm" @tap="onConfirm">确定</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { getCurrentTheme } from '@/utils/themes.js'
import { loadCategories, saveCategories, addCategory, deleteCategory, updateCategory, resetCategories, toggleCategoryVisible, getAllCategoriesByType } from '@/utils/categories.js'

export default {
  components: { AppIcon },
  data() {
    return {
      theme: getCurrentTheme(),
      type: 'expense',
      allCategories: [],
      currentList: [],
      showModal: false,
      editingCat: null,
      formData: { name: '', icon: 'other', color: '#6366f1', customIcon: '' },
      dragIndex: -1,
      dragOverIndex: -1,
      startY: 0,
      iconOptions: ['food','transport','shopping','entertainment','housing','medical','education','communication','daily','snack','clothing','beauty','pet','travel','gift','salary','bonus','investment','parttime','redpacket','refund','other','coffee','film','music','sport','ball','wine','taxi','bulb','tool','star','heart','note','calendar','edit'],
      colorOptions: ['#ff9800','#2196f3','#e91e63','#9c27b0','#795548','#f44336','#3f51b5','#009688','#607d8b','#ff5722','#673ab7','#ec407a','#8d6e63','#00bcd4','#ff7043','#4caf50','#8bc34a','#43a047','#26a69a','#ef5350','#66bb6a','#6366f1','#9e9e9e']
    }
  },
  onLoad() { this.loadList() },
  onShow() { this.loadList() },
  created() {
    uni.$on('themeChange', (theme) => { this.theme = theme })
  },
  methods: {
    goBack() { uni.navigateBack({ delta: 1 }) },
    loadList() {
      this.allCategories = loadCategories()
      this.refreshCurrentList()
    },
    refreshCurrentList() {
      this.currentList = getAllCategoriesByType(this.type)
    },
    switchType(t) {
      if (this.type === t) return
      this.type = t
      this.refreshCurrentList()
    },
    onAdd() {
      this.editingCat = null
      this.formData = { name: '', icon: 'other', color: '#6366f1', customIcon: '' }
      this.showModal = true
    },
    onEdit(cat) {
      this.editingCat = cat
      this.formData = { name: cat.name, icon: cat.icon, color: cat.color, customIcon: cat.customIcon || '' }
      this.showModal = true
    },
    onConfirm() {
      if (!this.formData.name.trim()) {
        uni.showToast({ title: '请输入分类名称', icon: 'none' })
        return
      }
      const iconData = this.formData.customIcon
        ? { icon: 'custom', customIcon: this.formData.customIcon, color: this.formData.color }
        : { icon: this.formData.icon, color: this.formData.color }
      if (this.editingCat) {
        updateCategory(this.editingCat.id, {
          name: this.formData.name.trim(),
          ...iconData
        })
        uni.showToast({ title: '已修改', icon: 'none' })
      } else {
        addCategory({
          name: this.formData.name.trim(),
          ...iconData,
          type: this.type
        })
        uni.showToast({ title: '已添加', icon: 'none' })
      }
      this.showModal = false
      this.loadList()
    },
    onDelete(cat) {
      uni.showModal({
        title: '删除分类',
        content: `删除「${cat.name}」分类？已使用该分类的记录不受影响，但将显示为「其他」`,
        confirmColor: '#ef4444',
        success: (res) => {
          if (res.confirm) {
            deleteCategory(cat.id)
            uni.showToast({ title: '已删除', icon: 'none' })
            this.loadList()
          }
        }
      })
    },
    onReset() {
      uni.showModal({
        title: '恢复默认',
        content: '所有自定义分类将被重置为默认设置，确定吗？',
        confirmColor: this.theme.primary,
        success: (res) => {
          if (res.confirm) {
            this.allCategories = resetCategories()
            this.refreshCurrentList()
            uni.showToast({ title: '已恢复默认', icon: 'none' })
          }
        }
      })
    },
    onToggleVisible(cat) {
      toggleCategoryVisible(cat.id)
      this.loadList()
    },
    selectPresetIcon(iconName) {
      this.formData.icon = iconName
      this.formData.customIcon = ''
    },
    choosePhoto() {
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const tempPath = res.tempFilePaths[0]
          // H5 端用 FileReader 转 base64
          // #ifdef H5
          const canvas = document.createElement('canvas')
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            const targetSize = 120
            canvas.width = targetSize
            canvas.height = targetSize
            const ctx = canvas.getContext('2d')
            ctx.drawImage(img, 0, 0, targetSize, targetSize)
            try {
              this.formData.customIcon = canvas.toDataURL('image/png')
            } catch (e) {
              // 跨域降级：直接用临时路径
              this.formData.customIcon = tempPath
            }
          }
          img.src = tempPath
          // #endif
          // #ifndef H5
          this.formData.customIcon = tempPath
          // #endif
        }
      })
    },
    // ====== 长按拖动排序 ======
    onLongPress(index) {
      this.dragIndex = index
      uni.vibrateShort && uni.vibrateShort()
    },
    onTouchStart(e, index) {
      if (this.dragIndex < 0) return
      const touch = e.touches[0]
      this.startY = touch.clientY
    },
    onTouchMove(e) {
      if (this.dragIndex < 0) return
      const touch = e.touches[0]
      const deltaY = touch.clientY - this.startY
      // 估算每行高度约 120px（视屏幕而定）
      const rowHeight = 60 // 屏幕像素估算
      const moveSteps = Math.round(deltaY / rowHeight)
      let newIndex = this.dragIndex + moveSteps
      newIndex = Math.max(0, Math.min(this.currentList.length - 1, newIndex))
      if (newIndex !== this.dragOverIndex) {
        this.dragOverIndex = newIndex
      }
    },
    onTouchEnd() {
      if (this.dragIndex >= 0 && this.dragOverIndex >= 0 && this.dragIndex !== this.dragOverIndex) {
        // 在 currentList 中交换位置
        const list = [...this.currentList]
        const item = list.splice(this.dragIndex, 1)[0]
        list.splice(this.dragOverIndex, 0, item)
        this.currentList = list

        // 同步到 allCategories
        const expenseList = this.allCategories.filter(c => c.type === 'expense')
        const incomeList = this.allCategories.filter(c => c.type === 'income')
        if (this.type === 'expense') {
          this.allCategories = [...this.currentList, ...incomeList]
        } else {
          this.allCategories = [...expenseList, ...this.currentList]
        }
        saveCategories(this.allCategories)
        uni.showToast({ title: '已调整顺序', icon: 'none' })
      }
      this.dragIndex = -1
      this.dragOverIndex = -1
    }
  }
}
</script>

<style scoped>
.cat-manage-page {
  min-height: 100vh;
  background: var(--theme-page-bg);
  padding-bottom: 60rpx;
}

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

/* 切换栏 */
.granularity-bar {
  display: flex;
  background: rgba(226, 232, 240, 0.6);
  border-radius: 24rpx;
  margin: 16rpx 48rpx;
  padding: 6rpx;
}
.gran-item {
  flex: 1;
  text-align: center;
  height: 68rpx;
  line-height: 68rpx;
  font-size: 28rpx;
  border-radius: 20rpx;
  color: var(--theme-text-hint);
  font-weight: 500;
  transition: all 0.2s;
}
.gran-item.active {
  background: var(--theme-card-bg);
  color: var(--theme-primary);
  font-weight: 600;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}

/* 提示 */
.tip-bar {
  text-align: center;
  padding: 8rpx 0 16rpx;
}
.tip-text {
  font-size: 22rpx;
  color: var(--theme-text-hint);
}

/* 分类列表 */
.cat-list {
  margin: 0 24rpx;
  background: var(--theme-card-bg);
  border-radius: 24rpx;
  padding: 0 32rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
}
.cat-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid var(--theme-divider);
  transition: opacity 0.2s, transform 0.2s;
}
.cat-row:last-child {
  border-bottom: none;
}
.cat-row.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}
.cat-row.drag-over {
  border-top: 3rpx solid var(--theme-primary);
}
.cat-row.hidden {
  opacity: 0.4;
}
.cat-row.hidden .cat-name {
  text-decoration: line-through;
  color: var(--theme-text-hint);
}

/* 勾选框 */
.check-box {
  width: 40rpx;
  height: 40rpx;
  border-radius: 10rpx;
  border: 3rpx solid var(--theme-text-disabled);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  flex-shrink: 0;
  transition: all 0.2s;
}
.check-box.checked {
  background: var(--theme-primary);
  border-color: var(--theme-primary);
}
.check-icon {
  font-size: 24rpx;
  color: #fff;
  font-weight: bold;
}

/* 拖动手柄 */
.drag-handle {
  width: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12rpx;
}
.handle-icon {
  font-size: 32rpx;
  color: var(--theme-text-disabled);
}

/* 分类图标 */
.cat-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}
.cat-name {
  flex: 1;
  font-size: 30rpx;
  color: var(--theme-text-main);
  font-weight: 500;
}

/* 操作按钮 */
.cat-actions {
  display: flex;
  gap: 12rpx;
}
.action-btn {
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 16rpx;
  font-weight: 500;
}
.edit-btn {
  background: var(--theme-tag-bg);
  color: var(--theme-primary);
}
.delete-btn {
  background: #fee2e2;
  color: var(--theme-expense);
}

/* 添加卡片 */
.add-card {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24rpx;
  padding: 28rpx;
  background: var(--theme-card-bg);
  border-radius: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
  border: 2rpx dashed var(--theme-text-disabled);
}
.add-icon {
  font-size: 40rpx;
  color: var(--theme-primary);
  margin-right: 12rpx;
}
.add-text {
  font-size: 30rpx;
  color: var(--theme-primary);
  font-weight: 500;
}

/* 重置按钮 */
.reset-btn {
  text-align: center;
  margin: 24rpx 24rpx 0;
  padding: 24rpx;
  background: var(--theme-card-bg);
  border-radius: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
}
.reset-btn text {
  font-size: 28rpx;
  color: var(--theme-text-hint);
}

/* ====== 弹窗 ====== */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-content {
  width: 88%;
  max-height: 80vh;
  overflow-y: auto;
  background: var(--theme-card-bg);
  border-radius: 32rpx;
  padding: 40rpx;
}
.modal-title {
  display: block;
  text-align: center;
  font-size: 34rpx;
  font-weight: bold;
  color: var(--theme-text-main);
  margin-bottom: 32rpx;
}
.modal-section {
  margin-bottom: 28rpx;
}
.modal-label {
  display: block;
  font-size: 24rpx;
  color: var(--theme-text-hint);
  margin-bottom: 12rpx;
}

/* 图标选择 */
.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.icon-option {
  width: 72rpx;
  height: 72rpx;
  border-radius: 16rpx;
  background: var(--theme-tag-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}
.icon-option.active {
  background: var(--theme-tag-bg);
  border-color: var(--theme-primary);
  transform: scale(1.1);
}

/* 自定义图片选项 */
.custom-photo {
  position: relative;
  overflow: hidden;
}
.custom-photo-img {
  width: 100%;
  height: 100%;
  border-radius: 16rpx;
  object-fit: cover;
}
.custom-photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.custom-photo-text {
  font-size: 18rpx;
  color: var(--theme-text-hint);
  margin-top: 4rpx;
}
.custom-photo-tip {
  display: block;
  font-size: 22rpx;
  color: var(--theme-expense);
  margin-top: 12rpx;
  text-align: center;
}

/* 颜色选择 */
.color-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.color-option {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  border: 4rpx solid transparent;
  transition: all 0.2s;
}
.color-option.active {
  border-color: var(--theme-text-main);
  transform: scale(1.15);
}

/* 输入框 */
.modal-input {
  width: 100%;
  height: 80rpx;
  background: var(--theme-tag-bg);
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  color: var(--theme-text-main);
}

/* 预览 */
.preview-box {
  display: flex;
  align-items: center;
  background: var(--theme-tag-bg);
  border-radius: 16rpx;
  padding: 20rpx 24rpx;
}

/* 弹窗按钮 */
.modal-actions {
  display: flex;
  gap: 20rpx;
  margin-top: 12rpx;
}
.modal-btn {
  flex: 1;
  text-align: center;
  padding: 24rpx 0;
  border-radius: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
}
.modal-btn.cancel {
  background: var(--theme-tag-bg);
  color: var(--theme-text-sub);
}
.modal-btn.confirm {
  background: var(--theme-gradient);
  color: #fff;
}
</style>

