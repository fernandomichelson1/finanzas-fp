import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { UserId } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { fmtMonto } from '@/lib/format';
import { shade } from '@/lib/color';
import { Avatar } from '@/components/ui/Avatar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Icon } from '@/components/ui/icons';
import { MovRow } from '@/components/movimientos/MovRow';
import { useUserById } from '@/store/lookups';

const INICIO = '2026-05-12';
const FIN = '2026-05-18';

export function ResumenSemanalScreen({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const categories = useFinanzasStore((s) => s.categories);

  const movsSem = useMemo(() => movimientos.filter((m) => m.fecha >= INICIO && m.fecha <= FIN), [movimientos]);
  const ferTotal = movsSem.filter((m) => m.user === 'fer' && m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0);
  const paoTotal = movsSem.filter((m) => m.user === 'pao' && m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0);
  const totalSem = ferTotal + paoTotal;
  const variacion = ((totalSem - 580000) / 580000) * 100;
  const ahorroSem = movsSem.filter((m) => m.tipo === 'ahorro').reduce((s, m) => s + m.monto, 0);

  const catTotals: Record<string, number> = {};
  movsSem.filter((m) => m.tipo === 'gasto' && m.cat).forEach((m) => (catTotals[m.cat!] = (catTotals[m.cat!] ?? 0) + m.monto));
  const topCats = Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCat = topCats[0]?.[1] || 1;
  const gastoMax = [...movsSem].filter((m) => m.tipo === 'gasto').sort((a, b) => b.monto - a.monto)[0];
  const catById = (id: string) => categories.find((c) => c.id === id);

  return (
    <div className={embedded ? '' : 'pt-2'}>
      {!embedded && <ScreenHeader title="Resumen semanal" onBack={() => navigate('/mas')} />}
      <div className="px-[18px] lg:px-0">
        <div className="relative mb-3.5 overflow-hidden rounded-[20px] p-[18px]" style={{ background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="pointer-events-none absolute -right-8 -top-12 h-52 w-52" style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 65%)' }} />
          <div className="relative text-white">
            <div className="text-[11px] uppercase tracking-[1.2px] text-white/55">Semana del 12 al 18 de mayo</div>
            <div className="mt-1 text-[32px] font-bold tabular-nums tracking-[-0.8px]">${fmtMonto(totalSem)}</div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold tabular-nums" style={{ background: variacion > 0 ? 'rgba(220,38,38,0.2)' : 'rgba(22,163,74,0.2)', color: variacion > 0 ? '#F87171' : '#4ADE80' }}>
                {variacion > 0 ? <Icon.up size={12} /> : <Icon.down size={12} />} {Math.abs(variacion).toFixed(1)}%
              </span>
              <span className="text-[11.5px] text-white/55">vs promedio últimas 4 semanas</span>
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-6">
          <section className="mb-4 min-w-0">
            <SectionHeader title="Por usuario" />
            <div className="flex gap-2">
              <UserCard userId="fer" total={ferTotal} otherTotal={paoTotal} />
              <UserCard userId="pao" total={paoTotal} otherTotal={ferTotal} />
            </div>
          </section>

          <section className="mb-4 min-w-0">
            <SectionHeader title="Top 5 categorías" />
            <div className="rounded-2xl border border-line bg-surface p-4">
              {topCats.map(([catId, total], i) => {
                const c = catById(catId);
                return (
                  <div key={catId} style={{ marginTop: i === 0 ? 0 : 10 }}>
                    <div className="mb-1.5 flex justify-between text-[12.5px]">
                      <span className="text-text">{c?.icono} {c?.nombre}</span>
                      <span className="font-semibold tabular-nums text-text">${fmtMonto(total)}</span>
                    </div>
                    <div className="h-[5px] rounded-sm bg-surface-2">
                      <div className="h-full rounded-sm" style={{ width: `${(total / maxCat) * 100}%`, background: `linear-gradient(90deg, ${c?.color}, ${shade(c?.color ?? '#888', -0.1)})` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {gastoMax && (
          <section className="mb-4">
            <SectionHeader title="Gasto más alto" />
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              <MovRow mov={gastoMax} isLast />
            </div>
          </section>
        )}

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
            <div className="text-[10.5px] uppercase tracking-wide text-muted">Ahorros semana</div>
            <div className="mt-1 text-lg font-bold tabular-nums text-savings">${fmtMonto(ahorroSem)}</div>
            <div className="mt-0.5 text-[11px] text-muted">{movsSem.filter((m) => m.tipo === 'ahorro').length} aportes</div>
          </div>
          <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
            <div className="text-[10.5px] uppercase tracking-wide text-muted">Alertas semana</div>
            <div className="mt-1 text-lg font-bold tabular-nums text-[#F59E0B]">2</div>
            <div className="mt-0.5 text-[11px] text-muted">Entretenimiento + Transporte</div>
          </div>
        </div>

        <div className="px-2 py-3.5 text-center text-[11px] leading-relaxed text-muted">Se genera automáticamente cada lunes a las 12:00<br />En etapa 2: envío por email</div>
      </div>
    </div>
  );
}

function UserCard({ userId, total, otherTotal }: { userId: UserId; total: number; otherTotal: number }) {
  const u = useUserById(userId);
  const diff = total - otherTotal;
  return (
    <div className="flex-1 rounded-[14px] border border-line bg-surface px-3.5 py-3">
      <div className="mb-2 flex items-center gap-2">
        <Avatar userId={userId} size={26} />
        <div className="text-[13px] font-medium text-text">{u?.nombre}</div>
      </div>
      <div className="text-[19px] font-bold tabular-nums tracking-[-0.3px] text-text">${fmtMonto(total)}</div>
      <div className="mt-1 text-[11px] tabular-nums" style={{ color: diff > 0 ? '#F87171' : '#4ADE80' }}>
        {diff > 0 ? '+' : ''}{fmtMonto(diff)} vs otro
      </div>
    </div>
  );
}
