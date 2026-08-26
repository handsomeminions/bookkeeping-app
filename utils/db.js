/**
 * 数据库操作模块 v2.0 - SQLite 本地存储
 * 新增: 预算表、账本表
 */

const DB_NAME = 'book.db'
const TABLE_RECORDS = 'records'
const TABLE_BUDGET = 'budgets'
const TABLE_BOOKS = 'books'

let dbOpen = false
let dbReadyPromise = null

/**
 * 初始化数据库
 */
export function initDB() {
  dbReadyPromise = new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.sqlite.openDatabase({
      name: DB_NAME,
      path: '_doc/book.db',
      success: function(e) {
        dbOpen = true
        console.log('数据库打开成功', e)
        createAllTables().then(() => resolve()).catch(err => reject(err))
      },
      fail: function(e) {
        console.error('数据库打开失败', e)
        reject(e)
      }
    })
    // #endif
    // #ifndef APP-PLUS
    dbOpen = true
    resolve()
    // #endif
  })
  return dbReadyPromise
}

/**
 * 确保数据库已初始化完成
 */
export function ensureDB() {
  if (dbReadyPromise) return dbReadyPromise
  if (dbOpen) return Promise.resolve()
  // 兜底：重新初始化
  return initDB()
}

function createAllTables() {
  return Promise.all([createRecordsTable(), createBudgetTable(), createBooksTable()])
}

function createRecordsTable() {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    const sql = `CREATE TABLE IF NOT EXISTS ${TABLE_RECORDS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      category TEXT NOT NULL,
      category_id TEXT NOT NULL,
      note TEXT,
      images TEXT,
      date TEXT NOT NULL,
      book_id INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    )`
    plus.sqlite.executeSql({
      name: DB_NAME, sql: sql,
      success: () => resolve(),
      fail: () => resolve()
    })
    // #endif
    // #ifndef APP-PLUS
    resolve()
    // #endif
  })
}

function createBudgetTable() {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    const sql = `CREATE TABLE IF NOT EXISTS ${TABLE_BUDGET} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL UNIQUE,
      budget_amount INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    )`
    plus.sqlite.executeSql({
      name: DB_NAME, sql: sql,
      success: () => resolve(),
      fail: () => resolve()
    })
    // #endif
    // #ifndef APP-PLUS
    resolve()
    // #endif
  })
}

function createBooksTable() {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    const sql = `CREATE TABLE IF NOT EXISTS ${TABLE_BOOKS} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT DEFAULT 'notebook',
      color TEXT DEFAULT '#6366f1',
      created_at INTEGER NOT NULL
    )`
    plus.sqlite.executeSql({
      name: DB_NAME, sql: sql,
      success: () => resolve(),
      fail: () => resolve()
    })
    // #endif
    // #ifndef APP-PLUS
    resolve()
    // #endif
  })
}

// ============== 记账记录 CRUD ==============

export function addRecord(record) {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    const amount = Math.round(parseFloat(record.amount) * 100)
    const bookId = record.book_id || 0

    ensureDB().then(() => {
      // #ifdef APP-PLUS
      const imagesStr = JSON.stringify(record.images || [])
      const sql = `INSERT INTO ${TABLE_RECORDS} (type, amount, category, category_id, note, images, date, book_id, created_at) VALUES ('${escapeStr(record.type)}', ${amount}, '${escapeStr(record.category)}', '${escapeStr(record.category_id)}', '${escapeStr(record.note || '')}', '${escapeStr(imagesStr)}', '${escapeStr(record.date)}', ${bookId}, ${now})`
      console.log('[addRecord] SQL:', sql)
      plus.sqlite.executeSql({
        name: DB_NAME, sql: sql,
        success: function(e) { console.log('[addRecord] 成功:', JSON.stringify(e)); resolve(e.insertId || now) },
        fail: function(e) { console.error('[addRecord] 失败:', JSON.stringify(e)); reject(e) }
      })
      // #endif
      // #ifndef APP-PLUS
      const records = getLocalRecords()
      const newId = now
      records.push({ id: newId, type: record.type, amount, category: record.category, category_id: record.category_id, note: record.note || '', images: record.images || [], date: record.date, book_id: bookId, created_at: now })
      saveLocalRecords(records)
      resolve(newId)
      // #endif
    }).catch(err => reject(err))
  })
}

export function deleteRecord(id) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.sqlite.executeSql({ name: DB_NAME, sql: `DELETE FROM ${TABLE_RECORDS} WHERE id=${id}`, success: () => resolve(), fail: (e) => reject(e) })
    // #endif
    // #ifndef APP-PLUS
    saveLocalRecords(getLocalRecords().filter(r => String(r.id) !== String(id)))
    resolve()
    // #endif
  })
}

export function updateRecord(id, record) {
  return new Promise((resolve, reject) => {
    const amount = Math.round(parseFloat(record.amount) * 100)
    ensureDB().then(() => {
      // #ifdef APP-PLUS
      const imagesStr = JSON.stringify(record.images || [])
      const sql = `UPDATE ${TABLE_RECORDS} SET type='${escapeStr(record.type)}', amount=${amount}, category='${escapeStr(record.category)}', category_id='${escapeStr(record.category_id)}', note='${escapeStr(record.note || '')}', images='${escapeStr(imagesStr)}', date='${escapeStr(record.date)}' WHERE id=${id}`
      console.log('[updateRecord] SQL:', sql)
      plus.sqlite.executeSql({ name: DB_NAME, sql: sql, success: () => { console.log('[updateRecord] 成功'); resolve() }, fail: (e) => { console.error('[updateRecord] 失败:', JSON.stringify(e)); reject(e) } })
      // #endif
      // #ifndef APP-PLUS
      let records = getLocalRecords()
      const idx = records.findIndex(r => String(r.id) === String(id))
      if (idx > -1) { records[idx] = { ...records[idx], ...record, amount, images: record.images || records[idx].images || [] }; saveLocalRecords(records) }
      resolve()
      // #endif
    }).catch(err => reject(err))
  })
}

export function getRecordsByMonth(month, bookId = 0) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    const sql = `SELECT * FROM ${TABLE_RECORDS} WHERE date LIKE '${month}%' AND book_id=${bookId} ORDER BY date DESC, created_at DESC`
    plus.sqlite.selectSql({
      name: DB_NAME, sql: sql,
      success: function(e) { resolve((e || []).map(r => ({ ...r, amount: r.amount / 100, images: r.images ? (typeof r.images === 'string' ? JSON.parse(r.images) : r.images) : [] }))) },
      fail: (e) => reject(e)
    })
    // #endif
    // #ifndef APP-PLUS
    resolve(getLocalRecords().filter(r => r.date.startsWith(month) && (r.book_id || 0) === bookId).sort((a, b) => b.created_at - a.created_at).map(r => ({ ...r, amount: r.amount / 100 })))
    // #endif
  })
}

export function getRecordById(id) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.sqlite.selectSql({
      name: DB_NAME, sql: `SELECT * FROM ${TABLE_RECORDS} WHERE id=${id}`,
      success: function(e) { resolve(e && e.length > 0 ? { ...e[0], amount: e[0].amount / 100, images: e[0].images ? (typeof e[0].images === 'string' ? JSON.parse(e[0].images) : e[0].images) : [] } : null) },
      fail: (e) => reject(e)
    })
    // #endif
    // #ifndef APP-PLUS
    const records = getLocalRecords()
    const r = records.find(r => String(r.id) === String(id))
    console.log('[getRecordById] 查找id=', id, '（类型:', typeof id, '），共', records.length, '条记录，匹配结果:', r ? '成功' : '未找到')
    if (r) console.log('[getRecordById] 找到记录:', JSON.stringify(r))
    resolve(r ? { ...r, amount: r.amount / 100, images: r.images || [] } : null)
    // #endif
  })
}

export function getMonthSummary(month, bookId = 0) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    const sql = `SELECT type, SUM(amount) as total FROM ${TABLE_RECORDS} WHERE date LIKE '${month}%' AND book_id=${bookId} GROUP BY type`
    plus.sqlite.selectSql({
      name: DB_NAME, sql: sql,
      success: function(e) {
        let income = 0, expense = 0
        for (const row of (e || [])) {
          if (row.type === 'income') income = row.total / 100
          else if (row.type === 'expense') expense = row.total / 100
        }
        resolve({ income, expense })
      },
      fail: (e) => reject(e)
    })
    // #endif
    // #ifndef APP-PLUS
    const records = getLocalRecords().filter(r => r.date.startsWith(month) && (r.book_id || 0) === bookId)
    let income = 0, expense = 0
    for (const r of records) {
      if (r.type === 'income') income += r.amount / 100
      else expense += r.amount / 100
    }
    resolve({ income, expense })
    // #endif
  })
}

export function getCategoryStats(month, type = 'expense', bookId = 0) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    const sql = `SELECT category, category_id, SUM(amount) as total FROM ${TABLE_RECORDS} WHERE date LIKE '${month}%' AND type='${type}' AND book_id=${bookId} GROUP BY category_id ORDER BY total DESC`
    plus.sqlite.selectSql({
      name: DB_NAME, sql: sql,
      success: function(e) {
        const list = (e || []).map(r => ({ category: r.category, category_id: r.category_id, total: r.total / 100 }))
        const sum = list.reduce((acc, item) => acc + item.total, 0)
        list.forEach(item => { item.percent = sum > 0 ? (item.total / sum * 100) : 0 })
        resolve(list)
      },
      fail: (e) => reject(e)
    })
    // #endif
    // #ifndef APP-PLUS
    const records = getLocalRecords().filter(r => r.date.startsWith(month) && r.type === type && (r.book_id || 0) === bookId)
    const map = {}
    for (const r of records) {
      if (!map[r.category_id]) map[r.category_id] = { category: r.category, category_id: r.category_id, total: 0 }
      map[r.category_id].total += r.amount / 100
    }
    const list = Object.values(map).sort((a, b) => b.total - a.total)
    const sum = list.reduce((acc, item) => acc + item.total, 0)
    list.forEach(item => { item.percent = sum > 0 ? (item.total / sum * 100) : 0 })
    resolve(list)
    // #endif
  })
}

export function getRecent6Months(bookId = 0) {
  return new Promise((resolve, reject) => {
    const months = []
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months.push(m)
    }
    Promise.all(months.map(m => getMonthSummary(m, bookId))).then(results => {
      resolve(months.map((m, i) => ({ month: m, income: results[i].income, expense: results[i].expense })))
    }).catch(err => reject(err))
  })
}

export function getTodaySummary(bookId = 0) {
  return new Promise((resolve, reject) => {
    const today = new Date()
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    // #ifdef APP-PLUS
    const sql = `SELECT type, SUM(amount) as total FROM ${TABLE_RECORDS} WHERE date='${dateStr}' AND book_id=${bookId} GROUP BY type`
    plus.sqlite.selectSql({
      name: DB_NAME, sql: sql,
      success: function(e) {
        let income = 0, expense = 0, count = 0
        for (const row of (e || [])) {
          if (row.type === 'income') income = row.total / 100
          else { expense = row.total / 100; count++ }
        }
        resolve({ income, expense, count })
      },
      fail: (e) => reject(e)
    })
    // #endif
    // #ifndef APP-PLUS
    const records = getLocalRecords().filter(r => r.date === dateStr && (r.book_id || 0) === bookId)
    let income = 0, expense = 0, count = 0
    for (const r of records) {
      if (r.type === 'income') income += r.amount / 100
      else { expense += r.amount / 100; count++ }
    }
    resolve({ income, expense, count })
    // #endif
  })
}

export function searchRecords(keyword, bookId = 0) {
  return new Promise((resolve, reject) => {
    // 把关键词拆成单字，任意一个字匹配即可（如搜"衣服"能匹配到"服饰"中的"服"）
    const chars = Array.from(keyword).filter(c => c.trim())
    // #ifdef APP-PLUS
    let charConds = ''
    if (chars.length > 0) {
      charConds = chars.map(c => {
        const ch = escapeStr(c)
        return `(category LIKE '%${ch}%' OR note LIKE '%${ch}%' OR printf('%.2f', amount / 100.0) LIKE '%${ch}%')`
      }).join(' OR ')
    }
    const sql = `SELECT * FROM ${TABLE_RECORDS} WHERE book_id=${bookId}${charConds ? ' AND (' + charConds + ')' : ''} ORDER BY date DESC, created_at DESC LIMIT 50`
    plus.sqlite.selectSql({
      name: DB_NAME, sql: sql,
      success: function(e) { resolve((e || []).map(r => ({ ...r, amount: r.amount / 100, images: r.images ? (typeof r.images === 'string' ? JSON.parse(r.images) : r.images) : [] }))) },
      fail: (e) => reject(e)
    })
    // #endif
    // #ifndef APP-PLUS
    resolve(getLocalRecords()
      .filter(r => {
        if ((r.book_id || 0) !== bookId) return false
        if (chars.length === 0) return false
        const cat = r.category || ''
        const note = r.note || ''
        const amt = (r.amount / 100).toFixed(2)
        // 任意一个字出现在 category/note/amount 中即可
        return chars.some(c => cat.includes(c) || note.includes(c) || amt.includes(c))
      })
      .sort((a, b) => b.created_at - a.created_at).slice(0, 50)
      .map(r => ({ ...r, amount: r.amount / 100 })))
    // #endif
  })
}

export function clearAllRecords() {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    // 同时清除记录和预算
    Promise.all([
      new Promise((r, j) => plus.sqlite.executeSql({ name: DB_NAME, sql: `DELETE FROM ${TABLE_RECORDS}`, success: () => r(), fail: (e) => j(e) })),
      new Promise((r, j) => plus.sqlite.executeSql({ name: DB_NAME, sql: `DELETE FROM ${TABLE_BUDGET}`, success: () => r(), fail: (e) => j(e) }))
    ]).then(() => resolve()).catch(err => reject(err))
    // #endif
    // #ifndef APP-PLUS
    saveLocalRecords([])
    saveLocalBudgets([])
    resolve()
    // #endif
  })
}

export function clearBudget(month) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.sqlite.executeSql({
      name: DB_NAME,
      sql: `DELETE FROM ${TABLE_BUDGET} WHERE month='${escapeStr(month)}'`,
      success: () => resolve(),
      fail: (e) => reject(e)
    })
    // #endif
    // #ifndef APP-PLUS
    let budgets = getLocalBudgets()
    budgets = budgets.filter(b => b.month !== month)
    saveLocalBudgets(budgets)
    resolve()
    // #endif
  })
}

export function getAllRecords() {
  return new Promise((resolve, reject) => {
    ensureDB().then(() => {
      // #ifdef APP-PLUS
      plus.sqlite.selectSql({
        name: DB_NAME, sql: `SELECT * FROM ${TABLE_RECORDS} ORDER BY date DESC, created_at DESC`,
        success: function(e) { resolve((e || []).map(r => ({ ...r, amount: r.amount / 100, images: r.images ? (typeof r.images === 'string' ? JSON.parse(r.images) : r.images) : [] }))) },
        fail: (e) => { console.error('[getAllRecords] SQL失败:', JSON.stringify(e)); resolve([]) }
      })
      // #endif
      // #ifndef APP-PLUS
      resolve(getLocalRecords().sort((a, b) => b.created_at - a.created_at).map(r => ({ ...r, amount: r.amount / 100 })))
      // #endif
    }).catch(err => { console.error('[getAllRecords] ensureDB失败:', err); resolve([]) })
  })
}

// ============== 预算管理 ==============

export function getBudget(month) {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.sqlite.selectSql({
      name: DB_NAME, sql: `SELECT * FROM ${TABLE_BUDGET} WHERE month='${month}'`,
      success: function(e) { resolve(e && e.length > 0 ? e[0].budget_amount / 100 : 0) },
      fail: () => resolve(0)
    })
    // #endif
    // #ifndef APP-PLUS
    const budgets = getLocalBudgets()
    const b = budgets.find(b => b.month === month)
    resolve(b ? b.amount : 0)
    // #endif
  })
}

export function setBudget(month, amount) {
  return new Promise((resolve, reject) => {
    const amt = Math.round(parseFloat(amount) * 100)
    const now = Date.now()
    // #ifdef APP-PLUS
    const sql = `INSERT OR REPLACE INTO ${TABLE_BUDGET} (month, budget_amount, created_at) VALUES ('${month}', ${amt}, ${now})`
    plus.sqlite.executeSql({ name: DB_NAME, sql: sql, success: () => resolve(), fail: (e) => reject(e) })
    // #endif
    // #ifndef APP-PLUS
    let budgets = getLocalBudgets()
    const idx = budgets.findIndex(b => b.month === month)
    if (idx > -1) budgets[idx].amount = parseFloat(amount)
    else budgets.push({ month, amount: parseFloat(amount) })
    saveLocalBudgets(budgets)
    resolve()
    // #endif
  })
}

export function getBudgetsByYear(year) {
  return new Promise((resolve, reject) => {
    const yearStr = String(year)
    // #ifdef APP-PLUS
    const sql = `SELECT month, budget_amount FROM ${TABLE_BUDGET} WHERE month LIKE '${yearStr}-%' ORDER BY month ASC`
    plus.sqlite.selectSql({
      name: DB_NAME, sql: sql,
      success: function(e) {
        const list = (e || []).map(row => ({ month: row.month, amount: row.budget_amount / 100 }))
        const total = list.reduce((s, b) => s + (b.amount || 0), 0)
        resolve({ total, list })
      },
      fail: () => resolve({ total: 0, list: [] })
    })
    // #endif
    // #ifndef APP-PLUS
    const budgets = getLocalBudgets()
    const list = budgets.filter(b => b.month && b.month.startsWith(yearStr))
    const total = list.reduce((s, b) => s + (b.amount || 0), 0)
    resolve({ total, list })
    // #endif
  })
}

// ============== 账本管理 ==============

export function getBooks() {
  return new Promise((resolve, reject) => {
    // #ifdef APP-PLUS
    plus.sqlite.selectSql({
      name: DB_NAME, sql: `SELECT * FROM ${TABLE_BOOKS} ORDER BY id ASC`,
      success: function(e) {
        if (!e || e.length === 0) {
          resolve([{ id: 0, name: '默认账本', icon: 'notebook', color: '#6366f1' }])
        } else {
          resolve([{ id: 0, name: '默认账本', icon: 'notebook', color: '#6366f1' }, ...e])
        }
      },
      fail: () => resolve([{ id: 0, name: '默认账本', icon: 'notebook', color: '#6366f1' }])
    })
    // #endif
    // #ifndef APP-PLUS
    resolve([{ id: 0, name: '默认账本', icon: 'notebook', color: '#6366f1' }])
    // #endif
  })
}

export function addBook(name, icon = 'notebook', color = '#6366f1') {
  return new Promise((resolve, reject) => {
    const now = Date.now()
    // #ifdef APP-PLUS
    const sql = `INSERT INTO ${TABLE_BOOKS} (name, icon, color, created_at) VALUES ('${escapeStr(name)}', '${icon}', '${color}', ${now})`
    plus.sqlite.executeSql({ name: DB_NAME, sql: sql, success: (e) => resolve(e.insertId || now), fail: (e) => reject(e) })
    // #endif
    // #ifndef APP-PLUS
    resolve(now)
    // #endif
  })
}

// ============== 关闭数据库 ==============

export function closeDB() {
  return new Promise((resolve) => {
    // #ifdef APP-PLUS
    if (dbOpen) {
      plus.sqlite.closeDatabase({ name: DB_NAME, success: () => { dbOpen = false; resolve() }, fail: () => resolve() })
    } else { resolve() }
    // #endif
    // #ifndef APP-PLUS
    dbOpen = false; resolve()
    // #endif
  })
}

// ============== localStorage 模拟 ==============

function getLocalRecords() {
  try { const d = uni.getStorageSync('book_records'); return d ? JSON.parse(d) : [] } catch (e) { return [] }
}
function saveLocalRecords(records) { uni.setStorageSync('book_records', JSON.stringify(records)) }
function getLocalBudgets() {
  try { const d = uni.getStorageSync('book_budgets'); return d ? JSON.parse(d) : [] } catch (e) { return [] }
}
function saveLocalBudgets(budgets) { uni.setStorageSync('book_budgets', JSON.stringify(budgets)) }

function escapeStr(str) {
  if (!str) return ''
  return String(str).replace(/'/g, "''")
}

export default {
  initDB, ensureDB, addRecord, deleteRecord, updateRecord, getRecordsByMonth, getRecordById,
  getMonthSummary, getCategoryStats, getRecent6Months, getTodaySummary, searchRecords, clearAllRecords, getAllRecords,
  getBudget, setBudget, clearBudget, getBudgetsByYear, getBooks, addBook, closeDB
}
