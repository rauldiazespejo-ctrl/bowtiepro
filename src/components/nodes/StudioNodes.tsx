import { useEffect, useState } from 'react'
import { Handle, Position, useReactFlow, type NodeProps } from '@xyflow/react'
import { cn } from '../../lib/cn'

function EditableLabel({ id, label }: { id: string; label: string }) {
  const { setNodes } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(label)

  useEffect(() => {
    setValue(label)
  }, [label])

  const commit = () => {
    setEditing(false)
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, label: value } } : n)),
    )
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
          if (e.key === 'Escape') {
            setEditing(false)
            setValue(label)
          }
        }}
        rows={2}
        className="nodrag nopan mt-1 w-full resize-none rounded-lg border border-zinc-600/80 bg-black/40 px-2 py-1 text-sm font-medium leading-snug text-zinc-50 outline-none focus:border-violet-500"
      />
    )
  }

  return (
    <button
      type="button"
      onDoubleClick={(e) => {
        e.stopPropagation()
        setEditing(true)
      }}
      className="nodrag nopan mt-1.5 w-full rounded-lg text-left text-sm font-medium leading-snug text-zinc-50 hover:bg-white/5"
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
}: {
  className?: string
  badge: string
  id: string
  label: string
  target?: boolean
  source?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md min-w-[160px] max-w-[220px] transition-[transform,box-shadow] duration-200 hover:scale-[1.02] hover:shadow-2xl',
        className,
      )}
    >
      {target && (
        <Handle
          type="target"
          position={Position.Left}
          className="!size-2.5 !border-2 !border-zinc-600 !bg-zinc-300"
        />
      )}
      {source && (
        <Handle
          type="source"
          position={Position.Right}
          className="!size-2.5 !border-2 !border-zinc-600 !bg-zinc-300"
        />
      )}
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">{badge}</p>
      <EditableLabel id={id} label={label} />
    </div>
  )
}

export function HazardNode({ id, data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      id={id}
      label={data.label}
      badge="Peligro"
      source
      className="border-rose-500/35 bg-gradient-to-br from-rose-950/90 to-zinc-950/90 ring-1 ring-rose-500/20"
    />
  )
}

export function BarrierPreventiveNode({ id, data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      id={id}
      label={data.label}
      badge="Barrera preventiva"
      target
      source
      className="border-amber-500/35 bg-gradient-to-br from-amber-950/85 to-zinc-950/90 ring-1 ring-amber-400/15"
    />
  )
}

export function TopEventNode({ id, data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      id={id}
      label={data.label}
      badge="Evento superior"
      target
      source
      className="border-violet-500/40 bg-gradient-to-br from-violet-950/90 to-zinc-950/90 ring-2 ring-violet-500/25 shadow-violet-950/40"
    />
  )
}

export function BarrierMitigativeNode({ id, data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      id={id}
      label={data.label}
      badge="Barrera mitigadora"
      target
      source
      className="border-sky-500/35 bg-gradient-to-br from-sky-950/85 to-zinc-950/90 ring-1 ring-sky-400/15"
    />
  )
}

export function ConsequenceNode({ id, data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      id={id}
      label={data.label}
      badge="Consecuencia"
      target
      className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 to-zinc-950/90 ring-1 ring-emerald-500/15"
    />
  )
}
