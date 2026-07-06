import type { ISODate, Mes } from '@/types/domain';

// Fecha real (del navegador). Antes estaba fija en 19/05/2026 (era para el
// diseño). Los seeds de mayo 2026 quedan como historial navegable.
export const TODAY: ISODate = isoOf(new Date());
export const MES_ACTUAL: Mes = TODAY.slice(0, 7);

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function parseISO(iso: ISODate): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function isoOf(date: Date): ISODate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

/** Días desde "hoy" hasta `iso` (positivo = futuro, negativo = vencido). */
export function daysUntil(iso: ISODate, from: ISODate = TODAY): number {
  const diff = parseISO(iso).getTime() - parseISO(from).getTime();
  return Math.round(diff / 86_400_000);
}

/** "Hoy" / "Ayer" / "12 may" relativo a la fecha simulada. */
export function niceDate(iso: ISODate): string {
  if (iso === TODAY) return 'Hoy';
  if (iso === isoOf(new Date(parseISO(TODAY).getTime() - 86_400_000))) return 'Ayer';
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES_CORTOS[m - 1]}`;
}

/** '2026-05' → 'Mayo 2026'. */
export function mesLabel(mes: Mes): string {
  const [y, m] = mes.split('-').map(Number);
  return `${MESES_LARGOS[m - 1]} ${y}`;
}

/** '2026-05' → 'May' (etiqueta corta para ejes/chips). */
export function mesLabelCorto(mes: Mes): string {
  const m = Number(mes.split('-')[1]);
  const c = MESES_CORTOS[m - 1] ?? '';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

/** Suma (o resta) meses a un 'YYYY-MM'. addMonths('2026-07', 1) → '2026-08'. */
export function addMonths(mes: Mes, delta: number): Mes {
  const [y, m] = mes.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** '2026-05-04' → '4 MAY' (para chips de vencimiento). */
export function fechaCorta(iso: ISODate): string {
  const meses = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const [, m, d] = iso.split('-').map(Number);
  return `${d} ${meses[m - 1]}`;
}
