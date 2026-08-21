/**
 * 通用格式化工具
 */

/**
 * 格式化金额，保留两位小数
 * @param {number} amount
 * @returns {string}
 */
export function formatMoney(amount) {
  if (!amount && amount !== 0) return '0.00'
  return Number(amount).toFixed(2)
}

/**
 * 格式化金额，带千分位
 * @param {number} amount
 * @returns {string}
 */
export function formatMoneyThousand(amount) {
  if (!amount && amount !== 0) return '0.00'
  return Number(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 获取当前日期 YYYY-MM-DD
 */
export function getToday() {
  const d = new Date()
  return formatDate(d)
}

/**
 * 获取当前月份 YYYY-MM
 */
export function getCurrentMonth() {
  const d = new Date()
  return formatMonth(d)
}

/**
 * 格式化日期 YYYY-MM-DD
 * @param {Date} date
 */
export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 格式化月份 YYYY-MM
 * @param {Date} date
 */
export function formatMonth(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/**
 * 从日期中提取月份 YYYY-MM
 * @param {string} dateStr YYYY-MM-DD
 */
export function getMonthFromDate(dateStr) {
  return dateStr ? dateStr.substring(0, 7) : ''
}

/**
 * 格式化日期显示（月-日）
 * @param {string} dateStr YYYY-MM-DD
 * @returns {string} MM-DD
 */
export function formatShortDate(dateStr) {
  if (!dateStr) return ''
  return dateStr.substring(5)
}

/**
 * 获取星期几的中文
 * @param {string} dateStr YYYY-MM-DD
 */
export function getWeekdayText(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekdays[d.getDay()]
}

/**
 * 获取月份的中文显示
 * @param {string} monthStr YYYY-MM
 * @returns {string} YYYY年MM月
 */
export function formatMonthChinese(monthStr) {
  if (!monthStr) return ''
  const parts = monthStr.split('-')
  return `${parts[0]}年${parseInt(parts[1])}月`
}

export default {
  formatMoney,
  formatMoneyThousand,
  getToday,
  getCurrentMonth,
  formatDate,
  formatMonth,
  getMonthFromDate,
  formatShortDate,
  getWeekdayText,
  formatMonthChinese
}
