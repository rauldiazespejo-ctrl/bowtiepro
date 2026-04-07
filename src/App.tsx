import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
} from '@xyflow/react'
import {
  AlertTriangle,
  Download,
  LayoutGrid,
  Sparkles,
  Upload,
  User,
  Wand2,
} from 'lucide-react'
import {
  BarrierMitigativeNode,
  BarrierPreventiveNode,
  ConsequenceNode,
  HazardNode,
  TopEventNode,
} from './components/nodes/StudioNodes'
import { layoutBowtie } from './lib/layout'
import { loadDiagram, saveDiagram } from './lib/storage'
import { createDefaultTemplate, expandWithAdditionalPath } from './lib/template'
import { cn } from './lib/cn'

const nodeTypes = {
  hazard: HazardNode,
  barrierPreventive: BarrierPreventiveNode,
  topEvent: TopEventNode,
  barrierMitigative: BarrierMitigativeNode,
  consequence: ConsequenceNode,
}

type SessionUser = { name: string; role: string }

function FlowWorkspace({
  user,
  onToast,
}: {
  user: SessionUser | null
  onToast: (msg: string) => void
}) {
  const initial = useMemo(() => {
    const stored = loadDiagram()
    if (stored?.nodes?.length) {
      return {
        nodes: layoutBowtie(stored.nodes as Node[]),
        edges: stored.edges as Edge[],
      }
    }
    const t = createDefaultTemplate()
    return { nodes: layoutBowtie(t.nodes), edges: t.edges }
  }, [])

  const [nodes, setNodes, onNodesChange] = useNodesState(initial.nodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initial.edges)
  const [savedAt, setSavedAt] = useState<Date | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      saveDiagram(nodes, edges)
      setSavedAt(new Date())
    }, 900)
    return () => clearTimeout(t)
  }, [nodes, edges])

  const onConnect = useCallback(
    (p: Connection) => setEdges((eds) => addEdge({ ...p, animated: true }, eds)),
    [setEdges],
  )

  const applyLayout = useCallback(() => {
    setNodes((n) => layoutBowtie(n))
    onToast('Diagrama reorganizado')
  }, [setNodes, onToast])

  const resetTemplate = useCallback(() => {
    const t = createDefaultTemplate()
    setNodes(layoutBowtie(t.nodes))
    setEdges(t.edges)
    onToast('Plantilla base cargada')
  }, [setNodes, setEdges, onToast])

  const expandPath = useCallback(() => {
    const eventNode = nodes.find((n) => n.type === 'topEvent')
    if (!eventNode) {
      onToast('No hay evento superior en el lienzo')
      return
    }
    const { nodes: nextN, edges: nextE } = expandWithAdditionalPath(nodes, edges, eventNode.id)
    setNodes(layoutBowtie(nextN))
    setEdges(nextE)
    onToast('Nuevo camino de riesgo añadido')
  }, [nodes, edges, setNodes, setEdges, onToast])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ nodes, edges }, null, 2)], {
      type: 'application/json',
    })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `bowtie-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    onToast('Exportación lista')
  }, [nodes, edges, onToast])

  const importJson = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      file
        .text()
        .then((text) => {
          const data = JSON.parse(text) as { nodes: Node[]; edges: Edge[] }
          if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) throw new Error('Formato inválido')
          setNodes(layoutBowtie(data.nodes))
          setEdges(data.edges)
          onToast('Diagrama importado')
        })
        .catch(() => onToast('No se pudo importar el archivo'))
    }
    input.click()
  }, [setNodes, setEdges, onToast])

  const miniMapColor = useCallback((n: Node) => {
    switch (n.type) {
      case 'hazard':
        return '#f43f5e'
      case 'barrierPreventive':
        return '#f59e0b'
      case 'topEvent':
        return '#8b5cf6'
      case 'barrierMitigative':
        return '#0ea5e9'
      case 'consequence':
        return '#34d399'
      default:
        return '#71717a'
    }
  }, [])

  return (
    <div className="relative h-[calc(100vh-4.25rem)] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.4}
        maxZoom={1.4}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{ style: { strokeWidth: 2 } }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-40" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={miniMapColor} maskColor="rgb(9 9 11 / 0.75)" />

        <Panel position="top-left" className="m-3 flex max-w-[min(100%-1.5rem,520px)] flex-wrap gap-2">
          <button
            type="button"
            onClick={applyLayout}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
          >
            <LayoutGrid className="size-4 text-violet-400" />
            Organizar automático
          </button>
          <button
            type="button"
            onClick={resetTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
          >
            <Sparkles className="size-4 text-amber-400" />
            Plantilla base
          </button>
          <button
            type="button"
            onClick={expandPath}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
          >
            <Wand2 className="size-4 text-sky-400" />
            Añadir camino
          </button>
          <button
            type="button"
            onClick={exportJson}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
          >
            <Download className="size-4 text-emerald-400" />
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={importJson}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
          >
            <Upload className="size-4 text-zinc-300" />
            Importar
          </button>
        </Panel>

        <Panel
          position="top-right"
          className="m-3 rounded-2xl border border-zinc-700/80 bg-zinc-950/90 px-4 py-3 text-right shadow-xl backdrop-blur"
        >
          {user && (
            <div className="flex items-center justify-end gap-2 text-xs text-zinc-400">
              <User className="size-3.5" />
              <span>
                {user.name}
                <span className="text-zinc-600"> · </span>
                {user.role}
              </span>
            </div>
          )}
          <p className="mt-1 text-[11px] text-zinc-500">
            {savedAt
              ? `Auto-guardado ${savedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`
              : 'Guardando…'}
          </p>
          <p className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-zinc-600">
            <AlertTriangle className="size-3 text-amber-500/80" />
            Arrastra nodos · Conecta handles · Cambios en local
          </p>
        </Panel>
      </ReactFlow>
    </div>
  )
}

export function App() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [toast, setToast] = useState<string | null>(null)

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
    <div className="flex min-h-full flex-col bg-zinc-950 text-zinc-100">
      <header
        className={cn(
          'flex shrink-0 items-center justify-between border-b border-zinc-800/80 px-5 py-3',
          'bg-gradient-to-r from-zinc-950 via-violet-950/20 to-zinc-950',
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 shadow-lg shadow-violet-950/50">
            <span className="text-lg font-bold tracking-tight text-white">B</span>
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white">Bowtie Studio</h1>
            <p className="text-xs text-zinc-500">Modelado bowtie con flujo visual y respaldo automático</p>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-[10px] font-medium uppercase tracking-widest text-violet-400/90">Modo trabajo</p>
          <p className="text-xs text-zinc-500">API local + persistencia en navegador</p>
        </div>
      </header>

      <main className="flex-1">
        <ReactFlowProvider>
          <FlowWorkspace user={user} onToast={showToast} />
        </ReactFlowProvider>
      </main>

      <div
        className={cn(
          'pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300',
          toast ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
        )}
      >
        {toast && (
          <div className="pointer-events-auto rounded-full border border-zinc-600 bg-zinc-900/95 px-5 py-2.5 text-sm text-zinc-100 shadow-2xl backdrop-blur">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
