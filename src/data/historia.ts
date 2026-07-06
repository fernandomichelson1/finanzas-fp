import type { HistoriaMes, HeatMatrix } from '@/types/domain';

// Últimos 6 meses (para Stats / tendencia / score histórico).
export const HISTORIA: HistoriaMes[] = [
  { mes: '2025-12', label: 'Dic', ingresos: 1850000, gastos: 1320000, ahorro: 240000, score: 78 },
  { mes: '2026-01', label: 'Ene', ingresos: 1920000, gastos: 1480000, ahorro: 180000, score: 70 },
  { mes: '2026-02', label: 'Feb', ingresos: 1980000, gastos: 1290000, ahorro: 260000, score: 82 },
  { mes: '2026-03', label: 'Mar', ingresos: 2050000, gastos: 1410000, ahorro: 290000, score: 81 },
  { mes: '2026-04', label: 'Abr', ingresos: 2180000, gastos: 1520000, ahorro: 220000, score: 76 },
  { mes: '2026-05', label: 'May', ingresos: 2270000, gastos: 1289450, ahorro: 280000, score: 92 },
];

// Mapa de calor — 7 días × 6 semanas. Valor = gasto del día en miles ARS.
// Filas: semanas (más antigua a más reciente).
export const HEAT_SEED: HeatMatrix = [
  [12, 8, 20, 35, 45, 62, 50], // hace 5 semanas
  [18, 15, 22, 28, 38, 55, 48], // hace 4
  [10, 12, 25, 30, 42, 70, 55], // hace 3
  [22, 20, 30, 24, 65, 80, 40], // hace 2
  [15, 18, 28, 32, 58, 75, 45], // semana pasada
  [42, 28, 38, 14, 0, 0, 0], // semana actual (parcial)
];
