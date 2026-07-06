// Cálculos derivados puros (sin estado ni UI). Testeable de forma aislada.
import type {
  Caja,
  Evento,
  GastoFijo,
  Liquidation,
  Mes,
  Metas,
  Movimiento,
  Owner,
  VencimientoInstancia,
  VencimientoRow,
} from '@/types/domain';
import { MES_ACTUAL, addMonths, daysInMonth, mesLabelCorto } from './date';

/** Movimientos de un mes ('YYYY-MM'). */
export function movimientosDelMes(movs: Movimiento[], mes: Mes = MES_ACTUAL): Movimiento[] {
  return movs.filter((m) => m.fecha.startsWith(mes));
}

/** Saldo de cada caja = saldo_inicial + ingresos − gastos ± transferencias/ahorros. */
export function saldosDeCajas(cajas: Caja[], movimientos: Movimiento[]): Record<string, number> {
  const map: Record<string, number> = {};
  cajas.forEach((c) => {
    map[c.id] = c.saldo_inicial;
  });
  movimientos.forEach((m) => {
    if (m.tipo === 'ingreso') {
      if (m.caja) map[m.caja] = (map[m.caja] ?? 0) + m.monto;
    } else if (m.tipo === 'gasto' || m.tipo === 'retencion') {
      if (m.caja) map[m.caja] = (map[m.caja] ?? 0) - m.monto;
    } else if (m.tipo === 'ahorro' || m.tipo === 'transferencia') {
      if (m.caja_origen) map[m.caja_origen] = (map[m.caja_origen] ?? 0) - m.monto;
      if (m.caja) map[m.caja] = (map[m.caja] ?? 0) + m.monto;
    }
  });
  return map;
}

/** Balance del mes: ingresos, gastos, ahorro y balance (ingresos − gastos). */
export function balanceDelMes(movs: Movimiento[], mes: Mes = MES_ACTUAL) {
  const mm = movimientosDelMes(movs, mes);
  const ingresos = mm.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const gastos = mm.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0);
  const ahorro = mm.filter((m) => m.tipo === 'ahorro').reduce((s, m) => s + m.monto, 0);
  return { ingresos, gastos, ahorro, balance: ingresos - gastos };
}

/**
 * Acumulado del mes en USD: cada movimiento se convierte con SU cotización del
 * momento (usdRate) y se suma. Solo cuenta los que tienen usdRate guardado.
 */
export function usdDelMes(movs: Movimiento[], mes: Mes = MES_ACTUAL) {
  const mm = movimientosDelMes(movs, mes).filter((m) => m.usdRate && m.usdRate > 0);
  const sumTipo = (t: string) =>
    mm.filter((m) => m.tipo === t).reduce((s, m) => s + m.monto / (m.usdRate as number), 0);
  return { gastos: sumTipo('gasto'), ingresos: sumTipo('ingreso'), ahorro: sumTipo('ahorro') };
}

/**
 * Gastos "reales" de un mes combinando las dos fuentes de verdad:
 *  - gastos fijos PAGADOS (instancias) → monto de la instancia (o el sugerido),
 *    imputados al responsable de ese mes;
 *  - gastos EVENTUALES (movimientos tipo 'gasto' que NO son pago de un gasto fijo,
 *    para no duplicar los que sí generan movimiento al pagarse desde la app).
 * Devuelve total, desglose fijos/eventuales, por categoría y por responsable.
 */
export interface GastosMes {
  total: number;
  fijos: number;
  eventuales: number;
  countFijos: number;
  porCategoria: Record<string, number>;
  porOwner: { fer: number; pao: number; compartido: number };
}

export function gastosDelMes(
  instancias: VencimientoInstancia[],
  gastosFijos: GastoFijo[],
  movimientos: Movimiento[],
  mes: Mes = MES_ACTUAL,
): GastosMes {
  const gfById = new Map(gastosFijos.map((g) => [g.id, g]));
  const porCategoria: Record<string, number> = {};
  const porOwner = { fer: 0, pao: 0, compartido: 0 };
  let fijos = 0;
  let countFijos = 0;

  for (const inst of instancias) {
    if (!inst.pagado || inst.mes !== mes) continue;
    const gf = gfById.get(inst.gfId);
    if (!gf) continue;
    const monto = inst.monto ?? gf.montoSugerido ?? 0;
    fijos += monto;
    countFijos += 1;
    porCategoria[gf.cat] = (porCategoria[gf.cat] ?? 0) + monto;
    const owner = ownerForMonth(gf, inst.mes);
    porOwner[owner === 'fer' ? 'fer' : owner === 'pao' ? 'pao' : 'compartido'] += monto;
  }

  let eventuales = 0;
  for (const m of movimientos) {
    if (m.tipo !== 'gasto' || !m.fecha.startsWith(mes)) continue;
    if ((m.tags ?? []).includes('gasto-fijo')) continue;
    eventuales += m.monto;
    if (m.cat) porCategoria[m.cat] = (porCategoria[m.cat] ?? 0) + m.monto;
    porOwner[m.user === 'pao' ? 'pao' : 'fer'] += m.monto;
  }

  return { total: fijos + eventuales, fijos, eventuales, countFijos, porCategoria, porOwner };
}

/** Serie de los últimos `n` meses (incluye `hasta`) con el gasto total real de cada uno. */
export function serieGastosMeses(
  instancias: VencimientoInstancia[],
  gastosFijos: GastoFijo[],
  movimientos: Movimiento[],
  hasta: Mes = MES_ACTUAL,
  n = 6,
): { mes: Mes; label: string; gastos: number }[] {
  return Array.from({ length: n }, (_, i) => {
    const mes = addMonths(hasta, -(n - 1 - i));
    return { mes, label: mesLabelCorto(mes), gastos: gastosDelMes(instancias, gastosFijos, movimientos, mes).total };
  });
}

/**
 * Estimación de gastos fijos del próximo mes: por cada gasto fijo activo, el monto
 * de su instancia más reciente hasta `mes` (o el sugerido si no hay historial).
 */
export function fijoEstimadoProxMes(
  instancias: VencimientoInstancia[],
  gastosFijos: GastoFijo[],
  mes: Mes = MES_ACTUAL,
): number {
  return gastosFijos
    .filter((gf) => gf.activo !== false)
    .reduce((s, gf) => {
      const last = instancias
        .filter((i) => i.gfId === gf.id && i.mes <= mes && i.monto != null)
        .sort((a, b) => b.mes.localeCompare(a.mes))[0];
      return s + (last?.monto ?? gf.montoSugerido ?? 0);
    }, 0);
}

/** Primer mes con alguna instancia registrada (para acotar el navegador de meses). */
export function primerMesConDatos(instancias: VencimientoInstancia[]): Mes | null {
  let min: Mes | null = null;
  for (const i of instancias) if (min === null || i.mes < min) min = i.mes;
  return min;
}

/** Gasto acumulado por categoría en el mes. */
export function gastoPorCategoria(movs: Movimiento[], mes: Mes = MES_ACTUAL): Record<string, number> {
  const acc: Record<string, number> = {};
  movimientosDelMes(movs, mes)
    .filter((m) => m.tipo === 'gasto' && m.cat)
    .forEach((m) => {
      acc[m.cat as string] = (acc[m.cat as string] ?? 0) + m.monto;
    });
  return acc;
}

export interface AlertaMeta {
  cat: string;
  type: 'red' | 'amber';
  pct: number;
  used: number;
  lim: number;
}

/** Alertas de metas: rojo si se superó el límite, ámbar si se llegó al 80%. */
export function alertasDeMetas(
  movs: Movimiento[],
  metas: Metas,
  mes: Mes = MES_ACTUAL,
): AlertaMeta[] {
  const uso = gastoPorCategoria(movs, mes);
  const out: AlertaMeta[] = [];
  Object.entries(metas).forEach(([cat, lim]) => {
    const used = uso[cat] ?? 0;
    const pct = used / lim;
    if (pct >= 1) out.push({ cat, type: 'red', pct, used, lim });
    else if (pct >= 0.8) out.push({ cat, type: 'amber', pct, used, lim });
  });
  return out;
}

/** Responsable de un gasto fijo en un mes dado: el cambio más reciente con `desde <= mes`, o el owner base. */
export function ownerForMonth(gf: GastoFijo, mes: Mes): Owner {
  let owner = gf.owner ?? 'fer';
  let best = '';
  for (const e of gf.ownerHistory ?? []) {
    if (e.desde <= mes && e.desde >= best) {
      best = e.desde;
      owner = e.owner;
    }
  }
  return owner;
}

/**
 * Vencimientos del mes: una fila por template activo; la instancia (si existe)
 * pisa monto/fecha/pagado.
 */
export function computeVencimientos(
  gastosFijos: GastoFijo[],
  instancias: VencimientoInstancia[],
  mes: Mes,
): VencimientoRow[] {
  const [y, m] = mes.split('-').map(Number);
  const insts = instancias ?? [];
  return (gastosFijos ?? [])
    .filter((gf) => gf.activo !== false)
    .map((gf) => {
      const inst = insts.find((i) => i.gfId === gf.id && i.mes === mes);
      // Sin instancia propia este mes → arrastramos el monto de la instancia
      // previa más reciente (editable). Si no hay ninguna, usamos el sugerido.
      const prior = inst
        ? undefined
        : insts
            .filter((i) => i.gfId === gf.id && i.mes < mes && i.monto != null)
            .sort((a, b) => b.mes.localeCompare(a.mes))[0];
      const dia = inst?.fecha ? Number(inst.fecha.split('-')[2]) : gf.diaVenc;
      const diaClamp = Math.min(dia, daysInMonth(y, m));
      const fecha = inst?.fecha ?? `${mes}-${String(diaClamp).padStart(2, '0')}`;
      const monto = inst?.monto ?? prior?.monto ?? gf.montoSugerido ?? 0;
      return {
        id: `${gf.id}__${mes}`,
        gfId: gf.id,
        mes,
        nombre: gf.nombre,
        cat: gf.cat,
        monto,
        vence: fecha,
        pagado: !!inst?.pagado,
        pagadoFecha: inst?.pagadoFecha,
        pagadoMovId: inst?.pagadoMovId,
        diaVenc: gf.diaVenc,
        montoSugerido: gf.montoSugerido,
        owner: ownerForMonth(gf, mes),
        prefilled: !inst,
      };
    });
}

/**
 * Liquidación de un evento: reparte en partes iguales, calcula el balance de
 * cada participante (pagado − parte) y matchea greedy mayor deudor ↔ acreedor.
 */
export function computeLiquidation(evento: Evento): Liquidation {
  const total = evento.gastos.reduce((s, g) => s + g.monto, 0);
  const share = total / evento.participantes.length;
  const balances = evento.participantes.map((p) => {
    const paid = evento.gastos
      .filter((g) => g.pagado_por === p.id)
      .reduce((s, g) => s + g.monto, 0);
    return { ...p, paid, balance: Math.round(paid - share) };
  });

  const debtors = balances.filter((b) => b.balance < -1).sort((a, b) => a.balance - b.balance);
  const creditors = balances.filter((b) => b.balance > 1).sort((a, b) => b.balance - a.balance);
  const deudas: Liquidation['deudas'] = [];
  const d = debtors.map((x) => ({ ...x, owed: -x.balance }));
  const c = creditors.map((x) => ({ ...x, due: x.balance }));
  let i = 0;
  let j = 0;
  while (i < d.length && j < c.length) {
    const amt = Math.min(d[i].owed, c[j].due);
    if (amt > 1) deudas.push({ from: d[i], to: c[j], amount: Math.round(amt) });
    d[i].owed -= amt;
    c[j].due -= amt;
    if (d[i].owed <= 1) i++;
    if (c[j].due <= 1) j++;
  }
  return { total, share, balances, deudas };
}
