import type { Movimiento } from '@/types/domain';

// Empezamos limpio: sin movimientos de ejemplo. Los eventuales se cargan desde el "+";
// los gastos fijos generan su movimiento al marcarlos pagados desde su pantalla.
export const MOVS_SEED: Movimiento[] = [];
