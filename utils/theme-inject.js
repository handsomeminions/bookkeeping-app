/**
 * 主题注入工具 v1.0
 * 
 * 解决方案：
 * - H5 端：直接用 document.documentElement.style.setProperty
 * - App 端：通过 plus.webview.evalJS 注入到页面 webview 的 document.documentElement
 */

import { getCurrentTheme } from './themes.js'

/**
 * 生成主题 CSS 变量键值对
 */
export function buildThemeVars(theme) {
  const t = theme || getCurrentTheme()
  const vars = {}
  vars['--theme-primary'] = t.primary
  vars['--theme-primary-light'] = t.primaryLight
  vars['--theme-gradient'] = t.gradient
  vars['--theme-gradient-soft'] = t.gradientSoft
  vars['--theme-bg-gradient'] = t.bgGradient
  vars['--theme-expense'] = t.expense
  vars['--theme-expense-light'] = t.expenseLight
  vars['--theme-income'] = t.income
  vars['--theme-income-light'] = t.incomeLight
  vars['--theme-shadow'] = t.shadow
  vars['--theme-shadow-strong'] = t.shadowStrong || t.shadow
  vars['--theme-nav-bg'] = t.navBg
  vars['--theme-card-bg'] = t.cardBg
  vars['--theme-tag-bg'] = t.tagBg
  vars['--theme-is-dark'] = t.isDark ? '1' : '0'
  if (t.isDark) {
    vars['--theme-text-main'] = '#e0e0e0'
    vars['--theme-text-sub'] = 'rgba(255,255,255,0.6)'
    vars['--theme-text-hint'] = 'rgba(255,255,255,0.4)'
    vars['--theme-text-disabled'] = 'rgba(255,255,255,0.2)'
    vars['--theme-page-bg'] = '#0f0f1a'
    vars['--theme-divider'] = 'rgba(255,255,255,0.08)'
  } else {
    vars['--theme-text-main'] = '#1a1a2e'
    vars['--theme-text-sub'] = '#4b5563'
    vars['--theme-text-hint'] = '#9ca3af'
    vars['--theme-text-disabled'] = '#d1d5db'
    vars['--theme-page-bg'] = '#f2f3f7'
    vars['--theme-divider'] = '#f3f4f6'
  }
  return vars
}

/**
 * 生成注入 CSS 变量的 JS 代码字符串（用于 evalJS）
 */
function buildInjectScript(vars) {
  let js = 'try{var r=document.documentElement;'
  for (const key in vars) {
    js += `r.style.setProperty('${key}','${vars[key]}');`
  }
  js += '}catch(e){}'
  return js
}

/**
 * 向所有已打开的页面 webview 注入主题变量
 */
export function injectThemeToWebviews(theme) {
  const vars = buildThemeVars(theme)
  const jsCode = buildInjectScript(vars)

  // #ifdef H5
  if (typeof document !== 'undefined') {
    const root = document.documentElement
    for (const key in vars) {
      root.style.setProperty(key, vars[key])
    }
  }
  // #endif

  // #ifdef APP-PLUS
  // 向当前页面的 webview 注入
  const pages = getCurrentPages()
  pages.forEach(page => {
    const webview = page.$getAppWebview ? page.$getAppWebview() : null
    if (webview) {
      webview.evalJS(jsCode)
    }
  })
  // 同时设置状态栏颜色
  const t = theme || getCurrentTheme()
  if (plus && plus.navigator) {
    plus.navigator.setStatusBarStyle(t.isDark ? 'light' : 'dark')
  }
  // #endif
}
