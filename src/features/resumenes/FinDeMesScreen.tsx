import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import {
  balanceDelMes,
  fijoEstimadoProxMes,
  gastosDelMes,
  primerMesConDatos,
  serieGastosMeses,
} from '@/lib/selectors';
import { MES_ACTUAL, addMonths, mesLabel } from '@/lib/date';
import { fmtMonto } from '@/lib/format';
import { alpha } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MonthlyBars } from '@/components/charts';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/icons';

const FER = '#2563EB';
const PAO = '#E11D48';

function DeltaChip({ pct, good }: { pct: number | null; good: boolean }) {
  if (pct === null) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums"
      style={{
        background: good ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.18)',
        color: good ? '#4ADE80' : '#F87171',
      }}
    >
      {pct >= 0 ? <Icon.up size={11} /> : <Icon.down size={11} />} {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function FinDeMesScreen({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const instancias = useFinanzasStore((s) => s.instancias);
  const gastosFijos = useFinanzasStore((s) => s.gastosFijos);
  const categories = useFinanzasStore((s) => s.categories);
  const metas = useFinanzasStore((s) => s.metas);
  const users = useFinanzasStore((s) => s.users);
  const usdRate = useFinanzasStore((s) => s.usdRate);

  const [mes, setMes] = useState(MES_ACTUAL);
  const catById = (id: string) => categories.find((c) => c.id === id);

  const minMes = useMemo(() => primerMesConDatos(instancias), [instancias]);
  const puedeAtras = !minMes || addMonths(mes, -1) >= minMes;
  const puedeAdelante = mes < MES_ACTUAL;

  const d = useMemo(() => {
    const cur = gastosDelMes(instancias, gastosFijos, movimientos, mes);
    const prevMes = addMonths(mes, -1);
    const prev = gastosDelMes(instancias, gastosFijos, movimientos, prevMes);
    const flujo = balanceDelMes(movimientos, mes);
    const serie = serieGastosMeses(instancias, gastosFijos, movimientos, mes, 6);

    // Promedio de los meses previos con datos (excluye el mes actual y meses vacíos).
    const previosConDatos = serie.slice(0, -1).filter((s) => s.gastos > 0);
    const promedio =
      previosConDatos.length > 0
        ? previosConDatos.reduce((s, x) => s + x.gastos, 0) / previosConDatos.length
        : 0;

    // Categoría que más creció vs el mes anterior (entre las que tienen historia).
    let sorpresa: { cat: string; pct: number; monto: number } | null = null;
    for (const [cat, monto] of Object.entries(cur.porCategoria)) {
      const antes = prev.porCategoria[cat] ?? 0;
      if (antes <= 0 || monto <= antes) continue;
      const pct = ((monto - antes) / antes) * 100;
      if (!sorpresa || pct > sorpresa.pct) sorpresa = { cat, pct, monto };
    }
    // Categoría más pesada del mes (fallback / dato base).
    const topCat = Object.entries(cur.porCategoria).sort((a, b) => b[1] - a[1])[0] ?? null;

    // Proyección del próximo mes: fijos estimados + promedio de eventuales (3 meses).
    const evSerie = [0, 1, 2].map(
      (k) => gastosDelMes(instancias, gastosFijos, movimientos, addMonths(mes, -k)).eventuales,
    );
    const evProm = evSerie.reduce((s, x) => s + x, 0) / evSerie.length;
    const proyeccion = Math.round(fijoEstimadoProxMes(instancias, gastosFijos, mes) + evProm);

    return { cur, prev, flujo, serie, promedio, sorpresa, topCat, proyeccion };
  }, [instancias, gastosFijos, movimientos, mes]);

  const { cur, prev, flujo, serie, promedio, sorpresa, topCat, proyeccion } = d;

  const vacio = cur.total === 0 && flujo.ingresos === 0 && flujo.ahorro === 0;

  const deltaTotalPct = prev.total > 0 ? ((cur.total - prev.total) / prev.total) * 100 : null;

  const kpis = [
    { label: 'Gastos', val: cur.total, prev: prev.total, color: '#F87171', inverse: true },
    { label: 'Fijos', val: cur.fijos, prev: prev.fijos, color: '#FB923C', inverse: true },
    { label: 'Eventuales', val: cur.eventuales, prev: prev.eventuales, color: '#F472B6', inverse: true },
  ];
  const flujoPrev = balanceDelMes(movimientos, addMonths(mes, -1));
  if (flujo.ingresos > 0 || flujoPrev.ingresos > 0)
    kpis.push({ label: 'Ingresos', val: flujo.ingresos, prev: flujoPrev.ingresos, color: '#22C55E', inverse: false });
  if (flujo.ahorro > 0 || flujoPrev.ahorro > 0)
    kpis.push({ label: 'Ahorro', val: flujo.ahorro, prev: flujoPrev.ahorro, color: '#FBBF24', inverse: false });

  const sobreMeta = Object.entries(metas)
    .map(([cat, lim]) => ({ cat, lim, used: cur.porCategoria[cat] ?? 0 }))
    .filter((x) => x.used > x.lim)
    .sort((a, b) => b.used - b.lim - (a.used - a.lim));

  const owners = users;
  const repartoRows = (
    [
      { key: 'fer', name: owners.fer?.nombre ?? 'Fer', val: cur.porOwner.fer, color: FER, userId: 'fer' as const },
      { key: 'pao', name: owners.pao?.nombre ?? 'Pao', val: cur.porOwner.pao, color: PAO, userId: 'pao' as const },
      { key: 'compartido', name: 'Compartido', val: cur.porOwner.compartido, color: '#8B5CF6' },
    ] as const
  ).filter((r) => r.val > 0);
  const repartoMax = Math.max(...repartoRows.map((r) => r.val), 1);

  const nav = (
    <div className="flex items-center gap-1">
      <button
        onClick={() => puedeAtras && setMes(addMonths(mes, -1))}
        disabled={!puedeAtras}
        aria-label="Mes anterior"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text transition-colors hover:bg-surface-2 disabled:opacity-30"
      >
        <span className="rotate-180"><Icon.chev size={16} /></span>
      </button>
      <button
        onClick={() => puedeAdelante && setMes(addMonths(mes, 1))}
        disabled={!puedeAdelante}
        aria-label="Mes siguiente"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-text transition-colors hover:bg-surface-2 disabled:opacity-30"
      >
        <Icon.chev size={16} />
      </button>
    </div>
  );

  return (
    <div className={embedded ? '' : 'pt-2'}>
      {!embedded && <ScreenHeader title="Fin de mes" subtitle={mesLabel(mes)} onBack={() => navigate('/mas')} action={nav} />}
      <div className="px-[18px] lg:px-0">
        {embedded && (
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[15px] font-semibold text-text">{mesLabel(mes)}</div>
            {nav}
          </div>
        )}

        {vacio ? (
          <div className="rounded-[20px] border border-line bg-surface p-8 text-center">
            <div className="text-[32px]">🗓️</div>
            <div className="mt-2 text-[15px] font-semibold text-text">Sin movimientos en {mesLabel(mes)}</div>
            <div className="mt-1 text-[13px] text-muted">Cargá gastos o pagá vencimientos para ver el cierre del mes.</div>
          </div>
        ) : (
          <>
            {/* Hero — total gastado del mes */}
            <div
              className="relative mb-3.5 overflow-hidden rounded-[20px] p-[18px]"
              style={{ background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="pointer-events-none absolute -right-8 -top-12 h-56 w-56" style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.22) 0%, transparent 65%)' }} />
              <div className="relative text-white">
                <div className="text-[11px] uppercase tracking-[1.2px] text-white/55">Total gastado · {mesLabel(mes)}</div>
                <div className="mt-1.5 flex items-end gap-2.5">
                  <div className="text-[34px] font-bold leading-none tracking-[-1px]">${fmtMonto(cur.total)}</div>
                  <div className="mb-0.5">
                    <DeltaChip pct={deltaTotalPct} good={deltaTotalPct !== null && deltaTotalPct < 0} />
                  </div>
                </div>
                <div className="mt-2 text-[12px] leading-relaxed text-white/70">
                  {cur.countFijos} {cur.countFijos === 1 ? 'gasto fijo' : 'gastos fijos'} · ${fmtMonto(cur.eventuales)} en eventuales
                  {usdRate > 0 && <> · ≈ US$ {fmtMonto(cur.total / usdRate)} al blue de hoy</>}
                </div>
              </div>
            </div>

            {/* KPIs vs mes anterior */}
            <section className="mb-4">
              <SectionHeader title="Vs mes anterior" subtitle={mesLabel(addMonths(mes, -1))} />
              <div className="grid grid-cols-2 gap-2">
                {kpis.map((k) => {
                  const delta = k.val - k.prev;
                  const pct = k.prev > 0 ? (delta / k.prev) * 100 : null;
                  const good = k.inverse ? delta < 0 : delta > 0;
                  return (
                    <div key={k.label} className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
                      <div className="text-[10.5px] uppercase tracking-wide text-muted">{k.label}</div>
                      <div className="mt-1 text-[17px] font-bold tabular-nums tracking-[-0.3px]" style={{ color: k.color }}>${fmtMonto(k.val)}</div>
                      <div className="mt-1.5"><DeltaChip pct={pct} good={good} /></div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Tendencia real — últimos 6 meses */}
            <section className="mb-4">
              <SectionHeader title="Tendencia de gastos" subtitle="últimos 6 meses" />
              <div className="rounded-[20px] border border-line bg-surface p-[18px]">
                <MonthlyBars data={serie} valueKey="gastos" color="#F87171" />
              </div>
            </section>

            {/* Categoría sorpresa (o la más pesada) */}
            {sorpresa ? (
              <section className="mb-4">
                <SectionHeader title="Categoría sorpresa" />
                <div className="flex items-center gap-3 rounded-2xl p-3.5" style={{ background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.13)} 0%, ${alpha('#F59E0B', 0.03)} 100%)`, border: `1px solid ${alpha('#F59E0B', 0.27)}` }}>
                  <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-[22px]" style={{ background: alpha('#F59E0B', 0.13), color: '#F59E0B' }}>📈</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-text">{catById(sorpresa.cat)?.nombre ?? sorpresa.cat} creció {Math.round(sorpresa.pct)}%</div>
                    <div className="mt-0.5 text-xs text-muted">${fmtMonto(sorpresa.monto)} este mes · más que {mesLabel(addMonths(mes, -1))}</div>
                  </div>
                </div>
              </section>
            ) : topCat ? (
              <section className="mb-4">
                <SectionHeader title="Categoría más pesada" />
                <div className="flex items-center gap-3 rounded-2xl p-3.5" style={{ background: `linear-gradient(135deg, ${alpha(catById(topCat[0])?.color ?? '#64748B', 0.13)} 0%, ${alpha(catById(topCat[0])?.color ?? '#64748B', 0.03)} 100%)`, border: `1px solid ${alpha(catById(topCat[0])?.color ?? '#64748B', 0.27)}` }}>
                  <div className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-xl" style={{ background: alpha(catById(topCat[0])?.color ?? '#64748B', 0.13), color: catById(topCat[0])?.color }}>
                    <CatIcon item={catById(topCat[0])} size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-text">{catById(topCat[0])?.nombre ?? topCat[0]}</div>
                    <div className="mt-0.5 text-xs text-muted">${fmtMonto(topCat[1])} · {((topCat[1] / cur.total) * 100).toFixed(0)}% del gasto del mes</div>
                  </div>
                </div>
              </section>
            ) : null}

            {/* Reparto Fer / Pao */}
            {repartoRows.length > 0 && (
              <section className="mb-4">
                <SectionHeader title="Quién pagó" subtitle="según responsable del mes" />
                <div className="rounded-2xl border border-line bg-surface p-4">
                  <div className="flex flex-col gap-2.5">
                    {repartoRows.map((r) => (
                      <div key={r.key}>
                        <div className="mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-text">
                            {'userId' in r && r.userId ? <Avatar userId={r.userId} size={18} /> : <span className="h-[18px] w-[18px] rounded-full" style={{ background: alpha(r.color, 0.3) }} />}
                            {r.name}
                          </span>
                          <span className="text-[13px] font-semibold tabular-nums" style={{ color: r.color }}>${fmtMonto(r.val)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                          <div className="h-full rounded-full" style={{ width: `${(r.val / repartoMax) * 100}%`, background: r.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {sobreMeta.length > 0 && (
              <section className="mb-4">
                <SectionHeader title="Sobre el límite" subtitle={`${sobreMeta.length} ${sobreMeta.length === 1 ? 'categoría' : 'categorías'}`} />
                <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                  {sobreMeta.map((s, i) => {
                    const c = catById(s.cat);
                    return (
                      <div key={s.cat} className="flex items-center gap-2.5 px-3.5 py-3" style={{ borderBottom: i === sobreMeta.length - 1 ? 'none' : '1px solid var(--border)' }}>
                        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg" style={{ background: alpha(c?.color ?? '#888', 0.12), color: c?.color }}>
                          <CatIcon item={c} size={18} />
                        </div>
                        <div className="flex-1 text-[13.5px] text-text">{c?.nombre}</div>
                        <div className="whitespace-nowrap text-xs font-semibold tabular-nums text-[#F87171]">+${fmtMonto(s.used - s.lim)}</div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Cierre vs promedio histórico */}
            {promedio > 0 && (
              <div
                className="mb-4 flex items-center gap-3 rounded-2xl p-3.5"
                style={
                  cur.total <= promedio
                    ? { background: `linear-gradient(135deg, ${alpha('#16A34A', 0.13)} 0%, ${alpha('#16A34A', 0.03)} 100%)`, border: `1px solid ${alpha('#16A34A', 0.33)}` }
                    : { background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.12)} 0%, ${alpha('#F59E0B', 0.03)} 100%)`, border: `1px solid ${alpha('#F59E0B', 0.3)}` }
                }
              >
                <div className="text-[32px]">{cur.total <= promedio ? '🏆' : '⚠️'}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-text">
                    {cur.total <= promedio ? 'Mes por debajo de tu promedio' : 'Mes por encima de tu promedio'}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {Math.abs(((cur.total - promedio) / promedio) * 100).toFixed(0)}% {cur.total <= promedio ? 'menos' : 'más'} que el promedio de ${fmtMonto(promedio)} de meses anteriores.
                  </div>
                </div>
              </div>
            )}

            {/* Proyección próximo mes */}
            <section className="mb-4">
              <SectionHeader title={`Proyección · ${mesLabel(addMonths(mes, 1))}`} />
              <div className="rounded-2xl border border-line bg-surface p-4">
                <div className="text-[11px] uppercase tracking-wide text-muted">Gastos estimados</div>
                <div className="mt-1 text-[22px] font-bold tabular-nums tracking-[-0.4px] text-text">${fmtMonto(proyeccion)}</div>
                <div className="mt-1 text-xs leading-relaxed text-muted">
                  Suma de tus gastos fijos activos (último monto de cada uno) + promedio de gastos eventuales de los últimos 3 meses.
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
