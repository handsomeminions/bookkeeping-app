<template>
  <view class="tab-bar" :style="{ background: navBg }">
    <!-- 账单 -->
    <view class="tab-item" @tap="switchTab(0)">
      <view class="tab-icon-wrap" :class="{ active: current === 0 }" :style="{ background: current === 0 ? tagBg : 'transparent' }">
        <AppIcon name="book" :size="36" :color="current === 0 ? activeColor : inactiveColor" />
      </view>
      <text class="tab-text" :style="{ color: current === 0 ? activeColor : inactiveColor, fontWeight: current === 0 ? 600 : 400 }">账单</text>
    </view>

    <!-- 统计 -->
    <view class="tab-item" @tap="switchTab(1)">
      <view class="tab-icon-wrap" :class="{ active: current === 1 }" :style="{ background: current === 1 ? tagBg : 'transparent' }">
        <AppIcon name="chart" :size="36" :color="current === 1 ? activeColor : inactiveColor" />
      </view>
      <text class="tab-text" :style="{ color: current === 1 ? activeColor : inactiveColor, fontWeight: current === 1 ? 600 : 400 }">统计</text>
    </view>

    <!-- 中间悬浮记账按钮 -->
    <view class="tab-item center-item">
      <view class="center-btn" :style="{ background: gradient }" @tap="goAdd">
        <AppIcon name="plus" :size="48" color="#fff" />
      </view>
    </view>

    <!-- 预算 -->
    <view class="tab-item" @tap="switchTab(3)">
      <view class="tab-icon-wrap" :class="{ active: current === 3 }" :style="{ background: current === 3 ? tagBg : 'transparent' }">
        <AppIcon name="wallet" :size="36" :color="current === 3 ? activeColor : inactiveColor" />
      </view>
      <text class="tab-text" :style="{ color: current === 3 ? activeColor : inactiveColor, fontWeight: current === 3 ? 600 : 400 }">预算</text>
    </view>

    <!-- 设置 -->
    <view class="tab-item" @tap="switchTab(4)">
      <view class="tab-icon-wrap" :class="{ active: current === 4 }" :style="{ background: current === 4 ? tagBg : 'transparent' }">
        <AppIcon name="settings" :size="36" :color="current === 4 ? activeColor : inactiveColor" />
      </view>
      <text class="tab-text" :style="{ color: current === 4 ? activeColor : inactiveColor, fontWeight: current === 4 ? 600 : 400 }">设置</text>
    </view>
  </view>
</template>

<script>
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import { getCurrentTheme } from '@/utils/themes.js'

export default {
  name: 'AppTabBar',
  components: { AppIcon },
  props: {
    current: { type: Number, default: 0 }
  },
  data() {
    return {
      theme: getCurrentTheme()
    }
  },
  computed: {
    activeColor() { return this.theme.primary || '#6366f1' },
    inactiveColor() { return this.theme.isDark ? 'rgba(255,255,255,0.4)' : (this.theme.textHint || '#9ca3af') },
    navBg() { return this.theme.navBg || '#ffffff' },
    tagBg() { return this.theme.tagBg || 'rgba(99,102,241,0.1)' },
    gradient() { return this.theme.gradient || 'linear-gradient(135deg, #6366f1, #818cf8)' }
  },
  created() {
    uni.$on('themeChange', (theme) => { this.theme = theme })
  },
  methods: {
    switchTab(index) {
      const paths = ['/pages/index/index', '/pages/statistics/index', '', '/pages/budget/index', '/pages/settings/index']
      if (this.current === index) return
      uni.switchTab({ url: paths[index] })
    },
    goAdd() {
      uni.navigateTo({ url: '/pages/add/index' })
    }
  }
}
</script>

<style scoped>
.tab-bar {
  position: fixed;
  left: 16rpx; right: 16rpx; bottom: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  height: 110rpx;
  padding-bottom: env(safe-area-inset-bottom);
  border-radius: 40rpx;
  box-shadow: 0 4rpx 30rpx rgba(0,0,0,0.08);
  z-index: 999;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  transition: all 0.2s;
}
.tab-icon-wrap {
  width: 52rpx;
  height: 52rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.tab-text {
  font-size: 20rpx;
  transition: color 0.2s;
}
.tab-item:active .tab-icon-wrap {
  transform: scale(0.92);
}

/* 中间悬浮按钮 */
.center-item {
  position: relative;
}
.center-btn {
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(99,102,241,0.3);
  margin-top: -30rpx;
  transition: all 0.2s;
}
.center-btn:active {
  transform: scale(0.9);
  box-shadow: 0 4rpx 16rpx rgba(99,102,241,0.2);
}
</style>
