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

/**
 * Estructura correcta de bowtie:
 * Peligro → Causas → [Controles Preventivos] → EVENTO TOP → [Controles Mitigadores] → Consecuencias
 */
export function createDefaultTemplate(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    { id: 'h1', type: 'hazard', position: { x: 0, y: 0 }, data: { label: 'Gas inflamable almacenado a presión' } },
    { id: 'ca1', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Corrosión de tuberías' } },
    { id: 'ca2', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Falla en sello mecánico' } },
    { id: 'ca3', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Error de operador' } },
    { id: 'cp1', type: 'barrierPreventive', position: { x: 0, y: 0 }, data: { label: 'Inspección y mantenimiento periódico' } },
    { id: 'cp2', type: 'barrierPreventive', position: { x: 0, y: 0 }, data: { label: 'Capacitación y procedimientos operativos' } },
    { id: 'e1', type: 'topEvent', position: { x: 0, y: 0 }, data: { label: 'Fuga de gas — pérdida de contención' } },
    { id: 'cm1', type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'Sistema de detección de gas (sensores)' } },
    { id: 'cm2', type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'Sistema de paro de emergencia (ESD)' } },
    { id: 'cm3', type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'Protección contra incendio (rociadores)' } },
    { id: 'co1', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Incendio o explosión' } },
    { id: 'co2', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Lesiones o fatalidad de personas' } },
    { id: 'co3', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Daño al activo y medio ambiente' } },
  ]

  const edges: Edge[] = [
    { id: 'h1-ca1', source: 'h1', target: 'ca1', markerEnd: { ...arrow } },
    { id: 'h1-ca2', source: 'h1', target: 'ca2', markerEnd: { ...arrow } },
    { id: 'h1-ca3', source: 'h1', target: 'ca3', markerEnd: { ...arrow } },
    { id: 'ca1-cp1', source: 'ca1', target: 'cp1', markerEnd: { ...arrow } },
    { id: 'ca2-cp1', source: 'ca2', target: 'cp1', markerEnd: { ...arrow } },
    { id: 'ca3-cp2', source: 'ca3', target: 'cp2', markerEnd: { ...arrow } },
    { id: 'cp1-e1', source: 'cp1', target: 'e1', markerEnd: { ...arrow } },
    { id: 'cp2-e1', source: 'cp2', target: 'e1', markerEnd: { ...arrow } },
    { id: 'e1-cm1', source: 'e1', target: 'cm1', markerEnd: { ...arrow } },
    { id: 'e1-cm2', source: 'e1', target: 'cm2', markerEnd: { ...arrow } },
    { id: 'e1-cm3', source: 'e1', target: 'cm3', markerEnd: { ...arrow } },
    { id: 'cm1-co1', source: 'cm1', target: 'co1', markerEnd: { ...arrow } },
    { id: 'cm2-co2', source: 'cm2', target: 'co2', markerEnd: { ...arrow } },
    { id: 'cm3-co3', source: 'cm3', target: 'co3', markerEnd: { ...arrow } },
  ]

  return { nodes, edges }
}

function createChemicalSpillTemplate(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    { id: 'h1', type: 'hazard', position: { x: 0, y: 0 }, data: { label: 'Sustancia química peligrosa almacenada' } },
    { id: 'ca1', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Ruptura de tanque o tubería' } },
    { id: 'ca2', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Sobrepresión del sistema' } },
    { id: 'ca3', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Error en carga/descarga' } },
    { id: 'cp1', type: 'barrierPreventive', position: { x: 0, y: 0 }, data: { label: 'Inspección de integridad (API 653)' } },
    { id: 'cp2', type: 'barrierPreventive', position: { x: 0, y: 0 }, data: { label: 'Válvula de alivio de presión' } },
    { id: 'e1', type: 'topEvent', position: { x: 0, y: 0 }, data: { label: 'Derrame de sustancia peligrosa' } },
    { id: 'cm1', type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'Dique de contención secundaria' } },
    { id: 'cm2', type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'Neutralización / absorción inmediata' } },
    { id: 'co1', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Contaminación de suelo y agua' } },
    { id: 'co2', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Intoxicación de personas' } },
    { id: 'co3', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Multas regulatorias y cierre' } },
  ]

  const edges: Edge[] = [
    { id: 'h1-ca1', source: 'h1', target: 'ca1', markerEnd: { ...arrow } },
    { id: 'h1-ca2', source: 'h1', target: 'ca2', markerEnd: { ...arrow } },
    { id: 'h1-ca3', source: 'h1', target: 'ca3', markerEnd: { ...arrow } },
    { id: 'ca1-cp1', source: 'ca1', target: 'cp1', markerEnd: { ...arrow } },
    { id: 'ca2-cp2', source: 'ca2', target: 'cp2', markerEnd: { ...arrow } },
    { id: 'ca3-cp1', source: 'ca3', target: 'cp1', markerEnd: { ...arrow } },
    { id: 'cp1-e1', source: 'cp1', target: 'e1', markerEnd: { ...arrow } },
    { id: 'cp2-e1', source: 'cp2', target: 'e1', markerEnd: { ...arrow } },
    { id: 'e1-cm1', source: 'e1', target: 'cm1', markerEnd: { ...arrow } },
    { id: 'e1-cm2', source: 'e1', target: 'cm2', markerEnd: { ...arrow } },
    { id: 'cm1-co1', source: 'cm1', target: 'co1', markerEnd: { ...arrow } },
    { id: 'cm2-co2', source: 'cm2', target: 'co2', markerEnd: { ...arrow } },
    { id: 'cm1-co3', source: 'cm1', target: 'co3', markerEnd: { ...arrow } },
  ]

  return { nodes, edges }
}

function createEquipmentFailureTemplate(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    { id: 'h1', type: 'hazard', position: { x: 0, y: 0 }, data: { label: 'Compresor centrífugo en operación' } },
    { id: 'ca1', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Desgaste de rodamientos' } },
    { id: 'ca2', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Sobrecarga operacional' } },
    { id: 'ca3', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Falta de lubricación' } },
    { id: 'cp1', type: 'barrierPreventive', position: { x: 0, y: 0 }, data: { label: 'Mantenimiento predictivo (vibración)' } },
    { id: 'cp2', type: 'barrierPreventive', position: { x: 0, y: 0 }, data: { label: 'Monitoreo de condición en línea' } },
    { id: 'e1', type: 'topEvent', position: { x: 0, y: 0 }, data: { label: 'Fallo catastrófico del compresor' } },
    { id: 'cm1', type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'Sistema de paro automático (ESD)' } },
    { id: 'cm2', type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'Aislamiento de líneas afectadas' } },
    { id: 'co1', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Pérdida de producción' } },
    { id: 'co2', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Daño a equipos adyacentes' } },
    { id: 'co3', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Lesiones por proyectiles / liberación' } },
  ]

  const edges: Edge[] = [
    { id: 'h1-ca1', source: 'h1', target: 'ca1', markerEnd: { ...arrow } },
    { id: 'h1-ca2', source: 'h1', target: 'ca2', markerEnd: { ...arrow } },
    { id: 'h1-ca3', source: 'h1', target: 'ca3', markerEnd: { ...arrow } },
    { id: 'ca1-cp1', source: 'ca1', target: 'cp1', markerEnd: { ...arrow } },
    { id: 'ca2-cp2', source: 'ca2', target: 'cp2', markerEnd: { ...arrow } },
    { id: 'ca3-cp1', source: 'ca3', target: 'cp1', markerEnd: { ...arrow } },
    { id: 'cp1-e1', source: 'cp1', target: 'e1', markerEnd: { ...arrow } },
    { id: 'cp2-e1', source: 'cp2', target: 'e1', markerEnd: { ...arrow } },
    { id: 'e1-cm1', source: 'e1', target: 'cm1', markerEnd: { ...arrow } },
    { id: 'e1-cm2', source: 'e1', target: 'cm2', markerEnd: { ...arrow } },
    { id: 'cm1-co1', source: 'cm1', target: 'co1', markerEnd: { ...arrow } },
    { id: 'cm2-co2', source: 'cm2', target: 'co2', markerEnd: { ...arrow } },
    { id: 'cm1-co3', source: 'cm1', target: 'co3', markerEnd: { ...arrow } },
  ]

  return { nodes, edges }
}

function createTrafficAccidentTemplate(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    { id: 'h1', type: 'hazard', position: { x: 0, y: 0 }, data: { label: 'Vehículo pesado en operación vial' } },
    { id: 'ca1', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Fatiga del conductor' } },
    { id: 'ca2', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Falla mecánica del vehículo' } },
    { id: 'ca3', type: 'cause', position: { x: 0, y: 0 }, data: { label: 'Condiciones adversas de ruta' } },
    { id: 'cp1', type: 'barrierPreventive', position: { x: 0, y: 0 }, data: { label: 'Gestión de fatiga y horas de manejo' } },
    { id: 'cp2', type: 'barrierPreventive', position: { x: 0, y: 0 }, data: { label: 'Inspección pre-operacional del vehículo' } },
    { id: 'e1', type: 'topEvent', position: { x: 0, y: 0 }, data: { label: 'Accidente de tránsito / volcamiento' } },
    { id: 'cm1', type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'EPP y cabina de sobrevivencia' } },
    { id: 'cm2', type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'Plan de atención de emergencias viales' } },
    { id: 'co1', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Lesiones o fatalidad del conductor' } },
    { id: 'co2', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Daño a terceros y propiedad' } },
    { id: 'co3', type: 'consequence', position: { x: 0, y: 0 }, data: { label: 'Daño reputacional y legal' } },
  ]

  const edges: Edge[] = [
    { id: 'h1-ca1', source: 'h1', target: 'ca1', markerEnd: { ...arrow } },
    { id: 'h1-ca2', source: 'h1', target: 'ca2', markerEnd: { ...arrow } },
    { id: 'h1-ca3', source: 'h1', target: 'ca3', markerEnd: { ...arrow } },
    { id: 'ca1-cp1', source: 'ca1', target: 'cp1', markerEnd: { ...arrow } },
    { id: 'ca2-cp2', source: 'ca2', target: 'cp2', markerEnd: { ...arrow } },
    { id: 'ca3-cp2', source: 'ca3', target: 'cp2', markerEnd: { ...arrow } },
    { id: 'cp1-e1', source: 'cp1', target: 'e1', markerEnd: { ...arrow } },
    { id: 'cp2-e1', source: 'cp2', target: 'e1', markerEnd: { ...arrow } },
    { id: 'e1-cm1', source: 'e1', target: 'cm1', markerEnd: { ...arrow } },
    { id: 'e1-cm2', source: 'e1', target: 'cm2', markerEnd: { ...arrow } },
    { id: 'cm1-co1', source: 'cm1', target: 'co1', markerEnd: { ...arrow } },
    { id: 'cm2-co2', source: 'cm2', target: 'co2', markerEnd: { ...arrow } },
    { id: 'cm1-co3', source: 'cm1', target: 'co3', markerEnd: { ...arrow } },
  ]

  return { nodes, edges }
}

export const TEMPLATES: TemplateDefinition[] = [
  {
    id: 'default',
    name: 'Incendio / Explosión',
    description: 'Gas inflamable — pérdida de contención e ignición',
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

export function expandWithAdditionalPath(
  nodes: Node[],
  edges: Edge[],
  eventId: string,
): { nodes: Node[]; edges: Edge[] } {
  const causes = nodes.filter((n) => n.type === 'cause')
  const suffix = causes.length + 1
  const caId = `ca-${suffix}`
  const cpId = `cp-${suffix}`
  const cmId = `cm-${suffix}`

  const firstConsequence = nodes.find((n) => n.type === 'consequence')

  const newNodes: Node[] = [
    ...nodes,
    { id: caId, type: 'cause', position: { x: 0, y: 0 }, data: { label: `Nueva causa ${suffix}` } },
    { id: cpId, type: 'barrierPreventive', position: { x: 0, y: 0 }, data: { label: 'Control preventivo (definir)' } },
    { id: cmId, type: 'barrierMitigative', position: { x: 0, y: 0 }, data: { label: 'Control mitigador (definir)' } },
  ]

  const newEdges: Edge[] = [
    ...edges,
    { id: `h1-${caId}`, source: 'h1', target: caId, markerEnd: { ...arrow } },
    { id: `${caId}-${cpId}`, source: caId, target: cpId, markerEnd: { ...arrow } },
    { id: `${cpId}-${eventId}`, source: cpId, target: eventId, markerEnd: { ...arrow } },
    { id: `${eventId}-${cmId}`, source: eventId, target: cmId, markerEnd: { ...arrow } },
  ]

  if (firstConsequence) {
    newEdges.push({ id: `${cmId}-${firstConsequence.id}`, source: cmId, target: firstConsequence.id, markerEnd: { ...arrow } })
  }

  return { nodes: newNodes, edges: newEdges }
}
