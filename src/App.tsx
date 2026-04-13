import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ReactFlowProvider } from '@xyflow/react'
import { FlowWorkspace } from './components/FlowWorkspace'
import { cn } from './lib/cn'

export type SessionUser = { id: string; name: string; role: string; email?: string }

function BowtieMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('shrink-0', className)} aria-hidden>
      <path fill="currentColor" className="text-slate-600" d="M16 4 4 16 16 28 28 16 16 4z" />
      <path fill="currentColor" className="text-slate-400/90" d="M16 9 9 16 16 23 23 16 16 9z" />
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
    <div className="flex min-h-full flex-col bg-[var(--studio-bg,#090b0f)] text-zinc-100">
      <header
        className={cn(
          'flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 px-4 py-3 sm:px-6',
          'bg-gradient-to-b from-[#12151c] to-[#0e1016]',
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-zinc-700/80 bg-zinc-900/80 shadow-sm ring-1 ring-white/[0.04]">
            <BowtieMark className="size-[1.65rem]" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h1 className="text-[15px] font-semibold tracking-tight text-zinc-50">Bowtie Studio</h1>
              <span className="rounded border border-zinc-700/80 bg-zinc-900/60 px-1.5 py-0 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                Pro
              </span>
            </div>
            <p className="mt-0.5 max-w-[46ch] text-xs leading-snug text-zinc-500">
              Modelado de barreras y diagramas bowtie para HSE y procesos críticos
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {diagrams.length > 0 && (
            <select
              value={diagramId ?? ''}
              onChange={(e) => setDiagramId(e.target.value || null)}
              className="max-w-[200px] rounded-md border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-200"
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
            className="rounded-md border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Colaborar
          </button>
          <button
            type="button"
            onClick={() => setDemoOpen(true)}
            className="rounded-md border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800"
          >
            Demo
          </button>
          {user?.role === 'super' && (
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              className="rounded-md border border-amber-900/50 bg-amber-950/30 px-2 py-1.5 text-xs text-amber-200 hover:bg-amber-950/50"
            >
              Crear usuario
            </button>
          )}
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-md border border-zinc-600 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800"
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
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setAdminOpen(false)}
        >
          <div className="studio-chrome w-full max-w-md rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-50">Nuevo usuario</h2>
            <p className="mt-1 text-xs text-zinc-500">Solo el superusuario puede crear cuentas.</p>
            <form className="mt-4 space-y-3" onSubmit={createUser}>
              <input
                placeholder="Nombre"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm"
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm"
              />
              <input
                type="password"
                required
                minLength={6}
                placeholder="Contraseña (mín. 6)"
                value={newUserPass}
                onChange={(e) => setNewUserPass(e.target.value)}
                className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="rounded-md px-3 py-2 text-xs text-zinc-400" onClick={() => setAdminOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="rounded-md border border-zinc-500 bg-zinc-800 px-3 py-2 text-xs text-zinc-100">
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {shareOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"
          onClick={() => setShareOpen(false)}
        >
          <div className="studio-chrome relative z-10 w-full max-w-md rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-50">Invitar colaborador</h2>
            <p className="mt-1 text-xs text-zinc-500">El usuario debe existir (email registrado). Podrá editar este diagrama.</p>
            <form className="mt-4 space-y-3" onSubmit={shareDiagram}>
              <input
                type="email"
                required
                placeholder="Email del colaborador"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="rounded-md px-3 py-2 text-xs text-zinc-400" onClick={() => setShareOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="rounded-md border border-zinc-500 bg-zinc-800 px-3 py-2 text-xs text-zinc-100">
                  Invitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {demoOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4"
          onClick={() => {
            setDemoOpen(false)
            setDemoUrl(null)
          }}
        >
          <div className="studio-chrome relative z-10 w-full max-w-md rounded-xl p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-zinc-50">Enlace demo (solo lectura)</h2>
            <p className="mt-1 text-xs text-zinc-500">Copia el enlace para compartir una vista fija del diagrama actual.</p>
            <form className="mt-4 space-y-3" onSubmit={createDemoLink}>
              <label className="text-xs text-zinc-500">Caduca en (días)</label>
              <input
                type="number"
                min={1}
                max={90}
                value={demoDays}
                onChange={(e) => setDemoDays(Number(e.target.value) || 30)}
                className="w-full rounded-md border border-zinc-600 bg-zinc-950 px-3 py-2 text-sm"
              />
              {demoUrl && (
                <div className="break-all rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-zinc-300">{demoUrl}</div>
              )}
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-md px-3 py-2 text-xs text-zinc-400"
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
                    className="rounded-md border border-zinc-500 bg-zinc-800 px-3 py-2 text-xs text-zinc-100"
                    onClick={() => void navigator.clipboard.writeText(demoUrl)}
                  >
                    Copiar enlace
                  </button>
                )}
                <button type="submit" className="rounded-md border border-zinc-500 bg-zinc-800 px-3 py-2 text-xs text-zinc-100">
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
          <div className="pointer-events-auto border-l-2 border-l-slate-500/80 bg-zinc-900/95 px-5 py-2.5 text-sm text-zinc-200 shadow-lg ring-1 ring-zinc-700/80">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
