import { createSSRApp } from 'vue'
import App from './App.vue'
import { injectThemeToWebviews } from './utils/theme-inject.js'

export function createApp() {
  const app = createSSRApp(App)

  // 全局 mixin：每个页面 onShow 时注入主题 CSS 变量
  // switchTab 缓存页面后 webview 已就绪，无需 setTimeout 延迟
  app.mixin({
    onShow() {
      // #ifdef APP-PLUS
      injectThemeToWebviews()
      // #endif
    }
  })

  return {
    app
  }
}
