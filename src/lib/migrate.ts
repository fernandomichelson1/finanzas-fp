import type {
  Caja,
  Categoria,
  GastoFijo,
  Metas,
  Movimiento,
  Objetivo,
  UserId,
  Usuario,
  VencimientoInstancia,
} from '@/types/domain';
import { GASTOS_FIJOS_SEED, VENCIMIENTOS_INST_SEED } from '@/data/gastosFijos';

/**
 * Versión del "dato del hogar". Al subirla, `normalizeHousehold` corre las
 * migraciones pendientes sobre el estado guardado (local + nube) para propagar
 * cambios de datos a los clientes ya existentes.
 * v3 (2026-07): reimport de gastos fijos desde el Excel + empezar limpio.
 * v4 (2026-07): quitar objetivos precargados + poner saldos de cajas en 0.
 * v5 (2026-07): recarga limpia de gastos fijos = solo 2026 (ene→jul), montos
 *   exactos del Excel, todo pagado (se quita el arrastre viejo 2019–2025).
 * v6 (2026-07): gastos fijos con dólar blue del día por pago (usdRate) + limpiar
 *   metas precargadas.
 */
export const DATA_VERSION = 6;

/** IDs de los objetivos que venían precargados (ya no se usan). */
const SEED_OBJETIVO_IDS = new Set(['o1', 'o2', 'o3']);
/** Categorías con meta precargada (se limpian en v6). */
const SEED_META_KEYS = new Set(['ali', 'ent', 'tra', 'edu']);

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
  cajas?: Caja[];
  metas?: Metas;
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

  const from = data.dataVersion ?? 0;
  let out: T = { ...data, users, objetivos, gastosFijos, categories };

  // v3: reemplaza gastos fijos por los del Excel + empieza limpio.
  if (from < 3) {
    if (!categories.some((c) => c.id === 'prestamo')) {
      categories = [...categories, structuredClone(PRESTAMO_CAT)];
    }
    out = {
      ...out,
      gastosFijos: structuredClone(GASTOS_FIJOS_SEED),
      instancias: structuredClone(VENCIMIENTOS_INST_SEED),
      movimientos: [] as Movimiento[],
      objetivos: objetivos.map((o) => ({ ...o, actual: 0 })),
      categories,
    };
  }

  // v4: quita los objetivos precargados (deja los que crearon) y pone saldos de cajas en 0.
  if (from < 4) {
    out = {
      ...out,
      objetivos: (out.objetivos ?? []).filter((o) => !SEED_OBJETIVO_IDS.has(o.id)),
      cajas: (out.cajas ?? data.cajas ?? []).map((c) => ({ ...c, saldo_inicial: 0 })),
    };
  }

  // v5: recarga limpia de gastos fijos e instancias (solo 2026, todo pagado).
  if (from < 5) {
    out = {
      ...out,
      gastosFijos: structuredClone(GASTOS_FIJOS_SEED),
      instancias: structuredClone(VENCIMIENTOS_INST_SEED),
    };
  }

  // v6: recarga con dólar del día por pago (usdRate) + limpia metas precargadas.
  if (from < 6) {
    out = {
      ...out,
      gastosFijos: structuredClone(GASTOS_FIJOS_SEED),
      instancias: structuredClone(VENCIMIENTOS_INST_SEED),
      metas: Object.fromEntries(
        Object.entries(out.metas ?? {}).filter(([k]) => !SEED_META_KEYS.has(k)),
      ),
    };
  }

  return { ...out, dataVersion: DATA_VERSION };
}
