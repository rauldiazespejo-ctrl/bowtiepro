import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BowtieMark } from '../components/BowtieMark'
import { cn } from '../lib/cn'

export function LoginPage() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme')
      if (saved) return saved === 'dark'
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const raw = await res.text()
      let data: { ok?: boolean; error?: string } = {}
      if (raw) {
        try {
          data = JSON.parse(raw) as { ok?: boolean; error?: string }
        } catch {
          /* cuerpo no JSON */
        }
      }
      if (!res.ok || !data.ok) {
        setErr(
          data.error ??
            (res.status === 503
              ? 'Servicio no disponible: revisa la configuración del servidor.'
              : res.status >= 500
                ? `Error del servidor (${res.status})`
                : 'No se pudo iniciar sesión'),
        )
        return
      }
      nav('/', { replace: true })
    } catch {
      setErr('Error de red')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--studio-bg)] px-4 py-12 text-[var(--text-primary)]">
      <div className="pro-panel w-full max-w-md p-10">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <BowtieMark className="size-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Bowtie Studio</h1>
            <span className="text-xs font-bold uppercase tracking-wide text-sky-500 dark:text-sky-400">Pro</span>
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">Inicie sesión para acceder a su trabajo guardado.</p>
        <form className="mt-6 space-y-5" onSubmit={submit}>
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300" htmlFor="login-pass">
              Contraseña
            </label>
            <input
              id="login-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              required
            />
          </div>
          {err && <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{err}</p>}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full rounded-xl border border-sky-500 bg-sky-500 py-3 text-sm font-bold text-white hover:bg-sky-600',
              loading && 'opacity-60',
            )}
          >
            {loading ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
