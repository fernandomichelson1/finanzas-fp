import { useMemo, useState } from 'react';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { HISTORIA, HEAT_SEED } from '@/data';
import { gastoPorCategoria, movimientosDelMes } from '@/lib/selectors';
import { fmtARSCompact, fmtMonto } from '@/lib/format';
import { alpha } from '@/lib/color';
import { Donut, MonthlyBars, HeatGrid, Sparkline, type DonutDatum } from '@/components/charts';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MovRow } from '@/components/movimientos/MovRow';
import { Chip } from '@/components/ui/Chip';

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 min-w-0">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="rounded-[20px] border border-line bg-surface p-[18px]">{children}</div>
    </section>
  );
}

export function StatsScreen({ embedded = false }: { embedded?: boolean }) {
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const categories = useFinanzasStore((s) => s.categories);
  const users = useFinanzasStore((s) => s.users);
  const [period, setPeriod] = useState('Mes');
  const [selCat, setSelCat] = useState<DonutDatum | null>(null);
  const [selHeat, setSelHeat] = useState<{ row: number; col: number; value: number } | null>(null);

  const catMap = useMemo(() => Object.fromEntries(categories.map((c) => [c.id, c])), [categories]);

  const gastoPorCat = useMemo(() => gastoPorCategoria(movimientos), [movimientos]);
  const totalGastos = Object.values(gastoPorCat).reduce((s, v) => s + v, 0);
  const donutData: DonutDatum[] = useMemo(
    () =>
      Object.entries(gastoPorCat)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, value]) => ({ id, value, color: catMap[id]?.color ?? '#64748B', label: catMap[id]?.nombre ?? id })),
    [gastoPorCat, catMap],
  );

  const fvpRows = useMemo(() => {
    const acc: Record<string, { fer: number; pao: number }> = {};
    movimientosDelMes(movimientos)
      .filter((m) => m.tipo === 'gasto' && m.cat)
      .forEach((m) => {
        acc[m.cat!] = acc[m.cat!] || { fer: 0, pao: 0 };
        if (m.user === 'fer' || m.user === 'pao') acc[m.cat!][m.user] += m.monto;
      });
    return Object.entries(acc)
      .map(([cat, v]) => ({ cat, ...v, total: v.fer + v.pao }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [movimientos]);
  const fvpMax = Math.max(...fvpRows.map((r) => Math.max(r.fer, r.pao)), 1);

  const top5 = useMemo(
    () => movimientosDelMes(movimientos).filter((m) => m.tipo === 'gasto').sort((a, b) => b.monto - a.monto).slice(0, 5),
    [movimientos],
  );

  const tasaSeries = HISTORIA.map((h) => Math.round((h.ahorro / h.ingresos) * 100));
  const avgGastos = HISTORIA.reduce((s, h) => s + h.gastos, 0) / HISTORIA.length;
  const proyeccion = [
    { mes: '2026-06', label: 'Jun', gastos: Math.round(avgGastos * 1.03) },
    { mes: '2026-07', label: 'Jul', gastos: Math.round(avgGastos * 1.05) },
  ];
  const lastScore = HISTORIA[HISTORIA.length - 1].score;
  const ferC = users.fer?.color ?? '#2563EB';
  const paoC = users.pao?.color ?? '#E11D48';

  return (
    <div className={embedded ? 'px-[18px] lg:px-0' : 'px-[18px] pt-2 lg:px-0'}>
      {!embedded && (
        <>
          <h1 className="m-0 text-2xl font-bold tracking-[-0.6px] text-text lg:text-[26px]">Estadísticas</h1>
          <div className="mt-1 text-[13px] text-muted">Análisis profundo de tus finanzas</div>
        </>
      )}

      <div className="hide-scroll my-4 flex gap-1.5 overflow-x-auto">
        {['Mes', 'Trimestre', 'Año', 'Total'].map((p) => (
          <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>
            {p}
          </Chip>
        ))}
      </div>

      <div className="lg:grid lg:grid-cols-2 lg:gap-x-6">
        {/* Donut */}
        <Card title="Distribución por categoría" subtitle="mayo 2026">
          <div className="flex flex-col items-center gap-4">
            <Donut
              data={donutData}
              centerLabel={selCat ? `$${fmtMonto(selCat.value)}` : fmtARSCompact(totalGastos)}
              centerSub={selCat ? selCat.label : 'Total gastos'}
              onSelect={(d) => setSelCat(selCat?.id === d.id ? null : d)}
              selectedId={selCat?.id}
            />
            <div className="grid w-full grid-cols-2 gap-1.5">
              {donutData.map((d) => {
                const pct = (d.value / totalGastos) * 100;
                const isSel = selCat?.id === d.id;
                return (
                  <div
                    key={d.id}
                    onClick={() => setSelCat(isSel ? null : d)}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5"
                    style={{ background: isSel ? alpha(d.color, 0.12) : 'transparent', border: `1px solid ${isSel ? d.color : 'transparent'}` }}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: d.color }} />
                    <span className="flex-1 truncate text-xs text-text">{d.label}</span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted">{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Tendencia */}
        <Card title="Tendencia de gastos" subtitle="+ proyección 2 meses">
          <MonthlyBars data={HISTORIA} valueKey="gastos" projectionNext={proyeccion} color="#F87171" />
          <div className="mt-3 flex gap-3.5 text-[11px] text-muted">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#F87171]" /> Gastos</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm border border-dashed border-[#F87171] bg-[#F87171]/30" /> Proyección</span>
          </div>
        </Card>

        {/* Heatmap */}
        <Card title="Mapa de calor semanal" subtitle="cuánto gastamos cada día">
          <div className="flex justify-center pb-3">
            <HeatGrid data={HEAT_SEED} baseColor="#DC2626" onSelect={setSelHeat} selectedKey={selHeat ? `${selHeat.row}-${selHeat.col}` : null} />
          </div>
          {selHeat ? (
            <div className="rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 text-center text-xs tabular-nums text-text">
              {DIAS[selHeat.col]} · <span className="font-semibold">${(selHeat.value * 1000).toLocaleString('es-AR')}</span>
            </div>
          ) : (
            <div className="text-center text-[11px] italic text-muted">Más intenso = más gasto · viernes y sábados son los más fuertes</div>
          )}
        </Card>

        {/* Fer vs Pao */}
        <Card title="Fer vs Pao" subtitle="por categoría · mayo">
          {fvpRows.map((r) => {
            const c = catMap[r.cat];
            return (
              <div key={r.cat} className="mb-3.5 last:mb-0">
                <div className="mb-1.5 text-[12.5px] font-medium text-text">{c?.icono} {c?.nombre}</div>
                {([['fer', r.fer, ferC], ['pao', r.pao, paoC]] as const).map(([who, val, color]) => (
                  <div key={who} className="mb-1 flex items-center gap-1.5 last:mb-0">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-bold text-white" style={{ background: color }}>
                      {users[who]?.iniciales}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-2">
                      <div className="h-full" style={{ width: `${(val / fvpMax) * 100}%`, background: color, boxShadow: `0 0 8px ${alpha(color, 0.47)}` }} />
                    </div>
                    <span className="min-w-[64px] text-right text-[11px] tabular-nums text-muted">${fmtMonto(val)}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </Card>

        {/* Score */}
        <Card title="Score histórico" subtitle="últimos 6 meses">
          <div className="mb-2 flex items-baseline justify-between">
            <div>
              <div className="text-[28px] font-bold tabular-nums text-text">{lastScore}</div>
              <div className="text-[11px] uppercase tracking-wider text-muted">Mayo</div>
            </div>
            <div className="rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums" style={{ background: alpha('#16A34A', 0.13), color: '#4ADE80' }}>
              +16 vs mes anterior
            </div>
          </div>
          <Sparkline values={HISTORIA.map((h) => h.score)} color="#22C55E" height={70} />
          <div className="mt-1 flex justify-between text-[10.5px] text-muted">
            {HISTORIA.map((h) => <span key={h.mes}>{h.label}</span>)}
          </div>
        </Card>

        {/* Tasa de ahorro */}
        <Card title="Tasa de ahorro" subtitle="% del ingreso">
          <div className="mb-1 flex items-baseline justify-between">
            <div className="text-[28px] font-bold tabular-nums text-savings">{tasaSeries[tasaSeries.length - 1]}%</div>
            <div className="text-[11px] text-muted">Meta ideal: <span className="text-text">10%</span></div>
          </div>
          <Sparkline values={tasaSeries} color="#D97706" height={60} />
        </Card>
      </div>

      {/* Top 5 (ancho completo) */}
      <section className="mb-4 min-w-0">
        <SectionHeader title="Top 5 gastos del mes" />
        <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
          {top5.map((m, i) => (
            <MovRow key={m.id} mov={m} isLast={i === top5.length - 1} />
          ))}
        </div>
      </section>
    </div>
  );
}
