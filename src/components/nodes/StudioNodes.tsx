import type { ReactNode } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { cn } from '../../lib/cn'

function NodeShell({
  className,
  badge,
  children,
  target,
  source,
}: {
  className?: string
  badge: string
  children: ReactNode
  target?: boolean
  source?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-3 shadow-xl backdrop-blur-md min-w-[160px] max-w-[220px] transition-transform duration-200 hover:scale-[1.02]',
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
      <div className="mt-1.5 text-sm font-medium leading-snug text-zinc-50">{children}</div>
    </div>
  )
}

export function HazardNode({ data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      badge="Peligro"
      source
      className="border-rose-500/35 bg-gradient-to-br from-rose-950/90 to-zinc-950/90 ring-1 ring-rose-500/20"
    >
      {data.label}
    </NodeShell>
  )
}

export function BarrierPreventiveNode({ data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      badge="Barrera preventiva"
      target
      source
      className="border-amber-500/35 bg-gradient-to-br from-amber-950/85 to-zinc-950/90 ring-1 ring-amber-400/15"
    >
      {data.label}
    </NodeShell>
  )
}

export function TopEventNode({ data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      badge="Evento superior"
      target
      source
      className="border-violet-500/40 bg-gradient-to-br from-violet-950/90 to-zinc-950/90 ring-2 ring-violet-500/25 shadow-violet-950/40"
    >
      {data.label}
    </NodeShell>
  )
}

export function BarrierMitigativeNode({ data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      badge="Barrera mitigadora"
      target
      source
      className="border-sky-500/35 bg-gradient-to-br from-sky-950/85 to-zinc-950/90 ring-1 ring-sky-400/15"
    >
      {data.label}
    </NodeShell>
  )
}

export function ConsequenceNode({ data }: NodeProps<{ label: string }>) {
  return (
    <NodeShell
      badge="Consecuencia"
      target
      className="border-emerald-500/30 bg-gradient-to-br from-emerald-950/80 to-zinc-950/90 ring-1 ring-emerald-500/15"
    >
      {data.label}
    </NodeShell>
  )
}
