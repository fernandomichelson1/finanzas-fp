import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Categoria } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { useUserById } from '@/store/lookups';
import {
  alertasDeMetas,
  balanceDelMes,
  computeVencimientos,
} from '@/lib/selectors';
import { MES_ACTUAL, daysUntil, fechaCorta, mesLabel } from '@/lib/date';
import { fmtARSCompact, fmtMonto, fmtUSD } from '@/lib/format';
import { alpha, shade } from '@/lib/color';
import { Avatar } from '@/components/ui/Avatar';
import { CatIcon } from '@/components/ui/CatIcon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Icon } from '@/components/ui/icons';
import { MovRow } from '@/components/movimientos/MovRow';

const DELTAS = { ingresos: 8.2, gastos: -3.5, balance: 22.1, ahorro: 14.0 };
const PERIODOS = ['Semana', 'Mes actual', 'Mes ant.', 'Año'];

export function DashboardScreen() {
  const navigate = useNavigate();
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const objetivos = useFinanzasStore((s) => s.objetivos);
  const gastosFijos = useFinanzasStore((s) => s.gastosFijos);
  const instancias = useFinanzasStore((s) => s.instancias);
  const metas = useFinanzasStore((s) => s.metas);
  const categories = useFinanzasStore((s) => s.categories);
  const usdRate = useFinanzasStore((s) => s.usdRate);
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const u = useUserById(currentUser);

  const [periodo, setPeriodo] = useState('Mes actual');

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])) as Record<string, Categoria>,
    [categories],
  );

  const { ingresos, gastos, ahorro, balance } = useMemo(
    () => balanceDelMes(movimientos),
    [movimientos],
  );

  const vencimientos = useMemo(
    () =>
      computeVencimientos(gastosFijos, instancias, MES_ACTUAL)
        .filter((v) => !v.pagado)
        .map((v) => ({ ...v, dr: daysUntil(v.vence) }))
        .filter((v) => v.dr >= -2)
        .sort((a, b) => a.vence.localeCompare(b.vence)),
    [gastosFijos, instancias],
  );
  const totalAVencer = vencimientos.reduce((s, v) => s + v.monto, 0);

  const recientes = useMemo(
    () =>
      [...movimientos]
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id))
        .slice(0, 5),
    [movimientos],
  );

  const alerts = useMemo(() => alertasDeMetas(movimientos, metas), [movimientos, metas]);

  return (
    <div className="px-[18px] pt-2 lg:px-0">
      {/* Header */}
      <div className="mb-3.5 flex items-center gap-3">
        <Avatar userId={currentUser} size={42} />
        <div className="flex-1">
          <div className="text-[13px] text-muted">Buen día,</div>
          <div className="mt-0.5 text-[17px] font-semibold text-text">
            {u?.nombre} <span className="text-sm font-normal text-muted">· {u?.rol}</span>
          </div>
        </div>
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-text">
          <Icon.bell size={18} />
          {alerts.length > 0 && (
            <span
              className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
              style={{ background: '#F59E0B', boxShadow: '0 0 0 2px var(--bg)' }}
            />
          )}
        </button>
      </div>

      {/* Period selector */}
      <div className="hide-scroll mb-4 flex gap-1.5 overflow-x-auto">
        {PERIODOS.map((p) => {
          const active = periodo === p;
          return (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className="whitespace-nowrap rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium transition-all"
              style={{
                background: active ? 'var(--text)' : 'var(--surface)',
                color: active ? 'var(--bg)' : 'var(--text-muted)',
              }}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Hero balance */}
      <div
        className="relative mb-4 overflow-hidden rounded-3xl p-[22px]"
        style={{
          background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 65%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-12 h-60 w-60"
          style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 65%)' }}
        />
        <div className="relative">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[1.2px] text-white/55">
              Balance · {mesLabel(MES_ACTUAL)}
            </div>
            <div
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
              style={{
                background: balance >= 0 ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.18)',
                color: balance >= 0 ? '#4ADE80' : '#F87171',
              }}
            >
              {DELTAS.balance > 0 ? <Icon.up size={12} /> : <Icon.down size={12} />}
              {Math.abs(DELTAS.balance).toFixed(1)}%
            </div>
          </div>
          <div className="mt-1 text-[38px] font-bold tabular-nums tracking-[-1.2px] text-white">
            {balance >= 0 ? '' : '−'}${fmtMonto(Math.abs(balance))}
          </div>
          <div className="mt-1 text-[12px] tabular-nums text-white/45">
            ≈ {fmtUSD(balance, usdRate)} · ${fmtMonto(usdRate)}/US$
          </div>
          <div className="mt-[18px] flex gap-4 border-t border-white/[0.07] pt-4">
            <MiniStat label="Ingresos" value={ingresos} color="#22C55E" sign="+" />
            <div className="w-px bg-white/[0.07]" />
            <MiniStat label="Gastos" value={gastos} color="#F87171" sign="−" />
            <div className="w-px bg-white/[0.07]" />
            <MiniStat label="Ahorro" value={ahorro} color="#FBBF24" sign="" />
          </div>
        </div>
      </div>

      {/* Alerts (full width) */}
      {alerts.length > 0 && (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {alerts.slice(0, 2).map((a) => {
            const c = catMap[a.cat];
            const color = a.type === 'red' ? '#DC2626' : '#F59E0B';
            return (
              <div
                key={a.cat}
                className="flex items-center gap-3 rounded-[14px] p-3"
                style={{
                  background: `linear-gradient(135deg, ${alpha(color, 0.13)} 0%, ${alpha(color, 0.03)} 100%)`,
                  border: `1px solid ${alpha(color, 0.27)}`,
                }}
              >
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: alpha(color, 0.13), color }}
                >
                  <Icon.warn size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-text">
                    {a.type === 'red' ? 'Superaste el límite de ' : 'Ya usaste el 80% en '}
                    {c?.nombre}
                  </div>
                  <div className="mt-0.5 text-[11px] tabular-nums text-muted">
                    ${fmtMonto(a.used)} / ${fmtMonto(a.lim)} · {(a.pct * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Three parallel sections (multi-column on desktop) */}
      <div className="grid gap-x-6 gap-y-1 lg:grid-cols-3">
        {/* Vencimientos */}
        <section className="mb-4 min-w-0">
          <SectionHeader
            title="Próximos a vencerse"
            subtitle={`${vencimientos.length} pagos · $${fmtMonto(totalAVencer)}`}
            action="Ver todos"
            onAction={() => navigate('/vencimientos')}
          />
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
            {vencimientos.slice(0, 4).map((v) => {
              const c = catMap[v.cat] ?? { color: '#64748B', icono: '•', nombre: 'Otros' };
              const urg = v.dr <= 3 ? '#F87171' : v.dr <= 10 ? '#F59E0B' : 'var(--text-muted)';
              const label =
                v.dr < 0
                  ? `Vencido ${-v.dr}d`
                  : v.dr === 0
                    ? 'Vence hoy'
                    : v.dr === 1
                      ? 'Vence mañana'
                      : `Vence ${fechaCorta(v.vence)}`;
              return (
                <div
                  key={v.id}
                  className="relative flex flex-col overflow-hidden rounded-2xl border border-line bg-surface p-3.5"
                >
                  <div
                    className="pointer-events-none absolute -right-5 -top-7 h-24 w-24"
                    style={{ background: `radial-gradient(circle, ${alpha(c.color, 0.13)} 0%, transparent 70%)` }}
                  />
                  <div className="relative flex flex-1 flex-col">
                    <div
                      className="mb-3 flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-[11px]"
                      style={{ background: alpha(c.color, 0.12), color: c.color, border: `1px solid ${alpha(c.color, 0.2)}` }}
                    >
                      <CatIcon item={c} size={22} />
                    </div>
                    <div className="truncate text-[17px] font-bold tabular-nums tracking-[-0.4px] text-text">
                      ${fmtMonto(v.monto)}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted">{v.nombre}</div>
                    <div className="mt-auto flex items-center gap-1.5 border-t border-line pt-2.5">
                      {v.dr <= 3 && (
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: urg, boxShadow: `0 0 6px ${urg}` }}
                        />
                      )}
                      <span className="truncate text-[11.5px] font-semibold" style={{ color: urg }}>
                        {label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Objetivos */}
        <section className="mb-4 min-w-0">
          <SectionHeader title="Objetivos de ahorro" subtitle="activos" />
          <div className="hide-scroll flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
            {objetivos.map((o) => {
              const pct = o.actual / o.meta;
              return (
                <div
                  key={o.id}
                  className="relative w-[220px] shrink-0 overflow-hidden rounded-[18px] border border-line bg-surface p-4 lg:w-full lg:shrink"
                >
                  <div
                    className="pointer-events-none absolute -right-5 -top-8 h-24 w-24"
                    style={{ background: `radial-gradient(circle, ${alpha(o.color, 0.2)} 0%, transparent 70%)` }}
                  />
                  <div className="relative">
                    <div className="mb-2.5 flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg"
                        style={{ background: alpha(o.color, 0.13), color: o.color }}
                      >
                        <CatIcon item={o} size={20} />
                      </div>
                      <span className="flex-1 truncate text-[13px] font-semibold text-text">{o.nombre}</span>
                    </div>
                    <div className="text-[19px] font-bold tabular-nums tracking-[-0.4px] text-text">
                      ${fmtMonto(o.actual)}
                    </div>
                    <div className="mt-0.5 text-[11px] tabular-nums text-muted">
                      de ${fmtMonto(o.meta)} · {(pct * 100).toFixed(0)}%
                    </div>
                    <div className="mt-3 h-[5px] overflow-hidden rounded-[3px] bg-surface-2">
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.min(pct, 1) * 100}%`,
                          background: `linear-gradient(90deg, ${o.color} 0%, ${shade(o.color, 0.1)} 100%)`,
                          boxShadow: `0 0 8px ${alpha(o.color, 0.47)}`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Últimos movimientos */}
        <section className="mb-4 min-w-0">
          <SectionHeader
            title="Últimos movimientos"
            action="Ver todos"
            onAction={() => navigate('/movimientos')}
          />
          <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
            {recientes.map((m, i) => (
              <MovRow key={m.id} mov={m} isLast={i === recientes.length - 1} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  sign,
}: {
  label: string;
  value: number;
  color: string;
  sign: string;
}) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-[10.5px] uppercase tracking-[0.8px] text-white/55">{label}</div>
      <div
        className="whitespace-nowrap text-[15px] font-semibold tabular-nums tracking-[-0.3px]"
        style={{ color }}
      >
        {sign}
        {fmtARSCompact(value)}
      </div>
    </div>
  );
}
