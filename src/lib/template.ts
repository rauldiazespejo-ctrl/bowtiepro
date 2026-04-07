import type { Edge, Node } from '@xyflow/react'

/** Plantilla bowtie inicial: amenaza → barreras preventivas → evento → barreras mitigadoras → consecuencias */
export function createDefaultTemplate(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    {
      id: 'h1',
      type: 'hazard',
      position: { x: 0, y: 0 },
      data: { label: 'Fuga de gas inflamable' },
    },
    {
      id: 'bp1',
      type: 'barrierPreventive',
      position: { x: 0, y: 0 },
      data: { label: 'Diseño a prueba de fugas' },
    },
    {
      id: 'bp2',
      type: 'barrierPreventive',
      position: { x: 0, y: 0 },
      data: { label: 'Inspección y mantenimiento' },
    },
    {
      id: 'e1',
      type: 'topEvent',
      position: { x: 0, y: 0 },
      data: { label: 'Ignición — incendio o explosión' },
    },
    {
      id: 'bm1',
      type: 'barrierMitigative',
      position: { x: 0, y: 0 },
      data: { label: 'Sistemas de detección y parada' },
    },
    {
      id: 'bm2',
      type: 'barrierMitigative',
      position: { x: 0, y: 0 },
      data: { label: 'Protección contra incendio' },
    },
    {
      id: 'c1',
      type: 'consequence',
      position: { x: 0, y: 0 },
      data: { label: 'Daño a personas' },
    },
    {
      id: 'c2',
      type: 'consequence',
      position: { x: 0, y: 0 },
      data: { label: 'Daño al activo / medio ambiente' },
    },
  ]

  const edges: Edge[] = [
    { id: 'h1-bp1', source: 'h1', target: 'bp1', animated: true },
    { id: 'bp1-bp2', source: 'bp1', target: 'bp2', animated: true },
    { id: 'bp2-e1', source: 'bp2', target: 'e1', animated: true },
    { id: 'e1-bm1', source: 'e1', target: 'bm1', animated: true },
    { id: 'bm1-bm2', source: 'bm1', target: 'bm2', animated: true },
    { id: 'bm2-c1', source: 'bm2', target: 'c1', animated: true },
    { id: 'bm2-c2', source: 'bm2', target: 'c2', animated: true },
  ]

  return { nodes, edges }
}

/** Añade un camino de riesgo adicional conectado al evento central (automatización de expansión). */
export function expandWithAdditionalPath(
  nodes: Node[],
  edges: Edge[],
  eventId: string,
): { nodes: Node[]; edges: Edge[] } {
  const hazards = nodes.filter((n) => n.type === 'hazard')
  const suffix = hazards.length + 1
  const hId = `h${suffix}`
  const bpId = `bp-${suffix}a`
  const bmId = `bm-${suffix}a`

  const newNodes: Node[] = [
    ...nodes,
    {
      id: hId,
      type: 'hazard',
      position: { x: 0, y: 0 },
      data: { label: `Nuevo peligro ${suffix}` },
    },
    {
      id: bpId,
      type: 'barrierPreventive',
      position: { x: 0, y: 0 },
      data: { label: 'Barrera preventiva (definir)' },
    },
    {
      id: bmId,
      type: 'barrierMitigative',
      position: { x: 0, y: 0 },
      data: { label: 'Barrera mitigadora (definir)' },
    },
  ]

  const firstConsequence = nodes.find((n) => n.type === 'consequence')

  const newEdges: Edge[] = [
    ...edges,
    { id: `${hId}-${bpId}`, source: hId, target: bpId, animated: true },
    { id: `${bpId}-${eventId}`, source: bpId, target: eventId, animated: true },
    { id: `${eventId}-${bmId}`, source: eventId, target: bmId, animated: true },
  ]

  if (firstConsequence) {
    newEdges.push({
      id: `${bmId}-${firstConsequence.id}`,
      source: bmId,
      target: firstConsequence.id,
      animated: true,
    })
  }

  return { nodes: newNodes, edges: newEdges }
}
