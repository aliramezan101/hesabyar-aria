import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import db from './db.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const port = Number(process.env.PORT || 3001)
const appPassword = String(process.env.APP_PASSWORD || '')
const production = process.env.NODE_ENV === 'production'
const sessions = new Set()

app.use(cors())
app.use(express.json({ limit: '1mb' }))

const nowId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const safeInt = (value) => Math.max(0, Math.round(Number(value) || 0))
const pageLimit = (value, fallback = 20) => Math.min(100, Math.max(1, Number(value) || fallback))
const parseCookies = (header = '') => Object.fromEntries(header.split(';').map((part) => part.trim().split('=').map(decodeURIComponent)).filter(([key, value]) => key && value))
const isAuthenticated = (req) => !appPassword || sessions.has(parseCookies(req.headers.cookie).aria_session)

app.get('/api/auth/status', (req, res) => res.json({ configured: Boolean(appPassword), authenticated: isAuthenticated(req), locked: production && !appPassword }))
app.post('/api/auth/login', (req, res) => {
  if (!appPassword) return res.json({ ok: true, configured: false })
  if (String(req.body?.password || '') !== appPassword) return res.status(401).json({ error: 'رمز ورود نادرست است.' })
  const token = crypto.randomBytes(32).toString('hex')
  sessions.add(token)
  res.setHeader('Set-Cookie', `aria_session=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax${production ? '; Secure' : ''}`)
  res.json({ ok: true })
})
app.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie).aria_session
  if (token) sessions.delete(token)
  res.setHeader('Set-Cookie', 'aria_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax')
  res.json({ ok: true })
})

app.use('/api', (req, res, next) => {
  if (req.path === '/health' || req.path.startsWith('/auth/')) return next()
  if (production && !appPassword) return res.status(503).json({ error: 'رمز APP_PASSWORD در محیط تولید تنظیم نشده است.' })
  if (!isAuthenticated(req)) return res.status(401).json({ error: 'نیاز به ورود است.' })
  next()
})

app.get('/api/health', (_req, res) => res.json({ ok: true, app: 'hesabyar-aria', time: new Date().toISOString() }))

app.get('/api/dashboard', (_req, res) => {
  const cash = db.prepare(`SELECT COALESCE(SUM(CASE WHEN direction='in' THEN amount_rial ELSE -amount_rial END),0) AS value FROM transactions WHERE status IN ('settled','paid')`).get().value
  const receivables = db.prepare(`SELECT COALESCE(SUM(amount_rial - paid_rial),0) AS value FROM installments WHERE status != 'paid'`).get().value
  const checksReceivable = db.prepare(`SELECT COALESCE(SUM(amount_rial),0) AS value FROM checks WHERE direction='receivable' AND status NOT IN ('settled','cancelled')`).get().value
  const commitments = db.prepare(`SELECT COALESCE(SUM(amount_rial),0) AS value FROM checks WHERE direction='payable' AND status NOT IN ('settled','cancelled')`).get().value
  const transactionCount = db.prepare(`SELECT COUNT(*) AS count FROM transactions`).get().count
  const upcoming = db.prepare(`SELECT * FROM checks WHERE status NOT IN ('settled','cancelled') ORDER BY due_date ASC LIMIT 5`).all()
  const transactions = db.prepare(`SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT 8`).all()
  const monthly = db.prepare(`SELECT substr(date, 1, 7) AS month, COALESCE(SUM(CASE WHEN direction='in' THEN amount_rial ELSE 0 END),0) AS inflow, COALESCE(SUM(CASE WHEN direction='out' THEN amount_rial ELSE 0 END),0) AS outflow FROM transactions GROUP BY substr(date,1,7) ORDER BY month DESC LIMIT 6`).all().reverse()
  res.json({ metrics: { cash, receivables: receivables + checksReceivable, commitments, transactionCount }, upcoming, transactions, monthly })
})

app.get('/api/transactions', (req, res) => {
  const limit = pageLimit(req.query.limit, 50)
  const query = String(req.query.q || '').trim()
  const rows = query
    ? db.prepare(`SELECT * FROM transactions WHERE description LIKE ? OR counterparty LIKE ? OR reference LIKE ? ORDER BY date DESC, created_at DESC LIMIT ?`).all(`%${query}%`, `%${query}%`, `%${query}%`, limit)
    : db.prepare(`SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ?`).all(limit)
  res.json(rows)
})

app.post('/api/transactions', (req, res) => {
  const body = req.body || {}
  if (!body.date || !body.description || safeInt(body.amount_rial) <= 0) return res.status(400).json({ error: 'date, description و amount_rial الزامی است.' })
  const record = {
    id: nowId('tx'),
    date: String(body.date),
    direction: body.direction === 'out' ? 'out' : 'in',
    category: String(body.category || 'other'),
    description: String(body.description).slice(0, 240),
    counterparty: String(body.counterparty || '').slice(0, 160),
    amount_rial: safeInt(body.amount_rial),
    status: String(body.status || 'settled'),
    reference: String(body.reference || '').slice(0, 80),
  }
  db.prepare(`INSERT INTO transactions (id,date,direction,category,description,counterparty,amount_rial,status,reference) VALUES (@id,@date,@direction,@category,@description,@counterparty,@amount_rial,@status,@reference)`).run(record)
  res.status(201).json(record)
})

app.get('/api/checks', (req, res) => {
  const limit = pageLimit(req.query.limit, 100)
  res.json(db.prepare(`SELECT * FROM checks ORDER BY due_date ASC LIMIT ?`).all(limit))
})

app.post('/api/checks', (req, res) => {
  const body = req.body || {}
  if (!body.holder || !body.issuer || !body.due_date || safeInt(body.amount_rial) <= 0) return res.status(400).json({ error: 'دارنده، صادرکننده، تاریخ سررسید و مبلغ الزامی است.' })
  const record = {
    id: nowId('check'),
    check_number: String(body.check_number || ''),
    serial: String(body.serial || ''),
    holder: String(body.holder),
    issuer: String(body.issuer),
    amount_rial: safeInt(body.amount_rial),
    due_date: String(body.due_date),
    direction: body.direction === 'payable' ? 'payable' : 'receivable',
    status: String(body.status || 'in_road'),
    owner: String(body.owner || ''),
    notes: String(body.notes || ''),
  }
  db.prepare(`INSERT INTO checks (id,check_number,serial,holder,issuer,amount_rial,due_date,direction,status,owner,notes) VALUES (@id,@check_number,@serial,@holder,@issuer,@amount_rial,@due_date,@direction,@status,@owner,@notes)`).run(record)
  res.status(201).json(record)
})

app.get('/api/contacts', (_req, res) => res.json(db.prepare(`SELECT * FROM contacts ORDER BY created_at DESC`).all()))
app.post('/api/contacts', (req, res) => {
  const body = req.body || {}
  if (!body.name) return res.status(400).json({ error: 'نام شخص الزامی است.' })
  const record = { id: nowId('contact'), name: String(body.name), type: String(body.type || 'customer'), phone: String(body.phone || ''), national_id: String(body.national_id || ''), notes: String(body.notes || '') }
  db.prepare(`INSERT INTO contacts (id,name,type,phone,national_id,notes) VALUES (@id,@name,@type,@phone,@national_id,@notes)`).run(record)
  res.status(201).json(record)
})
app.patch('/api/contacts/:id', (req, res) => {
  const body = req.body || {}
  if (!body.name) return res.status(400).json({ error: 'نام شخص الزامی است.' })
  const result = db.prepare(`UPDATE contacts SET name=?, type=?, phone=?, national_id=?, notes=? WHERE id=?`).run(String(body.name), String(body.type || 'customer'), String(body.phone || ''), String(body.national_id || ''), String(body.notes || ''), req.params.id)
  if (!result.changes) return res.status(404).json({ error: 'شخص پیدا نشد.' })
  res.json(db.prepare(`SELECT * FROM contacts WHERE id=?`).get(req.params.id))
})

app.get('/api/vehicles', (_req, res) => res.json(db.prepare(`SELECT vehicles.*, contacts.name AS customer_name FROM vehicles LEFT JOIN contacts ON contacts.id = vehicles.customer_id ORDER BY vehicles.created_at DESC`).all()))
app.post('/api/vehicles', (req, res) => {
  const body = req.body || {}
  if (!body.title) return res.status(400).json({ error: 'عنوان خودرو الزامی است.' })
  const record = { id: nowId('vehicle'), title: String(body.title), plate: String(body.plate || ''), vin: String(body.vin || ''), model_year: Number(body.model_year) || null, status: String(body.status || 'available'), value_rial: safeInt(body.value_rial), customer_id: body.customer_id || null, notes: String(body.notes || '') }
  db.prepare(`INSERT INTO vehicles (id,title,plate,vin,model_year,status,value_rial,customer_id,notes) VALUES (@id,@title,@plate,@vin,@model_year,@status,@value_rial,@customer_id,@notes)`).run(record)
  res.status(201).json(record)
})

app.get('/api/investors', (_req, res) => res.json(db.prepare(`SELECT * FROM investors ORDER BY created_at DESC`).all()))
app.post('/api/investors', (req, res) => {
  const body = req.body || {}
  if (!body.name) return res.status(400).json({ error: 'نام سرمایه‌گذار الزامی است.' })
  const record = { id: nowId('investor'), name: String(body.name), principal_rial: safeInt(body.principal_rial), rate_percent: Number(body.rate_percent) || 0, status: String(body.status || 'active'), notes: String(body.notes || '') }
  db.prepare(`INSERT INTO investors (id,name,principal_rial,rate_percent,status,notes) VALUES (@id,@name,@principal_rial,@rate_percent,@status,@notes)`).run(record)
  res.status(201).json(record)
})
app.patch('/api/investors/:id', (req, res) => {
  const body = req.body || {}
  if (!body.name) return res.status(400).json({ error: 'نام سرمایه‌گذار الزامی است.' })
  const result = db.prepare(`UPDATE investors SET name=?, principal_rial=?, rate_percent=?, status=?, notes=? WHERE id=?`).run(String(body.name), safeInt(body.principal_rial), Number(body.rate_percent) || 0, String(body.status || 'active'), String(body.notes || ''), req.params.id)
  if (!result.changes) return res.status(404).json({ error: 'سرمایه‌گذار پیدا نشد.' })
  res.json(db.prepare(`SELECT * FROM investors WHERE id=?`).get(req.params.id))
})

app.get('/api/installments', (_req, res) => res.json(db.prepare(`SELECT installments.*, contacts.name AS customer_name, vehicles.title AS vehicle_title FROM installments LEFT JOIN contacts ON contacts.id=installments.customer_id LEFT JOIN vehicles ON vehicles.id=installments.vehicle_id ORDER BY due_date ASC`).all()))
app.patch('/api/installments/:id', (req, res) => {
  const body = req.body || {}
  const paid = safeInt(body.paid_rial)
  const status = body.status === 'paid' ? 'paid' : 'due'
  const result = db.prepare(`UPDATE installments SET paid_rial=?, status=? WHERE id=?`).run(paid, status, req.params.id)
  if (!result.changes) return res.status(404).json({ error: 'قسط پیدا نشد.' })
  res.json({ ok: true })
})

app.get('/api/reports/summary', (_req, res) => {
  const categories = db.prepare(`SELECT category, direction, COALESCE(SUM(amount_rial),0) AS amount FROM transactions GROUP BY category, direction ORDER BY amount DESC`).all()
  const byStatus = db.prepare(`SELECT status, COUNT(*) AS count, COALESCE(SUM(amount_rial),0) AS amount FROM checks GROUP BY status`).all()
  res.json({ categories, byStatus })
})

const clientDist = path.resolve(__dirname, '../dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
}

if (process.env.VERCEL !== '1' && process.env.NETLIFY !== 'true') {
  app.listen(port, '0.0.0.0', () => console.log(`حسابیار آریا روی پورت ${port} فعال شد.`))
}

export default app
