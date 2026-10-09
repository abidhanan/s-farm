import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Moon, ShieldCheck, Sun, Tractor, Wallet } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { mode } from '../lib/db'
import { Spinner } from '../components/ui'
import type { Role } from '../lib/types'

const ROLE_TABS: { value: Role; label: string; icon: typeof ShieldCheck }[] = [
  { value: 'admin', label: 'Admin', icon: ShieldCheck },
  { value: 'peternak', label: 'Peternak', icon: Tractor },
  { value: 'bendahara', label: 'Bendahara', icon: Wallet },
]
const roleLabel: Record<Role, string> = { admin: 'Admin', peternak: 'Peternak', bendahara: 'Bendahara' }

const DEMO_ACCOUNTS: { role: Role; email: string; password: string }[] = [
  { role: 'admin', email: 'admin@s-farm.id', password: 'admin123' },
  { role: 'peternak', email: 'peternak@s-farm.id', password: 'peternak123' },
  { role: 'bendahara', email: 'bendahara@s-farm.id', password: 'bendahara123' },
]

export default function Login() {
  const { signIn } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('peternak')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await signIn(email, password, role)
    setLoading(false)
    if (error) setError(error)
    else navigate('/', { replace: true })
  }

  function quickLogin(acc: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(acc.email)
    setPassword(acc.password)
    setRole(acc.role)
    setError(null)
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-gradient-to-br from-brand-50 via-slate-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-400/20 blur-3xl" />

      <button
        onClick={toggle}
        className="absolute right-4 top-4 z-10 rounded-xl bg-white/70 p-2.5 text-slate-600 shadow-sm backdrop-blur hover:bg-white dark:bg-slate-800/70 dark:text-slate-300 dark:hover:bg-slate-800"
        aria-label="Ganti tema"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      <div className="relative mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-6 text-center">
          <img src="/favicon.svg" alt="S-Farm" width={76} height={76} className="mx-auto mb-3 drop-shadow-sm" />
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">S-Farm</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Sistem Peternakan Desa Singopuran</p>
        </div>

        <div className="card p-6">
          <p className="mb-2 text-center text-sm font-medium text-slate-500 dark:text-slate-400">Masuk sebagai</p>
          <div className="mb-5 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {ROLE_TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setRole(t.value)
                  setError(null)
                }}
                className={`flex flex-col items-center gap-1 rounded-lg py-2 text-xs font-semibold transition ${
                  role === t.value
                    ? 'bg-white text-brand-700 shadow-sm dark:bg-slate-900 dark:text-brand-300'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <t.icon size={18} className="shrink-0" />
                {t.label}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                required
              />
            </div>
            <div>
              <label className="label">Kata Sandi</label>
              <div className="relative">
                <input
                  className="input pr-11"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Tampilkan sandi"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">{error}</p>}

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner className="h-5 w-5" /> : `Masuk sebagai ${roleLabel[role]}`}
            </button>
          </form>
        </div>

        {mode === 'demo' && (
          <div className="card mt-4 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Akun Demo (klik untuk isi)
            </p>
            <div className="grid gap-2">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  onClick={() => quickLogin(a)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:border-brand-400 hover:bg-brand-50 dark:border-slate-700 dark:hover:border-brand-600 dark:hover:bg-brand-950/30"
                >
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{roleLabel[a.role]}</span>
                  <span className="text-xs text-slate-400">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          {mode === 'demo'
            ? 'Berjalan dalam mode demo. Hubungkan Supabase untuk data permanen & multi-perangkat.'
            : 'Akun baru hanya dapat dibuat oleh admin.'}
        </p>
      </div>
    </div>
  )
}
