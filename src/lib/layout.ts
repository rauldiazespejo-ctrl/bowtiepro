import type { Node } from '@xyflow/react'

const COL = {
  hazard: 0,
  cause: 1,
  barrierPreventive: 2,
  topEvent: 3,
  barrierMitigative: 4,
  consequence: 5,
} as const

const GAP_X = 200
const GAP_Y = 96
const ORIGIN_Y = 120

function stackColumn(list: Node[], colIndex: number): Node[] {
  const n = list.length
  const totalH = (n - 1) * GAP_Y
  const startY = ORIGIN_Y - totalH / 2
  return list.map((node, i) => ({
    ...node,
    position: {
      x: 48 + colIndex * GAP_X,
      y: startY + i * GAP_Y,
    },
  }))
}

/** Organiza nodos en columnas tipo bowtie (izquierda → centro → derecha). */
export function layoutBowtie(nodes: Node[]): Node[] {
  const byType = {
    hazard: [] as Node[],
    cause: [] as Node[],
    barrierPreventive: [] as Node[],
    topEvent: [] as Node[],
    barrierMitigative: [] as Node[],
    consequence: [] as Node[],
  }

  for (const node of nodes) {
    const t = node.type as keyof typeof byType
    if (byType[t]) byType[t].push(node)
  }

  const ordered: Node[] = [
    ...stackColumn(byType.hazard, COL.hazard),
    ...stackColumn(byType.cause, COL.cause),
    ...stackColumn(byType.barrierPreventive, COL.barrierPreventive),
    ...stackColumn(byType.topEvent, COL.topEvent),
    ...stackColumn(byType.barrierMitigative, COL.barrierMitigative),
    ...stackColumn(byType.consequence, COL.consequence),
  ]

  const map = new Map(ordered.map((n) => [n.id, n]))
  return nodes.map((n) => map.get(n.id) ?? n)
}
