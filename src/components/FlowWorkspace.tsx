import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
  Maximize2,
  Minimize2,
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
  CauseNode,
  ConsequenceNode,
  HazardNode,
  TopEventNode,
} from './nodes/StudioNodes'
import { ShortcutsModal } from './ShortcutsModal'
import { layoutBowtie } from '../lib/layout'
import { loadDiagram, saveDiagram } from '../lib/storage'
import { TEMPLATES, expandWithAdditionalPath } from '../lib/template'
import { createStudioNode, type StudioNodeType } from '../lib/nodeFactory'
import { validateDiagram, type DiagramValidation } from '../lib/validateDiagram'
import { useDiagramHistory } from '../hooks/useDiagramHistory'
import { cn } from '../lib/cn'

const VALID_NODE_TYPES = new Set([
  'hazard',
  'cause',
  'barrierPreventive',
  'topEvent',
  'barrierMitigative',
  'consequence',
])

const nodeTypes = {
  hazard: HazardNode,
  cause: CauseNode,
  barrierPreventive: BarrierPreventiveNode,
  topEvent: TopEventNode,
  barrierMitigative: BarrierMitigativeNode,
  consequence: ConsequenceNode,
}

const NODE_TYPE_LABELS: Record<string, string> = {
  hazard: 'Peligro',
  cause: 'Causa',
  barrierPreventive: 'Control preventivo',
  topEvent: 'Evento Top',
  barrierMitigative: 'Control mitigador',
  consequence: 'Consecuencia',
}

const toolBtn =
  'inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/35 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-700'

function ToolbarSep() {
  return <span className="hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-slate-700 sm:block" aria-hidden />
}

type SessionUser = { name: string; role: string }

function DiagramSkeleton() {
  const bar = 'animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700/60'
  return (
    <div className="flex h-full w-full items-center justify-center bg-[var(--studio-canvas)]">
      <div className="flex items-center gap-5 opacity-70">
        <div className="flex flex-col gap-3">
          <div className={cn(bar, 'h-14 w-40')} />
          <div className={cn(bar, 'h-14 w-40')} />
        </div>
        <div className="flex flex-col gap-3">
          <div className={cn(bar, 'h-14 w-36')} />
          <div className={cn(bar, 'h-14 w-36')} />
        </div>
        <div className={cn(bar, 'h-20 w-44')} />
        <div className="flex flex-col gap-3">
          <div className={cn(bar, 'h-14 w-36')} />
          <div className={cn(bar, 'h-14 w-36')} />
        </div>
        <div className="flex flex-col gap-3">
          <div className={cn(bar, 'h-14 w-40')} />
          <div className={cn(bar, 'h-14 w-40')} />
        </div>
      </div>
    </div>
  )
}

function AddNodeMenu({ onAdd }: { onAdd: (t: StudioNodeType) => void }) {
  const [open, setOpen] = useState(false)

  const items: { type: StudioNodeType; label: string }[] = [
    { type: 'hazard', label: 'Peligro' },
    { type: 'cause', label: 'Causa' },
    { type: 'barrierPreventive', label: 'Control preventivo' },
    { type: 'topEvent', label: 'Evento Top' },
    { type: 'barrierMitigative', label: 'Control mitigador' },
    { type: 'consequence', label: 'Consecuencia' },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(toolBtn, 'pro-button-primary border-sky-500 bg-sky-500 text-white hover:bg-sky-600')}
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
          <ul className="absolute left-0 top-full z-50 mt-2 min-w-[200px] rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-slate-200/50 dark:border-slate-700 dark:bg-slate-900">
            {items.map(({ type, label }) => (
              <li key={type}>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
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

function TemplateMenu({ onLoad }: { onLoad: (templateId: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={toolBtn}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Sparkles className="size-4 text-slate-500 dark:text-slate-400" />
        Plantilla
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
          <ul className="absolute left-0 top-full z-50 mt-2 min-w-[240px] rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {TEMPLATES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => {
                    onLoad(t.id)
                    setOpen(false)
                  }}
                >
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{t.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t.description}</p>
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
        backgroundColor: '#0c0f14',
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
      className={toolBtn}
      aria-label="Exportar diagrama como PNG"
    >
      <Camera className="size-4 text-slate-500 dark:text-slate-400" />
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
      className={toolBtn}
      aria-label="Exportar informe PDF"
    >
      <FileDown className="size-4 text-slate-500 dark:text-slate-400" />
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
  readOnly = false,
  isFullscreen,
  onToggleFullscreen,
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
  readOnly?: boolean
  isFullscreen: boolean
  onToggleFullscreen: () => void
}) {
  const { screenToFlowPosition } = useReactFlow()

  const applyLayout = useCallback(() => {
    takeSnapshot()
    setNodes((n) => layoutBowtie(n))
    onToast('Diagrama reorganizado')
  }, [setNodes, onToast, takeSnapshot])

  const loadTemplate = useCallback(
    (templateId: string) => {
      const tpl = TEMPLATES.find((t) => t.id === templateId)
      if (!tpl) return
      takeSnapshot()
      const { nodes: tNodes, edges: tEdges } = tpl.create()
      setNodes(layoutBowtie(tNodes))
      setEdges(tEdges)
      onToast(`Plantilla "${tpl.name}" cargada`)
    },
    [setNodes, setEdges, onToast, takeSnapshot],
  )

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
          if (!Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
            throw new Error('Formato inválido')
          }
          const invalidNodes = data.nodes.filter((n) => !VALID_NODE_TYPES.has(String(n.type ?? '')))
          if (invalidNodes.length > 0) {
            onToast(`Tipos de nodo desconocidos: ${invalidNodes.map((n) => n.type).join(', ')}`)
            return
          }
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

  if (readOnly) {
    return (
      <>
        <Panel position="top-left" className="m-3">
          <div className="toolbar-pro">
            <span className="px-3 text-xs font-bold text-amber-600 dark:text-amber-400">Vista demo · solo lectura</span>
            <ToolbarSep />
            <ExportPngControl onToast={onToast} />
            <ExportPdfControl onToast={onToast} validation={validation} />
            <button
              type="button"
              onClick={onOpenShortcuts}
              className={toolBtn}
              aria-label="Ver atajos de teclado"
            >
              <HelpCircle className="size-4 text-slate-500 dark:text-slate-400" />
              Ayuda
            </button>
          </div>
        </Panel>
      </>
    )
  }

  return (
    <>
      <Panel position="top-left" className="m-3">
        <div className="toolbar-pro">
          <AddNodeMenu onAdd={addNode} />
          <ToolbarSep />
          <button
            type="button"
            disabled={!canUndo}
            onClick={() => (undo() ? onToast('Deshecho') : null)}
            className={toolBtn}
            aria-label="Deshacer"
          >
            <Undo2 className="size-4 text-slate-500 dark:text-slate-400" />
            Deshacer
          </button>
          <button
            type="button"
            disabled={!canRedo}
            onClick={() => (redo() ? onToast('Rehecho') : null)}
            className={toolBtn}
            aria-label="Rehacer"
          >
            <Redo2 className="size-4 text-slate-500 dark:text-slate-400" />
            Rehacer
          </button>
          <ToolbarSep />
          <button
            type="button"
            onClick={applyLayout}
            className={toolBtn}
          >
            <LayoutGrid className="size-4 text-slate-500 dark:text-slate-400" />
            Organizar
          </button>
          <TemplateMenu onLoad={loadTemplate} />
          <button type="button" onClick={expandPath} className={toolBtn}>
            <Wand2 className="size-4 text-slate-500 dark:text-slate-400" />
            Camino
          </button>
          <ToolbarSep />
          <ExportPngControl onToast={onToast} />
          <ExportPdfControl onToast={onToast} validation={validation} />
          <button type="button" onClick={exportJson} className={toolBtn}>
            <Download className="size-4 text-slate-500 dark:text-slate-400" />
            JSON
          </button>
          <button type="button" onClick={importJson} className={toolBtn}>
            <Upload className="size-4 text-slate-400 dark:text-slate-300" />
            Importar
          </button>
          <ToolbarSep />
          <button
            type="button"
            onClick={onOpenShortcuts}
            className={toolBtn}
            aria-label="Ver atajos de teclado"
          >
            <HelpCircle className="size-4 text-slate-500 dark:text-slate-400" />
            Ayuda
          </button>
          <button
            type="button"
            onClick={onToggleFullscreen}
            className={toolBtn}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <Minimize2 className="size-4 text-slate-500 dark:text-slate-400" />
            ) : (
              <Maximize2 className="size-4 text-slate-500 dark:text-slate-400" />
            )}
          </button>
        </div>
      </Panel>

      <Panel
        position="top-right"
        className="pro-panel m-3 px-5 py-3"
      >
        {user && (
          <div className="flex items-center justify-end gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
            <User className="size-4" />
            <span>
              {user.name}
              <span className="text-slate-400"> · </span>
              <span className="text-xs uppercase">{user.role}</span>
            </span>
          </div>
        )}
        <p className="mt-2 flex items-center justify-end gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <AlertTriangle className="size-3.5 text-amber-500" />
          Arrastre, conexión entre nodos y doble clic para editar
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
  remoteDiagramId = null,
  demoToken = null,
  readOnly = false,
  onDiagramVersionChange,
  serverVersionHint = null,
  saveSignal = 0,
}: {
  user: SessionUser | null
  onToast: (msg: string) => void
  savedAt: Date | null
  setSavedAt: (d: Date | null) => void
  shortcutsOpen: boolean
  setShortcutsOpen: (v: boolean) => void
  remoteDiagramId?: string | null
  demoToken?: string | null
  readOnly?: boolean
  onDiagramVersionChange?: (version: number) => void
  serverVersionHint?: number | null
  saveSignal?: number
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[])
  const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[])
  const [canvasReady, setCanvasReady] = useState(false)
  const versionRef = useRef(1)
  const onVersionParentRef = useRef(onDiagramVersionChange)
  onVersionParentRef.current = onDiagramVersionChange

  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  })

  const assignVersion = useCallback((v: number) => {
    versionRef.current = v
    onVersionParentRef.current?.(v)
  }, [])
  const [insightsOpen, setInsightsOpen] = useState(false)
  const [selected, setSelected] = useState<OnSelectionChangeParams>({ nodes: [], edges: [] })
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }, [])

  const { takeSnapshot, undo, redo, canUndo, canRedo } = useDiagramHistory(nodes, edges, setNodes, setEdges)

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (demoToken) {
        const res = await fetch(`/api/public/demo/${encodeURIComponent(demoToken)}`)
        if (!res.ok) {
          onToast(res.status === 410 ? 'El enlace demo ha caducado' : 'No se pudo cargar la demo')
          const t = TEMPLATES[0].create()
          if (!cancelled) {
            setNodes(layoutBowtie(t.nodes))
            setEdges(t.edges)
            setCanvasReady(true)
          }
          return
        }
        const data = (await res.json()) as { nodes: Node[]; edges: Edge[] }
        if (!cancelled) {
          setNodes(layoutBowtie(data.nodes))
          setEdges(data.edges)
          setCanvasReady(true)
        }
        return
      }
      if (remoteDiagramId) {
        const res = await fetch(`/api/diagrams/${encodeURIComponent(remoteDiagramId)}`, {
          credentials: 'include',
        })
        if (!res.ok) {
          onToast('No se pudo cargar el diagrama del servidor')
          const tpl = TEMPLATES[0].create()
          if (!cancelled) {
            setNodes(layoutBowtie(tpl.nodes))
            setEdges(tpl.edges)
            assignVersion(1)
            setCanvasReady(true)
          }
          return
        }
        const data = (await res.json()) as { nodes: Node[]; edges: Edge[]; version: number }
        if (!cancelled) {
          assignVersion(data.version)
          setNodes(layoutBowtie(data.nodes))
          setEdges(data.edges)
          setCanvasReady(true)
        }
        return
      }
      const stored = loadDiagram()
      if (stored?.nodes?.length) {
        if (!cancelled) {
          setNodes(layoutBowtie(stored.nodes as Node[]))
          setEdges(stored.edges as Edge[])
          setCanvasReady(true)
        }
        return
      }
      const t = TEMPLATES[0].create()
      if (!cancelled) {
        setNodes(layoutBowtie(t.nodes))
        setEdges(t.edges)
        setCanvasReady(true)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [demoToken, remoteDiagramId, onToast, setEdges, setNodes, assignVersion])

  useEffect(() => {
    if (serverVersionHint == null) return
    if (serverVersionHint > versionRef.current) {
      versionRef.current = serverVersionHint
    }
  }, [serverVersionHint])

  const doSave = useCallback(async () => {
    if (!canvasReady || demoToken || readOnly) return
    const currentNodes = nodesRef.current
    const currentEdges = edgesRef.current
    if (!remoteDiagramId) {
      saveDiagram(currentNodes, currentEdges)
      setSavedAt(new Date())
      return
    }
    try {
      const res = await fetch(`/api/diagrams/${encodeURIComponent(remoteDiagramId)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: currentNodes,
          edges: currentEdges,
          version: versionRef.current,
        }),
      })
      if (res.status === 409) {
        const r2 = await fetch(`/api/diagrams/${encodeURIComponent(remoteDiagramId)}`, {
          credentials: 'include',
        })
        if (r2.ok) {
          const j = (await r2.json()) as { nodes: Node[]; edges: Edge[]; version: number }
          assignVersion(j.version)
          setNodes(layoutBowtie(j.nodes))
          setEdges(j.edges)
          onToast('Otro colaborador editó el diagrama; se sincronizó')
        }
        return
      }
      if (!res.ok) return
      const j = (await res.json()) as { version: number }
      assignVersion(j.version)
      setSavedAt(new Date())
    } catch {
      /* ignore */
    }
  }, [canvasReady, demoToken, readOnly, remoteDiagramId, setSavedAt, onToast, assignVersion, setNodes, setEdges])

  useEffect(() => {
    if (!canvasReady || demoToken || readOnly) return
    const delay = remoteDiagramId ? 1200 : 900
    const t = setTimeout(() => void doSave(), delay)
    return () => clearTimeout(t)
  }, [nodes, edges, canvasReady, demoToken, readOnly, remoteDiagramId, doSave])

  const prevSaveSignal = useRef(0)
  useEffect(() => {
    if (saveSignal <= prevSaveSignal.current) return
    prevSaveSignal.current = saveSignal
    if (canvasReady && !demoToken && !readOnly) {
      void doSave()
    }
  }, [saveSignal, canvasReady, demoToken, readOnly, doSave])

  useEffect(() => {
    if (!canvasReady || !remoteDiagramId || demoToken || readOnly) return
    const id = window.setInterval(() => {
      void (async () => {
        try {
          const res = await fetch(`/api/diagrams/${encodeURIComponent(remoteDiagramId)}`, {
            credentials: 'include',
          })
          if (!res.ok) return
          const j = (await res.json()) as { version: number; nodes: Node[]; edges: Edge[] }
          if (j.version > versionRef.current) {
            assignVersion(j.version)
            setNodes(layoutBowtie(j.nodes))
            setEdges(j.edges)
            onToast('Cambios de un colaborador aplicados')
          }
        } catch {
          /* ignore */
        }
      })()
    }, 12000)
    return () => window.clearInterval(id)
  }, [canvasReady, remoteDiagramId, demoToken, readOnly, onToast, setEdges, setNodes, assignVersion])

  const onNodesChangeWrapped = useCallback(
    (changes: NodeChange[]) => {
      if (readOnly) {
        const allowed = changes.filter((ch) => ch.type === 'select')
        if (allowed.length) onNodesChange(allowed)
        return
      }
      if (changes.some((c) => c.type === 'remove')) takeSnapshot()
      onNodesChange(changes)
    },
    [onNodesChange, takeSnapshot, readOnly],
  )

  const onEdgesChangeWrapped = useCallback(
    (changes: EdgeChange[]) => {
      if (readOnly) {
        const allowed = changes.filter((ch) => ch.type === 'select')
        if (allowed.length) onEdgesChange(allowed)
        return
      }
      if (changes.some((c) => c.type === 'remove')) takeSnapshot()
      onEdgesChange(changes)
    },
    [onEdgesChange, takeSnapshot, readOnly],
  )

  const onConnect = useCallback(
    (p: Connection) => {
      if (readOnly) return
      takeSnapshot()
      setEdges((eds) =>
        addEdge(
          {
            ...p,
            animated: false,
            markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b', width: 14, height: 14 },
          },
          eds,
        ),
      )
    },
    [setEdges, takeSnapshot, readOnly],
  )

  const onNodeDragStart = useCallback(() => {
    if (readOnly) return
    takeSnapshot()
  }, [takeSnapshot, readOnly])

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
    if (readOnly) return
    if (selected.nodes.length === 0 && selected.edges.length === 0) return
    takeSnapshot()
    const nodeIds = new Set(selected.nodes.map((n) => n.id))
    const edgeIds = new Set(selected.edges.map((e) => e.id))
    setNodes((ns) => ns.filter((n) => !nodeIds.has(n.id)))
    setEdges((es) => es.filter((e) => !edgeIds.has(e.id) && !nodeIds.has(e.source) && !nodeIds.has(e.target)))
    onToast('Selección eliminada')
  }, [selected, setNodes, setEdges, onToast, takeSnapshot, readOnly])

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
        return '#e11d48'
      case 'barrierPreventive':
        return '#d97706'
      case 'topEvent':
        return '#475569'
      case 'barrierMitigative':
        return '#0369a1'
      case 'consequence':
        return '#059669'
      default:
        return '#64748b'
    }
  }, [])

  if (!canvasReady) {
    return (
      <div className="h-[calc(100vh-4.25rem)] w-full border-t border-slate-200 dark:border-slate-700">
        <DiagramSkeleton />
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-4.25rem)] w-full border-t border-slate-200 bg-[var(--studio-canvas)] dark:border-slate-700 animate-fade-in">
      <ReactFlow
        className="studio-flow"
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeWrapped}
        onEdgesChange={onEdgesChangeWrapped}
        onConnect={readOnly ? undefined : onConnect}
        onNodeDragStart={onNodeDragStart}
        onSelectionChange={setSelected}
        nodeTypes={nodeTypes}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.35}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          animated: false,
          style: { stroke: '#94a3b8', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8', width: 14, height: 14 },
        }}
        deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
      >
        <Background variant={BackgroundVariant.Lines} gap={32} lineWidth={0.5} color="#cbd5e1" className="opacity-40 dark:opacity-30" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={miniMapColor} maskColor="rgb(248 250 252 / 0.85)" className="!rounded-xl !border !border-slate-200 !bg-white/90 dark:!border-slate-700 dark:!bg-slate-900/90" />

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
          readOnly={readOnly}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />

        <Panel position="bottom-left" className="m-3 flex max-w-[min(100%-1.5rem,340px)] flex-col gap-2">
          <button
            type="button"
            onClick={() => setInsightsOpen((o) => !o)}
            className={cn(toolBtn, 'w-fit')}
          >
            <BarChart3 className="size-4 text-slate-500 dark:text-slate-400" />
            Calidad del modelo
            <span
              className={cn(
                'ml-1 rounded-lg px-2 py-0.5 font-mono text-xs font-bold',
                validation.healthScore >= 80 && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
                validation.healthScore >= 50 && validation.healthScore < 80 && 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
                validation.healthScore < 50 && 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
              )}
            >
              {validation.healthScore}
            </span>
            <ChevronDown className={cn('size-3.5 transition-transform', insightsOpen && 'rotate-180')} />
          </button>
          {insightsOpen && (
            <div className="pro-panel p-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Peligros', value: validation.stats.hazards, color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300' },
                  { label: 'Barr. prev.', value: validation.stats.barriersPreventive, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300' },
                  { label: 'Eventos', value: validation.stats.topEvents, color: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200' },
                  { label: 'Barr. mit.', value: validation.stats.barriersMitigative, color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300' },
                  { label: 'Consecuencias', value: validation.stats.consequences, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' },
                  { label: 'Conexiones', value: validation.stats.edges, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
                ].map(({ label, value, color }) => (
                  <div key={label} className={cn('flex flex-col items-center rounded-lg px-2 py-2', color)}>
                    <span className="text-lg font-bold leading-none">{value}</span>
                    <span className="mt-1 text-center text-[10px] font-semibold uppercase leading-tight tracking-wide opacity-80">{label}</span>
                  </div>
                ))}
              </div>
              {validation.warnings.length > 0 && (
                <ul className="mt-3 space-y-1.5 border-t border-slate-200 pt-3 text-xs font-medium text-amber-600 dark:border-slate-700 dark:text-amber-400">
                  {validation.warnings.map((w, i) => (
                    <li key={`${i}-${w.slice(0, 24)}`} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 border-t border-slate-200 pt-3 text-xs font-medium text-slate-400 dark:border-slate-700 dark:text-slate-500">
                Auto-guardado{' '}
                {savedAt
                  ? savedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
                  : '…'}
              </p>
            </div>
          )}
        </Panel>

        {primarySelected && !readOnly && (
          <Panel position="bottom-right" className="pro-panel m-3 w-[min(100%-1.5rem,300px)]">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Inspector</p>
            <p className="mt-1 text-sm font-bold text-slate-700 dark:text-slate-200">
              {NODE_TYPE_LABELS[String(primarySelected.type)] ?? primarySelected.type}
            </p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" htmlFor="insp-label">
              Texto
            </label>
            <textarea
              id="insp-label"
              value={String(primarySelected.data?.label ?? '')}
              onChange={(e) => updateSelectedLabel(e.target.value)}
              rows={3}
              className="nodrag nopan mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-sky-400"
            />
            <button
              type="button"
              onClick={deleteSelected}
              className="nodrag nopan mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-2.5 text-sm font-bold text-rose-600 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
            >
              <Trash2 className="size-4" />
              Eliminar selección
            </button>
          </Panel>
        )}
      </ReactFlow>

      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  )
}
