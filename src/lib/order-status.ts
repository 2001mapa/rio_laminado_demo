export const INTERNAL_STATES = [
  'Reservado',
  'Confirmado',
  'En preparación',
  'Pendiente de verificación',
  'Verificado',
  'Empacado',
  'Despachado',
  'Cancelado'
] as const;

export type InternalOrderState = typeof INTERNAL_STATES[number];

export const TRANSITION_ACTIONS = [
  'CONFIRM',
  'START_PREPARATION',
  'SEND_TO_VERIFICATION',
  'COMPLETE_VERIFICATION',
  'PACK',
  'DISPATCH',
  'CANCEL'
] as const;

export type OrderTransitionAction = typeof TRANSITION_ACTIONS[number];

export const PUBLIC_STATES: Record<InternalOrderState, string> = {
  'Reservado': 'Pedido recibido',
  'Confirmado': 'Estamos preparando tu pedido',
  'En preparación': 'Estamos preparando tu pedido',
  'Pendiente de verificación': 'Estamos preparando tu pedido',
  'Verificado': 'Estamos preparando tu pedido',
  'Empacado': 'Pedido listo',
  'Despachado': 'Pedido enviado',
  'Cancelado': 'Pedido cancelado'
};

export const PUBLIC_MESSAGES: Record<InternalOrderState, string> = {
  'Reservado': 'Recibimos tu pedido y reservamos las unidades.',
  'Confirmado': 'Tu pedido está siendo gestionado. Para cambios, comunícate con tu asesor RIO.',
  'En preparación': 'Tu pedido está siendo gestionado. Para cambios, comunícate con tu asesor RIO.',
  'Pendiente de verificación': 'Tu pedido está siendo gestionado. Para cambios, comunícate con tu asesor RIO.',
  'Verificado': 'Tu pedido está siendo gestionado. Para cambios, comunícate con tu asesor RIO.',
  'Empacado': 'Tu pedido ya está listo para ser despachado.',
  'Despachado': '¡Tu pedido ha sido enviado! Aquí abajo puedes ver tu número de rastreo, y en un momento nos comunicaremos contigo para enviarte la foto de la guía física.',
  'Cancelado': 'Este pedido ha sido cancelado.'
};

export const NEXT_ALLOWED_ACTION: Record<InternalOrderState, { action: OrderTransitionAction, label: string } | null> = {
  'Reservado': { action: 'CONFIRM', label: 'Confirmar pedido' },
  'Confirmado': { action: 'START_PREPARATION', label: 'Iniciar preparación' },
  'En preparación': { action: 'SEND_TO_VERIFICATION', label: 'Enviar a verificación' },
  'Pendiente de verificación': { action: 'COMPLETE_VERIFICATION', label: 'Completar verificación' },
  'Verificado': { action: 'PACK', label: 'Empacar pedido' },
  'Empacado': { action: 'DISPATCH', label: 'Marcar como despachado' },
  'Despachado': null,
  'Cancelado': null
};

// Maps (Current State + Action) -> Next State
export function getNextState(currentState: string, action: OrderTransitionAction): InternalOrderState {
  if (action === 'CANCEL') {
    if (currentState === 'Despachado') throw new Error('No se puede cancelar un pedido despachado');
    return 'Cancelado';
  }

  const map: Record<InternalOrderState, Partial<Record<OrderTransitionAction, InternalOrderState>>> = {
    'Reservado': { 'CONFIRM': 'Confirmado' },
    'Confirmado': { 'START_PREPARATION': 'En preparación' },
    'En preparación': { 'SEND_TO_VERIFICATION': 'Pendiente de verificación' },
    'Pendiente de verificación': { 'COMPLETE_VERIFICATION': 'Verificado' },
    'Verificado': { 'PACK': 'Empacado' },
    'Empacado': { 'DISPATCH': 'Despachado' },
    'Despachado': {},
    'Cancelado': {}
  };

  const nextState = map[currentState as InternalOrderState]?.[action];
  if (!nextState) {
    throw new Error(`Transición inválida: No se puede aplicar ${action} al estado ${currentState}`);
  }
  return nextState;
}

export const PUBLIC_MILESTONES = [
  'Pedido recibido',
  'Estamos preparando tu pedido',
  'Pedido listo',
  'Pedido enviado'
];

export function getMilestoneIndex(publicState: string): number {
  if (publicState === 'Pedido cancelado') return -1;
  return PUBLIC_MILESTONES.indexOf(publicState);
}
