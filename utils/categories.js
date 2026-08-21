/**
 * 记账分类管理 v2.0
 * 支持从 localStorage 读取用户自定义分类（排序、增删），fallback 到默认预设
 * 每个分类含: id, name, icon(emoji), color(背景色), type(适用类型)
 */

import { defaultCategories } from './default-categories.js'

const STORAGE_KEY = 'book_categories'

/**
 * 获取默认分类列表
 */
export function getDefaultCategories() {
  return JSON.parse(JSON.stringify(defaultCategories))
}

/**
 * 检测旧 emoji icon 并自动迁移为新的 SVG 图标名
 * emoji 的特征：不是纯英文字母/下划线组合（如 "🍔" 或 "📝"）
 */
function migrateIcons(categories) {
  let changed = false
  categories.forEach(c => {
    if (c.icon && !/^[a-z_]+$/.test(c.icon)) {
      // 旧 emoji，尝试用 id 匹配默认分类的新图标名
      const def = defaultCategories.find(d => d.id === c.id)
      c.icon = def ? def.icon : 'other'
      changed = true
    }
  })
  return changed
}

/**
 * 从 localStorage 加载分类列表，如果没有则初始化为默认分类
 */
export function loadCategories() {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    if (data) {
      const parsed = JSON.parse(data)
      if (parsed && Array.isArray(parsed) && parsed.length > 0) {
        // 自动迁移旧 emoji 图标为 SVG 图标名
        if (migrateIcons(parsed)) {
          saveCategories(parsed)
        }
        return parsed
      }
    }
  } catch (e) {
    console.error('加载分类失败', e)
  }
  // 首次使用，初始化为默认分类并保存
  const defaults = getDefaultCategories()
  saveCategories(defaults)
  return defaults
}

/**
 * 保存分类列表到 localStorage
 */
export function saveCategories(categories) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(categories))
}

/**
 * 重置分类为默认
 */
export function resetCategories() {
  const defaults = getDefaultCategories()
  saveCategories(defaults)
  return defaults
}

/**
 * 按类型获取分类列表（只返回勾选显示的分类）
 * @param {string} type expense 或 income
 */
export function getCategoriesByType(type) {
  const all = loadCategories()
  return all.filter(c => c.type === type && c.visible !== false)
}

/**
 * 按类型获取全部分类（含未勾选的，给分类管理页用）
 * @param {string} type expense 或 income
 */
export function getAllCategoriesByType(type) {
  const all = loadCategories()
  return all.filter(c => c.type === type)
}

/**
 * 根据 id 获取分类信息
 * @param {string} id
 */
export function getCategoryById(id) {
  const all = loadCategories()
  return all.find(c => c.id === id) || all.find(c => c.id === 'other_expense') || all[0]
}

/**
 * 添加新分类
 * @param {object} cat { name, icon, color, type }
 * @returns {object} 新添加的分类（含 id）
 */
export function addCategory(cat) {
  const all = loadCategories()
  const newCat = {
    id: 'custom_' + Date.now(),
    name: cat.name,
    icon: cat.icon || 'other',
    color: cat.color || '#6366f1',
    type: cat.type
  }
  if (cat.customIcon) newCat.customIcon = cat.customIcon
  all.push(newCat)
  saveCategories(all)
  return newCat
}

/**
 * 删除分类
 * @param {string} id
 */
export function deleteCategory(id) {
  const all = loadCategories()
  const filtered = all.filter(c => c.id !== id)
  saveCategories(filtered)
  return filtered
}

/**
 * 更新分类顺序（接收排好序的完整列表）
 */
export function updateCategoryOrder(sortedCategories) {
  saveCategories(sortedCategories)
  return sortedCategories
}

/**
 * 更新单个分类信息
 */
export function updateCategory(id, updates) {
  const all = loadCategories()
  const idx = all.findIndex(c => c.id === id)
  if (idx > -1) {
    all[idx] = { ...all[idx], ...updates }
    saveCategories(all)
    return all[idx]
  }
  return null
}

/**
 * 切换分类显示/隐藏
 */
export function toggleCategoryVisible(id) {
  const all = loadCategories()
  const idx = all.findIndex(c => c.id === id)
  if (idx > -1) {
    all[idx].visible = !all[idx].visible
    saveCategories(all)
    return all[idx].visible
  }
  return null
}

export default {
  getDefaultCategories,
  loadCategories,
  saveCategories,
  resetCategories,
  getCategoriesByType,
  getAllCategoriesByType,
  getCategoryById,
  addCategory,
  deleteCategory,
  updateCategoryOrder,
  updateCategory,
  toggleCategoryVisible
}
