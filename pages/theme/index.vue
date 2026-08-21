<template>
  <view class="theme-page" :style="{ background: currentTheme.bgGradient }">
    <!-- 自定义导航栏 -->
    <view class="custom-navbar">
      <view class="navbar-back" @tap="goBack">
        <AppIcon name="arrow-left" :size="22" :color="currentTheme.primary" />
      </view>
      <text class="navbar-title" :style="{ color: currentTheme.isDark ? '#e0e0e0' : currentTheme.textMain }">主题编辑</text>
      <view class="navbar-placeholder"></view>
    </view>

    <!-- 当前主题预览 -->
    <view class="preview-section">
      <text class="preview-label" :style="{ color: currentTheme.isDark ? 'rgba(255,255,255,0.6)' : currentTheme.textHint }">当前主题</text>
      <view class="preview-card" :style="{ background: currentTheme.gradient, boxShadow: '0 8rpx 32rpx ' + currentTheme.shadow }">
        <view class="preview-card-top">
          <view class="preview-icon-circle" style="background: rgba(255,255,255,0.25)">
            <AppIcon name="book" :size="28" color="#fff" />
          </view>
          <view class="preview-card-info">
            <text class="preview-card-name">{{ currentTheme.name }}</text>
            <text class="preview-card-desc">{{ currentTheme.desc }}</text>
          </view>
        </view>
        <view class="preview-card-bottom">
          <view class="preview-swatch" v-for="(c, i) in swatchColors" :key="i" :style="{ background: c }"></view>
        </view>
      </view>
    </view>

    <!-- 主题选择网格 -->
    <view class="section-header">
      <text class="section-title" :style="{ color: currentTheme.isDark ? 'rgba(255,255,255,0.6)' : currentTheme.textHint }">选择主题</text>
    </view>
    <view class="theme-grid">
      <view
        v-for="theme in themes"
        :key="theme.id"
        class="theme-item"
        :class="{ active: theme.id === currentThemeId }"
        @tap="selectTheme(theme)"
      >
        <view class="theme-preview" :style="{ background: theme.preview, boxShadow: theme.id === currentThemeId ? '0 8rpx 24rpx ' + theme.shadow : 'none' }">
          <view class="theme-check" v-if="theme.id === currentThemeId">
            <text class="theme-check-icon">✓</text>
          </view>
        </view>
        <text class="theme-name" :style="{ color: currentTheme.isDark ? (theme.id === currentThemeId ? currentTheme.primary : 'rgba(255,255,255,0.8)') : (theme.id === currentThemeId ? currentTheme.primary : currentTheme.textSub) }">{{ theme.name }}</text>
        <text class="theme-desc-text" :style="{ color: currentTheme.isDark ? 'rgba(255,255,255,0.4)' : currentTheme.textHint }">{{ theme.desc }}</text>
      </view>
    </view>

    <!-- 底部说明 -->
    <view class="footer-tip" :style="{ color: currentTheme.isDark ? 'rgba(255,255,255,0.3)' : currentTheme.textDisabled }">
      <text>主题会自动保存，重启App后依然生效</text>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { themes, getCurrentTheme, setTheme } from '@/utils/themes.js'

export default {
  components: { AppIcon },
  data() {
    return {
      themes,
      currentThemeId: 'aurora',
      currentTheme: themes[0]
    }
  },
  computed: {
    swatchColors() {
      const t = this.currentTheme
      return [t.primary, t.primaryLight, t.expense, t.income]
    }
  },
  onLoad() {
    this.currentTheme = getCurrentTheme()
    this.currentThemeId = this.currentTheme.id
  },
  onShow() {
    this.currentTheme = getCurrentTheme()
    this.currentThemeId = this.currentTheme.id
  },
  methods: {
    goBack() { uni.navigateBack({ delta: 1 }) },
    selectTheme(theme) {
      this.currentThemeId = theme.id
      this.currentTheme = theme
      setTheme(theme.id)
      uni.showToast({ title: '已切换「' + theme.name + '」', icon: 'none' })
      // 通知其他页面更新主题
      uni.$emit('themeChange', theme)
    }
  }
}
</script>

<style scoped>
.theme-page {
  min-height: 100vh;
  padding-bottom: 60rpx;
}

/* 自定义导航栏 */
.custom-navbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: calc(var(--status-bar-height) + 16rpx) 24rpx 16rpx;
}
.navbar-back {
  width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: var(--theme-nav-bg); box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.06);
}
.navbar-title { font-size: 34rpx; font-weight: 600; }
.navbar-placeholder { width: 64rpx; }

/* 当前主题预览 */
.preview-section { padding: 24rpx 32rpx; }
.preview-label { font-size: 24rpx; margin-bottom: 16rpx; display: block; }
.preview-card {
  border-radius: 28rpx;
  padding: 32rpx;
  transition: all 0.3s;
}
.preview-card-top { display: flex; align-items: center; margin-bottom: 28rpx; }
.preview-icon-circle {
  width: 80rpx; height: 80rpx; border-radius: 24rpx;
  display: flex; align-items: center; justify-content: center;
  margin-right: 20rpx;
}
.preview-card-info { display: flex; flex-direction: column; }
.preview-card-name { font-size: 32rpx; font-weight: bold; color: #fff; }
.preview-card-desc { font-size: 24rpx; color: rgba(255,255,255,0.7); margin-top: 4rpx; }
.preview-card-bottom { display: flex; gap: 12rpx; }
.preview-swatch { width: 48rpx; height: 48rpx; border-radius: 12rpx; border: 3rpx solid rgba(255,255,255,0.3); }

/* 主题选择 */
.section-header { padding: 16rpx 32rpx 8rpx; }
.section-title { font-size: 24rpx; }
.theme-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
  padding: 16rpx 32rpx;
}
.theme-item {
  width: calc((100% - 24rpx) / 2);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  border-radius: 24rpx;
  background: var(--theme-card-bg);
  transition: all 0.2s;
  box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03);
}
.theme-item.active {
  background: var(--theme-card-bg);
  transform: scale(1.02);
  box-shadow: 0 4rpx 20rpx var(--theme-shadow);
}
.theme-preview {
  width: 100%;
  height: 120rpx;
  border-radius: 20rpx;
  position: relative;
  overflow: hidden;
  margin-bottom: 12rpx;
}
.theme-check {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 48rpx; height: 48rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.9);
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.15);
}
.theme-check-icon { font-size: 28rpx; color: var(--theme-text-main); font-weight: bold; }
.theme-name { font-size: 28rpx; font-weight: 600; margin-bottom: 4rpx; }
.theme-desc-text { font-size: 22rpx; }

/* 底部提示 */
.footer-tip { text-align: center; margin-top: 40rpx; padding: 0 48rpx; }
.footer-tip text { font-size: 22rpx; line-height: 1.6; }
</style>
