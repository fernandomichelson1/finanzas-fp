import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Evento } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { computeLiquidation } from '@/lib/selectors';
import { fmtMonto } from '@/lib/format';
import { alpha, shade } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Icon } from '@/components/ui/icons';
import { useCatById } from '@/store/lookups';

export function EventosScreen() {
  const navigate = useNavigate();
  const eventos = useFinanzasStore((s) => s.eventos);
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const closeEvent = useFinanzasStore((s) => s.closeEvent);
  const togglePaidDeuda = useFinanzasStore((s) => s.togglePaidDeuda);
  const [detailId, setDetailId] = useState<string | null>(null);

  const detail = eventos.find((e) => e.id === detailId);
  if (detail) {
    return (
      <EventoDetalle
        evento={detail}
        isCreator={detail.creado_por === currentUser}
        onBack={() => setDetailId(null)}
        onClose={() => closeEvent(detail.id)}
        onTogglePaid={(key) => togglePaidDeuda(detail.id, key)}
      />
    );
  }

  return (
    <div className="pt-2">
      <ScreenHeader
        title="Eventos"
        onBack={() => navigate('/mas')}
        action={<button className="rounded-[10px] bg-[#2563EB] px-3 py-1.5 text-[13px] font-medium text-white">+ Nuevo</button>}
      />
      <div className="px-[18px] lg:px-0">
        <div className="mb-3 text-[13px] text-muted">Gastos compartidos con otras personas. El sistema calcula quién le debe cuánto a quién.</div>
        <div className="grid gap-3 lg:grid-cols-2">
          {eventos.map((ev) => {
            const total = ev.gastos.reduce((s, g) => s + g.monto, 0);
            const { deudas } = computeLiquidation(ev);
            const closed = ev.estado === 'cerrado';
            return (
              <button key={ev.id} onClick={() => setDetailId(ev.id)} className="rounded-[18px] border border-line bg-surface p-4 text-left">
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[22px]"
                    style={{ background: closed ? 'var(--surface-2)' : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', color: closed ? 'var(--text-muted)' : '#fff', boxShadow: closed ? 'none' : '0 6px 14px rgba(139,92,246,0.35)' }}
                  >
                    {closed ? '✓' : '🎉'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <div className="text-[15px] font-semibold text-text">{ev.nombre}</div>
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide" style={{ background: closed ? 'var(--surface-2)' : alpha('#16A34A', 0.13), color: closed ? 'var(--text-muted)' : '#4ADE80' }}>
                        {closed ? 'CERRADO' : 'ACTIVO'}
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-muted">{ev.descripcion}</div>
                    <div className="mt-2.5 flex flex-wrap gap-3 text-[11.5px] tabular-nums text-muted">
                      <span>👥 {ev.participantes.length}</span>
                      <span>📋 {ev.gastos.length} gastos</span>
                      <span className="font-semibold text-text">${fmtMonto(total)}</span>
                    </div>
                    {!closed && deudas.length > 0 && (
                      <div className="mt-2.5 rounded-lg bg-surface-2 px-2.5 py-1.5 text-[11px] text-muted">
                        {deudas.length} transferencia{deudas.length > 1 ? 's' : ''} pendiente{deudas.length > 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <Icon.chev size={16} className="text-muted" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EventoDetalle({ evento, isCreator, onBack, onClose, onTogglePaid }: { evento: Evento; isCreator: boolean; onBack: () => void; onClose: () => void; onTogglePaid: (key: string) => void }) {
  const users = useFinanzasStore((s) => s.users);
  const { total, share, balances, deudas } = computeLiquidation(evento);
  const closed = evento.estado === 'cerrado';

  return (
    <div className="pt-2">
      <ScreenHeader
        title={evento.nombre}
        size="md"
        onBack={onBack}
        action={!closed && isCreator ? <button onClick={onClose} className="rounded-[10px] bg-[#DC2626] px-3 py-1.5 text-xs font-medium text-white">Cerrar</button> : undefined}
      />
      <div className="px-[18px] lg:px-0">
        {/* Hero */}
        <div className="relative mb-3.5 overflow-hidden rounded-[20px] p-[18px]" style={{ background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="pointer-events-none absolute -right-8 -top-12 h-44 w-44" style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.3) 0%, transparent 65%)' }} />
          <div className="relative text-white">
            <div className="text-[11px] uppercase tracking-[1.2px] text-white/55">Total gastado</div>
            <div className="mt-1 text-[34px] font-bold tabular-nums tracking-[-1px]">${fmtMonto(total)}</div>
            <div className="mt-1 text-[12px] tabular-nums text-white/60">${fmtMonto(share)} por persona · {evento.participantes.length} participantes</div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-6">
          {/* Balances */}
          <section className="mb-4 min-w-0">
            <SectionHeader title="Balances" subtitle="pagado vs parte justa" />
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {balances.map((b, i) => {
                const color = b.user_id ? users[b.user_id]?.color ?? '#64748B' : '#64748B';
                return (
                  <div key={b.id} className="flex items-center gap-3 px-3.5 py-3" style={{ borderBottom: i === balances.length - 1 ? 'none' : '1px solid var(--border)' }}>
                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -0.15)} 100%)` }}>
                      {b.nombre.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-sm font-medium text-text">
                        {b.nombre}
                        {!b.user_id && <span className="rounded bg-surface-2 px-1.5 py-0.5 text-[9px] text-muted">EXTERNO</span>}
                      </div>
                      <div className="mt-0.5 text-[11px] tabular-nums text-muted">Pagó ${fmtMonto(b.paid)}</div>
                    </div>
                    <div className="whitespace-nowrap text-sm font-semibold tabular-nums" style={{ color: b.balance > 0 ? '#22C55E' : b.balance < 0 ? '#F87171' : 'var(--text-muted)' }}>
                      {b.balance > 0 ? '+' : ''}{fmtMonto(b.balance)}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Liquidación */}
          <section className="mb-4 min-w-0">
            <SectionHeader title="Liquidación" subtitle={`${deudas.length} transferencia${deudas.length !== 1 ? 's' : ''} ${closed ? 'final' : 'mínima'}`} />
            <div className="overflow-hidden rounded-2xl border border-line bg-surface">
              {deudas.length === 0 ? (
                <div className="p-5 text-center text-[13px] text-muted">Todos quedaron parejos · sin transferencias necesarias</div>
              ) : (
                deudas.map((d, i) => {
                  const key = `${d.from.id}-${d.to.id}`;
                  const saldada = evento.deudasSaldadas?.[key];
                  return (
                    <div key={key} className="flex items-center gap-2.5 px-3.5 py-3" style={{ borderBottom: i === deudas.length - 1 ? 'none' : '1px solid var(--border)', opacity: saldada ? 0.55 : 1 }}>
                      <div className="min-w-0 flex-1 text-[12.5px] text-text">
                        <span className="font-semibold" style={{ textDecoration: saldada ? 'line-through' : 'none' }}>{d.from.nombre}</span>
                        <span className="mx-1.5 text-muted">→</span>
                        <span className="font-semibold" style={{ textDecoration: saldada ? 'line-through' : 'none' }}>{d.to.nombre}</span>
                      </div>
                      <div className="whitespace-nowrap text-sm font-semibold tabular-nums text-[#FBBF24]" style={{ textDecoration: saldada ? 'line-through' : 'none' }}>${fmtMonto(d.amount)}</div>
                      <button
                        onClick={() => onTogglePaid(key)}
                        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md text-white"
                        style={{ background: saldada ? '#16A34A' : 'transparent', border: saldada ? 'none' : '1.5px solid var(--border-strong)' }}
                        title="Marcar como saldada"
                      >
                        {saldada && <Icon.check size={14} strokeWidth={3} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </div>

        {/* Gastos */}
        <section className="mb-4">
          <SectionHeader title="Gastos cargados" subtitle={`${evento.gastos.length} ítems`} />
          <div className="overflow-hidden rounded-2xl border border-line bg-surface">
            {evento.gastos.map((g, i) => (
              <GastoRow key={g.id} g={g} payerName={evento.participantes.find((p) => p.id === g.pagado_por)?.nombre ?? '?'} isLast={i === evento.gastos.length - 1} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function GastoRow({ g, payerName, isLast }: { g: Evento['gastos'][number]; payerName: string; isLast: boolean }) {
  const c = useCatById(g.cat) ?? { color: '#64748B', icono: '•', nombre: 'Otros' };
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-3" style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: alpha(c.color, 0.12), color: c.color, border: `1px solid ${alpha(c.color, 0.2)}` }}>
        <CatIcon item={c} size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium text-text">{g.desc}</div>
        <div className="mt-0.5 text-[11px] text-muted">Pagó {payerName}</div>
      </div>
      <div className="whitespace-nowrap text-[13.5px] font-semibold tabular-nums text-text">${fmtMonto(g.monto)}</div>
    </div>
  );
}
