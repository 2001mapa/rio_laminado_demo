"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_MILESTONES = exports.NEXT_ALLOWED_ACTION = exports.PUBLIC_MESSAGES = exports.PUBLIC_STATES = exports.TRANSITION_ACTIONS = exports.INTERNAL_STATES = void 0;
exports.getNextState = getNextState;
exports.getMilestoneIndex = getMilestoneIndex;
exports.INTERNAL_STATES = [
    'Reservado',
    'Confirmado',
    'En preparación',
    'Pendiente de verificación',
    'Verificado',
    'Empacado',
    'Despachado',
    'Cancelado'
];
exports.TRANSITION_ACTIONS = [
    'CONFIRM',
    'START_PREPARATION',
    'SEND_TO_VERIFICATION',
    'COMPLETE_VERIFICATION',
    'PACK',
    'DISPATCH',
    'CANCEL'
];
exports.PUBLIC_STATES = {
    'Reservado': 'Pedido recibido',
    'Confirmado': 'Estamos preparando tu pedido',
    'En preparación': 'Estamos preparando tu pedido',
    'Pendiente de verificación': 'Estamos preparando tu pedido',
    'Verificado': 'Estamos preparando tu pedido',
    'Empacado': 'Pedido listo',
    'Despachado': 'Pedido enviado',
    'Cancelado': 'Pedido cancelado'
};
exports.PUBLIC_MESSAGES = {
    'Reservado': 'Recibimos tu pedido y reservamos las unidades.',
    'Confirmado': 'Tu pedido está siendo gestionado. Para cambios, comunícate con tu asesor RIO.',
    'En preparación': 'Tu pedido está siendo gestionado. Para cambios, comunícate con tu asesor RIO.',
    'Pendiente de verificación': 'Tu pedido está siendo gestionado. Para cambios, comunícate con tu asesor RIO.',
    'Verificado': 'Tu pedido está siendo gestionado. Para cambios, comunícate con tu asesor RIO.',
    'Empacado': 'Tu pedido ya está listo para ser despachado.',
    'Despachado': '¡Tu pedido ha sido enviado! Aquí abajo puedes ver tu número de rastreo, y en un momento nos comunicaremos contigo para enviarte la foto de la guía física.',
    'Cancelado': 'Este pedido ha sido cancelado.'
};
exports.NEXT_ALLOWED_ACTION = {
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
function getNextState(currentState, action) {
    var _a;
    if (action === 'CANCEL') {
        if (currentState === 'Despachado')
            throw new Error('No se puede cancelar un pedido despachado');
        return 'Cancelado';
    }
    const map = {
        'Reservado': { 'CONFIRM': 'Confirmado' },
        'Confirmado': { 'START_PREPARATION': 'En preparación' },
        'En preparación': { 'SEND_TO_VERIFICATION': 'Pendiente de verificación' },
        'Pendiente de verificación': { 'COMPLETE_VERIFICATION': 'Verificado' },
        'Verificado': { 'PACK': 'Empacado' },
        'Empacado': { 'DISPATCH': 'Despachado' },
        'Despachado': {},
        'Cancelado': {}
    };
    const nextState = (_a = map[currentState]) === null || _a === void 0 ? void 0 : _a[action];
    if (!nextState) {
        throw new Error(`Transición inválida: No se puede aplicar ${action} al estado ${currentState}`);
    }
    return nextState;
}
exports.PUBLIC_MILESTONES = [
    'Pedido recibido',
    'Estamos preparando tu pedido',
    'Pedido listo',
    'Pedido enviado'
];
function getMilestoneIndex(publicState) {
    if (publicState === 'Pedido cancelado')
        return -1;
    return exports.PUBLIC_MILESTONES.indexOf(publicState);
}
