import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { HISTORIA } from '@/data';
import { balanceDelMes, gastoPorCategoria } from '@/lib/selectors';
import { fmtMonto } from '@/lib/format';
import { alpha } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ProgressRing } from '@/components/charts';
import { Icon } from '@/components/ui/icons';

const SCORE = 92;

export function FinDeMesScreen({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const categories = useFinanzasStore((s) => s.categories);
  const metas = useFinanzasStore((s) => s.metas);

  const { ingresos, gastos, ahorro, balance } = useMemo(() => balanceDelMes(movimientos), [movimientos]);
  const uso = useMemo(() => gastoPorCategoria(movimientos), [movimientos]);
  const mesAnt = HISTORIA[HISTORIA.length - 2];
  const catById = (id: string) => categories.find((c) => c.id === id);

  const kpis = [
    { label: 'Ingresos', val: ingresos, prev: mesAnt.ingresos, color: '#22C55E', inverse: false },
    { label: 'Gastos', val: gastos, prev: mesAnt.gastos, color: '#F87171', inverse: true },
    { label: 'Balance', val: balance, prev: mesAnt.ingresos - mesAnt.gastos, color: '#3B82F6', inverse: false },
    { label: 'Ahorro', val: ahorro, prev: mesAnt.ahorro, color: '#FBBF24', inverse: false },
  ];

  const sobreMeta = Object.entries(metas)
    .map(([cat, lim]) => ({ cat, lim, used: uso[cat] ?? 0 }))
    .filter((x) => x.used > x.lim);

  const proyJunio = Math.round((HISTORIA.reduce((s, h) => s + h.gastos, 0) / HISTORIA.length) * 1.04);

  return (
    <div className={embedded ? '' : 'pt-2'}>
      {!embedded && <ScreenHeader title="Fin de mes · Mayo" onBack={() => navigate('/mas')} />}
      <div className="px-[18px] lg:px-0">
        {/* Hero score */}
        <div className="relative mb-3.5 flex items-center gap-4 overflow-hidden rounded-[20px] p-[18px]" style={{ background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="pointer-events-none absolute -right-8 -top-12 h-56 w-56" style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.3) 0%, transparent 65%)' }} />
          <div className="relative"><ProgressRing pct={SCORE / 100} size={96} thickness={9} color="#22C55E" label={SCORE} sub="Score" /></div>
          <div className="relative flex-1 text-white">
            <div className="text-[11px] uppercase tracking-[1.2px] text-white/55">Mes cerrado</div>
            <div className="mt-1 text-[22px] font-bold tracking-[-0.4px]">Excelente</div>
            <div className="mt-1.5 text-[12px] leading-relaxed text-white/70">+16 puntos vs abril. La tasa de ahorro subió a {((ahorro / ingresos) * 100).toFixed(1)}%.</div>
          </div>
        </div>

        {/* KPIs vs mes anterior */}
        <section className="mb-4">
          <SectionHeader title="Vs mes anterior" />
          <div className="grid grid-cols-2 gap-2">
            {kpis.map((k) => {
              const delta = k.val - k.prev;
              const deltaPct = (delta / Math.max(Math.abs(k.prev), 1)) * 100;
              const good = k.inverse ? delta < 0 : delta > 0;
              return (
                <div key={k.label} className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
                  <div className="text-[10.5px] uppercase tracking-wide text-muted">{k.label}</div>
                  <div className="mt-1 text-[17px] font-bold tabular-nums tracking-[-0.3px]" style={{ color: k.color }}>${fmtMonto(k.val)}</div>
                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-semibold tabular-nums" style={{ background: good ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.18)', color: good ? '#4ADE80' : '#F87171' }}>
                    {delta > 0 ? <Icon.up size={11} /> : <Icon.down size={11} />} {Math.abs(deltaPct).toFixed(1)}%
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Categoría sorpresa */}
        <section className="mb-4">
          <SectionHeader title="Categoría sorpresa" />
          <div className="flex items-center gap-3 rounded-2xl p-3.5" style={{ background: `linear-gradient(135deg, ${alpha('#F59E0B', 0.13)} 0%, ${alpha('#F59E0B', 0.03)} 100%)`, border: `1px solid ${alpha('#F59E0B', 0.27)}` }}>
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-xl text-[22px]" style={{ background: alpha('#F59E0B', 0.13), color: '#F59E0B' }}>📈</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-text">Entretenimiento creció 142%</div>
              <div className="mt-0.5 text-xs text-muted">Más salidas y cuotas que el mes pasado</div>
            </div>
          </div>
        </section>

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

        {/* Logro */}
        <div className="mb-4 flex items-center gap-3 rounded-2xl p-3.5" style={{ background: `linear-gradient(135deg, ${alpha('#16A34A', 0.13)} 0%, ${alpha('#16A34A', 0.03)} 100%)`, border: `1px solid ${alpha('#16A34A', 0.33)}` }}>
          <div className="text-[32px]">🏆</div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-text">Mejor mes de los últimos 6</div>
            <div className="mt-0.5 text-xs text-muted">Balance positivo + score 92 + 2 objetivos avanzando</div>
          </div>
        </div>

        {/* Proyección */}
        <section className="mb-4">
          <SectionHeader title="Proyección · Junio" />
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="text-[11px] uppercase tracking-wide text-muted">Gastos estimados</div>
            <div className="mt-1 text-[22px] font-bold tabular-nums tracking-[-0.4px] text-text">${fmtMonto(proyJunio)}</div>
            <div className="mt-1 text-xs leading-relaxed text-muted">Basado en gastos fijos detectados (Colegio, Expensas, Servicios) + promedio histórico variable.</div>
          </div>
        </section>
      </div>
    </div>
  );
}
