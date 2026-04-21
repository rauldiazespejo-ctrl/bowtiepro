import { MarkerType, type Edge, type Node } from '@xyflow/react'

const arrow = {
  type: MarkerType.ArrowClosed,
  color: '#64748b',
  width: 14,
  height: 14,
} as const

export type TemplateDefinition = {
  id: string
  name: string
  description: string
  create: () => { nodes: Node[]; edges: Edge[] }
}

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
    { id: 'h1-bp1', source: 'h1', target: 'bp1', animated: false, markerEnd: { ...arrow } },
    { id: 'bp1-bp2', source: 'bp1', target: 'bp2', animated: false, markerEnd: { ...arrow } },
    { id: 'bp2-e1', source: 'bp2', target: 'e1', animated: false, markerEnd: { ...arrow } },
    { id: 'e1-bm1', source: 'e1', target: 'bm1', animated: false, markerEnd: { ...arrow } },
    { id: 'bm1-bm2', source: 'bm1', target: 'bm2', animated: false, markerEnd: { ...arrow } },
    { id: 'bm2-c1', source: 'bm2', target: 'c1', animated: false, markerEnd: { ...arrow } },
    { id: 'bm2-c2', source: 'bm2', target: 'c2', animated: false, markerEnd: { ...arrow } },
  ]

  return { nodes, edges }
}

function createChemicalSpillTemplate(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    {
      id: 'h1',
      type: 'hazard',
      position: { x: 0, y: 0 },
      data: { label: 'Almacenamiento de sustancia química peligrosa' },
    },
    {
      id: 'bp1',
      type: 'barrierPreventive',
      position: { x: 0, y: 0 },
      data: { label: 'Tanque de doble contención' },
    },
    {
      id: 'bp2',
      type: 'barrierPreventive',
      position: { x: 0, y: 0 },
      data: { label: 'Inspección periódica de tuberías' },
    },
    {
      id: 'e1',
      type: 'topEvent',
      position: { x: 0, y: 0 },
      data: { label: 'Derrame de sustancia peligrosa' },
    },
    {
      id: 'bm1',
      type: 'barrierMitigative',
      position: { x: 0, y: 0 },
      data: { label: 'Dique de contención secundaria' },
    },
    {
      id: 'bm2',
      type: 'barrierMitigative',
      position: { x: 0, y: 0 },
      data: { label: 'Plan de respuesta a emergencias' },
    },
    {
      id: 'c1',
      type: 'consequence',
      position: { x: 0, y: 0 },
      data: { label: 'Contaminación del suelo / agua' },
    },
    {
      id: 'c2',
      type: 'consequence',
      position: { x: 0, y: 0 },
      data: { label: 'Intoxicación de personas' },
    },
  ]

  const edges: Edge[] = [
    { id: 'h1-bp1', source: 'h1', target: 'bp1', animated: false, markerEnd: { ...arrow } },
    { id: 'bp1-bp2', source: 'bp1', target: 'bp2', animated: false, markerEnd: { ...arrow } },
    { id: 'bp2-e1', source: 'bp2', target: 'e1', animated: false, markerEnd: { ...arrow } },
    { id: 'e1-bm1', source: 'e1', target: 'bm1', animated: false, markerEnd: { ...arrow } },
    { id: 'bm1-bm2', source: 'bm1', target: 'bm2', animated: false, markerEnd: { ...arrow } },
    { id: 'bm2-c1', source: 'bm2', target: 'c1', animated: false, markerEnd: { ...arrow } },
    { id: 'bm2-c2', source: 'bm2', target: 'c2', animated: false, markerEnd: { ...arrow } },
  ]

  return { nodes, edges }
}

function createEquipmentFailureTemplate(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    {
      id: 'h1',
      type: 'hazard',
      position: { x: 0, y: 0 },
      data: { label: 'Vibración excesiva en compresor' },
    },
    {
      id: 'bp1',
      type: 'barrierPreventive',
      position: { x: 0, y: 0 },
      data: { label: 'Mantenimiento predictivo' },
    },
    {
      id: 'bp2',
      type: 'barrierPreventive',
      position: { x: 0, y: 0 },
      data: { label: 'Monitoreo de condición en línea' },
    },
    {
      id: 'e1',
      type: 'topEvent',
      position: { x: 0, y: 0 },
      data: { label: 'Fallo catastrófico del compresor' },
    },
    {
      id: 'bm1',
      type: 'barrierMitigative',
      position: { x: 0, y: 0 },
      data: { label: 'Sistema de paro de emergencia (ESD)' },
    },
    {
      id: 'bm2',
      type: 'barrierMitigative',
      position: { x: 0, y: 0 },
      data: { label: 'Aislamiento automático de líneas' },
    },
    {
      id: 'c1',
      type: 'consequence',
      position: { x: 0, y: 0 },
      data: { label: 'Pérdida de producción' },
    },
    {
      id: 'c2',
      type: 'consequence',
      position: { x: 0, y: 0 },
      data: { label: 'Daño a equipos adyacentes' },
    },
  ]

  const edges: Edge[] = [
    { id: 'h1-bp1', source: 'h1', target: 'bp1', animated: false, markerEnd: { ...arrow } },
    { id: 'bp1-bp2', source: 'bp1', target: 'bp2', animated: false, markerEnd: { ...arrow } },
    { id: 'bp2-e1', source: 'bp2', target: 'e1', animated: false, markerEnd: { ...arrow } },
    { id: 'e1-bm1', source: 'e1', target: 'bm1', animated: false, markerEnd: { ...arrow } },
    { id: 'bm1-bm2', source: 'bm1', target: 'bm2', animated: false, markerEnd: { ...arrow } },
    { id: 'bm2-c1', source: 'bm2', target: 'c1', animated: false, markerEnd: { ...arrow } },
    { id: 'bm2-c2', source: 'bm2', target: 'c2', animated: false, markerEnd: { ...arrow } },
  ]

  return { nodes, edges }
}

function createTrafficAccidentTemplate(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    {
      id: 'h1',
      type: 'hazard',
      position: { x: 0, y: 0 },
      data: { label: 'Conducción de vehículo pesado en ruta' },
    },
    {
      id: 'bp1',
      type: 'barrierPreventive',
      position: { x: 0, y: 0 },
      data: { label: 'Capacitación y habilitación de conductores' },
    },
    {
      id: 'bp2',
      type: 'barrierPreventive',
      position: { x: 0, y: 0 },
      data: { label: 'Inspección pre-operacional del vehículo' },
    },
    {
      id: 'e1',
      type: 'topEvent',
      position: { x: 0, y: 0 },
      data: { label: 'Accidente de tránsito / volcamiento' },
    },
    {
      id: 'bm1',
      type: 'barrierMitigative',
      position: { x: 0, y: 0 },
      data: { label: 'Equipos de protección personal (EPP)' },
    },
    {
      id: 'bm2',
      type: 'barrierMitigative',
      position: { x: 0, y: 0 },
      data: { label: 'Plan de atención de emergencias viales' },
    },
    {
      id: 'c1',
      type: 'consequence',
      position: { x: 0, y: 0 },
      data: { label: 'Lesiones o fatalidad del conductor' },
    },
    {
      id: 'c2',
      type: 'consequence',
      position: { x: 0, y: 0 },
      data: { label: 'Daño a terceros y propiedad' },
    },
  ]

  const edges: Edge[] = [
    { id: 'h1-bp1', source: 'h1', target: 'bp1', animated: false, markerEnd: { ...arrow } },
    { id: 'bp1-bp2', source: 'bp1', target: 'bp2', animated: false, markerEnd: { ...arrow } },
    { id: 'bp2-e1', source: 'bp2', target: 'e1', animated: false, markerEnd: { ...arrow } },
    { id: 'e1-bm1', source: 'e1', target: 'bm1', animated: false, markerEnd: { ...arrow } },
    { id: 'bm1-bm2', source: 'bm1', target: 'bm2', animated: false, markerEnd: { ...arrow } },
    { id: 'bm2-c1', source: 'bm2', target: 'c1', animated: false, markerEnd: { ...arrow } },
    { id: 'bm2-c2', source: 'bm2', target: 'c2', animated: false, markerEnd: { ...arrow } },
  ]

  return { nodes, edges }
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'default',
    name: 'Incendio / Explosión',
    description: 'Fuga de gas inflamable con ignición',
    create: createDefaultTemplate,
  },
  {
    id: 'spill',
    name: 'Derrame Químico',
    description: 'Escape de sustancia peligrosa al ambiente',
    create: createChemicalSpillTemplate,
  },
  {
    id: 'equipment',
    name: 'Fallo de Equipo Mecánico',
    description: 'Fallo catastrófico de compresor en planta',
    create: createEquipmentFailureTemplate,
  },
  {
    id: 'traffic',
    name: 'Accidente de Tránsito',
    description: 'Volcamiento de vehículo pesado en ruta',
    create: createTrafficAccidentTemplate,
  },
]

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
    { id: `${hId}-${bpId}`, source: hId, target: bpId, animated: false, markerEnd: { ...arrow } },
    { id: `${bpId}-${eventId}`, source: bpId, target: eventId, animated: false, markerEnd: { ...arrow } },
    { id: `${eventId}-${bmId}`, source: eventId, target: bmId, animated: false, markerEnd: { ...arrow } },
  ]

  if (firstConsequence) {
    newEdges.push({
      id: `${bmId}-${firstConsequence.id}`,
      source: bmId,
      target: firstConsequence.id,
      animated: false,
      markerEnd: { ...arrow },
    })
  }

  return { nodes: newNodes, edges: newEdges }
}
