/**
 * 默认分类预设
 * icon: AppIcon 组件的图标名称（SVG线条图标）
 * visible: 是否在记账界面显示（用户可在分类管理中勾选/取消）
 */
export const defaultCategories = [
  // ===== 支出分类 =====
  { id: 'food', name: '餐饮', icon: 'food', color: '#ff9800', type: 'expense', visible: true },
  { id: 'transport', name: '交通', icon: 'transport', color: '#2196f3', type: 'expense', visible: true },
  { id: 'shopping', name: '购物', icon: 'shopping', color: '#e91e63', type: 'expense', visible: true },
  { id: 'entertainment', name: '娱乐', icon: 'entertainment', color: '#9c27b0', type: 'expense', visible: true },
  { id: 'housing', name: '住房', icon: 'housing', color: '#795548', type: 'expense', visible: true },
  { id: 'medical', name: '医疗', icon: 'medical', color: '#f44336', type: 'expense', visible: true },
  { id: 'education', name: '教育', icon: 'education', color: '#3f51b5', type: 'expense', visible: true },
  { id: 'communication', name: '通讯', icon: 'communication', color: '#009688', type: 'expense', visible: true },
  { id: 'daily', name: '日用', icon: 'daily', color: '#607d8b', type: 'expense', visible: true },
  { id: 'snack', name: '零食', icon: 'snack', color: '#ff5722', type: 'expense', visible: true },
  { id: 'clothing', name: '服饰', icon: 'clothing', color: '#673ab7', type: 'expense', visible: true },
  { id: 'beauty', name: '美妆', icon: 'beauty', color: '#ec407a', type: 'expense', visible: false },
  { id: 'pet', name: '宠物', icon: 'pet', color: '#8d6e63', type: 'expense', visible: false },
  { id: 'travel', name: '旅行', icon: 'travel', color: '#00bcd4', type: 'expense', visible: true },
  { id: 'gift', name: '礼物', icon: 'gift', color: '#ff7043', type: 'expense', visible: false },
  { id: 'other_expense', name: '其他', icon: 'other', color: '#9e9e9e', type: 'expense', visible: true },

  // ===== 收入分类 =====
  { id: 'salary', name: '工资', icon: 'salary', color: '#4caf50', type: 'income', visible: true },
  { id: 'bonus', name: '奖金', icon: 'bonus', color: '#8bc34a', type: 'income', visible: true },
  { id: 'investment', name: '理财', icon: 'investment', color: '#43a047', type: 'income', visible: true },
  { id: 'parttime', name: '兼职', icon: 'parttime', color: '#26a69a', type: 'income', visible: false },
  { id: 'redpacket', name: '红包', icon: 'redpacket', color: '#ef5350', type: 'income', visible: true },
  { id: 'refund', name: '退款', icon: 'refund', color: '#66bb6a', type: 'income', visible: false },
  { id: 'other_income', name: '其他', icon: 'other', color: '#9e9e9e', type: 'income', visible: true }
]
