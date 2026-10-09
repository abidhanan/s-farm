import { Calendar, Check, ChevronDown, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-brand-600 dark:text-brand-400">
      <Spinner className="h-8 w-8" />
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string
  subtitle?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  tone = 'brand',
}: {
  label: string
  value: string
  sub?: string
  icon?: ReactNode
  tone?: 'brand' | 'amber' | 'blue' | 'red' | 'slate'
}) {
  const tones: Record<string, string> = {
    brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }
  return (
    <div className="card animate-fade-in p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="min-h-[2rem] break-words pr-0.5 text-[11px] font-medium uppercase leading-tight tracking-wide text-slate-500 dark:text-slate-400">
          {label}
        </span>
        {icon && (
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tones[tone]}`}>{icon}</span>
        )}
      </div>
      <div className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  )
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
      {icon && <div className="mb-3 text-slate-400">{icon}</div>}
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} animate-fade-in`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

/** Input tanggal tanpa panah bawaan, dengan ikon kalender yang membuka date picker. */
export function DateInput({
  value,
  onChange,
  required,
  className = '',
}: {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  function openPicker() {
    const el = ref.current as (HTMLInputElement & { showPicker?: () => void }) | null
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
        return
      } catch {
        /* fallback di bawah */
      }
    }
    el.focus()
  }
  return (
    <div className="relative">
      <input
        ref={ref}
        type="date"
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={`input date-input pr-11 ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        aria-label="Pilih tanggal"
        onClick={openPicker}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:text-brand-600 dark:hover:text-brand-400"
      >
        <Calendar size={18} />
      </button>
    </div>
  )
}

export interface SelectOption {
  value: string
  label: string
}

/** Dropdown kustom dengan animasi buka/tutup (pengganti <select> bawaan). */
export function Select({
  value,
  onChange,
  options,
  placeholder = 'Pilih…',
  ariaLabel,
  buttonClassName = '',
  disabled = false,
}: {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  ariaLabel?: string
  buttonClassName?: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle() {
    if (disabled) return
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect()
      // Buka ke atas bila ruang di bawah sempit (mis. di dalam modal / dekat tepi layar).
      setDropUp(window.innerHeight - rect.bottom < 240 && rect.top > 240)
    }
    setOpen((o) => !o)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`input flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60 ${buttonClassName}`}
      >
        <span className={`truncate ${selected ? '' : 'text-slate-400'}`}>{selected ? selected.label : placeholder}</span>
        <ChevronDown size={18} className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <div
        role="listbox"
        className={`absolute z-50 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white p-1 shadow-lg transition duration-150 ease-out dark:border-slate-700 dark:bg-slate-800 ${
          dropUp ? 'bottom-full mb-1 origin-bottom' : 'top-full mt-1 origin-top'
        } ${open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'}`}
      >
        {options.map((o) => {
          const active = o.value === value
          return (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={active}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                active
                  ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/50 dark:text-brand-200'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700/60'
              }`}
            >
              <span className="truncate">{o.label}</span>
              {active && <Check size={16} className="shrink-0" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
