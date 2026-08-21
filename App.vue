<script>
import { getCurrentTheme } from './utils/themes.js'
import { injectThemeToWebviews, buildThemeVars } from './utils/theme-inject.js'
import db from './utils/db.js'

export default {
  data() {
    return {
      theme: getCurrentTheme()
    }
  },
  onLaunch: function() {
    // App 启动时初始化数据库
    // #ifdef APP-PLUS
    db.initDB().then(() => {
      console.log('[App] 数据库初始化成功')
    }).catch(err => {
      console.error('[App] 数据库初始化失败', err)
    })
    // 隐藏原生 tabBar，使用自定义 AppTabBar
    if (uni.hideTabBar) {
      uni.hideTabBar({ animation: false })
    }
    // #endif
    // 注入全局主题 CSS 变量（只执行一次）
    this.$nextTick(() => {
      this.applyTheme()
    })
  },
  onShow: function() {},
  onHide: function() {},
  created() {
    // 监听主题切换事件
    uni.$on('themeChange', (theme) => {
      this.theme = theme
      this.applyTheme()
    })
  },
  methods: {
    applyTheme() {
      injectThemeToWebviews(this.theme)
    }
  }
}
</script>

<style>
/* 全局基础样式 */
page {
  background: var(--theme-page-bg, #f5f5f5);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 28rpx;
  color: var(--theme-text-main, #333);
  -webkit-font-smoothing: antialiased;
}

view, text, scroll-view {
  box-sizing: border-box;
}
</style>
