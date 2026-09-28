import type {
  Caja,
  Categoria,
  Concepto,
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
 * v7 (2026-09): reorganización de Ingresos. Renombra "Ingresos laborales"→Trabajo,
 *   crea las categorías Mami Fitness e Inversiones, unifica los ingresos sueltos en
 *   "Varios" y reasigna los movimientos ya cargados (sin dejar asientos huérfanos).
 */
export const DATA_VERSION = 7;

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
  conceptos?: Concepto[];
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

  // v7: reorganización de INGRESOS. Acotada a las categorías de ingreso (ingl/otroi)
  // para no tocar gastos con subcategorías homónimas (Ivan, Mamá, Varios, Alquiler…).
  // Idempotente: puede correr más de una vez sin duplicar ni romper referencias.
  if (from < 7) {
    let cats = out.categories ?? [];
    let concs = out.conceptos ?? [];
    const movs = out.movimientos ?? [];

    // a) "Ingresos laborales" → "Trabajo"
    cats = cats.map((c) => (c.id === 'ingl' ? { ...c, nombre: 'Trabajo' } : c));

    // b) categorías nuevas (solo si faltan)
    const haveCat = new Set(cats.map((c) => c.id));
    const nuevasCats: Categoria[] = [];
    if (!haveCat.has('cat-mamifit'))
      nuevasCats.push({ id: 'cat-mamifit', nombre: 'Mami Fitness', tipo: 'ingreso', color: '#EC4899', icono: '💪', custom: true });
    if (!haveCat.has('cat-inversiones'))
      nuevasCats.push({ id: 'cat-inversiones', nombre: 'Inversiones', tipo: 'ingreso', color: '#14B8A6', icono: '📈', custom: true });
    cats = [...cats, ...nuevasCats];

    // c) subcategorías de Mami Fitness (solo si faltan)
    const haveConc = new Set(concs.map((k) => k.id));
    const mfConceptos: Concepto[] = [
      { id: 'co-mf-alumnas', nombre: 'Alumnas', cat: 'cat-mamifit' },
      { id: 'co-mf-ropa', nombre: 'Ropa', cat: 'cat-mamifit' },
      { id: 'co-mf-otros', nombre: 'Otros', cat: 'cat-mamifit' },
    ];
    concs = [...concs, ...mfConceptos.filter((k) => !haveConc.has(k.id))];

    // Buscar subcategoría por (categoría, nombre) para no confundir homónimos de gastos.
    const cid = (cat: string, nombre: string) =>
      concs.find((k) => k.cat === cat && k.nombre === nombre)?.id ?? null;
    const variosId = cid('otroi', 'Varios');
    const inversionId = cid('otroi', 'Inversión');
    const mamisId = cid('ingl', 'Mamis');
    const budinesId = cid('ingl', 'Budines');
    const ventasId = cid('otroi', 'Ventas');
    const alquilerId = cid('otroi', 'Alquiler');
    const mergeIds = new Set(
      [cid('otroi', 'Tia Pitty'), cid('otroi', 'Fer'), cid('otroi', 'Ivan'), cid('otroi', 'Mamá')].filter(
        (x): x is string => !!x,
      ),
    );

    // d) renombres + e) mover "Inversión" a la categoría Inversiones
    concs = concs.map((k) => {
      if (k.id === 'ingl-honorarios') return { ...k, nombre: 'Honorarios' };
      if (alquilerId && k.id === alquilerId) return { ...k, nombre: 'Alquileres' };
      if (inversionId && k.id === inversionId) return { ...k, cat: 'cat-inversiones' };
      return k;
    });

    // f) reasignar los movimientos ya cargados (por id, solo ingresos)
    const movs2 = movs.map((m) => {
      const c = m.concepto;
      if (inversionId && c === inversionId) return { ...m, cat: 'cat-inversiones' };
      if (mamisId && c === mamisId) return { ...m, cat: 'cat-mamifit', concepto: 'co-mf-otros' };
      if (budinesId && c === budinesId) return { ...m, cat: 'otroi', concepto: variosId };
      if (c && mergeIds.has(c)) return { ...m, cat: 'otroi', concepto: variosId };
      return m;
    });

    // g) borrar subcategorías obsoletas (Budines, Mamis, Tia Pitty, Fer, Ivan, Mamá, Ventas)
    const borrar = new Set([budinesId, mamisId, ventasId, ...mergeIds].filter((x): x is string => !!x));
    concs = concs.filter((k) => !borrar.has(k.id));

    out = { ...out, categories: cats, conceptos: concs, movimientos: movs2 };
  }

  return { ...out, dataVersion: DATA_VERSION };
}
