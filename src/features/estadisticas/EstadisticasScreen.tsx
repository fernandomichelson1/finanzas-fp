import { useMemo, useState } from 'react';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { ownerForMonth, serieGastosMeses } from '@/lib/selectors';
import { MES_ACTUAL, TODAY, mesLabel, fechaCorta } from '@/lib/date';
import { fmtARSCompact, fmtMonto } from '@/lib/format';
import { alpha } from '@/lib/color';
import { Avatar } from '@/components/ui/Avatar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Donut, MonthlyBars, type DonutDatum } from '@/components/charts';

type Periodo = 'mes' | 'anio' | 'todo' | 'custom';

const FER = '#2563EB';
const PAO = '#E11D48';

export function EstadisticasScreen({ embedded = false }: { embedded?: boolean }) {
  const gastosFijos = useFinanzasStore((s) => s.gastosFijos);
  const instancias = useFinanzasStore((s) => s.instancias);
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const categories = useFinanzasStore((s) => s.categories);
  const cajas = useFinanzasStore((s) => s.cajas);
  const users = useFinanzasStore((s) => s.users);
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [desde, setDesde] = useState(`${MES_ACTUAL}-01`);
  const [hasta, setHasta] = useState(TODAY);
  const [selCat, setSelCat] = useState<string | null>(null);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);
  const year = MES_ACTUAL.slice(0, 4);

  const stats = useMemo(() => {
    const inMes = (mes: string) =>
      periodo === 'todo' ? true : periodo === 'anio' ? mes.startsWith(year) : mes === MES_ACTUAL;
    // Un gasto fijo pagado entra si su FECHA DE PAGO cae en el rango (custom) o su
    // mes cae en el preset. Un movimiento entra por su fecha (custom) o su mes.
    const instEnPeriodo = (inst: { mes: string; pagadoFecha?: string }) =>
      periodo === 'custom'
        ? !!inst.pagadoFecha && inst.pagadoFecha >= desde && inst.pagadoFecha <= hasta
        : inMes(inst.mes);
    const movEnPeriodo = (fecha: string) =>
      periodo === 'custom' ? fecha >= desde && fecha <= hasta : inMes(fecha.slice(0, 7));
    const gfById = new Map(gastosFijos.map((g) => [g.id, g]));
    const cajaOwner = new Map(cajas.map((c) => [c.id, c.owner]));
    // Gastos fijos pagados, según el RESPONSABLE del gasto (fer/pao/compartido).
    const gastoFijo = { fer: 0, pao: 0, compartido: 0 };
    // Gastos varios (los eventuales, del día a día), según quién los cargó.
    const gastoVario = { fer: 0, pao: 0 };
    // Gastos fijos según de QUÉ CUENTA salió la plata (el dueño de la caja), sin
    // importar de quién es el gasto. "Lo que puso realmente cada uno".
    const pagoFijosReal = { fer: 0, pao: 0 };
    const ingresa = { fer: 0, pao: 0 };
    const ahorra = { fer: 0, pao: 0 };
    const porCat: Record<string, number> = {};
    const porCatOwner: Record<string, { fer: number; pao: number }> = {};
    const addCat = (cat: string | null, monto: number, quien: 'fer' | 'pao' | 'compartido') => {
      if (!cat) return;
      porCat[cat] = (porCat[cat] ?? 0) + monto;
      porCatOwner[cat] = porCatOwner[cat] ?? { fer: 0, pao: 0 };
      if (quien === 'compartido') {
        porCatOwner[cat].fer += monto / 2;
        porCatOwner[cat].pao += monto / 2;
      } else {
        porCatOwner[cat][quien] += monto;
      }
    };

    // Gastos fijos pagados → según el responsable de ese mes.
    for (const inst of instancias) {
      if (!inst.pagado || !instEnPeriodo(inst)) continue;
      const gf = gfById.get(inst.gfId);
      if (!gf) continue;
      const monto = inst.monto ?? gf.montoSugerido ?? 0;
      const owner = ownerForMonth(gf, inst.mes);
      const quien = owner === 'fer' ? 'fer' : owner === 'pao' ? 'pao' : 'compartido';
      gastoFijo[quien] += monto;
      addCat(gf.cat, monto, quien);
    }
    // Movimientos: gastos eventuales (no los pagos de gasto fijo), ingresos y ahorros.
    for (const m of movimientos) {
      if (!movEnPeriodo(m.fecha)) continue;
      const u: 'fer' | 'pao' = m.user === 'pao' ? 'pao' : 'fer';
      const esFijo = (m.tags ?? []).includes('gasto-fijo');
      if (m.tipo === 'gasto' && esFijo) {
        // Quién puso la plata = dueño de la cuenta de la que salió el pago.
        const dueño = cajaOwner.get(m.caja ?? '') === 'pao' ? 'pao' : 'fer';
        pagoFijosReal[dueño] += m.monto;
      } else if (m.tipo === 'gasto') {
        gastoVario[u] += m.monto;
        addCat(m.cat, m.monto, u);
      } else if (m.tipo === 'ingreso') ingresa[u] += m.monto;
      else if (m.tipo === 'ahorro') ahorra[u] += m.monto;
    }
    return { gastoFijo, gastoVario, pagoFijosReal, ingresa, ahorra, porCat, porCatOwner };
  }, [gastosFijos, instancias, movimientos, cajas, periodo, desde, hasta, year]);

  const totalGastos = Object.values(stats.porCat).reduce((s, v) => s + v, 0);
  const donutData: DonutDatum[] = useMemo(
    () =>
      Object.entries(stats.porCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, value]) => ({ id, value, color: catMap[id]?.color ?? '#64748B', label: catMap[id]?.nombre ?? id })),
    [stats.porCat, catMap],
  );
  const sel = donutData.find((d) => d.id === selCat) ?? null;

  const fvpRows = useMemo(
    () =>
      Object.entries(stats.porCatOwner)
        .map(([cat, v]) => ({ cat, ...v, total: v.fer + v.pao }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    [stats.porCatOwner],
  );
  const fvpMax = Math.max(...fvpRows.map((r) => Math.max(r.fer, r.pao)), 1);

  const serie = useMemo(
    () => serieGastosMeses(instancias, gastosFijos, movimientos, MES_ACTUAL, 6),
    [instancias, gastosFijos, movimientos],
  );

  const periodoLabel =
    periodo === 'mes'
      ? mesLabel(MES_ACTUAL)
      : periodo === 'anio'
        ? year
        : periodo === 'todo'
          ? 'Todo el historial'
          : `${fechaCorta(desde)} – ${fechaCorta(hasta)}`;

  return (
    <div className={embedded ? 'px-[18px] lg:px-0' : 'px-[18px] pt-2 lg:px-0'}>
      {!embedded && (
        <div className="mb-3.5 flex items-center justify-between">
          <div>
            <h1 className="m-0 text-2xl font-bold tracking-[-0.6px] text-text lg:text-[26px]">Estadísticas</h1>
            <div className="mt-1 text-[13px] text-muted">Quién paga, ingresa y ahorra · {periodoLabel}</div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-white" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', boxShadow: '0 6px 16px rgba(37,99,235,0.4)' }}>📊</div>
        </div>
      )}

      {/* Período */}
      <div className="hide-scroll mb-3 flex gap-1.5 overflow-x-auto">
        {(['mes', 'anio', 'todo', 'custom'] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className="shrink-0 whitespace-nowrap rounded-[10px] border px-4 py-2.5 text-[13px] font-semibold transition-colors"
            style={{
              background: periodo === p ? 'var(--text)' : 'var(--surface)',
              color: periodo === p ? 'var(--bg)' : 'var(--text-muted)',
              borderColor: periodo === p ? 'var(--text)' : 'var(--border)',
            }}
          >
            {p === 'mes' ? 'Este mes' : p === 'anio' ? 'Este año' : p === 'todo' ? 'Todo' : 'Personalizado'}
          </button>
        ))}
      </div>

      {periodo === 'custom' && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-3">
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">Desde</span>
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={(e) => setDesde(e.target.value)}
              className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px] text-text outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">Hasta</span>
            <input
              type="date"
              value={hasta}
              min={desde}
              max={TODAY}
              onChange={(e) => setHasta(e.target.value)}
              className="rounded-lg border border-line bg-surface-2 px-3 py-2 text-[13px] text-text outline-none focus:border-accent"
            />
          </label>
          <span className="flex-1 text-[11.5px] leading-snug text-muted">
            Toma los pagos e ingresos con fecha entre esas dos (inclusive).
          </span>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Gastos fijos" hint="Los fijos pagados, según el responsable del gasto" fer={stats.gastoFijo.fer} pao={stats.gastoFijo.pao} compartido={stats.gastoFijo.compartido} ferName={users.fer?.nombre ?? 'Fer'} paoName={users.pao?.nombre ?? 'Pao'} />
        <MetricCard title="Gastos varios" hint="Los del día a día (no fijos), por quién los cargó" fer={stats.gastoVario.fer} pao={stats.gastoVario.pao} ferName={users.fer?.nombre ?? 'Fer'} paoName={users.pao?.nombre ?? 'Pao'} />
        <MetricCard title="Ingresa cada uno" hint="Ingresos cargados a la cuenta" fer={stats.ingresa.fer} pao={stats.ingresa.pao} ferName={users.fer?.nombre ?? 'Fer'} paoName={users.pao?.nombre ?? 'Pao'} />
        <MetricCard title="Ahorra cada uno" hint="Aportes a objetivos y ahorros" fer={stats.ahorra.fer} pao={stats.ahorra.pao} ferName={users.fer?.nombre ?? 'Fer'} paoName={users.pao?.nombre ?? 'Pao'} />
      </div>

      {/* Gastos fijos: quién puso la plata realmente (por cuenta de pago, no por responsable) */}
      <div className="mt-4 lg:grid lg:grid-cols-2 lg:items-stretch lg:gap-6">
        <MetricCard
          title="Fijos: quién puso la plata"
          hint="Según de qué cuenta salió el pago (lo real que puso cada uno)"
          fer={stats.pagoFijosReal.fer}
          pao={stats.pagoFijosReal.pao}
          ferName={users.fer?.nombre ?? 'Fer'}
          paoName={users.pao?.nombre ?? 'Pao'}
        />
        <div className="mt-3 flex items-center rounded-2xl border border-dashed border-line bg-surface-2 px-4 py-3.5 lg:mt-0">
          <p className="m-0 text-[12.5px] leading-relaxed text-muted">
            La tarjeta <b className="font-semibold text-text">“Gastos fijos”</b> reparte por el responsable del gasto.
            Esta, en cambio, suma cada pago por la{' '}
            <b className="font-semibold text-text">cuenta de la que salió la plata</b>, sin importar de quién sea el
            gasto. Ej: si pagás un gasto de {users.pao?.nombre ?? 'Pao'} desde tu cuenta, cuenta como que lo pusiste vos.
          </p>
        </div>
      </div>

      <div className="mt-4 lg:grid lg:grid-cols-2 lg:gap-x-6">
        {/* Distribución por categoría */}
        <section className="mb-4 min-w-0">
          <SectionHeader title="Distribución por categoría" subtitle={periodoLabel} />
          {donutData.length === 0 ? (
            <div className="rounded-[20px] border border-line bg-surface p-8 text-center text-[13px] text-muted">Sin gastos en el período.</div>
          ) : (
            <div className="rounded-[20px] border border-line bg-surface p-[18px]">
              <div className="flex flex-col items-center gap-4">
                <Donut
                  data={donutData}
                  centerLabel={sel ? `$${fmtMonto(sel.value)}` : fmtARSCompact(totalGastos)}
                  centerSub={sel ? sel.label : 'Total gastos'}
                  onSelect={(d) => setSelCat(selCat === d.id ? null : d.id)}
                  selectedId={selCat}
                />
                <div className="grid w-full grid-cols-2 gap-1.5">
                  {donutData.map((dd) => {
                    const pct = (dd.value / totalGastos) * 100;
                    const isSel = selCat === dd.id;
                    return (
                      <div key={dd.id} onClick={() => setSelCat(isSel ? null : dd.id)} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5" style={{ background: isSel ? alpha(dd.color, 0.12) : 'transparent', border: `1px solid ${isSel ? dd.color : 'transparent'}` }}>
                        <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: dd.color }} />
                        <span className="flex-1 truncate text-xs text-text">{dd.label}</span>
                        <span className="shrink-0 text-[11px] tabular-nums text-muted">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Tendencia real */}
        <section className="mb-4 min-w-0">
          <SectionHeader title="Tendencia de gastos" subtitle="últimos 6 meses" />
          <div className="rounded-[20px] border border-line bg-surface p-[18px]">
            <MonthlyBars data={serie} valueKey="gastos" color="#F87171" />
          </div>
        </section>
      </div>

      {/* Fer vs Pao por categoría */}
      {fvpRows.length > 0 && (
        <section className="mb-4 min-w-0">
          <SectionHeader title={`${users.fer?.nombre ?? 'Fer'} vs ${users.pao?.nombre ?? 'Pao'}`} subtitle={`por categoría · ${periodoLabel}`} />
          <div className="rounded-[20px] border border-line bg-surface p-[18px]">
            {fvpRows.map((r) => {
              const c = catMap[r.cat];
              return (
                <div key={r.cat} className="mb-3.5 last:mb-0">
                  <div className="mb-1.5 text-[12.5px] font-medium text-text">{c?.icono} {c?.nombre ?? r.cat}</div>
                  {([['fer', r.fer, FER], ['pao', r.pao, PAO]] as const).map(([who, val, color]) => (
                    <div key={who} className="mb-1 flex items-center gap-1.5 last:mb-0">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white" style={{ background: color }}>{users[who]?.iniciales}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-2">
                        <div className="h-full" style={{ width: `${(val / fvpMax) * 100}%`, background: color, boxShadow: `0 0 8px ${alpha(color, 0.47)}` }} />
                      </div>
                      <span className="min-w-[72px] text-right text-[11px] tabular-nums text-muted">${fmtMonto(val)}</span>
                    </div>
                  ))}
                </div>
              );
            })}
            <div className="mt-1 text-[11px] text-muted">Los gastos compartidos se reparten 50/50 entre ambos.</div>
          </div>
        </section>
      )}

      {!embedded && (
        <div className="mt-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[12px] text-muted">
          Los ingresos y ahorros se cargan desde la app (el “+”). Los gastos fijos importados
          del Excel están todos a nombre de Fer; cambiá el responsable por mes en “Gastos fijos”.
        </div>
      )}
    </div>
  );
}

function MetricCard({ title, hint, fer, pao, compartido = 0, ferName, paoName }: { title: string; hint: string; fer: number; pao: number; compartido?: number; ferName: string; paoName: string }) {
  const total = fer + pao + compartido;
  const max = Math.max(fer, pao, compartido, 1);
  const rows: { name: string; val: number; color: string; userId?: 'fer' | 'pao' }[] = [
    { name: ferName, val: fer, color: FER, userId: 'fer' },
    { name: paoName, val: pao, color: PAO, userId: 'pao' },
  ];
  if (compartido > 0) rows.push({ name: 'Compartido', val: compartido, color: '#8B5CF6' });

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="text-[14.5px] font-semibold text-text">{title}</div>
      <div className="mb-3 text-[11px] text-muted">{hint}</div>
      <div className="mb-3 text-[22px] font-bold tabular-nums tracking-[-0.5px] text-text">${fmtMonto(total)}</div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-text">
                {r.userId ? <Avatar userId={r.userId} size={18} /> : <span className="h-[18px] w-[18px] rounded-full" style={{ background: alpha(r.color, 0.3) }} />}
                {r.name}
              </span>
              <span className="text-[13px] font-semibold tabular-nums" style={{ color: r.color }}>${fmtMonto(r.val)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full" style={{ width: `${(r.val / max) * 100}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
