<template>
  <view class="settings-page">
    <!-- 应用信息卡片 -->
    <view class="app-info-card">
      <view class="app-icon-wrap">
        <AppIcon name="book" :size="56" color="#fff" />
      </view>
      <view class="app-text">
        <text class="app-name">记账本</text>
        <text class="app-version">v1.0.0 · 本地存储</text>
      </view>
    </view>

    <!-- 常用功能 -->
    <view class="section-title">常用功能</view>
    <view class="func-card">
      <view class="func-item">
        <view class="func-icon pet-icon-bg">
          <AppIcon name="heart" :size="40" :color="currentTheme.primary" />
        </view>
        <view class="func-info">
          <text class="func-name">桌面宠物</text>
          <text class="func-desc">萌宠陪你记账</text>
        </view>
        <switch :checked="petEnabled" @change="togglePet" color="#6366f1" class="pet-switch" />
      </view>
      <view class="func-item" @tap="goTheme">
        <view class="func-icon theme-preview-icon" :style="{ background: themePreviewGradient }">
          <AppIcon name="star" :size="40" color="#fff" />
        </view>
        <view class="func-info">
          <text class="func-name">主题编辑</text>
          <text class="func-desc">{{ currentThemeName }} · 点击切换</text>
        </view>
        <text class="func-arrow">›</text>
      </view>
      <view class="func-item" @tap="goCategoryManage">
        <view class="func-icon">
          <AppIcon name="tags" :size="40" :color="currentTheme.primary" />
        </view>
        <view class="func-info">
          <text class="func-name">分类管理</text>
          <text class="func-desc">排序、添加、删除分类</text>
        </view>
        <text class="func-arrow">›</text>
      </view>
      <view class="func-item" @tap="exportData">
        <view class="func-icon">
          <AppIcon name="upload" :size="40" :color="currentTheme.isDark ? '#60a5fa' : '#3b82f6'" />
        </view>
        <view class="func-info">
          <text class="func-name">导出账单</text>
          <text class="func-desc">导出本月为 CSV 文件</text>
        </view>
        <text class="func-arrow">›</text>
      </view>
      <view class="func-item" @tap="exportAllData">
        <view class="func-icon">
          <AppIcon name="clipboard" :size="40" :color="currentTheme.isDark ? '#34d399' : '#22c55e'" />
        </view>
        <view class="func-info">
          <text class="func-name">导出全部</text>
          <text class="func-desc">导出所有月份账单</text>
        </view>
        <text class="func-arrow">›</text>
      </view>
    </view>

    <!-- 数据管理 -->
    <view class="section-title">数据管理</view>
    <view class="danger-card">
      <view class="func-item" @tap="confirmClear">
        <view class="func-icon danger-icon">
          <AppIcon name="trash" :size="40" :color="currentTheme.expense" />
        </view>
        <view class="func-info">
          <text class="func-name danger-text">清空所有数据</text>
          <text class="func-desc">永久删除，不可恢复</text>
        </view>
        <text class="func-arrow">›</text>
      </view>
    </view>

    <view class="footer-text">数据仅保存在手机本地，卸载App将丢失数据</view>

    <!-- 自定义底部导航栏 -->
    <AppTabBar :current="4" />
  </view>
</template>

<script>
import AppIcon from '@/components/AppIcon/AppIcon.vue'
import AppTabBar from '@/components/AppTabBar/AppTabBar.vue'
import db from '@/utils/db.js'
import { getCurrentTheme } from '@/utils/themes.js'
import { formatMoney, getCurrentMonth, formatMonth } from '@/utils/format.js'

export default {
  components: { AppIcon, AppTabBar },
  data() {
    return {
      currentTheme: getCurrentTheme(),
      petEnabled: uni.getStorageSync('pet_enabled') !== false
    }
  },
  computed: {
    currentThemeName() { return this.currentTheme.name },
    themePreviewGradient() { return this.currentTheme.preview }
  },
  onShow() {
    // #ifdef APP-PLUS
    if (uni.hideTabBar) uni.hideTabBar({ animation: false })
    // #endif
    this.currentTheme = getCurrentTheme()
  },
  created() {
    uni.$on('themeChange', (theme) => { this.currentTheme = theme })
  },
  methods: {
    formatMoney,
    togglePet(e) {
      this.petEnabled = e.detail.value
      uni.setStorageSync('pet_enabled', e.detail.value)
      uni.$emit('petToggle', e.detail.value)
    },
    goTheme() { uni.navigateTo({ url: '/pages/theme/index' }) },
    goCategoryManage() { uni.navigateTo({ url: '/pages/category-manage/index' }) },
    async exportData() {
      try {
        uni.showLoading({ title: '导出中...', mask: true })
        const records = await db.getRecordsByMonth(getCurrentMonth())
        if (records.length === 0) { uni.hideLoading(); uni.showToast({ title: '本月暂无数据', icon: 'none' }); return }
        const csv = this.buildCSV(records)
        const fileName = `记账导出_${getCurrentMonth()}.csv`
        await this.saveFile(csv, fileName)
        uni.hideLoading()
        uni.showToast({ title: '已导出本月', icon: 'none' })
      } catch (e) {
        uni.hideLoading()
        console.error('导出本月失败', e)
        uni.showToast({ title: '导出失败: ' + (e.message || JSON.stringify(e)), icon: 'none', duration: 3000 })
      }
    },
    async exportAllData() {
      try {
        uni.showLoading({ title: '导出中...', mask: true })
        const allRecords = await db.getAllRecords()
        if (allRecords.length === 0) { uni.hideLoading(); uni.showToast({ title: '暂无数据', icon: 'none' }); return }
        allRecords.sort((a, b) => b.date.localeCompare(a.date))
        const csv = this.buildCSV(allRecords)
        const fileName = `记账全部导出_${formatMonth(new Date())}.csv`
        await this.saveFile(csv, fileName)
        uni.hideLoading()
        uni.showToast({ title: '已导出全部', icon: 'none' })
      } catch (e) {
        uni.hideLoading()
        console.error('导出全部失败', e)
        uni.showToast({ title: '导出失败: ' + (e.message || JSON.stringify(e)), icon: 'none', duration: 3000 })
      }
    },
    buildCSV(records) {
      let csv = '日期,类型,分类,金额,备注\n'
      for (const r of records) {
        const typeText = r.type === 'expense' ? '支出' : '收入'
        const note = (r.note || '').replace(/"/g, '""')
        csv += `${r.date},${typeText},${r.category},${r.amount},"${note}"\n`
      }
      return csv
    },
    saveFile(content, fileName) {
      return new Promise((resolve, reject) => {
        const fullContent = '\uFEFF' + content
        // #ifdef H5
        const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        a.click()
        URL.revokeObjectURL(url)
        resolve()
        // #endif
        // #ifdef APP-PLUS
        // App端：用 saveFile API 写入绝对路径
        const env = plus.io.PRIVATE_DOC
        plus.io.requestFileSystem(env, function(fs) {
          fs.root.getFile(fileName, { create: true }, function(entry) {
            entry.createWriter(function(writer) {
              writer.onwrite = function() {
                const fileUrl = entry.toLocalURL()
                console.log('[导出] 文件已写入:', fileUrl)
                uni.showModal({
                  title: '导出成功',
                  content: '文件已保存到:\n' + fileUrl + '\n\n是否用其他应用打开？',
                  confirmText: '打开',
                  cancelText: '关闭',
                  success: function(res) {
                    if (res.confirm) {
                      plus.runtime.openFile(fileUrl, {}, function(e) {
                        console.log('[导出] openFile:', JSON.stringify(e))
                      })
                    }
                    resolve()
                  }
                })
              }
              writer.onerror = function(e) {
                console.error('[导出] 写入失败:', JSON.stringify(e))
                reject(e)
              }
              writer.write(fullContent)
            }, function(e) {
              console.error('[导出] createWriter 失败:', JSON.stringify(e))
              reject(e)
            })
          }, function(e) {
            console.error('[导出] getFile 失败:', JSON.stringify(e))
            reject(e)
          })
        }, function(e) {
          console.error('[导出] requestFileSystem 失败:', JSON.stringify(e))
          reject(e)
        })
        // #endif
        // #ifdef MP
        const fs = uni.getFileSystemManager()
        const filePath = `${wx.env.USER_DATA_PATH}/${fileName}`
        fs.writeFile({
          filePath,
          data: fullContent,
          encoding: 'utf-8',
          success: () => {
            uni.openDocument({ filePath, success: () => resolve(), fail: () => resolve() })
          },
          fail: (e) => reject(e)
        })
        // #endif
      })
    },
    confirmClear() {
      uni.showModal({
        title: '危险操作',
        content: '将永久删除所有记账记录和预算数据，且不可恢复。确定要清空吗？',
        confirmText: '确认清空', confirmColor: '#ef4444', cancelText: '取消',
        success: async (res) => {
          if (res.confirm) {
            try { await db.clearAllRecords(); uni.showToast({ title: '已清空所有数据', icon: 'none' }) }
            catch (e) { uni.showToast({ title: '操作失败', icon: 'none' }) }
          }
        }
      })
    }
  }
}
</script>

<style scoped>
.settings-page { min-height: 100vh; background: var(--theme-bg-gradient); padding-top: var(--status-bar-height); padding-bottom: 160rpx; }

/* App信息卡片 */
.app-info-card { display: flex; align-items: center; margin: 24rpx; padding: 32rpx; background: var(--theme-gradient); border-radius: 24rpx; box-shadow: 0 4rpx 20rpx var(--theme-shadow); }
.app-icon-wrap { margin-right: 24rpx; }
.app-text { display: flex; flex-direction: column; }
.app-name { font-size: 36rpx; font-weight: bold; color: #fff; }
.app-version { font-size: 24rpx; color: rgba(255,255,255,0.7); margin-top: 4rpx; }

/* 段落标题 */
.section-title { font-size: 26rpx; color: var(--theme-text-hint); margin: 32rpx 32rpx 16rpx; }

/* 功能卡片 */
.func-card, .danger-card { background: var(--theme-card-bg); border-radius: 24rpx; margin: 0 24rpx; padding: 0 32rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.03); }
.func-item { display: flex; align-items: center; padding: 28rpx 0; border-bottom: 1rpx solid var(--theme-divider); }
.func-item:last-child { border-bottom: none; }
.func-icon { width: 72rpx; height: 72rpx; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; margin-right: 20rpx; flex-shrink: 0; background: var(--theme-tag-bg); }
.theme-preview-icon { background: var(--theme-gradient) !important; }
.func-icon.danger-icon { background: var(--theme-expense-light); }
.func-info { flex: 1; display: flex; flex-direction: column; }
.func-name { font-size: 30rpx; color: var(--theme-text-main); }
.func-desc { font-size: 24rpx; color: var(--theme-text-hint); margin-top: 4rpx; }
.danger-text { color: var(--theme-expense) !important; }
.func-arrow { font-size: 36rpx; color: var(--theme-text-disabled); }
.pet-icon-bg { background: rgba(99,102,241,0.1); }
.pet-switch { transform: scale(0.85); }

/* 页脚 */
.footer-text { text-align: center; font-size: 22rpx; color: var(--theme-text-disabled); margin-top: 40rpx; padding: 0 48rpx; line-height: 1.6; }
</style>
