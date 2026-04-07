import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  MarkerType,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type OnSelectionChangeParams,
} from '@xyflow/react'
import { toPng } from 'html-to-image'
import {
  AlertTriangle,
  BarChart3,
  Camera,
  ChevronDown,
  Download,
  FileDown,
  HelpCircle,
  LayoutGrid,
  Plus,
  Redo2,
  Sparkles,
  Trash2,
  Undo2,
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
} from './nodes/StudioNodes'
import { ShortcutsModal } from './ShortcutsModal'
import { layoutBowtie } from '../lib/layout'
import { loadDiagram, saveDiagram } from '../lib/storage'
import { createDefaultTemplate, expandWithAdditionalPath } from '../lib/template'
import { createStudioNode, type StudioNodeType } from '../lib/nodeFactory'
import { validateDiagram, type DiagramValidation } from '../lib/validateDiagram'
import { useDiagramHistory } from '../hooks/useDiagramHistory'
import { cn } from '../lib/cn'

const nodeTypes = {
  hazard: HazardNode,
  barrierPreventive: BarrierPreventiveNode,
  topEvent: TopEventNode,
  barrierMitigative: BarrierMitigativeNode,
  consequence: ConsequenceNode,
}

const NODE_TYPE_LABELS: Record<string, string> = {
  hazard: 'Peligro',
  barrierPreventive: 'Barrera preventiva',
  topEvent: 'Evento superior',
  barrierMitigative: 'Barrera mitigadora',
  consequence: 'Consecuencia',
}

type SessionUser = { name: string; role: string }

function AddNodeMenu({ onAdd }: { onAdd: (t: StudioNodeType) => void }) {
  const [open, setOpen] = useState(false)

  const items: { type: StudioNodeType; label: string }[] = [
    { type: 'hazard', label: 'Peligro' },
    { type: 'barrierPreventive', label: 'Barrera preventiva' },
    { type: 'topEvent', label: 'Evento superior' },
    { type: 'barrierMitigative', label: 'Barrera mitigadora' },
    { type: 'consequence', label: 'Consecuencia' },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-violet-500/40 bg-violet-950/50 px-3 py-2 text-xs font-medium text-violet-100 shadow-lg backdrop-blur hover:bg-violet-900/50"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Plus className="size-4" />
        Añadir nodo
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-xl border border-zinc-700 bg-zinc-950 py-1 shadow-2xl">
            {items.map(({ type, label }) => (
              <li key={type}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
                  onClick={() => {
                    onAdd(type)
                    setOpen(false)
                  }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function ExportPngControl({ onToast }: { onToast: (msg: string) => void }) {
  const { fitView } = useReactFlow()

  const exportPng = useCallback(async () => {
    const vp = document.querySelector('.react-flow__viewport') as HTMLElement | null
    if (!vp) {
      onToast('No se encontró el lienzo')
      return
    }
    try {
      await fitView({ padding: 0.15, duration: 200 })
      await new Promise((r) => setTimeout(r, 280))
      const dataUrl = await toPng(vp, {
        backgroundColor: '#09090b',
        pixelRatio: 2,
        cacheBust: true,
      })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = `bowtie-captura-${new Date().toISOString().slice(0, 10)}.png`
      a.click()
      onToast('Imagen PNG descargada')
    } catch {
      onToast('Error al exportar imagen')
    }
  }, [fitView, onToast])

  return (
    <button
      type="button"
      onClick={() => void exportPng()}
      className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
      aria-label="Exportar diagrama como PNG"
    >
      <Camera className="size-4 text-pink-400" />
      PNG
    </button>
  )
}

function ExportPdfControl({
  onToast,
  validation,
}: {
  onToast: (msg: string) => void
  validation: DiagramValidation
}) {
  const { fitView } = useReactFlow()

  const run = useCallback(async () => {
    const vp = document.querySelector('.react-flow__viewport') as HTMLElement | null
    if (!vp) {
      onToast('No se encontró el lienzo')
      return
    }
    try {
      onToast('Generando PDF…')
      await fitView({ padding: 0.15, duration: 200 })
      await new Promise((r) => setTimeout(r, 320))
      const { exportBowtiePdf } = await import('../lib/exportPdf')
      await exportBowtiePdf(vp, validation)
      onToast('PDF descargado')
    } catch {
      onToast('Error al generar PDF')
    }
  }, [fitView, onToast, validation])

  return (
    <button
      type="button"
      onClick={() => void run()}
      className="inline-flex items-center gap-2 rounded-xl border border-red-500/35 bg-red-950/30 px-3 py-2 text-xs font-medium text-red-100 shadow-lg backdrop-blur hover:bg-red-950/50"
      aria-label="Exportar informe PDF"
    >
      <FileDown className="size-4 text-red-400" />
      PDF
    </button>
  )
}

function FlowToolbarInner({
  user,
  onToast,
  nodes,
  edges,
  setNodes,
  setEdges,
  takeSnapshot,
  undo,
  redo,
  canUndo,
  canRedo,
  onOpenShortcuts,
  validation,
}: {
  user: SessionUser | null
  onToast: (msg: string) => void
  nodes: Node[]
  edges: Edge[]
  setNodes: ReturnType<typeof useNodesState>[1]
  setEdges: ReturnType<typeof useEdgesState>[1]
  takeSnapshot: () => void
  undo: () => boolean
  redo: () => boolean
  canUndo: boolean
  canRedo: boolean
  onOpenShortcuts: () => void
  validation: DiagramValidation
}) {
  const { screenToFlowPosition } = useReactFlow()

  const applyLayout = useCallback(() => {
    takeSnapshot()
    setNodes((n) => layoutBowtie(n))
    onToast('Diagrama reorganizado')
  }, [setNodes, onToast, takeSnapshot])

  const resetTemplate = useCallback(() => {
    takeSnapshot()
    const t = createDefaultTemplate()
    setNodes(layoutBowtie(t.nodes))
    setEdges(t.edges)
    onToast('Plantilla base cargada')
  }, [setNodes, setEdges, onToast, takeSnapshot])

  const expandPath = useCallback(() => {
    const eventNode = nodes.find((n) => n.type === 'topEvent')
    if (!eventNode) {
      onToast('No hay evento superior en el lienzo')
      return
    }
    takeSnapshot()
    const { nodes: nextN, edges: nextE } = expandWithAdditionalPath(nodes, edges, eventNode.id)
    setNodes(layoutBowtie(nextN))
    setEdges(nextE)
    onToast('Nuevo camino de riesgo añadido')
  }, [nodes, edges, setNodes, setEdges, onToast, takeSnapshot])

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
          takeSnapshot()
          setNodes(layoutBowtie(data.nodes))
          setEdges(data.edges)
          onToast('Diagrama importado')
        })
        .catch(() => onToast('No se pudo importar el archivo'))
    }
    input.click()
  }, [setNodes, setEdges, onToast, takeSnapshot])

  const addNode = useCallback(
    (t: StudioNodeType) => {
      takeSnapshot()
      const pos = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      })
      setNodes((n) => [...n, createStudioNode(t, pos)])
      onToast('Nodo añadido')
    },
    [setNodes, onToast, takeSnapshot, screenToFlowPosition],
  )

  return (
    <>
      <Panel position="top-left" className="m-3 flex max-w-[min(100%-1.5rem,640px)] flex-wrap gap-2">
        <AddNodeMenu onAdd={addNode} />
        <button
          type="button"
          disabled={!canUndo}
          onClick={() => (undo() ? onToast('Deshecho') : null)}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Deshacer"
        >
          <Undo2 className="size-4 text-zinc-400" />
          Deshacer
        </button>
        <button
          type="button"
          disabled={!canRedo}
          onClick={() => (redo() ? onToast('Rehecho') : null)}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Rehacer"
        >
          <Redo2 className="size-4 text-zinc-400" />
          Rehacer
        </button>
        <button
          type="button"
          onClick={applyLayout}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
        >
          <LayoutGrid className="size-4 text-violet-400" />
          Organizar
        </button>
        <button type="button" onClick={resetTemplate} className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800">
          <Sparkles className="size-4 text-amber-400" />
          Plantilla
        </button>
        <button type="button" onClick={expandPath} className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800">
          <Wand2 className="size-4 text-sky-400" />
          Camino
        </button>
        <ExportPngControl onToast={onToast} />
        <ExportPdfControl onToast={onToast} validation={validation} />
        <button type="button" onClick={exportJson} className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800">
          <Download className="size-4 text-emerald-400" />
          JSON
        </button>
        <button type="button" onClick={importJson} className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800">
          <Upload className="size-4 text-zinc-300" />
          Importar
        </button>
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/90 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
          aria-label="Ver atajos de teclado"
        >
          <HelpCircle className="size-4 text-zinc-400" />
          Ayuda
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
        <p className="mt-2 flex items-center justify-end gap-1.5 text-[10px] text-zinc-600">
          <AlertTriangle className="size-3 text-amber-500/80" />
          Arrastra · Conecta · Doble clic para editar
        </p>
      </Panel>
    </>
  )
}

export function FlowWorkspace({
  user,
  onToast,
  savedAt,
  setSavedAt,
  shortcutsOpen,
  setShortcutsOpen,
}: {
  user: SessionUser | null
  onToast: (msg: string) => void
  savedAt: Date | null
  setSavedAt: (d: Date | null) => void
  shortcutsOpen: boolean
  setShortcutsOpen: (v: boolean) => void
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
  const [insightsOpen, setInsightsOpen] = useState(true)
  const [selected, setSelected] = useState<OnSelectionChangeParams>({ nodes: [], edges: [] })

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useDiagramHistory(nodes, edges, setNodes, setEdges)

  useEffect(() => {
    const t = setTimeout(() => {
      saveDiagram(nodes, edges)
      setSavedAt(new Date())
    }, 900)
    return () => clearTimeout(t)
  }, [nodes, edges, setSavedAt])

  const onNodesChangeWrapped = useCallback(
    (changes: NodeChange[]) => {
      if (changes.some((c) => c.type === 'remove')) takeSnapshot()
      onNodesChange(changes)
    },
    [onNodesChange, takeSnapshot],
  )

  const onEdgesChangeWrapped = useCallback(
    (changes: EdgeChange[]) => {
      if (changes.some((c) => c.type === 'remove')) takeSnapshot()
      onEdgesChange(changes)
    },
    [onEdgesChange, takeSnapshot],
  )

  const onConnect = useCallback(
    (p: Connection) => {
      takeSnapshot()
      setEdges((eds) =>
        addEdge(
          {
            ...p,
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a', width: 18, height: 18 },
          },
          eds,
        ),
      )
    },
    [setEdges, takeSnapshot],
  )

  const onNodeDragStart = useCallback(() => {
    takeSnapshot()
  }, [takeSnapshot])

  const validation = useMemo(() => validateDiagram(nodes, edges), [nodes, edges])
  const primarySelected = selected.nodes[0]

  const updateSelectedLabel = useCallback(
    (label: string) => {
      if (!primarySelected) return
      setNodes((ns) =>
        ns.map((n) => (n.id === primarySelected.id ? { ...n, data: { ...n.data, label } } : n)),
      )
    },
    [primarySelected, setNodes],
  )

  const deleteSelected = useCallback(() => {
    if (selected.nodes.length === 0 && selected.edges.length === 0) return
    takeSnapshot()
    const nodeIds = new Set(selected.nodes.map((n) => n.id))
    const edgeIds = new Set(selected.edges.map((e) => e.id))
    setNodes((ns) => ns.filter((n) => !nodeIds.has(n.id)))
    setEdges((es) => es.filter((e) => !edgeIds.has(e.id) && !nodeIds.has(e.source) && !nodeIds.has(e.target)))
    onToast('Selección eliminada')
  }, [selected, setNodes, setEdges, onToast, takeSnapshot])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault()
        setShortcutsOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, setShortcutsOpen])

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
        onNodesChange={onNodesChangeWrapped}
        onEdgesChange={onEdgesChangeWrapped}
        onConnect={onConnect}
        onNodeDragStart={onNodeDragStart}
        onSelectionChange={setSelected}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.35}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          style: { strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#71717a', width: 18, height: 18 },
        }}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} className="opacity-40" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={miniMapColor} maskColor="rgb(9 9 11 / 0.75)" />

        <FlowToolbarInner
          user={user}
          onToast={onToast}
          nodes={nodes}
          edges={edges}
          setNodes={setNodes}
          setEdges={setEdges}
          takeSnapshot={takeSnapshot}
          undo={undo}
          redo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          validation={validation}
        />

        <Panel position="bottom-left" className="m-3 flex max-w-[min(100%-1.5rem,320px)] flex-col gap-2">
          <button
            type="button"
            onClick={() => setInsightsOpen((o) => !o)}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-zinc-600/80 bg-zinc-900/95 px-3 py-2 text-xs font-medium text-zinc-100 shadow-lg backdrop-blur hover:bg-zinc-800"
          >
            <BarChart3 className="size-4 text-emerald-400" />
            Calidad del modelo
            <span
              className={cn(
                'ml-1 rounded-md px-1.5 py-0.5 font-mono text-[10px]',
                validation.healthScore >= 80 && 'bg-emerald-500/20 text-emerald-300',
                validation.healthScore >= 50 && validation.healthScore < 80 && 'bg-amber-500/20 text-amber-200',
                validation.healthScore < 50 && 'bg-rose-500/20 text-rose-200',
              )}
            >
              {validation.healthScore}
            </span>
          </button>
          {insightsOpen && (
            <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/95 p-3 text-xs shadow-xl backdrop-blur">
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-zinc-400">
                <li>Peligros: {validation.stats.hazards}</li>
                <li>Prev.: {validation.stats.barriersPreventive}</li>
                <li>Mit.: {validation.stats.barriersMitigative}</li>
                <li>Eventos: {validation.stats.topEvents}</li>
                <li>Cons.: {validation.stats.consequences}</li>
                <li>Aristas: {validation.stats.edges}</li>
              </ul>
              {validation.warnings.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-zinc-800 pt-2 text-[11px] text-amber-200/90">
                  {validation.warnings.map((w, i) => (
                    <li key={`${i}-${w.slice(0, 24)}`} className="flex gap-1.5">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0 text-amber-500" />
                      {w}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 border-t border-zinc-800 pt-2 text-[10px] text-zinc-600">
                Auto-guardado{' '}
                {savedAt
                  ? savedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                  : '…'}
              </p>
            </div>
          )}
        </Panel>

        {primarySelected && (
          <Panel position="bottom-right" className="m-3 w-[min(100%-1.5rem,280px)] rounded-2xl border border-zinc-700/80 bg-zinc-950/95 p-4 shadow-xl backdrop-blur">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Inspector</p>
            <p className="mt-1 text-xs text-violet-300/90">
              {NODE_TYPE_LABELS[String(primarySelected.type)] ?? primarySelected.type}
            </p>
            <label className="mt-3 block text-[10px] uppercase tracking-wide text-zinc-500" htmlFor="insp-label">
              Texto
            </label>
            <textarea
              id="insp-label"
              value={String(primarySelected.data?.label ?? '')}
              onChange={(e) => updateSelectedLabel(e.target.value)}
              rows={3}
              className="nodrag nopan mt-1 w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-sm text-zinc-100 outline-none focus:border-violet-500"
            />
            <button
              type="button"
              onClick={deleteSelected}
              className="nodrag nopan mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/40 bg-rose-950/40 py-2 text-xs font-medium text-rose-200 hover:bg-rose-950/70"
            >
              <Trash2 className="size-3.5" />
              Eliminar selección
            </button>
          </Panel>
        )}
      </ReactFlow>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
