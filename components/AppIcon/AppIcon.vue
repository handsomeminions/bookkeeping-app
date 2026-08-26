<template>
  <view class="app-icon" :style="{ width: size + 'rpx', height: size + 'rpx' }">
    <image v-if="src" :src="src" mode="aspectFit" :style="{ width: size + 'rpx', height: size + 'rpx', borderRadius: '20%' }" />
    <image v-else :src="svgSrc" mode="aspectFit" :style="{ width: size + 'rpx', height: size + 'rpx' }" />
  </view>
</template>

<script>
const ICONS = {
  // 导航栏
  book: '<path d="M4 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3-7 3V5z" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linejoin="round"/><path d="M8 7h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M8 10h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>',
  chart: '<path d="M4 20h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><rect x="5" y="11" width="3" height="7" rx="0.5" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="10.5" y="7" width="3" height="11" rx="0.5" stroke="currentColor" stroke-width="1.5" fill="none"/><rect x="16" y="13" width="3" height="5" rx="0.5" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  wallet: '<path d="M3 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2H3V7z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M3 9h16a1 1 0 0 1 1 1v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><circle cx="16" cy="14" r="1.5" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  settings: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linejoin="round"/>',
  // 设置页功能
  tags: '<path d="M9 6h11a1 1 0 0 1 1 1v4.5a1 1 0 0 1-.3.7l-6 6a1 1 0 0 1-1.4 0L6.3 13a1 1 0 0 1 0-1.4l5.3-5.3A1 1 0 0 1 12.4 6H9z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><circle cx="16" cy="9" r="1.5" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  upload: '<path d="M12 3l5 6h-3v6h-4v-6H7l5-6z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><path d="M5 17v2a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><rect x="9" y="2" width="6" height="4" rx="1" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M8 10h8M8 13h8M8 16h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  trash: '<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  // 方向箭头
  'arrow-left': '<path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  'arrow-up': '<path d="M12 5v14M6 11l6-6 6 6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  'arrow-down': '<path d="M12 5v14M6 13l6 6 6-6" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  // 日期
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><circle cx="8" cy="14" r="1" fill="currentColor"/><circle cx="12" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/>',
  // 备注
  note: '<path d="M4 4h12l4 4v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M16 4v4h4" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M7 13h10M7 16h7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  // 分类图标 - 支出
  food: '<path d="M5 10h14M6 10l.5 9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1l.5-9" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10V6a3 3 0 0 1 6 0v4" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  transport: '<rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M4 11h16" stroke="currentColor" stroke-width="1.4"/><circle cx="8" cy="15" r="1.2" fill="currentColor"/><circle cx="16" cy="15" r="1.2" fill="currentColor"/>',
  shopping: '<path d="M5 8h14l-1 12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1L5 8z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="currentColor" stroke-width="1.6" fill="none"/>',
  entertainment: '<path d="M6 8h12a3 3 0 0 1 3 3v2a3 3 0 0 1-5 2l-2-1H10l-2 1a3 3 0 0 1-5-2v-2a3 3 0 0 1 3-3z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M8 11v2M16 11v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  housing: '<path d="M4 11l8-6 8 6" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M10 20v-5h4v5" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>',
  medical: '<rect x="4" y="6" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 10v6M9 13h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  education: '<path d="M3 9l9-4 9 4-9 4-9-4z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M7 11v4a5 5 0 0 0 10 0v-4" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M3 9v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  communication: '<rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M9 18h6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  daily: '<path d="M6 5h12l-1 15a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 5z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M6 5h12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M10 10v5M14 10v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  snack: '<circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="10" cy="10" r="1" fill="currentColor"/><circle cx="14" cy="11" r="1" fill="currentColor"/><circle cx="11" cy="14" r="1" fill="currentColor"/>',
  clothing: '<path d="M7 3l5 3 5-3 4 4-3 3v11H6V10L3 7l4-4z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>',
  beauty: '<path d="M9 3h6v3a4 4 0 0 0 0 0L9 6V3z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/><rect x="9" y="6" width="6" height="15" rx="1" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  pet: '<circle cx="7" cy="8" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="6" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="17" cy="8" r="2" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M12 11c-4 0-7 3-7 6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3c0-3-3-6-7-6z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>',
  travel: '<path d="M10 2h4l2 7-2 1v12h-2V10h-2v12H8V10L6 9l2-7z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>',
  gift: '<rect x="4" y="9" width="16" height="12" rx="1" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M2 9h20M12 9v12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 9s-3-5-5-3 5 3 5 3 3-5 5-3-5 3-5 3z" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  // 分类图标 - 收入
  salary: '<rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  bonus: '<rect x="4" y="9" width="16" height="12" rx="1" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M2 9h20M12 9v12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 9s-3-5-5-3 5 3 5 3 3-5 5-3-5 3-5 3z" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  investment: '<path d="M3 17l6-6 4 4 8-8" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 7h4v4" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  parttime: '<rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  redpacket: '<rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M4 8s4 2 8 0 4 0 4 0" stroke="currentColor" stroke-width="1.4" fill="none"/><circle cx="12" cy="14" r="2.5" stroke="currentColor" stroke-width="1.4" fill="none"/>',
  refund: '<rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M2 10h20" stroke="currentColor" stroke-width="1.4"/><path d="M6 15h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  // 其他
  other: '<circle cx="5" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="19" cy="12" r="1.5" fill="currentColor"/>',
  // 拖拽
  drag: '<circle cx="9" cy="6" r="1.5" fill="currentColor"/><circle cx="15" cy="6" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="18" r="1.5" fill="currentColor"/><circle cx="15" cy="18" r="1.5" fill="currentColor"/>',
  // 咖啡
  coffee: '<path d="M4 8h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V8z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M16 10h2a2 2 0 0 1 0 4h-2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M7 3v3M11 3v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  // 电影
  film: '<rect x="4" y="4" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M4 9h16M4 15h16M9 4v16M15 4v16" stroke="currentColor" stroke-width="1.4"/>',
  // 音乐
  music: '<path d="M9 18V6l10-2v12" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/><circle cx="7" cy="18" r="2.5" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="17" cy="16" r="2.5" stroke="currentColor" stroke-width="1.5" fill="none"/>',
  // 运动
  sport: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" stroke="currentColor" stroke-width="1.2" fill="none"/>',
  // 球
  ball: '<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M12 3v18M3 12h18" stroke="currentColor" stroke-width="1.2"/>',
  // 酒杯
  wine: '<path d="M5 3h14l-2 6a5 5 0 0 1-10 0L5 3z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M12 14v6M8 20h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  // 出租车
  taxi: '<rect x="3" y="10" width="18" height="9" rx="2" stroke="currentColor" stroke-width="1.6" fill="none"/><path d="M5 10V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><circle cx="7" cy="19" r="1.5" stroke="currentColor" stroke-width="1.4" fill="none"/><circle cx="17" cy="19" r="1.5" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M10 5h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  // 灯泡
  bulb: '<path d="M9 18h6M10 21h4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M12 3a6 6 0 0 0-4 10c1 1 1.5 2 1.5 3h5c0-1 .5-2 1.5-3a6 6 0 0 0-4-10z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  // 工具
  tool: '<path d="M14 7a4 4 0 0 1-5 5L4 17l3 3 5-5a4 4 0 0 1 5-5l-3 3-2-2 3-3a4 4 0 0 1-1 0z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>',
  // 星星
  star: '<path d="M12 3l2.5 6 6.5.5-5 4.5 1.5 6.5L12 17l-5.5 3.5L8 14l-5-4.5 6.5-.5L12 3z" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linejoin="round"/>',
  // 心
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/>',
  // 添加
  plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  // 编辑
  edit: '<path d="M4 20h4l10-10-4-4L4 16v4z" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/><path d="M14 6l4 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
  // 搜索
  search: '<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8" fill="none"/><path d="M21 21l-4.5-4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  // 关闭/清除
  close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>'
}

export default {
  name: 'AppIcon',
  props: {
    name: { type: String, default: 'other' },
    size: { type: Number, default: 48 },
    color: { type: String, default: '#6b7280' },
    src: { type: String, default: '' }
  },
  computed: {
    svgSrc() {
      const body = ICONS[this.name] || ICONS.other
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="color:' + this.color + '">' + body + '</svg>'
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    }
  }
}
</script>

<style scoped>
.app-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
