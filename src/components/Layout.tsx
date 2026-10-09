import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Egg,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Receipt,
  ShoppingCart,
  Sun,
  Syringe,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useTheme } from '../lib/theme'
import { mode } from '../lib/db'
import type { Role } from '../lib/types'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  roles?: Role[]
}

const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ayam', label: 'Ayam Petelur', icon: Egg },
  { to: '/kambing', label: 'Kambing', icon: Syringe },
  { to: '/penjualan', label: 'Penjualan', icon: ShoppingCart },
  { to: '/pengeluaran', label: 'Pengeluaran', icon: Receipt },
  { to: '/laporan', label: 'Laporan', icon: BarChart3 },
  { to: '/users', label: 'Pengguna', icon: Users, roles: ['admin'] },
]

const roleLabel: Record<Role, string> = { admin: 'Admin', peternak: 'Peternak', bendahara: 'Bendahara' }
const roleTone: Record<Role, string> = {
  admin: 'bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300',
  peternak: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  bendahara: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" width={36} height={36} className="rounded-xl" />
      <div className="leading-tight">
        <div className="font-extrabold tracking-tight text-slate-900 dark:text-white">S-Farm</div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400">Desa Singopuran</div>
      </div>
    </div>
  )
}

export default function Layout() {
  const { profile, signOut, can } = useAuth()
  const { theme, toggle } = useTheme()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const items = NAV.filter((n) => !n.roles || (profile && can(n.roles)))

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  const navList = (
    <nav className="flex flex-col gap-1">
      {items.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.to === '/'}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`
          }
        >
          <n.icon size={19} />
          {n.label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="min-h-full">
      {/* Sidebar — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 lg:flex">
        <div className="px-2 py-2">
          <Brand />
        </div>
        <div className="mt-4 flex-1">{navList}</div>
        <UserBox profile={profile} onLogout={handleLogout} />
      </aside>

      {/* Drawer — mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] animate-fade-in flex-col border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between px-2 py-2">
              <Brand />
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tutup menu">
                <X size={20} />
              </button>
            </div>
            <div className="mt-4 flex-1">{navList}</div>
            <UserBox profile={profile} onLogout={handleLogout} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-2 lg:hidden">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Buka menu">
              <Menu size={22} />
            </button>
            <Brand />
          </div>
          <div className="hidden lg:block">
            {mode === 'demo' && (
              <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                Mode Demo — data tersimpan di browser
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggle}
              className="rounded-xl p-2.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label={theme === 'dark' ? 'Mode terang' : 'Mode gelap'}
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {profile && (
              <span className={`badge ${roleTone[profile.role]}`}>{roleLabel[profile.role]}</span>
            )}
          </div>
        </header>

        {mode === 'demo' && (
          <div className="border-b border-amber-200 bg-amber-50 px-4 py-1.5 text-center text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300 lg:hidden">
            Mode Demo — data hanya di browser ini
          </div>
        )}

        <main className="mx-auto max-w-6xl px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function UserBox({ profile, onLogout }: { profile: ReturnType<typeof useAuth>['profile']; onLogout: () => void }) {
  if (!profile) return null
  return (
    <div className="mt-4 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
          {profile.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.full_name}</div>
          <div className="truncate text-xs text-slate-500 dark:text-slate-400">{profile.email}</div>
        </div>
      </div>
      <button onClick={onLogout} className="btn-ghost mt-3 w-full">
        <LogOut size={16} /> Keluar
      </button>
    </div>
  )
}
