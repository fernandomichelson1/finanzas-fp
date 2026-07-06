// Punto único de acceso a los seeds + ensamblado del estado inicial.
import type {
  Caja,
  Categoria,
  Concepto,
  Evento,
  GastoFijo,
  Metas,
  Movimiento,
  Objetivo,
  Usuario,
  UserId,
  VencimientoInstancia,
} from '@/types/domain';

import { DATA_VERSION } from '@/lib/migrate';
import { USERS_SEED } from './users';
import { CATEGORIES_SEED } from './categories';
import { CONCEPTOS_SEED } from './conceptos';
import { MOVS_SEED } from './movimientos';
import { OBJETIVOS_SEED } from './objetivos';
import { METAS_SEED } from './metas';
import { GASTOS_FIJOS_SEED, VENCIMIENTOS_INST_SEED } from './gastosFijos';
import { CAJAS_SEED, CAJA_TIPOS } from './cajas';
import { EVENTOS_SEED } from './eventos';

export {
  USERS_SEED,
  CATEGORIES_SEED,
  CONCEPTOS_SEED,
  MOVS_SEED,
  OBJETIVOS_SEED,
  METAS_SEED,
  GASTOS_FIJOS_SEED,
  VENCIMIENTOS_INST_SEED,
  CAJAS_SEED,
  CAJA_TIPOS,
  EVENTOS_SEED,
};
export { HISTORIA, HEAT_SEED } from './historia';

/** Colecciones mutables de la app (todo lo que el store administra). */
export interface FinanzasData {
  users: Record<UserId, Usuario>;
  categories: Categoria[];
  conceptos: Concepto[];
  movimientos: Movimiento[];
  objetivos: Objetivo[];
  metas: Metas;
  gastosFijos: GastoFijo[];
  instancias: VencimientoInstancia[];
  cajas: Caja[];
  eventos: Evento[];
  /** Versión del dato para migraciones (ver lib/migrate). */
  dataVersion: number;
}

/** Estado inicial (copias profundas para no mutar los seeds importados). */
export function buildInitialData(): FinanzasData {
  return {
    users: structuredClone(USERS_SEED),
    categories: structuredClone(CATEGORIES_SEED),
    conceptos: structuredClone(CONCEPTOS_SEED),
    movimientos: structuredClone(MOVS_SEED),
    objetivos: structuredClone(OBJETIVOS_SEED),
    metas: structuredClone(METAS_SEED),
    gastosFijos: structuredClone(GASTOS_FIJOS_SEED),
    instancias: structuredClone(VENCIMIENTOS_INST_SEED),
    cajas: structuredClone(CAJAS_SEED),
    eventos: structuredClone(EVENTOS_SEED),
    dataVersion: DATA_VERSION,
  };
}
