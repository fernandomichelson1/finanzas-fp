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

/** Solo el número con separadores, sin '$'. 1850000 → '1.850.000'. */
export function fmtMonto(n: number): string {
  return Math.round(n).toLocaleString('es-AR');
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
