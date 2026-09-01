import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CarFront,
  Check,
  CheckCheck,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  FileCheck2,
  FilePlus2,
  LayoutDashboard,
  Menu,
  PieChart,
  Plus,
  Search,
  Settings,
  TrendingDown,
  TrendingUp,
  UserRound,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const navItems = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'ledger', label: 'دفتر کل', icon: BookOpen },
  { id: 'people', label: 'اشخاص', icon: UsersRound },
  { id: 'vehicles', label: 'خودروها', icon: CarFront },
  { id: 'checks', label: 'چک‌ها', icon: FileCheck2 },
  { id: 'installments', label: 'اقساط', icon: CalendarDays },
  { id: 'investors', label: 'سرمایه‌گذاران', icon: PieChart },
  { id: 'reports', label: 'گزارش‌ها', icon: BarChart3 },
]

const remoteApi = async (url, options) => {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'خطا در ارتباط با سرور')
  return payload
}

const faNumber = new Intl.NumberFormat('fa-IR')
const faCompact = new Intl.NumberFormat('fa-IR', { notation: 'compact', maximumFractionDigits: 1 })
const money = (value, compact = false) => `${(compact ? faCompact : faNumber).format(Math.round(Number(value || 0)))} ریال`
const dateLabel = (value) => String(value || '').replaceAll('-', '/')
const today = '۱۴۰۵/۰۶/۰۹'
const themeStorageKey = 'hesabyar-aria-theme-v1'
const getInitialTheme = () => {
  try { return window.localStorage.getItem(themeStorageKey) || 'light' } catch { return 'light' }
}

const isGithubPages = typeof window !== 'undefined' && window.location.hostname.endsWith('.github.io')
const localStorageKey = 'hesabyar-aria-local-v1'

const demoLocalData = {
  transactions: [
    { id: 'tx-demo-1', date: '۱۴۰۵/۰۶/۰۹', direction: 'in', category: 'installment', description: 'دریافت قسط شماره ۵', counterparty: 'مشتری نمونه رضایی', amount_rial: 5000000000, status: 'settled', reference: 'نمونه-۰۰۱' },
    { id: 'tx-demo-2', date: '۱۴۰۵/۰۶/۰۹', direction: 'out', category: 'check', description: 'پرداخت چک سرمایه‌گذار', counterparty: 'سرمایه‌گذار نمونه', amount_rial: 2150000000, status: 'in_road', reference: 'نمونه-۰۰۲' },
    { id: 'tx-demo-3', date: '۱۴۰۵/۰۶/۰۸', direction: 'in', category: 'check', description: 'دریافت چک مشتری', counterparty: 'مشتری نمونه رضایی', amount_rial: 1325000000, status: 'settled', reference: 'نمونه-۰۰۳' },
    { id: 'tx-demo-4', date: '۱۴۰۵/۰۶/۰۸', direction: 'out', category: 'transfer', description: 'انتقال به حساب سرمایه‌گذار', counterparty: 'صندوق توسعه نمونه', amount_rial: 3000000000, status: 'settled', reference: 'نمونه-۰۰۴' },
    { id: 'tx-demo-5', date: '۱۴۰۵/۰۶/۰۷', direction: 'in', category: 'sale', description: 'دریافت از فروش خودرو', counterparty: 'مشتری نمونه رضایی', amount_rial: 7600000000, status: 'settled', reference: 'نمونه-۰۰۵' },
    { id: 'tx-demo-6', date: '۱۴۰۵/۰۶/۰۶', direction: 'out', category: 'expense', description: 'هزینه اجراییه چک', counterparty: 'پرونده نمونه', amount_rial: 120000000, status: 'settled', reference: 'نمونه-۰۰۶' },
  ],
  checks: [
    { id: 'check-demo-1', check_number: '۹۴۰۷۲۹', serial: 'نمونه-۰۱', holder: 'سرمایه‌گذار نمونه', issuer: 'صندوق حسابیار', amount_rial: 2150000000, due_date: '۱۴۰۵/۰۶/۱۲', direction: 'payable', status: 'in_road', owner: 'صندوق', notes: '۳ روز مانده؛ نمونه' },
    { id: 'check-demo-2', check_number: '۳۲۲۳۴۵', serial: 'نمونه-۰۲', holder: 'مشتری نمونه رضایی', issuer: 'مشتری نمونه رضایی', amount_rial: 1874000000, due_date: '۱۴۰۵/۰۶/۱۵', direction: 'receivable', status: 'in_road', owner: 'خودم', notes: '۶ روز مانده؛ نمونه' },
    { id: 'check-demo-3', check_number: '۳۳۴۴۵۶', serial: 'نمونه-۰۳', holder: 'مشتری نمونه رضایی', issuer: 'مشتری نمونه رضایی', amount_rial: 1325000000, due_date: '۱۴۰۵/۰۶/۱۷', direction: 'receivable', status: 'in_road', owner: 'خودم', notes: '۸ روز مانده؛ نمونه' },
    { id: 'check-demo-4', check_number: '۴۴۵۵۶۶', serial: 'نمونه-۰۴', holder: 'صندوق حسابیار', issuer: 'صندوق حسابیار', amount_rial: 900000000, due_date: '۱۴۰۵/۰۶/۱۹', direction: 'payable', status: 'in_road', owner: 'سرمایه‌گذار', notes: '۱۰ روز مانده؛ نمونه' },
  ],
  contacts: [
    { id: 'contact-demo-1', name: 'مشتری نمونه رضایی', type: 'customer', phone: '۰۹۱۲۱۲۳۴۵۶۷', national_id: '', notes: 'نمونه آزمایشی؛ قبل از استفاده واقعی جایگزین شود.' },
    { id: 'contact-demo-2', name: 'سرمایه‌گذار نمونه', type: 'investor', phone: '۰۹۱۵۱۲۳۴۵۶۷', national_id: '', notes: 'نمونه آزمایشی.' },
    { id: 'contact-demo-3', name: 'صندوق توسعه نمونه', type: 'company', phone: '', national_id: '', notes: 'نمونه آزمایشی.' },
  ],
  vehicles: [
    { id: 'vehicle-demo-1', title: 'آریزو ۵ FL نمونه', plate: '۱۲ الف ۳۴۵ ایران ۵۱', vin: '', model_year: 1402, status: 'leased', value_rial: 28000000000, customer_id: 'contact-demo-1', notes: 'نمونه؛ اطلاعات واقعی وارد نشده است.' },
    { id: 'vehicle-demo-2', title: 'تارا اتوماتیک نمونه', plate: '۷۸ ب ۹۰۱ ایران ۳۶', vin: '', model_year: 1403, status: 'available', value_rial: 39500000000, customer_id: null, notes: 'نمونه؛ آماده تخصیص.' },
  ],
  investors: [
    { id: 'investor-demo-1', name: 'سرمایه‌گذار نمونه', principal_rial: 80000000000, rate_percent: 4.5, status: 'active', notes: 'نرخ و اصل سرمایه نمونه است.' },
    { id: 'investor-demo-2', name: 'دایی مهدی (نمونه)', principal_rial: 22000000000, rate_percent: 4.5, status: 'active', notes: 'این رکورد صرفاً برای نمایش رابط است.' },
  ],
  installments: [
    { id: 'installment-demo-1', customer_id: 'contact-demo-1', vehicle_id: 'vehicle-demo-1', due_date: '۱۴۰۵/۰۶/۱۴', amount_rial: 6500000000, paid_rial: 0, status: 'due', reference: 'قسط-۰۰۱' },
    { id: 'installment-demo-2', customer_id: 'contact-demo-1', vehicle_id: 'vehicle-demo-1', due_date: '۱۴۰۵/۰۶/۲۴', amount_rial: 6500000000, paid_rial: 0, status: 'due', reference: 'قسط-۰۰۲' },
    { id: 'installment-demo-3', customer_id: 'contact-demo-1', vehicle_id: 'vehicle-demo-1', due_date: '۱۴۰۵/۰۷/۰۴', amount_rial: 6500000000, paid_rial: 0, status: 'due', reference: 'قسط-۰۰۳' },
    { id: 'installment-demo-4', customer_id: 'contact-demo-1', vehicle_id: 'vehicle-demo-1', due_date: '۱۴۰۵/۰۵/۱۴', amount_rial: 6500000000, paid_rial: 6500000000, status: 'paid', reference: 'قسط-۰۰۰' },
  ],
}

const cloneLocalData = () => JSON.parse(JSON.stringify(demoLocalData))
const localData = () => {
  try {
    const saved = window.localStorage.getItem(localStorageKey)
    if (saved) return JSON.parse(saved)
  } catch { /* use the demo data when storage is unavailable */ }
  const seeded = cloneLocalData()
  try { window.localStorage.setItem(localStorageKey, JSON.stringify(seeded)) } catch { /* ignore storage failures */ }
  return seeded
}
const saveLocalData = (data) => {
  try { window.localStorage.setItem(localStorageKey, JSON.stringify(data)) } catch { /* ignore storage failures */ }
}
const localId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const localBody = (options = {}) => {
  try { return JSON.parse(options.body || '{}') } catch { return {} }
}

const localApi = async (url, options = {}) => {
  const path = String(url).split('?')[0]
  const query = new URLSearchParams(String(url).split('?')[1] || '')
  if (path === '/api/auth/status') return { configured: false, authenticated: true, locked: false }
  if (path === '/api/auth/login') return { ok: true, configured: false }

  const data = localData()
  const sortNewest = (rows) => [...rows].sort((a, b) => String(b.date || b.created_at || '').localeCompare(String(a.date || a.created_at || '')))
  const withJoins = () => {
    const contacts = Object.fromEntries(data.contacts.map((item) => [item.id, item.name]))
    const vehicles = Object.fromEntries(data.vehicles.map((item) => [item.id, item.title]))
    return {
      contacts,
      vehicles,
      vehiclesRows: data.vehicles.map((item) => ({ ...item, customer_name: contacts[item.customer_id] || null })),
      installments: data.installments.map((item) => ({ ...item, customer_name: contacts[item.customer_id] || null, vehicle_title: vehicles[item.vehicle_id] || null })),
    }
  }

  if (path === '/api/dashboard') {
    const cash = data.transactions.filter((item) => ['settled', 'paid'].includes(item.status)).reduce((sum, item) => sum + (item.direction === 'in' ? item.amount_rial : -item.amount_rial), 0)
    const receivables = data.installments.filter((item) => item.status !== 'paid').reduce((sum, item) => sum + item.amount_rial - item.paid_rial, 0)
    const checksReceivable = data.checks.filter((item) => item.direction === 'receivable' && !['settled', 'cancelled'].includes(item.status)).reduce((sum, item) => sum + item.amount_rial, 0)
    const commitments = data.checks.filter((item) => item.direction === 'payable' && !['settled', 'cancelled'].includes(item.status)).reduce((sum, item) => sum + item.amount_rial, 0)
    const months = {}
    data.transactions.forEach((item) => { const month = String(item.date || '').slice(0, 7); months[month] ||= { month, inflow: 0, outflow: 0 }; months[month][item.direction === 'in' ? 'inflow' : 'outflow'] += item.amount_rial })
    const monthly = Object.values(months).sort((a, b) => a.month.localeCompare(b.month)).slice(-6)
    return { metrics: { cash, receivables: receivables + checksReceivable, commitments, transactionCount: data.transactions.length }, upcoming: [...data.checks].filter((item) => !['settled', 'cancelled'].includes(item.status)).sort((a, b) => String(a.due_date).localeCompare(String(b.due_date))).slice(0, 5), transactions: sortNewest(data.transactions).slice(0, 8), monthly }
  }
  if (path === '/api/transactions' && !options.method) {
    const q = String(query.get('q') || '').trim()
    const rows = q ? data.transactions.filter((item) => `${item.description} ${item.counterparty} ${item.reference}`.includes(q)) : data.transactions
    return sortNewest(rows).slice(0, Math.min(100, Number(query.get('limit')) || 50))
  }
  if (path === '/api/transactions' && options.method === 'POST') {
    const body = localBody(options)
    const record = { id: localId('tx'), date: String(body.date || today), direction: body.direction === 'out' ? 'out' : 'in', category: String(body.category || 'other'), description: String(body.description || ''), counterparty: String(body.counterparty || ''), amount_rial: Math.max(0, Math.round(Number(body.amount_rial) || 0)), status: String(body.status || 'settled'), reference: String(body.reference || '') }
    data.transactions.push(record); saveLocalData(data); return record
  }
  const collectionMap = { '/api/checks': 'checks', '/api/contacts': 'contacts', '/api/vehicles': 'vehicles', '/api/investors': 'investors' }
  if (collectionMap[path] && !options.method) {
    return collectionMap[path] === 'vehicles' ? withJoins().vehiclesRows : data[collectionMap[path]]
  }
  if (collectionMap[path] && options.method === 'POST') {
    const body = localBody(options)
    const type = collectionMap[path]
    const defaults = type === 'checks' ? { holder: '', issuer: '', amount_rial: 0, due_date: today, direction: 'receivable', check_number: '', serial: '', owner: 'خودم', status: 'in_road', notes: '' } : type === 'contacts' ? { name: '', type: 'customer', phone: '', national_id: '', notes: '' } : type === 'vehicles' ? { title: '', plate: '', vin: '', model_year: null, status: 'available', value_rial: 0, customer_id: null, notes: '' } : { name: '', principal_rial: 0, rate_percent: 0, status: 'active', notes: '' }
    const record = { ...defaults, ...body, id: localId(type.slice(0, -1)), amount_rial: Math.max(0, Math.round(Number(body.amount_rial) || 0)), value_rial: Math.max(0, Math.round(Number(body.value_rial) || 0)), principal_rial: Math.max(0, Math.round(Number(body.principal_rial) || 0)), rate_percent: Number(body.rate_percent) || 0 }
    data[type].push(record); saveLocalData(data); return record
  }
  if (path.startsWith('/api/contacts/') && options.method === 'PATCH') {
    const id = path.split('/').pop(); const body = localBody(options); const item = data.contacts.find((row) => row.id === id)
    if (!item) throw new Error('شخص پیدا نشد.')
    Object.assign(item, { name: String(body.name || item.name), type: String(body.type || item.type), phone: String(body.phone || ''), national_id: String(body.national_id || ''), notes: String(body.notes || '') })
    saveLocalData(data); return item
  }
  if (path.startsWith('/api/investors/') && options.method === 'PATCH') {
    const id = path.split('/').pop(); const body = localBody(options); const item = data.investors.find((row) => row.id === id)
    if (!item) throw new Error('سرمایه‌گذار پیدا نشد.')
    Object.assign(item, { name: String(body.name || item.name), principal_rial: Math.max(0, Math.round(Number(body.principal_rial) || 0)), rate_percent: Number(body.rate_percent) || 0, status: String(body.status || item.status), notes: String(body.notes || '') })
    saveLocalData(data); return item
  }
  if (path === '/api/installments' && !options.method) return withJoins().installments
  if (path.startsWith('/api/installments/') && options.method === 'PATCH') {
    const id = path.split('/').pop(); const body = localBody(options); const item = data.installments.find((row) => row.id === id)
    if (!item) throw new Error('قسط پیدا نشد.')
    item.paid_rial = Math.max(0, Math.round(Number(body.paid_rial) || 0)); item.status = body.status === 'paid' ? 'paid' : 'due'; saveLocalData(data); return { ok: true }
  }
  if (path === '/api/reports/summary') return { categories: [], byStatus: [] }
  throw new Error('مسیر محلی پیدا نشد.')
}

const api = (url, options) => isGithubPages ? localApi(url, options) : remoteApi(url, options)

function App() {
  const [active, setActive] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [records, setRecords] = useState({ transactions: [], checks: [], contacts: [], vehicles: [], investors: [], installments: [] })
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [profile, setProfile] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [dateContext, setDateContext] = useState({ id: 'today', label: today })
  const [theme, setTheme] = useState(getInitialTheme)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState(null)
  const [search, setSearch] = useState('')
  const [auth, setAuth] = useState({ loading: true, required: false, locked: false, authenticated: false })

  const refresh = async () => {
    setLoading(true)
    try {
      const [dash, transactions, checks, contacts, vehicles, investors, installments] = await Promise.all([
        api('/api/dashboard'),
        api('/api/transactions?limit=100'),
        api('/api/checks'),
        api('/api/contacts'),
        api('/api/vehicles'),
        api('/api/investors'),
        api('/api/installments'),
      ])
      setDashboard(dash)
      setRecords({ transactions, checks, contacts, vehicles, investors, installments })
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    api('/api/auth/status')
      .then((status) => {
        setAuth({ loading: false, required: status.configured, locked: status.locked, authenticated: status.authenticated })
        if (!status.configured || status.authenticated) refresh()
      })
      .catch((error) => { setAuth({ loading: false, required: false, locked: false, authenticated: false }); setNotice({ type: 'error', message: error.message }) })
  }, [])

  const currentTitle = navItems.find((item) => item.id === active)?.label || 'داشبورد'
  const go = (id) => { setActive(id); setMobileOpen(false) }
  const openModal = (type, record = null) => setModal({ type, record })
  const submitModal = async (payload) => {
    try {
      const type = modal.type
      const baseEndpoint = { transaction: '/api/transactions', check: '/api/checks', contact: '/api/contacts', vehicle: '/api/vehicles', investor: '/api/investors' }[type]
      const endpoint = modal.record ? `${baseEndpoint}/${modal.record.id}` : baseEndpoint
      await api(endpoint, { method: modal.record ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
      setModal(null)
      await refresh()
      setNotice({ type: 'success', message: modal.record ? 'تغییرات با موفقیت ذخیره شد.' : 'رکورد با موفقیت ثبت شد.' })
    } catch (error) {
      setNotice({ type: 'error', message: error.message })
    }
  }

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(null), 4000)
    return () => window.clearTimeout(timer)
  }, [notice])

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try { window.localStorage.setItem(themeStorageKey, theme) } catch { /* ignore storage failures */ }
  }, [theme])

  if (auth.loading) return <div className="auth-loading"><div className="auth-loading-mark">A</div><span>در حال آماده‌سازی حسابیار آریا...</span></div>
  if (auth.locked) return <LockedScreen />
  if (auth.required && !auth.authenticated) return <LoginScreen onLogin={() => { setAuth((current) => ({ ...current, authenticated: true })); refresh() }} />

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">A</div>
          <div>
            <strong>حسابیار آریا</strong>
            <span>دفتر مالی شما</span>
          </div>
        </div>
        <nav className="side-nav">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${active === id ? 'active' : ''}`} onClick={() => go(id)}>
              <Icon size={19} strokeWidth={active === id ? 2.2 : 1.8} />
              <span>{label}</span>
              {active === id && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button className="nav-item" onClick={() => setSettingsOpen(true)}><Settings size={19} /><span>تنظیمات</span></button>
          <div className="sidebar-divider" />
          <div className="workspace-status"><span className="status-dot" /> پایگاه محلی فعال</div>
          <small>واحد مرجع: ریال</small>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen((open) => !open)} aria-label="بازکردن منو"><Menu size={22} /></button>
          <div className="topbar-context">
            <span className="topbar-kicker">فضای کاری شخصی</span>
            <span className="topbar-title">{currentTitle}</span>
          </div>
          <div className="topbar-actions">
            <label className="global-search">
              <Search size={17} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="جست‌وجو در حسابیار آریا..." />
            </label>
            <button className="icon-button notification-button" aria-label="اعلان‌ها"><Bell size={19} /><span>۴</span></button>
            <button className="avatar-button">ع</button>
          </div>
        </header>

        <div className="page-wrap">
          <div className="page-heading">
            <div>
              <div className="breadcrumb">حسابیار آریا <ArrowLeft size={14} /> {currentTitle}</div>
              <h1>{active === 'dashboard' ? 'داشبورد مالی' : currentTitle}</h1>
              <p>{active === 'dashboard' ? 'نمایی سریع از نقدینگی، تعهدات و سررسیدهای شما' : pageDescription(active)}</p>
            </div>
            <div className="heading-actions">
              <div className="date-picker-wrap">
                <button className="date-control" aria-expanded={dateOpen} onClick={() => setDateOpen((open) => !open)}><CalendarDays size={16} /> {dateContext.label} <ChevronDown size={15} /></button>
                {dateOpen && <DateMenu selected={dateContext.id} onSelect={(option) => { setDateContext(option); setDateOpen(false); setNotice({ type: 'success', message: `بازهٔ ${option.label} انتخاب شد.` }) }} />}
              </div>
              <button className="primary-button" onClick={() => openModal('transaction')}><Plus size={18} /> ثبت تراکنش</button>
            </div>
          </div>

          {loading && <div className="loading-bar"><span /></div>}
          {notice && <div className={`notice ${notice.type}`}><span>{notice.message}</span><button onClick={() => setNotice(null)}><X size={16} /></button></div>}

          {active === 'dashboard' && <Dashboard dashboard={dashboard} onOpen={openModal} />}
          {active === 'ledger' && <Ledger transactions={records.transactions} search={search} onOpen={openModal} />}
          {active === 'people' && <People contacts={records.contacts} onOpen={openModal} onOpenProfile={setProfile} />}
          {active === 'vehicles' && <Vehicles vehicles={records.vehicles} onOpen={openModal} />}
          {active === 'checks' && <Checks checks={records.checks} onOpen={openModal} />}
          {active === 'installments' && <Installments installments={records.installments} onRefresh={refresh} />}
          {active === 'investors' && <Investors investors={records.investors} onOpen={openModal} />}
          {active === 'reports' && <Reports dashboard={dashboard} records={records} />}
        </div>
      </main>

      {modal && <Modal type={modal.type} record={modal.record} onClose={() => setModal(null)} onSubmit={submitModal} />}
      {profile && <ContactProfile contact={profile} onClose={() => setProfile(null)} onEdit={() => { setProfile(null); openModal('contact', profile) }} />}
      {settingsOpen && <SettingsPanel theme={theme} onThemeChange={setTheme} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('')
    try { await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) }); onLogin() } catch (err) { setError(err.message) } finally { setBusy(false) }
  }
  return <div className="auth-screen"><div className="auth-card"><div className="auth-brand"><div className="brand-mark">A</div><div><strong>حسابیار آریا</strong><span>دفتر مالی شما</span></div></div><h1>ورود به فضای مالی</h1><p>برای مشاهده اطلاعات حسابداری، رمز ورود را وارد کنید.</p><form onSubmit={submit}><label className="field"><span>رمز ورود</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus required /></label>{error && <div className="auth-error">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? 'در حال بررسی...' : 'ورود به حسابیار'} <ArrowLeft size={16} /></button></form><small>داده‌ها در پایگاه امن همین فضای کاری نگهداری می‌شوند.</small></div></div>
}

function LockedScreen() { return <div className="auth-screen"><div className="auth-card"><div className="auth-brand"><div className="brand-mark">A</div><div><strong>حسابیار آریا</strong><span>دفتر مالی شما</span></div></div><h1>تنظیمات ناقص است</h1><p>برای فعال‌شدن نسخه عمومی، متغیر محیطی <code>APP_PASSWORD</code> باید در Railway تنظیم شود.</p><div className="auth-error">تا تنظیم رمز، اطلاعات مالی از دسترس عمومی خارج است.</div></div></div> }

function pageDescription(active) {
  return {
    ledger: 'تمام ورود و خروج‌های ثبت‌شده با قابلیت پیگیری',
    people: 'مشتریان، سرمایه‌گذاران و طرف‌حساب‌های کاری',
    vehicles: 'دارایی‌ها و خودروهای در حال اجاره به شرط تملیک',
    checks: 'چک‌های دریافتی و پرداختی با کنترل سررسید',
    installments: 'برنامه اقساط و وضعیت وصول مشتریان',
    investors: 'اصل سرمایه، نرخ توافقی و تعهدات سرمایه‌گذاران',
    reports: 'خلاصه تحلیلی برای تصمیم‌گیری و کنترل ریسک',
  }[active]
}

function Dashboard({ dashboard, onOpen }) {
  const data = dashboard?.monthly?.map((item) => ({ ...item, label: item.month.replace('۱۴۰۵/', '') })) || []
  const metrics = dashboard?.metrics || { cash: 0, receivables: 0, commitments: 0, transactionCount: 0 }
  return (
    <>
      <section className="metric-grid">
        <MetricCard label="موقعیت خالص مالی" value={metrics.cash + metrics.receivables - metrics.commitments} accent="blue" icon={WalletCards} trend="۸.۳٪" />
        <MetricCard label="موجودی نقد" value={metrics.cash} accent="teal" icon={CircleDollarSign} trend="۵.۷٪" />
        <MetricCard label="مطالبات" value={metrics.receivables} accent="indigo" icon={ClipboardList} trend="۱۲.۱٪" />
        <MetricCard label="تعهدات نزدیک" value={metrics.commitments} accent="red" icon={FileCheck2} trend="۹.۶٪" down />
      </section>

      <section className="dashboard-grid">
        <div className="panel cashflow-panel">
          <PanelHeader title="جریان نقدی" action={<select className="select-compact" defaultValue="6"><option value="6">۶ ماه اخیر</option><option value="12">۱۲ ماه اخیر</option></select>} />
          <div className="chart-legend"><span><i className="legend-dot green" /> ورودی نقد</span><span><i className="legend-dot red" /> خروجی نقد</span><span><i className="legend-dot blue" /> خالص جریان</span></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.length ? data : [{ label: 'فروردین', inflow: 0, outflow: 0 }]} margin={{ top: 12, right: 5, left: 8, bottom: 4 }}>
                <defs>
                  <linearGradient id="inflow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16b995" stopOpacity={0.28} /><stop offset="100%" stopColor="#16b995" stopOpacity={0} /></linearGradient>
                  <linearGradient id="outflow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ec6a75" stopOpacity={0.22} /><stop offset="100%" stopColor="#ec6a75" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#edf0f5" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#8992a4', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#8992a4', fontSize: 10 }} tickFormatter={(value) => `${Math.round(value / 1000000000)}ب`} width={32} />
                <Tooltip formatter={(value) => money(value, true)} labelFormatter={(label) => `ماه ${label}`} contentStyle={{ direction: 'rtl', border: '1px solid #e7ebf2', borderRadius: 12, fontFamily: 'inherit' }} />
                <Area type="monotone" dataKey="inflow" name="ورودی نقد" stroke="#16b995" strokeWidth={2.4} fill="url(#inflow)" />
                <Area type="monotone" dataKey="outflow" name="خروجی نقد" stroke="#ec6a75" strokeWidth={2.1} fill="url(#outflow)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel upcoming-panel">
          <PanelHeader title="سررسیدهای نزدیک" action={<button className="text-button" onClick={() => onOpen('check')}>ثبت چک <Plus size={14} /></button>} />
          <div className="upcoming-list">
            {(dashboard?.upcoming || []).map((item) => <UpcomingItem key={item.id} item={item} />)}
            {!dashboard?.upcoming?.length && <EmptyState icon={FileCheck2} text="سررسید فعالی ثبت نشده است" />}
          </div>
          <button className="panel-footer-link">مشاهده همه <ArrowLeft size={15} /></button>
        </div>
      </section>

      <section className="panel transactions-panel">
        <PanelHeader title="آخرین تراکنش‌ها" action={<button className="text-button">مشاهده همه <ArrowLeft size={15} /></button>} />
        <TransactionTable transactions={dashboard?.transactions || []} />
      </section>
    </>
  )
}

function MetricCard({ label, value, icon: Icon, accent, trend, down }) {
  return <div className={`metric-card accent-${accent}`}>
    <div className="metric-top"><span>{label}</span><span className="metric-icon"><Icon size={18} /></span></div>
    <strong>{money(value, true)}</strong>
    <div className={`metric-trend ${down ? 'negative' : ''}`}>{down ? <TrendingDown size={14} /> : <TrendingUp size={14} />} <b>{trend}</b><span>نسبت به دوره قبل</span></div>
  </div>
}

function PanelHeader({ title, action }) { return <div className="panel-header"><h2>{title}</h2>{action}</div> }

function UpcomingItem({ item }) {
  return <div className="upcoming-item">
    <span className={`upcoming-icon ${item.direction === 'payable' ? 'payable' : 'receivable'}`}><FileCheck2 size={17} /></span>
    <div className="upcoming-main"><strong>{item.direction === 'payable' ? 'چک پرداختنی' : 'چک دریافتی'}</strong><span>{item.holder}</span><small>{dateLabel(item.due_date)}</small></div>
    <div className="upcoming-value"><b>{money(item.amount_rial, true)}</b><small>{item.direction === 'payable' ? 'پرداخت' : 'دریافت'}</small></div>
  </div>
}

function TransactionTable({ transactions, compact = false }) {
  return <div className={`table-scroll ${compact ? 'compact-table' : ''}`}><table><thead><tr><th>تاریخ</th><th>شرح</th><th>طرف حساب</th><th>مبلغ</th><th>وضعیت</th></tr></thead><tbody>
    {transactions.map((item) => <tr key={item.id}><td className="muted-cell">{dateLabel(item.date)}</td><td><span className={`direction-icon ${item.direction}`} >{item.direction === 'in' ? <ArrowDownLeft size={15} /> : <ArrowUpRight size={15} />}</span>{item.description}</td><td className="muted-cell">{item.counterparty || '—'}</td><td className={item.direction === 'in' ? 'amount-in' : 'amount-out'}>{item.direction === 'in' ? '+' : '−'} {money(item.amount_rial)}</td><td><StatusBadge status={item.status} /></td></tr>)}
    {!transactions.length && <tr><td colSpan="5"><EmptyState icon={ClipboardList} text="هنوز تراکنشی ثبت نشده است" /></td></tr>}
  </tbody></table></div>
}

function StatusBadge({ status }) {
  const map = { settled: ['تسویه شده', 'success'], in_road: ['در انتظار', 'info'], due: ['سررسید', 'warning'], paid: ['پرداخت شده', 'success'], active: ['فعال', 'success'], available: ['آزاد', 'info'], leased: ['در قرارداد', 'warning'], overdue: ['معوق', 'danger'] }
  const [label, tone] = map[status] || [status || 'ثبت‌شده', 'neutral']
  return <span className={`status-badge ${tone}`}><i />{label}</span>
}

function Ledger({ transactions, search, onOpen }) {
  const filtered = useMemo(() => search ? transactions.filter((item) => `${item.description} ${item.counterparty} ${item.reference}`.includes(search)) : transactions, [transactions, search])
  return <section className="panel page-panel"><PanelHeader title="دفتر کل" action={<button className="primary-button small" onClick={() => onOpen('transaction')}><Plus size={16} /> ثبت تراکنش</button>} /><div className="filter-row"><div className="filter-search"><Search size={16} /><span>{search || 'برای فیلتر از جست‌وجوی بالا استفاده کنید'}</span></div><button className="secondary-button"><CalendarDays size={16} /> بازه زمانی</button><button className="secondary-button"><ChevronDown size={16} /> همه وضعیت‌ها</button></div><TransactionTable transactions={filtered} /></section>
}

function People({ contacts, onOpen, onOpenProfile }) {
  return <section className="panel page-panel"><PanelHeader title="اشخاص و طرف‌حساب‌ها" action={<button className="primary-button small" onClick={() => onOpen('contact')}><Plus size={16} /> شخص جدید</button>} /><div className="entity-grid">{contacts.map((item) => <button type="button" className="entity-card" key={item.id} onClick={() => onOpenProfile(item)} aria-label={`مشاهده پروفایل ${item.name}`}><div className="entity-avatar"><UserRound size={20} /></div><div><strong>{item.name}</strong><span>{contactType(item.type)}</span><small>{item.phone || 'شماره ثبت نشده'}</small></div><ArrowLeft size={16} /></button>)}{!contacts.length && <EmptyState icon={UsersRound} text="شخصی ثبت نشده است" />}</div></section>
}

function contactType(type) { return { customer: 'مشتری', investor: 'سرمایه‌گذار', company: 'شرکت / صندوق' }[type] || 'طرف حساب' }

function Vehicles({ vehicles, onOpen }) {
  return <section className="panel page-panel"><PanelHeader title="خودروها" action={<button className="primary-button small" onClick={() => onOpen('vehicle')}><Plus size={16} /> خودرو جدید</button>} /><div className="table-scroll"><table><thead><tr><th>خودرو</th><th>پلاک</th><th>مدل</th><th>ارزش ثبت‌شده</th><th>وضعیت</th><th>طرف قرارداد</th></tr></thead><tbody>{vehicles.map((item) => <tr key={item.id}><td><span className="table-leading-icon"><CarFront size={16} /></span>{item.title}</td><td>{item.plate || '—'}</td><td>{item.model_year || '—'}</td><td>{money(item.value_rial)}</td><td><StatusBadge status={item.status} /></td><td className="muted-cell">{item.customer_name || 'آزاد'}</td></tr>)}{!vehicles.length && <tr><td colSpan="6"><EmptyState icon={CarFront} text="خودرویی ثبت نشده است" /></td></tr>}</tbody></table></div></section>
}

function Checks({ checks, onOpen }) {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? checks : checks.filter((item) => item.direction === filter)
  return <section className="panel page-panel"><PanelHeader title="مدیریت چک‌ها" action={<button className="primary-button small" onClick={() => onOpen('check')}><Plus size={16} /> ثبت چک</button>} /><div className="tab-row"><button className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>همه ({checks.length})</button><button className={filter === 'receivable' ? 'selected' : ''} onClick={() => setFilter('receivable')}>دریافتی</button><button className={filter === 'payable' ? 'selected' : ''} onClick={() => setFilter('payable')}>پرداختی</button></div><div className="table-scroll"><table><thead><tr><th>شماره / سریال</th><th>دارنده</th><th>صادرکننده</th><th>مبلغ</th><th>سررسید</th><th>نوع</th><th>وضعیت</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><b>{item.check_number || 'بدون شماره'}</b><small className="table-subtext">{item.serial || '—'}</small></td><td>{item.holder}</td><td>{item.issuer}</td><td className={item.direction === 'receivable' ? 'amount-in' : 'amount-out'}>{money(item.amount_rial)}</td><td>{dateLabel(item.due_date)}</td><td>{item.direction === 'receivable' ? 'دریافتی' : 'پرداختی'}</td><td><StatusBadge status={item.status} /></td></tr>)}{!filtered.length && <tr><td colSpan="7"><EmptyState icon={FileCheck2} text="چکی با این فیلتر وجود ندارد" /></td></tr>}</tbody></table></div></section>
}

function Installments({ installments, onRefresh }) {
  const markPaid = async (item) => { try { await api(`/api/installments/${item.id}`, { method: 'PATCH', body: JSON.stringify({ paid_rial: item.amount_rial, status: 'paid' }) }); await onRefresh() } catch { /* notice is handled by next refresh */ } }
  return <section className="panel page-panel"><PanelHeader title="برنامه اقساط" action={<button className="secondary-button"><CalendarDays size={16} /> تقویم اقساط</button>} /><div className="installment-summary"><div><span>کل اقساط</span><b>{faNumber.format(installments.length)}</b></div><div><span>وصول‌شده</span><b className="positive">{faNumber.format(installments.filter((i) => i.status === 'paid').length)}</b></div><div><span>در انتظار وصول</span><b className="warning-text">{faNumber.format(installments.filter((i) => i.status !== 'paid').length)}</b></div></div><div className="table-scroll"><table><thead><tr><th>مشتری</th><th>خودرو</th><th>سررسید</th><th>مبلغ قسط</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{installments.map((item) => <tr key={item.id}><td>{item.customer_name || '—'}</td><td>{item.vehicle_title || '—'}</td><td>{dateLabel(item.due_date)}</td><td>{money(item.amount_rial)}</td><td><StatusBadge status={item.status} /></td><td>{item.status !== 'paid' && <button className="row-action" onClick={() => markPaid(item)}><Check size={15} /> ثبت وصول</button>}</td></tr>)}</tbody></table></div></section>
}

function Investors({ investors, onOpen }) {
  return <section className="panel page-panel"><PanelHeader title="سرمایه‌گذاران" action={<button className="primary-button small" onClick={() => onOpen('investor')}><Plus size={16} /> سرمایه‌گذار جدید</button>} /><div className="investor-grid">{investors.map((item) => <article className="investor-card" key={item.id}><div className="investor-card-top"><span className="investor-icon"><CircleDollarSign size={19} /></span><StatusBadge status={item.status} /></div><strong>{item.name}</strong><small>اصل سرمایه</small><b>{money(item.principal_rial)}</b><div className="investor-meta"><span>نرخ توافقی</span><strong>{faNumber.format(item.rate_percent)}٪ ماهانه</strong></div><div className="investor-actions"><button type="button" className="secondary-button small" onClick={() => onOpen('investor', item)}>ویرایش سرمایه‌گذار</button></div></article>)}</div></section>
}

function Reports({ dashboard, records }) {
  const totalIn = records.transactions.filter((item) => item.direction === 'in').reduce((sum, item) => sum + item.amount_rial, 0)
  const totalOut = records.transactions.filter((item) => item.direction === 'out').reduce((sum, item) => sum + item.amount_rial, 0)
  return <div className="report-grid"><section className="panel report-main"><PanelHeader title="خلاصه گزارش مالی" action={<button className="secondary-button"><FilePlus2 size={16} /> خروجی گزارش</button>} /><div className="report-highlight"><div><span>خالص جریان ثبت‌شده</span><strong>{money(totalIn - totalOut, true)}</strong><small>بر اساس تراکنش‌های ثبت‌شده</small></div><div className="report-highlight-chart"><div style={{ width: `${Math.min(100, totalIn ? (totalOut / totalIn) * 100 : 0)}%` }} /></div></div><div className="report-bars"><ReportBar label="ورودی‌ها" value={totalIn} max={Math.max(totalIn, totalOut)} tone="green" /><ReportBar label="خروجی‌ها" value={totalOut} max={Math.max(totalIn, totalOut)} tone="red" /><ReportBar label="مطالبات باز" value={dashboard?.metrics?.receivables || 0} max={Math.max(totalIn, totalOut)} tone="blue" /></div></section><section className="panel insight-panel"><PanelHeader title="کنترل‌های مهم" /><Insight icon={TrendingDown} tone="warning" title="تمرکز سررسیدها" text={`${faNumber.format(records.checks.filter((c) => c.status !== 'settled').length)} چک در صف پیگیری است.`} /><Insight icon={CheckCheck} tone="success" title="وصول اقساط" text={`${faNumber.format(records.installments.filter((i) => i.status === 'paid').length)} قسط تسویه شده ثبت شده است.`} /><Insight icon={CircleDollarSign} tone="info" title="سرمایه فعال" text={`${faNumber.format(records.investors.filter((i) => i.status === 'active').length)} سرمایه‌گذار فعال در سیستم است.`} /></section></div>
}

function ReportBar({ label, value, max, tone }) { return <div className="report-bar"><div><span>{label}</span><b>{money(value, true)}</b></div><div className="bar-track"><i className={tone} style={{ width: `${max ? Math.max(3, (value / max) * 100) : 0}%` }} /></div></div> }
function Insight({ icon: Icon, tone, title, text }) { return <div className="insight"><span className={`insight-icon ${tone}`}><Icon size={17} /></span><div><strong>{title}</strong><p>{text}</p></div></div> }
function EmptyState({ icon: Icon, text }) { return <div className="empty-state"><Icon size={25} /><span>{text}</span></div> }

function modalDefaults(type, record) {
  const defaults = type === 'transaction' ? { date: today, direction: 'in', category: 'installment', description: '', counterparty: '', amount_rial: '', status: 'settled', reference: '' } : type === 'check' ? { holder: '', issuer: '', amount_rial: '', due_date: today, direction: 'receivable', check_number: '', serial: '', owner: 'خودم', status: 'in_road', notes: '' } : type === 'contact' ? { name: '', type: 'customer', phone: '', national_id: '', notes: '' } : type === 'vehicle' ? { title: '', plate: '', vin: '', model_year: '', status: 'available', value_rial: '', customer_id: null, notes: '' } : { name: '', principal_rial: '', rate_percent: '4.5', status: 'active', notes: '' }
  const value = { ...defaults, ...(record || {}) }
  if (type === 'investor') value.rate_percent = String(record?.rate_percent ?? defaults.rate_percent)
  return value
}

function Modal({ type, record, onClose, onSubmit }) {
  const configs = {
    transaction: { title: 'ثبت تراکنش جدید', submit: 'ثبت تراکنش' },
    check: { title: 'ثبت چک جدید', submit: 'ثبت چک' },
    contact: { title: 'ثبت شخص جدید', submit: 'ثبت شخص' },
    vehicle: { title: 'ثبت خودرو جدید', submit: 'ثبت خودرو' },
    investor: { title: record ? 'ویرایش سرمایه‌گذار' : 'ثبت سرمایه‌گذار جدید', submit: record ? 'ذخیره تغییرات' : 'ثبت سرمایه‌گذار' },
  }
  const [form, setForm] = useState(() => modalDefaults(type, record))
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const submit = (event) => { event.preventDefault(); onSubmit(form) }
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><div className="modal"><div className="modal-head"><div><span className="modal-kicker">فرم ثبت اطلاعات</span><h2>{configs[type].title}</h2></div><button onClick={onClose} className="modal-close" aria-label="بستن"><X size={19} /></button></div><form onSubmit={submit}><div className="form-grid">
    {type === 'transaction' && <><Field label="تاریخ" value={form.date} onChange={(v) => update('date', v)} required /><SelectField label="نوع گردش" value={form.direction} onChange={(v) => update('direction', v)} options={[["in", "ورودی"], ["out", "خروجی"]]} /><Field label="شرح" value={form.description} onChange={(v) => update('description', v)} required full /><Field label="طرف حساب" value={form.counterparty} onChange={(v) => update('counterparty', v)} /><Field label="مبلغ (ریال)" type="number" value={form.amount_rial} onChange={(v) => update('amount_rial', v)} required /><Field label="مرجع / شماره پیگیری" value={form.reference} onChange={(v) => update('reference', v)} /></>}
    {type === 'check' && <><Field label="دارنده چک" value={form.holder} onChange={(v) => update('holder', v)} required /><Field label="صادرکننده" value={form.issuer} onChange={(v) => update('issuer', v)} required /><Field label="مبلغ (ریال)" type="number" value={form.amount_rial} onChange={(v) => update('amount_rial', v)} required /><Field label="تاریخ سررسید" value={form.due_date} onChange={(v) => update('due_date', v)} required /><SelectField label="نوع چک" value={form.direction} onChange={(v) => update('direction', v)} options={[["receivable", "دریافتی"], ["payable", "پرداختی"]]} /><Field label="شماره چک" value={form.check_number} onChange={(v) => update('check_number', v)} /><Field label="سریال" value={form.serial} onChange={(v) => update('serial', v)} /><Field label="یادداشت" value={form.notes} onChange={(v) => update('notes', v)} full /></>}
    {type === 'contact' && <><Field label="نام و نام خانوادگی / شرکت" value={form.name} onChange={(v) => update('name', v)} required full /><SelectField label="نوع شخص" value={form.type} onChange={(v) => update('type', v)} options={[["customer", "مشتری"], ["investor", "سرمایه‌گذار"], ["company", "شرکت / صندوق"]]} /><Field label="شماره تماس" value={form.phone} onChange={(v) => update('phone', v)} /><Field label="شناسه ملی / کد ملی" value={form.national_id} onChange={(v) => update('national_id', v)} /><Field label="یادداشت" value={form.notes} onChange={(v) => update('notes', v)} full /></>}
    {type === 'vehicle' && <><Field label="عنوان خودرو" value={form.title} onChange={(v) => update('title', v)} required full /><Field label="پلاک" value={form.plate} onChange={(v) => update('plate', v)} /><Field label="مدل" type="number" value={form.model_year} onChange={(v) => update('model_year', v)} /><Field label="ارزش ثبت‌شده (ریال)" type="number" value={form.value_rial} onChange={(v) => update('value_rial', v)} /><SelectField label="وضعیت" value={form.status} onChange={(v) => update('status', v)} options={[["available", "آزاد"], ["leased", "در قرارداد"], ["sold", "فروخته‌شده"]]} /><Field label="یادداشت" value={form.notes} onChange={(v) => update('notes', v)} full /></>}
    {type === 'investor' && <><Field label="نام سرمایه‌گذار" value={form.name} onChange={(v) => update('name', v)} required full /><Field label="اصل سرمایه (ریال)" type="number" value={form.principal_rial} onChange={(v) => update('principal_rial', v)} /><Field label="نرخ توافقی ماهانه (٪)" type="number" step="0.1" value={form.rate_percent} onChange={(v) => update('rate_percent', v)} /><SelectField label="وضعیت" value={form.status} onChange={(v) => update('status', v)} options={[["active", "فعال"], ["closed", "تسویه‌شده"], ["overdue", "معوق"]]} /><Field label="یادداشت" value={form.notes} onChange={(v) => update('notes', v)} full /></>}
    </div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>انصراف</button><button type="submit" className="primary-button">{configs[type].submit} <ArrowLeft size={16} /></button></div></form></div></div>
}

const dateOptions = [
  { id: 'today', label: today },
  { id: 'current-month', label: 'ماه جاری' },
  { id: 'previous-month', label: 'ماه قبل' },
]

function DateMenu({ selected, onSelect }) {
  return <div className="date-menu" role="menu" aria-label="انتخاب بازه تاریخ"><span className="date-menu-title">بازه نمایش</span>{dateOptions.map((option) => <button type="button" role="menuitem" key={option.id} className={`date-option ${selected === option.id ? 'selected' : ''}`} onClick={() => onSelect(option)}><span>{option.label}</span>{selected === option.id && <Check size={15} />}</button>)}</div>
}

function ContactProfile({ contact, onClose, onEdit }) {
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal profile-modal" role="dialog" aria-modal="true" aria-labelledby="contact-profile-title"><div className="modal-head"><div><span className="modal-kicker">پروفایل طرف حساب</span><h2 id="contact-profile-title">{contact.name}</h2></div><button onClick={onClose} className="modal-close" aria-label="بستن"><X size={19} /></button></div><div className="profile-summary"><div className="profile-avatar"><UserRound size={25} /></div><div><strong>{contact.name}</strong><span>{contactType(contact.type)}</span></div></div><div className="profile-grid"><div><span>نوع شخص</span><strong>{contactType(contact.type)}</strong></div><div><span>شماره تماس</span><strong>{contact.phone || 'ثبت نشده'}</strong></div><div><span>کد ملی / شناسه ملی</span><strong>{contact.national_id || 'ثبت نشده'}</strong></div><div><span>یادداشت</span><strong>{contact.notes || 'یادداشتی ثبت نشده است'}</strong></div></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>بستن</button><button type="button" className="primary-button" onClick={onEdit}>ویرایش اطلاعات <ArrowLeft size={16} /></button></div></section></div>
}

function SettingsPanel({ theme, onThemeChange, onClose }) {
  const dark = theme === 'dark'
  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal settings-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div className="modal-head"><div><span className="modal-kicker">تنظیمات محیط</span><h2 id="settings-title">تنظیمات حسابیار</h2></div><button onClick={onClose} className="modal-close" aria-label="بستن"><X size={19} /></button></div><div className="settings-list"><div className="settings-row"><div><strong>تم شب</strong><span>برای استفاده راحت‌تر در نور کم</span></div><button type="button" className={`theme-toggle ${dark ? 'on' : ''}`} aria-pressed={dark} onClick={() => onThemeChange(dark ? 'light' : 'dark')}><span className="toggle-knob" />{dark ? 'فعال' : 'خاموش'}</button></div><div className="settings-row"><div><strong>ذخیره‌سازی آزمایشی</strong><span>اطلاعات این نسخه در حافظه همین مرورگر نگهداری می‌شود.</span></div><span className="settings-value">localStorage</span></div></div><div className="modal-actions"><button type="button" className="primary-button" onClick={onClose}>تمام</button></div></section></div>
}

function Field({ label, value, onChange, type = 'text', step, required = false, full = false }) { return <label className={`field ${full ? 'full' : ''}`}><span>{label}{required && ' *'}</span><input type={type} step={step} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></label> }
function SelectField({ label, value, onChange, options }) { return <label className="field"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([key, labelText]) => <option key={key} value={key}>{labelText}</option>)}</select></label> }

export default App
