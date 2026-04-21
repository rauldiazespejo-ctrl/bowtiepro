import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ReactFlowProvider } from '@xyflow/react'
import { FlowWorkspace } from './components/FlowWorkspace'
import { BowtieMark } from './components/BowtieMark'
import { cn } from './lib/cn'
import {
  Check,
  ChevronDown,
  Copy,
  Link2,
  Loader2,
  LogOut,
  Moon,
  Pencil,
  Plus,
  Search,
  Shield,
  Sun,
  Trash2,
  Users,
  X,
} from 'lucide-react'

export type SessionUser = { id: string; name: string; role: string; email?: string }

type DiagramEntry = { id: string; title: string; myRole: string }
type Collaborator = { id: string; name: string; email: string; role: string }

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

function SessionBootScreen() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-5 bg-[var(--studio-bg,#090b0f)] px-4">
      <div className="relative flex size-[4.25rem] items-center justify-center rounded-2xl border border-slate-200/80 bg-white shadow-lg dark:border-slate-600 dark:bg-slate-800">
        <BowtieMark className="size-11" />
        <span className="absolute -bottom-0.5 -right-0.5 flex size-7 items-center justify-center rounded-full border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950">
          <Loader2 className="size-4 animate-spin text-sky-600 dark:text-sky-400" aria-hidden />
        </span>
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Cargando sesión…</p>
    </div>
  )
}

function DiagramPicker({
  diagrams,
  diagramId,
  onSelect,
  onRenameClick,
  onDuplicate,
  onDeleteClick,
  onNew,
}: {
  diagrams: DiagramEntry[]
  diagramId: string | null
  onSelect: (id: string) => void
  onRenameClick: (id: string, title: string) => void
  onDuplicate: (id: string) => void
  onDeleteClick: (id: string) => void
  onNew: () => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  const filtered = diagrams.filter((d) =>
    d.title.toLowerCase().includes(search.toLowerCase()),
  )
  const current = diagrams.find((d) => d.id === diagramId)

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
    else setSearch('')
  }, [open])

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex max-w-[min(220px,38vw)] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
        aria-label="Seleccionar diagrama"
      >
        <span className="min-w-0 truncate">{current?.title ?? 'Seleccionar…'}</span>
        <ChevronDown className={cn('size-3.5 shrink-0 transition-transform text-slate-400', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-full z-50 mt-1.5 w-80 rounded-xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-200/50 dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 px-3 py-2 dark:border-slate-800">
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar diagrama…"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}>
                  <X className="size-3.5 text-slate-400 hover:text-slate-600" />
                </button>
              )}
            </div>
            <ul className="max-h-60 overflow-y-auto py-1">
              {filtered.map((d) => (
                <li key={d.id} className={cn('group flex items-center gap-1 px-2 py-1', d.id === diagramId && 'bg-sky-50 dark:bg-sky-950/30')}>
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                    onClick={() => { onSelect(d.id); setOpen(false) }}
                  >
                    {d.title}
                    {d.myRole !== 'owner' && (
                      <span className="ml-1.5 text-[10px] font-bold uppercase text-slate-400">{d.myRole}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    title="Renombrar"
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    onClick={() => { onRenameClick(d.id, d.title); setOpen(false) }}
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Duplicar"
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                    onClick={() => { onDuplicate(d.id); setOpen(false) }}
                  >
                    <Copy className="size-3.5" />
                  </button>
                  {d.myRole === 'owner' && (
                    <button
                      type="button"
                      title="Eliminar"
                      className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                      onClick={() => { onDeleteClick(d.id); setOpen(false) }}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-center text-sm text-slate-400">Sin resultados</li>
              )}
            </ul>
            <div className="border-t border-slate-100 p-2 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { onNew(); setOpen(false) }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
              >
                <Plus className="size-4" />
                Nuevo diagrama
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function UserMenu({
  user,
  onLogout,
  onShare,
  onDemo,
  onAdmin,
}: {
  user: SessionUser | null
  onLogout: () => void
  onShare: () => void
  onDemo: () => void
  onAdmin: () => void
}) {
  const [open, setOpen] = useState(false)
  const initials = user
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : '?'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex size-9 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-700 ring-2 ring-transparent transition-all hover:ring-sky-300 dark:bg-sky-900/40 dark:text-sky-300 dark:hover:ring-sky-700"
        aria-label="Menú de usuario"
      >
        {initials}
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Cerrar"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            {user && (
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{user.name}</p>
                {user.email && (
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                )}
                <span className="mt-1.5 inline-block rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-600 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-400">
                  Pro
                </span>
              </div>
            )}
            <ul className="py-1">
              <li>
                <button
                  type="button"
                  onClick={() => { onShare(); setOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Users className="size-4 text-slate-400" />
                  Colaboradores
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => { onDemo(); setOpen(false) }}
                  className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Link2 className="size-4 text-slate-400" />
                  Enlace demo
                </button>
              </li>
              {user?.role === 'super' && (
                <li>
                  <button
                    type="button"
                    onClick={() => { onAdmin(); setOpen(false) }}
                    className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                  >
                    <Shield className="size-4 text-amber-400" />
                    Crear usuario
                  </button>
                </li>
              )}
            </ul>
            <div className="border-t border-slate-100 py-1 dark:border-slate-800">
              <button
                type="button"
                onClick={() => { onLogout(); setOpen(false) }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30"
              >
                <LogOut className="size-4" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
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
    return <SessionBootScreen />
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
  const [diagrams, setDiagrams] = useState<DiagramEntry[]>([])
  const [diagramServerVersion, setDiagramServerVersion] = useState<number | null>(null)
  const [saveSignal, setSaveSignal] = useState(0)

  const [renameOpen, setRenameOpen] = useState(false)
  const [renameTitle, setRenameTitle] = useState('')
  const [renameBusy, setRenameBusy] = useState(false)

  const [newDiagramOpen, setNewDiagramOpen] = useState(false)
  const [newDiagramTitle, setNewDiagramTitle] = useState('Nuevo diagrama')
  const [newDiagramBusy, setNewDiagramBusy] = useState(false)

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const [adminOpen, setAdminOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [demoOpen, setDemoOpen] = useState(false)

  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPass, setNewUserPass] = useState('')
  const [newUserName, setNewUserName] = useState('')

  const [shareEmail, setShareEmail] = useState('')
  const [shareRole, setShareRole] = useState<'editor' | 'viewer'>('editor')
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [collaboratorsLoading, setCollaboratorsLoading] = useState(false)

  const [demoDays, setDemoDays] = useState(30)
  const [demoUrl, setDemoUrl] = useState<string | null>(null)
  const [demoCopied, setDemoCopied] = useState(false)

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
      const data = (await res.json()) as { diagrams: DiagramEntry[] }
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
          setDiagrams([{ id: created.id, title: 'Mi diagrama', myRole: 'owner' }])
        }
      } else if (!cancelled) {
        setDiagramId((prev) => prev ?? list[0].id)
      }
    }
    void loadDiagrams()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    setDiagramServerVersion(null)
  }, [diagramId])

  useEffect(() => {
    if (!shareOpen || !diagramId) return
    setCollaboratorsLoading(true)
    fetch(`/api/diagrams/${encodeURIComponent(diagramId)}/access`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data: { owner: unknown; collaborators: Collaborator[] }) => {
        setCollaborators(data.collaborators ?? [])
      })
      .catch(() => {})
      .finally(() => setCollaboratorsLoading(false))
  }, [shareOpen, diagramId])

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
      body: JSON.stringify({ email: shareEmail.trim(), role: shareRole }),
    })
    const data = (await res.json()) as { error?: string }
    if (!res.ok) {
      showToast(data.error ?? 'No se pudo compartir')
      return
    }
    showToast('Colaborador añadido (debe estar registrado)')
    setShareEmail('')
    setShareRole('editor')
    const refetch = await fetch(`/api/diagrams/${encodeURIComponent(diagramId)}/access`, { credentials: 'include' })
    if (refetch.ok) {
      const d = (await refetch.json()) as { collaborators: Collaborator[] }
      setCollaborators(d.collaborators ?? [])
    }
  }

  const revokeCollaborator = async (userId: string) => {
    if (!diagramId) return
    const res = await fetch(
      `/api/diagrams/${encodeURIComponent(diagramId)}/access/${encodeURIComponent(userId)}`,
      { method: 'DELETE', credentials: 'include' },
    )
    if (res.ok) {
      setCollaborators((prev) => prev.filter((c) => c.id !== userId))
      showToast('Acceso revocado')
    }
  }

  const submitRenameDiagram = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!diagramId) return
    const title = renameTitle.trim()
    if (!title) {
      showToast('El título no puede estar vacío')
      return
    }
    if (diagramServerVersion == null) {
      showToast('Espera a que cargue el diagrama')
      return
    }
    setRenameBusy(true)
    try {
      const res = await fetch(`/api/diagrams/${encodeURIComponent(diagramId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, version: diagramServerVersion }),
      })
      const data = (await res.json()) as { error?: string; version?: number; title?: string; currentVersion?: number }
      if (res.status === 409) {
        const cur = data.currentVersion
        if (typeof cur === 'number') setDiagramServerVersion(cur)
        const r2 = await fetch(`/api/diagrams/${encodeURIComponent(diagramId)}`, { credentials: 'include' })
        if (r2.ok) {
          const j = (await r2.json()) as { title: string; version: number }
          setDiagramServerVersion(j.version)
          setRenameTitle(j.title)
        }
        showToast('Conflicto sincronizado. Vuelve a guardar si hace falta.')
        return
      }
      if (!res.ok || data.version == null) {
        showToast(data.error ?? 'No se pudo renombrar')
        return
      }
      setDiagramServerVersion(data.version)
      setDiagrams((prev) => prev.map((d) => (d.id === diagramId ? { ...d, title: data.title ?? title } : d)))
      showToast('Diagrama renombrado')
      setRenameOpen(false)
    } finally {
      setRenameBusy(false)
    }
  }

  const submitNewDiagram = async (e: React.FormEvent) => {
    e.preventDefault()
    const title = newDiagramTitle.trim() || 'Nuevo diagrama'
    setNewDiagramBusy(true)
    try {
      const res = await fetch('/api/diagrams', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      const data = (await res.json()) as { error?: string; id?: string; title?: string }
      if (!res.ok || !data.id) {
        showToast(data.error ?? 'No se pudo crear el diagrama')
        return
      }
      setDiagrams((prev) => [{ id: data.id!, title: data.title ?? title, myRole: 'owner' }, ...prev])
      setDiagramId(data.id)
      setNewDiagramOpen(false)
      setNewDiagramTitle('Nuevo diagrama')
      showToast('Diagrama creado')
    } finally {
      setNewDiagramBusy(false)
    }
  }

  const duplicateDiagram = async (id: string) => {
    const res = await fetch(`/api/diagrams/${encodeURIComponent(id)}/duplicate`, {
      method: 'POST',
      credentials: 'include',
    })
    const data = (await res.json()) as { error?: string; id?: string; title?: string }
    if (!res.ok || !data.id) {
      showToast(data.error ?? 'No se pudo duplicar el diagrama')
      return
    }
    setDiagrams((prev) => [{ id: data.id!, title: data.title!, myRole: 'owner' }, ...prev])
    setDiagramId(data.id)
    showToast('Diagrama duplicado')
  }

  const deleteDiagram = async (id: string) => {
    setDeleteBusy(true)
    try {
      const res = await fetch(`/api/diagrams/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        showToast(data.error ?? 'No se pudo eliminar')
        return
      }
      setDiagrams((prev) => {
        const next = prev.filter((d) => d.id !== id)
        if (diagramId === id) {
          setDiagramId(next[0]?.id ?? null)
        }
        return next
      })
      setDeleteConfirmId(null)
      showToast('Diagrama eliminado')
    } finally {
      setDeleteBusy(false)
    }
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
    try {
      await navigator.clipboard.writeText(url)
      setDemoCopied(true)
      setTimeout(() => setDemoCopied(false), 2500)
      showToast('Enlace demo generado y copiado')
    } catch {
      showToast('Enlace demo generado')
    }
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        setSaveSignal((s) => s + 1)
        showToast('Guardando…')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showToast])

  const currentDiagram = diagrams.find((d) => d.id === diagramId)
  const isReadOnly = currentDiagram?.myRole === 'viewer'

  return (
    <div className="flex min-h-full flex-col bg-[var(--studio-bg)] text-[var(--text-primary)]">
      <header className="header-pro flex shrink-0 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <BowtieMark className="size-[1.65rem]" />
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h1 className="text-[17px] font-bold tracking-tight text-slate-800 dark:text-slate-100">Bowtie Studio</h1>
              <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-600 dark:border-sky-800 dark:bg-sky-900/40 dark:text-sky-400">
                Pro
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2">
          {diagrams.length > 0 && (
            <DiagramPicker
              diagrams={diagrams}
              diagramId={diagramId}
              onSelect={(id) => setDiagramId(id)}
              onRenameClick={(id, title) => {
                setDiagramId(id)
                setRenameTitle(title)
                setRenameOpen(true)
              }}
              onDuplicate={(id) => void duplicateDiagram(id)}
              onDeleteClick={(id) => setDeleteConfirmId(id)}
              onNew={() => {
                setNewDiagramTitle('Nuevo diagrama')
                setNewDiagramOpen(true)
              }}
            />
          )}
          {savedAt && (
            <span className="hidden text-xs font-medium text-slate-400 sm:inline dark:text-slate-500" title="Último guardado">
              Guardado {savedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle isDark={isDark} onToggle={() => setIsDark(!isDark)} />
          <UserMenu
            user={user}
            onLogout={() => void logout()}
            onShare={() => setShareOpen(true)}
            onDemo={() => { setDemoUrl(null); setDemoCopied(false); setDemoOpen(true) }}
            onAdmin={() => setAdminOpen(true)}
          />
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
              onDiagramVersionChange={setDiagramServerVersion}
              serverVersionHint={diagramServerVersion}
              saveSignal={saveSignal}
              readOnly={isReadOnly}
            />
          </ReactFlowProvider>
        )}
      </main>

      {renameOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rename-dlg-title"
          onClick={() => !renameBusy && setRenameOpen(false)}
        >
          <div className="pro-panel w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 id="rename-dlg-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Renombrar diagrama
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              El nombre se guarda en el servidor y queda visible para los colaboradores.
            </p>
            <form className="mt-5 space-y-4" onSubmit={submitRenameDiagram}>
              <input
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
                placeholder="Título del diagrama"
                autoFocus
                maxLength={120}
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={renameBusy}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setRenameOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={renameBusy || diagramServerVersion == null} className="pro-button-primary">
                  {renameBusy ? 'Guardando…' : 'Guardar nombre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {newDiagramOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="new-dlg-title"
          onClick={() => !newDiagramBusy && setNewDiagramOpen(false)}
        >
          <div className="pro-panel w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 id="new-dlg-title" className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Nuevo diagrama
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Se crea una plantilla bowtie vacía en tu cuenta.
            </p>
            <form className="mt-5 space-y-4" onSubmit={submitNewDiagram}>
              <input
                value={newDiagramTitle}
                onChange={(e) => setNewDiagramTitle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
                placeholder="Título"
                autoFocus
                maxLength={120}
              />
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={newDiagramBusy}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => setNewDiagramOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" disabled={newDiagramBusy} className="pro-button-primary">
                  {newDiagramBusy ? 'Creando…' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={() => !deleteBusy && setDeleteConfirmId(null)}
        >
          <div className="pro-panel w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50">
                <Trash2 className="size-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Eliminar diagrama</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  &quot;{diagrams.find((d) => d.id === deleteConfirmId)?.title}&quot;
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">
              Esta acción es permanente y no se puede deshacer.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                disabled={deleteBusy}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 disabled:opacity-50 dark:text-slate-400"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteBusy}
                className="rounded-xl border border-rose-500 bg-rose-500 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-rose-600 disabled:opacity-60"
                onClick={() => void deleteDiagram(deleteConfirmId)}
              >
                {deleteBusy ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Colaboradores</h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Gestiona el acceso al diagrama actual.
            </p>

            {collaboratorsLoading ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Cargando…
              </div>
            ) : collaborators.length > 0 ? (
              <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-700">
                {collaborators.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      {c.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{c.name}</p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.email}</p>
                    </div>
                    <span className={cn(
                      'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
                      c.role === 'editor' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
                    )}>
                      {c.role}
                    </span>
                    {currentDiagram?.myRole === 'owner' && (
                      <button
                        type="button"
                        title="Revocar acceso"
                        onClick={() => void revokeCollaborator(c.id)}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Sin colaboradores aún.</p>
            )}

            {currentDiagram?.myRole === 'owner' && (
              <form className="mt-5 space-y-3" onSubmit={shareDiagram}>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Invitar</p>
                <input
                  type="email"
                  required
                  placeholder="Email del colaborador"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
                />
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Rol:</label>
                  <div className="flex gap-2">
                    {(['editor', 'viewer'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setShareRole(r)}
                        className={cn(
                          'rounded-lg border px-3 py-1.5 text-xs font-bold capitalize transition-all',
                          shareRole === r
                            ? 'border-sky-500 bg-sky-500 text-white'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300',
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-1">
                  <button
                    type="button"
                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    onClick={() => setShareOpen(false)}
                  >
                    Cerrar
                  </button>
                  <button type="submit" className="pro-button-primary">
                    Invitar
                  </button>
                </div>
              </form>
            )}

            {currentDiagram?.myRole !== 'owner' && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                  onClick={() => setShareOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {demoOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => { setDemoOpen(false); setDemoUrl(null); setDemoCopied(false) }}
        >
          <div className="pro-panel relative z-10 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Enlace demo (solo lectura)</h2>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              Genera un enlace temporal de solo lectura para compartir el diagrama actual.
            </p>
            <form className="mt-5 space-y-4" onSubmit={createDemoLink}>
              <div>
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Caduca en (días)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={demoDays}
                  onChange={(e) => setDemoDays(Number(e.target.value) || 30)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium dark:border-slate-600 dark:bg-slate-800"
                />
              </div>
              {demoUrl && (
                <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800">
                  <p className="min-w-0 flex-1 break-all text-sm font-medium text-sky-600 dark:text-sky-400">{demoUrl}</p>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(demoUrl)
                      setDemoCopied(true)
                      setTimeout(() => setDemoCopied(false), 2500)
                    }}
                    className="shrink-0 rounded-lg border border-slate-200 bg-white p-1.5 transition-colors hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700"
                    title="Copiar enlace"
                  >
                    {demoCopied ? (
                      <Check className="size-4 text-emerald-500" />
                    ) : (
                      <Copy className="size-4 text-slate-400" />
                    )}
                  </button>
                </div>
              )}
              <div className="flex flex-wrap justify-end gap-3 pt-1">
                <button
                  type="button"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                  onClick={() => { setDemoOpen(false); setDemoUrl(null); setDemoCopied(false) }}
                >
                  Cerrar
                </button>
                <button type="submit" className="pro-button-primary">
                  {demoUrl ? 'Regenerar' : 'Generar y copiar'}
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
