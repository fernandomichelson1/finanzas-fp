import type { MovimientoTipo } from '@/types/domain';

// ── Moneda (ARS, locale es-AR) ──

/** 1850000 → '$1.850.000' (con signo si es negativo). */
export function fmtARS(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(Math.round(n));
  return sign + '$' + abs.toLocaleString('es-AR');
}

/** Compacto: 1850000 → '$1.8M', 42000 → '$42K'. */
export function fmtARSCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return '$' + (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (abs >= 1_000) return '$' + (n / 1_000).toFixed(0) + 'K';
  return fmtARS(n);
}

/**
 * Solo el número con separadores, SIEMPRE con 2 decimales (coma), sin '$'.
 * 1850000 → '1.850.000,00'; 2209144.17 → '2.209.144,17'. No redondea a entero.
 */
export function fmtMonto(n: number): string {
  return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Entrada de montos en formato argentino (miles con '.', decimal con ',') ──

/**
 * Formatea EN VIVO lo que se tipea a formato AR: puntos de miles automáticos,
 * coma para el decimal. '1000' → '1.000'; '1000,5' → '1.000,5'; ',5' → '0,5'.
 */
export function formatMiles(raw: string): string {
  const s = String(raw).replace(/[^\d,]/g, '');
  const i = s.indexOf(',');
  const intp = (i === -1 ? s : s.slice(0, i)).replace(/^0+(?=\d)/, '');
  const dec = i === -1 ? null : s.slice(i + 1).replace(/[^\d]/g, '').slice(0, 2);
  const intf = intp.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return dec === null ? intf : `${intf || '0'},${dec}`;
}

/** Texto AR de un input ('1.234,56') → número (1234.56). */
export function parseMoney(text: string): number {
  const n = Number(String(text).replace(/\./g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

/** Número → texto de input AR. 914100 → '914.100'; 179623.31 → '179.623,31'; 0 → ''. */
export function moneyToInput(n: number | null | undefined): string {
  if (!n) return '';
  return formatMiles(String(n).replace('.', ','));
}

/** Convierte ARS a USD con la cotización dada. 1.400.000 @ 1400 → 'US$ 1.000'. */
export function fmtUSD(ars: number, rate: number): string {
  if (!rate || rate <= 0) return 'US$ —';
  const sign = ars < 0 ? '-' : '';
  return sign + 'US$ ' + Math.abs(Math.round(ars / rate)).toLocaleString('es-AR');
}

// ── Semántica por tipo de movimiento ──

export function tipoColor(tipo: MovimientoTipo): string {
  return {
    ingreso: 'var(--income)',
    gasto: 'var(--expense)',
    ahorro: 'var(--savings)',
    retencion: '#94A3B8',
    transferencia: '#60A5FA',
  }[tipo];
}

export function tipoSign(tipo: MovimientoTipo): string {
  return {
    ingreso: '+',
    gasto: '−',
    ahorro: '↪',
    retencion: '−',
    transferencia: '⇄',
  }[tipo];
}

export const TIPO_LABEL: Record<MovimientoTipo, string> = {
  ingreso: 'Ingreso',
  gasto: 'Gasto',
  ahorro: 'Ahorro',
  retencion: 'Retención',
  transferencia: 'Transferencia',
};
