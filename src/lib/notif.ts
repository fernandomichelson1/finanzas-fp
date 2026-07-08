import type { Movimiento, UserId, Usuario } from '@/types/domain';
import { tipoColor } from './format';

export interface NotifView {
  titulo: string;
  sub: string;
  color: string;
}

/**
 * Convierte un movimiento en el texto de una notificación de la campanita.
 * Ej: "Fer · Pagó Expensas" / "gasto fijo".
 */
export function movToNotif(
  m: Movimiento,
  users: Record<UserId, Usuario>,
  catNombre: (id: string | null) => string | undefined,
): NotifView {
  const nombre = users[m.user]?.nombre ?? 'Alguien';
  const esFijo = (m.tags ?? []).includes('gasto-fijo');
  const cat = catNombre(m.cat);
  let accion: string;
  let detalle: string;
  switch (m.tipo) {
    case 'ingreso':
      accion = 'Ingreso';
      detalle = m.desc || cat || 'ingreso';
      break;
    case 'ahorro':
      accion = 'Ahorro';
      detalle = m.desc || 'aporte a objetivo';
      break;
    case 'transferencia':
      accion = 'Transferencia';
      detalle = 'entre cuentas';
      break;
    case 'retencion':
      accion = 'Retención';
      detalle = m.desc || cat || 'impuesto';
      break;
    default: // gasto
      if (esFijo) {
        accion = `Pagó ${m.desc}`;
        detalle = 'gasto fijo';
      } else {
        accion = 'Compra';
        detalle = m.desc || cat || 'gasto';
      }
  }
  return { titulo: `${nombre} · ${accion}`, sub: detalle, color: tipoColor(m.tipo) };
}
