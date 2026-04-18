import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ReactFlowProvider } from '@xyflow/react'
import { FlowWorkspace } from './components/FlowWorkspace'
import { cn } from './lib/cn'
import { Moon, Sun } from 'lucide-react'

export type SessionUser = { id: string; name: string; role: string; email?: string }

function ThemeToggle({
  isDark,
  onToggle,
}: {
  isDark: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="theme-toggle"
      aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      <span className={cn('theme-toggle-thumb', isDark ? 'dark' : 'light')}>
        {isDark ? (
          <Moon className="size-3.5 text-slate-700" />
        ) : (
          <Sun className="size-3.5 text-amber-500" />
        )}
      </span>
    </button>
  )
}

function BowtieMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn('shrink-0', className)} aria-hidden>
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#14b8a6" />
        </linearGradient>
        <linearGradient id="logoGradInner" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path fill="url(#logoGrad)" filter="url(#glow)" d="M24 4 4 24 24 44 44 24 24 4z" opacity="0.95" />
      <path fill="url(#logoGradInner)" d="M24 12 12 24 24 36 36 24 24 12z" />
      <circle fill="#0ea5e9" cx="24" cy="24" r="3" filter="url(#glow)" />
    </svg>
  )
}

export function App() {
  const [auth, setAuth] = useState<'loading' | 'in' | 'out'>('loading')

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { authenticated?: boolean }) => setAuth(d.authenticated ? 'in' : 'out'))
      .catch(() => setAuth('out'))
  }, [])

  if (auth === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--studio-bg,#090b0f)] text-zinc-500">
        Cargando sesión…
      </div>
    )
  }
  if (auth === 'out') {
    return <Navigate to="/login" replace />
  }
  return <WorkspaceShell />
}

function WorkspaceShell() {
  const nav = useNavigate()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [diagramId, setDiagramId] = useState<string | null>(null)
  const [diagrams, setDiagrams] = useState<{ id: string; title: string }[]>([])
  const [adminOpen, setAdminOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPass, setNewUserPass] = useState('')
  const [newUserName, setNewUserName] = useState('')
  const [shareEmail, setShareEmail] = useState('')
  const [demoDays, setDemoDays] = useState(30)
  const [demoUrl, setDemoUrl] = useState<string | null>(null)
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

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3200)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/session', { credentials: 'include' }).then((r) => r.json()),
      fetch('/api/users/me', { credentials: 'include' }).then((r) => r.json()),
    ])
      .then(([s, me]) => {
        if (s?.user) {
          setUser({
            id: s.user.id,
            name: s.user.name,
            role: s.user.role ?? 'user',
            email: s.user.email,
          })
        } else if (me?.name && !me.error) {
          setUser({ id: me.id, name: me.name, role: me.role, email: me.email })
        }
      })
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadDiagrams() {
      const res = await fetch('/api/diagrams', { credentials: 'include' })
      if (!res.ok || cancelled) return
      const data = (await res.json()) as { diagrams: { id: string; title: string }[] }
      const list = data.diagrams ?? []
      setDiagrams(list)
      if (list.length === 0) {
        const cr = await fetch('/api/diagrams', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: 'Mi diagrama' }),
        })
        if (cr.ok && !cancelled) {
          const created = (await cr.json()) as { id: string }
          setDiagramId(created.id)
          setDiagrams([{ id: created.id, title: 'Mi diagrama' }])
        }
      } else if (!cancelled) {
        setDiagramId((prev) => prev ?? list[0].id)
      }
    }
    void loadDiagrams()
    return () => {
      cancelled = true
    }
  }, [])

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    nav('/login', { replace: true })
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/users', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newUserEmail.trim(),
        password: newUserPass,
        name: newUserName.trim() || undefined,
      }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      showToast(data.error ?? 'Error al crear usuario')
      return
    }
    showToast('Usuario creado')
    setNewUserEmail('')
    setNewUserPass('')
    setNewUserName('')
    setAdminOpen(false)
  }

  const shareDiagram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diagramId) return
    const res = await fetch(`/api/diagrams/${encodeURIComponent(diagramId)}/access`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: shareEmail.trim(), role: 'editor' }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      showToast(data.error ?? 'No se pudo compartir')
      return
    }
    showToast('Colaborador añadido (debe estar registrado)')
    setShareEmail('')
    setShareOpen(false)
  }

  const createDemoLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diagramId) return
    const res = await fetch(`/api/diagrams/${encodeURIComponent(diagramId)}/demo`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: demoDays }),
    })
    const data = (await res.json()) as { error?: string; token?: string }
    if (!res.ok || !data.token) {
      showToast(data.error ?? 'Error al generar demo')
      return
    }
    const url = `${window.location.origin}/demo/${data.token}`
    setDemoUrl(url)
    showToast('Enlace demo generado')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        showToast('Guardado automático en el servidor')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showToast])

  return (
    <div className="flex min-h-full flex-col bg-[var(--studio-bg)] text-[var(--text-primary)]">
      <header
        className={cn(
          'header-pro flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <BowtieMark className="size-[1.65rem]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h1 className="text-[17px] font-bold tracking-tight text-slate-800 dark:text-slate-100">Bowtie Studio</h1>
              <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-600 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-400">
                Pro
              </span>
            </div>
            <p className="mt-0.5 max-w-[46ch] text-sm leading-snug text-slate-500 dark:text-slate-400">
              Modelado de barreras y diagramas bowtie para HSE y procesos críticos
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          {diagrams.length > 0 && (
            <select
              value={diagramId ?? ''}
              onChange={(e) => setDiagramId(e.target.value || null)}
              className="max-w-[200px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              {diagrams.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="pro-button"
          >
            Colaborar
          </button>
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="pro-button"
          >
            Demo
          </button>
          {user?.role === 'super' && (
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="pro-button border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
            >
              Crear usuario
            </button>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="pro-button border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-400"
          >
            Salir
          </button>
        </div>
      </header>

      <main className="flex-1">
        {diagramId && (
          <ReactFlowProvider key={diagramId}>
            <FlowWorkspace
              user={user}
              onToast={showToast}
              savedAt={savedAt}
              setSavedAt={setSavedAt}
              shortcutsOpen={shortcutsOpen}
              setShortcutsOpen={setShortcutsOpen}
              remoteDiagramId={diagramId}
            />
          </ReactFlowProvider>
        )}
      </main>

      {adminOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => setAdminOpen(false)}
        >
          <div className="pro-panel w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Nuevo usuario</h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Solo el superusuario puede crear cuentas.</p>
            <form className="mt-5 space-y-4" onSubmit={createUser}>
              <input
                placeholder="Nombre"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Contraseña (mín. 6)"
                value={newUserPass}
                onChange={(e) => setNewUserPass(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => setAdminOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="pro-button-primary">
                  Crear usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {shareOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => setShareOpen(false)}
        >
          <div className="pro-panel relative z-10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Invitar colaborador</h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">El usuario debe existir (email registrado). Podrá editar este diagrama.</p>
            <form className="mt-5 space-y-4" onSubmit={shareDiagram}>
              <input
                type="email"
                required
                placeholder="Email del colaborador"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200" onClick={() => setShareOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="pro-button-primary">
                  Invitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {demoOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => {
            setDemoOpen(false)
            setDemoUrl(null)
          }}
        >
          <div className="pro-panel relative z-10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Enlace demo (solo lectura)</h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">Copia el enlace para compartir una vista fija del diagrama actual.</p>
            <form className="mt-5 space-y-4" onSubmit={createDemoLink}>
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Caduca en (días)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={demoDays}
                onChange={(e) => setDemoDays(Number(e.target.value) || 30)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
              />
              {demoUrl && (
                <div className="break-all rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-medium text-sky-600 dark:border-slate-600 dark:bg-slate-800 dark:text-sky-400">{demoUrl}</div>
              )}
              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => {
                    setDemoOpen(false)
                    setDemoUrl(null)
                  }}
                >
                  Cerrar
                </button>
                {demoUrl && (
                  <button
                    type="button"
                    className="pro-button"
                    onClick={() => void navigator.clipboard.writeText(demoUrl)}
                  >
                    Copiar enlace
                  </button>
                )}
                <button type="submit" className="pro-button-primary">
                  Generar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div
        className={cn(
          'pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300',
          toast ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        {toast && (
          <div className="pointer-events-auto rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-xl ring-1 ring-slate-200/50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
