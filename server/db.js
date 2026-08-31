import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const dataDir = process.env.DATA_DIR || (process.env.NETLIFY === 'true' ? '/tmp/hesabyar-aria-data' : path.resolve(process.cwd(), 'data'))
fs.mkdirSync(dataDir, { recursive: true })

const db = new DatabaseSync(path.join(dataDir, 'hesabyar-aria.db'))
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;')

db.exec(`
  CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'customer',
    phone TEXT,
    national_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    plate TEXT,
    vin TEXT,
    model_year INTEGER,
    status TEXT NOT NULL DEFAULT 'available',
    value_rial INTEGER NOT NULL DEFAULT 0,
    customer_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES contacts(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS investors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    principal_rial INTEGER NOT NULL DEFAULT 0,
    rate_percent REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('in', 'out')),
    category TEXT NOT NULL DEFAULT 'other',
    description TEXT NOT NULL,
    counterparty TEXT,
    amount_rial INTEGER NOT NULL CHECK(amount_rial >= 0),
    status TEXT NOT NULL DEFAULT 'settled',
    reference TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS checks (
    id TEXT PRIMARY KEY,
    check_number TEXT,
    serial TEXT,
    holder TEXT NOT NULL,
    issuer TEXT NOT NULL,
    amount_rial INTEGER NOT NULL CHECK(amount_rial >= 0),
    due_date TEXT NOT NULL,
    direction TEXT NOT NULL CHECK(direction IN ('receivable', 'payable')),
    status TEXT NOT NULL DEFAULT 'in_road',
    owner TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS installments (
    id TEXT PRIMARY KEY,
    customer_id TEXT,
    vehicle_id TEXT,
    due_date TEXT NOT NULL,
    amount_rial INTEGER NOT NULL CHECK(amount_rial >= 0),
    paid_rial INTEGER NOT NULL DEFAULT 0 CHECK(paid_rial >= 0),
    status TEXT NOT NULL DEFAULT 'due',
    reference TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES contacts(id) ON DELETE SET NULL,
    FOREIGN KEY(vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
  );
`)

const id = (prefix, index) => `${prefix}-${index}`
const seedDemo = process.env.SEED_DEMO !== 'false'

if (seedDemo && db.prepare('SELECT COUNT(*) AS count FROM transactions').get().count === 0) {
  const insertContact = db.prepare(`INSERT OR IGNORE INTO contacts (id, name, type, phone, notes) VALUES (?, ?, ?, ?, ?)`)
  const insertVehicle = db.prepare(`INSERT OR IGNORE INTO vehicles (id, title, plate, model_year, status, value_rial, customer_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertInvestor = db.prepare(`INSERT OR IGNORE INTO investors (id, name, principal_rial, rate_percent, status, notes) VALUES (?, ?, ?, ?, ?, ?)`)
  const insertTransaction = db.prepare(`INSERT OR IGNORE INTO transactions (id, date, direction, category, description, counterparty, amount_rial, status, reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertCheck = db.prepare(`INSERT OR IGNORE INTO checks (id, check_number, serial, holder, issuer, amount_rial, due_date, direction, status, owner, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const insertInstallment = db.prepare(`INSERT OR IGNORE INTO installments (id, customer_id, vehicle_id, due_date, amount_rial, paid_rial, status, reference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)

  db.exec('BEGIN')
  try {
    insertContact.run('contact-demo-1', 'مشتری نمونه رضایی', 'customer', '۰۹۱۲۱۲۳۴۵۶۷', 'نمونه آزمایشی؛ قبل از استفاده واقعی جایگزین شود.')
    insertContact.run('contact-demo-2', 'سرمایه‌گذار نمونه', 'investor', '۰۹۱۵۱۲۳۴۵۶۷', 'نمونه آزمایشی.')
    insertContact.run('contact-demo-3', 'صندوق توسعه نمونه', 'company', '', 'نمونه آزمایشی.')

    insertVehicle.run('vehicle-demo-1', 'آریزو ۵ FL نمونه', '۱۲ الف ۳۴۵ ایران ۵۱', 1402, 'leased', 28000000000, 'contact-demo-1', 'نمونه؛ اطلاعات واقعی وارد نشده است.')
    insertVehicle.run('vehicle-demo-2', 'تارا اتوماتیک نمونه', '۷۸ ب ۹۰۱ ایران ۳۶', 1403, 'available', 39500000000, null, 'نمونه؛ آماده تخصیص.')

    insertInvestor.run('investor-demo-1', 'سرمایه‌گذار نمونه', 80000000000, 4.5, 'active', 'نرخ و اصل سرمایه نمونه است.')
    insertInvestor.run('investor-demo-2', 'دایی مهدی (نمونه)', 22000000000, 4.5, 'active', 'این رکورد صرفاً برای نمایش رابط است.')

    const txs = [
      ['tx-demo-1', '۱۴۰۵/۰۶/۰۹', 'in', 'installment', 'دریافت قسط شماره ۵', 'مشتری نمونه رضایی', 5000000000, 'settled', 'نمونه-۰۰۱'],
      ['tx-demo-2', '۱۴۰۵/۰۶/۰۹', 'out', 'check', 'پرداخت چک سرمایه‌گذار', 'سرمایه‌گذار نمونه', 2150000000, 'in_road', 'نمونه-۰۰۲'],
      ['tx-demo-3', '۱۴۰۵/۰۶/۰۸', 'in', 'check', 'دریافت چک مشتری', 'مشتری نمونه رضایی', 1325000000, 'settled', 'نمونه-۰۰۳'],
      ['tx-demo-4', '۱۴۰۵/۰۶/۰۸', 'out', 'transfer', 'انتقال به حساب سرمایه‌گذار', 'صندوق توسعه نمونه', 3000000000, 'settled', 'نمونه-۰۰۴'],
      ['tx-demo-5', '۱۴۰۵/۰۶/۰۷', 'in', 'sale', 'دریافت از فروش خودرو', 'مشتری نمونه رضایی', 7600000000, 'settled', 'نمونه-۰۰۵'],
      ['tx-demo-6', '۱۴۰۵/۰۶/۰۶', 'out', 'expense', 'هزینه اجراییه چک', 'پرونده نمونه', 120000000, 'settled', 'نمونه-۰۰۶'],
    ]
    txs.forEach((row) => insertTransaction.run(...row))

    const checks = [
      ['check-demo-1', '۹۴۰۷۲۹', 'نمونه-۰۱', 'سرمایه‌گذار نمونه', 'صندوق حسابیار', 2150000000, '۱۴۰۵/۰۶/۱۲', 'payable', 'in_road', 'صندوق', '۳ روز مانده؛ نمونه'],
      ['check-demo-2', '۳۲۲۳۴۵', 'نمونه-۰۲', 'مشتری نمونه رضایی', 'مشتری نمونه رضایی', 1874000000, '۱۴۰۵/۰۶/۱۵', 'receivable', 'in_road', 'خودم', '۶ روز مانده؛ نمونه'],
      ['check-demo-3', '۳۳۴۴۵۶', 'نمونه-۰۳', 'مشتری نمونه رضایی', 'مشتری نمونه رضایی', 1325000000, '۱۴۰۵/۰۶/۱۷', 'receivable', 'in_road', 'خودم', '۸ روز مانده؛ نمونه'],
      ['check-demo-4', '۴۴۵۵۶۶', 'نمونه-۰۴', 'صندوق حسابیار', 'صندوق حسابیار', 900000000, '۱۴۰۵/۰۶/۱۹', 'payable', 'in_road', 'سرمایه‌گذار', '۱۰ روز مانده؛ نمونه'],
    ]
    checks.forEach((row) => insertCheck.run(...row))

    const installments = [
      ['installment-demo-1', 'contact-demo-1', 'vehicle-demo-1', '۱۴۰۵/۰۶/۱۴', 6500000000, 0, 'due', 'قسط-۰۰۱'],
      ['installment-demo-2', 'contact-demo-1', 'vehicle-demo-1', '۱۴۰۵/۰۶/۲۴', 6500000000, 0, 'due', 'قسط-۰۰۲'],
      ['installment-demo-3', 'contact-demo-1', 'vehicle-demo-1', '۱۴۰۵/۰۷/۰۴', 6500000000, 0, 'due', 'قسط-۰۰۳'],
      ['installment-demo-4', 'contact-demo-1', 'vehicle-demo-1', '۱۴۰۵/۰۵/۱۴', 6500000000, 6500000000, 'paid', 'قسط-۰۰۰'],
    ]
    installments.forEach((row) => insertInstallment.run(...row))
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }
}

export default db
