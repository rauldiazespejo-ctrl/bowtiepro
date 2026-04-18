import { useEffect, useState } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { cn } from '../../lib/cn'

const NODE_COLORS = {
  hazard: {
    light: 'border-rose-500 bg-rose-50',
    dark: 'border-rose-600 bg-rose-950/60',
    accent: 'text-rose-600 dark:text-rose-400',
    badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300',
  },
  barrierPreventive: {
    light: 'border-amber-500 bg-amber-50',
    dark: 'border-amber-600 bg-amber-950/60',
    accent: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  topEvent: {
    light: 'border-slate-600 bg-slate-100',
    dark: 'border-slate-500 bg-slate-800/60',
    accent: 'text-slate-600 dark:text-slate-400',
    badge: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  },
  barrierMitigative: {
    light: 'border-sky-500 bg-sky-50',
    dark: 'border-sky-600 bg-sky-950/60',
    accent: 'text-sky-600 dark:text-sky-400',
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300',
  },
  consequence: {
    light: 'border-emerald-500 bg-emerald-50',
    dark: 'border-emerald-600 bg-emerald-950/60',
    accent: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300',
  },
}

type NodeVariant = keyof typeof NODE_COLORS

function EditableLabel({ id, label, variant = 'hazard' }: { id: string; label: string; variant?: NodeVariant }) {
  const setNodes = useReactFlow((state) => state.setNodes)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(label)
  const colors = NODE_COLORS[variant]

  useEffect(() => { setValue(label) }, [label])

  const commit = () => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, label: value } } : node
      )
    )
    setEditing(false)
  }

  if (editing) {
    return (
      <textarea
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onPointerDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          e.stopPropagation()
          if (e.key === 'Escape') { setEditing(false); setValue(label) }
        }}
        rows={2}
        className="nodrag nopan mt-1.5 w-full resize-none rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm font-semibold leading-snug text-slate-800 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-sky-400"
      />
    )
  }

  return (
    <button
      type="button"
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true) }}
      className={cn('nodrag nopan mt-1.5 w-full rounded-md px-2 py-1.5 text-left text-sm font-semibold leading-snug text-slate-700 transition-colors hover:bg-slate-200/60 dark:text-slate-200 dark:hover:bg-slate-700/50', colors.accent)}
    >
      {label}
    </button>
  )
}

function NodeShell({
  className,
  badge,
  id,
  label,
  target,
  source,
  variant = 'hazard',
}: {
  className?: string
  badge: string
  id: string
  label: string
  target?: boolean
  source?: boolean
  variant?: NodeVariant
}) {
  const colors = NODE_COLORS[variant]

  return (
    <div
      className={cn(
        'bowtie-node group relative min-w-[180px] max-w-[260px] rounded-xl border-2 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        colors.light,
        colors.dark,
        className,
      )}
    >
      {target && (
        <Handle type="target" position={Position.Left} className="!size-3 !-ml-1.5 !border-2 !border-slate-400 !bg-white dark:!border-slate-500 dark:!bg-slate-300" />
      )}
      {source && (
        <Handle type="source" position={Position.Right} className="!size-3 !-mr-1.5 !border-2 !border-slate-400 !bg-white dark:!border-slate-500 dark:!bg-slate-300" />
      )}
      <div className={cn('mb-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider', colors.badge)}>{badge}</div>
      <EditableLabel id={id} label={label} variant={variant} />
    </div>
  )
}

export function HazardNode({ id, data }: NodeProps<{ label: string }>) {
  return <NodeShell variant="hazard" id={id} label={data.label} badge="Peligro" source className="border-l-4" />
}

export function BarrierPreventiveNode({ id, data }: NodeProps<{ label: string }>) {
  return <NodeShell variant="barrierPreventive" id={id} label={data.label} badge="Barrera preventiva" target source className="border-l-4" />
}

export function TopEventNode({ id, data }: NodeProps<{ label: string }>) {
  return <NodeShell variant="topEvent" id={id} label={data.label} badge="Evento superior" target source className="border-l-4" />
}

export function BarrierMitigativeNode({ id, data }: NodeProps<{ label: string }>) {
  return <NodeShell variant="barrierMitigative" id={id} label={data.label} badge="Barrera mitigadora" target source className="border-l-4" />
}

export function ConsequenceNode({ id, data }: NodeProps<{ label: string }>) {
  return <NodeShell variant="consequence" id={id} label={data.label} badge="Consecuencia" target className="border-l-4" />
}