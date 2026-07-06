import type {
  Categoria,
  GastoFijo,
  Movimiento,
  Objetivo,
  UserId,
  Usuario,
  VencimientoInstancia,
} from '@/types/domain';
import { GASTOS_FIJOS_SEED, VENCIMIENTOS_INST_SEED } from '@/data/gastosFijos';

/**
 * Versión del "dato del hogar". Al subirla, `normalizeHousehold` corre una
 * migración ÚNICA sobre el estado guardado (local + nube) para propagar cambios
 * de datos a los clientes ya existentes.
 * v3 (2026-07): reimport de gastos fijos desde el Excel + empezar limpio.
 */
export const DATA_VERSION = 3;

const PRESTAMO_CAT: Categoria = {
  id: 'prestamo',
  nombre: 'Préstamos',
  tipo: 'gasto',
  color: '#0D9488',
  icono: '🏦',
  uso: 'fijo',
};

// Uso por defecto de las categorías conocidas (para datos viejos sin `uso`).
const CAT_FIJO = new Set(['tc', 'edu', 'viv', 'serv', 'seg', 'cel', 'imp', 'hon', 'prestamo']);
const CAT_EVENTUAL = new Set(['ali', 'tra', 'ent']);

interface Normalizable {
  users?: Record<UserId, Usuario>;
  objetivos?: Objetivo[];
  gastosFijos?: GastoFijo[];
  categories?: Categoria[];
  movimientos?: Movimiento[];
  instancias?: VencimientoInstancia[];
  dataVersion?: number;
}

/**
 * Normaliza el estado del hogar al cargarlo (local o nube): fuerza fer/pao admin,
 * completa owner de objetivos/gastos fijos y uso de categorías, y aplica la
 * migración de datos versionada (reimport del Excel en v3).
 */
export function normalizeHousehold<T extends Normalizable>(data: T): T {
  const users: Record<UserId, Usuario> = { ...(data.users ?? {}) };
  (['fer', 'pao'] as UserId[]).forEach((id) => {
    if (users[id]) users[id] = { ...users[id], rol: 'admin' };
  });
  const objetivos = (data.objetivos ?? []).map((o) => ({ ...o, owner: o.owner ?? 'compartido' }));
  const gastosFijos = (data.gastosFijos ?? []).map((gf) => ({
    ...gf,
    owner: gf.owner ?? (gf.id === 'gf-tc-banco-pao' ? 'pao' : 'fer'),
  }));
  let categories = (data.categories ?? []).map((c) => {
    if (c.tipo !== 'gasto' || c.uso) return c;
    const uso = CAT_FIJO.has(c.id) ? 'fijo' : CAT_EVENTUAL.has(c.id) ? 'eventual' : 'ambos';
    return { ...c, uso };
  });

  const base = { ...data, users, objetivos, gastosFijos, categories, dataVersion: DATA_VERSION };

  // Migración única (v<3): reemplaza gastos fijos por los del Excel + empieza limpio.
  if ((data.dataVersion ?? 0) < DATA_VERSION) {
    if (!categories.some((c) => c.id === 'prestamo')) {
      categories = [...categories, structuredClone(PRESTAMO_CAT)];
    }
    return {
      ...base,
      gastosFijos: structuredClone(GASTOS_FIJOS_SEED),
      instancias: structuredClone(VENCIMIENTOS_INST_SEED),
      movimientos: [] as Movimiento[],
      objetivos: objetivos.map((o) => ({ ...o, actual: 0 })),
      categories,
    };
  }
  return base;
}
