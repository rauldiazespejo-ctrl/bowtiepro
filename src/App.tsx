import { useCallback, useEffect, useState } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { FlowWorkspace } from './components/FlowWorkspace'
import { cn } from './lib/cn'

type SessionUser = { name: string; role: string }

function BowtieMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('shrink-0', className)} aria-hidden>
      <path
        fill="currentColor"
        className="text-slate-600"
        d="M16 4 4 16 16 28 28 16 16 4z"
      />
      <path fill="currentColor" className="text-slate-400/90" d="M16 9 9 16 16 23 23 16 16 9z" />
    </svg>
  )
}

export function App() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/auth/session').then((r) => r.json()),
      fetch('/api/users/me').then((r) => r.json()),
    ])
      .then(([s, me]) => {
        if (s?.user) setUser({ name: s.user.name, role: s.user.role ?? me.role ?? 'usuario' })
        else if (me?.name) setUser({ name: me.name, role: me.role })
      })
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        showToast('Ya está guardado automáticamente en este navegador')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showToast])

  return (
    <div className="flex min-h-full flex-col bg-[var(--studio-bg,#090b0f)] text-zinc-100">
      <header
        className={cn(
          'flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-4 py-3 sm:px-6',
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
        <div className="hidden shrink-0 text-right sm:block">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">Flujo de trabajo</p>
          <p className="text-xs text-zinc-600">Validación · Historial · Exportación</p>
        </div>
      </header>

      <main className="flex-1">
        <ReactFlowProvider>
          <FlowWorkspace
            user={user}
            onToast={showToast}
            savedAt={savedAt}
            setSavedAt={setSavedAt}
            shortcutsOpen={shortcutsOpen}
            setShortcutsOpen={setShortcutsOpen}
          />
        </ReactFlowProvider>
      </main>

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
