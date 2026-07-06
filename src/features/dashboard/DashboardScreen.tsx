import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Categoria, UserId, VencimientoRow } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { useUserById } from '@/store/lookups';
import { logout } from '@/services/session';
import {
  alertasDeMetas,
  balanceDelMes,
  computeVencimientos,
  gastosDelMes,
} from '@/lib/selectors';
import { MES_ACTUAL, TODAY, addMonths, daysUntil, fechaCorta, mesLabel } from '@/lib/date';
import { fmtARSCompact, fmtMonto, fmtUSD } from '@/lib/format';
import { alpha, shade } from '@/lib/color';
import { Avatar } from '@/components/ui/Avatar';
import { CatIcon } from '@/components/ui/CatIcon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { AdaptiveDialog } from '@/components/ui/AdaptiveDialog';
import { Icon } from '@/components/ui/icons';
import { MovRow } from '@/components/movimientos/MovRow';
import { PagarSheet } from '@/features/vencimientos/sheets';

/** Achica una imagen a un cuadrado de 160px (cover) → data URI chico para el avatar. */
function fileToAvatar(file: File, cb: (dataUri: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const S = 160;
      const canvas = document.createElement('canvas');
      canvas.width = S;
      canvas.height = S;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scale = Math.max(S / img.width, S / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      cb(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

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
  const users = useFinanzasStore((s) => s.users);
  const setCurrentUser = useFinanzasStore((s) => s.setCurrentUser);
  const updateUser = useFinanzasStore((s) => s.updateUser);
  const u = useUserById(currentUser);

  const [payingFor, setPayingFor] = useState<VencimientoRow | null>(null);
  const [showBell, setShowBell] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c])) as Record<string, Categoria>,
    [categories],
  );

  // Gastos reales del mes (fijos pagados + eventuales) y flujo real (ingresos/ahorro).
  const cur = useMemo(
    () => gastosDelMes(instancias, gastosFijos, movimientos),
    [instancias, gastosFijos, movimientos],
  );
  const prev = useMemo(
    () => gastosDelMes(instancias, gastosFijos, movimientos, addMonths(MES_ACTUAL, -1)),
    [instancias, gastosFijos, movimientos],
  );
  const flujo = useMemo(() => balanceDelMes(movimientos), [movimientos]);
  const gastos = cur.total;
  const ingresos = flujo.ingresos;
  const ahorro = flujo.ahorro;
  const deltaGastosPct = prev.total > 0 ? ((cur.total - prev.total) / prev.total) * 100 : null;

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

  // Movimientos de HOY (el "Ver todos" abre la lista completa).
  const delDia = useMemo(
    () =>
      movimientos
        .filter((m) => m.fecha === TODAY)
        .sort((a, b) => b.id.localeCompare(a.id)),
    [movimientos],
  );

  const alerts = useMemo(() => alertasDeMetas(cur.porCategoria, metas), [cur, metas]);
  const catById = (id: string) => categories.find((c) => c.id === id);

  const onPickPhoto = (file?: File) => {
    if (file) fileToAvatar(file, (uri) => updateUser(currentUser, { foto: uri }));
  };

  return (
    <div className="px-[18px] pt-2 lg:px-0">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => setShowProfile(true)} aria-label="Perfil" className="rounded-full transition-transform active:scale-95">
          <Avatar userId={currentUser} size={42} />
        </button>
        <div className="flex-1">
          <div className="text-[13px] text-muted">Buen día,</div>
          <div className="mt-0.5 text-[17px] font-semibold text-text">
            {u?.nombre} <span className="text-sm font-normal capitalize text-muted">· {u?.rol}</span>
          </div>
        </div>
        <button onClick={() => setShowBell(true)} aria-label="Notificaciones" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-text transition-colors hover:bg-surface-2">
          <Icon.bell size={18} />
          {alerts.length > 0 && (
            <span
              className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white"
              style={{ background: '#DC2626', boxShadow: '0 0 0 2px var(--bg)' }}
            >
              {alerts.length}
            </span>
          )}
        </button>
      </div>

      {/* Hero — gastos del mes */}
      <div
        className="relative mb-4 overflow-hidden rounded-3xl p-[22px]"
        style={{
          background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 12px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56" style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.35) 0%, transparent 65%)' }} />
        <div className="pointer-events-none absolute -bottom-20 -left-12 h-60 w-60" style={{ background: 'radial-gradient(circle, rgba(225,29,72,0.18) 0%, transparent 65%)' }} />
        <div className="relative">
          <div className="mb-1.5 flex items-center justify-between">
            <div className="text-xs uppercase tracking-[1.2px] text-white/55">Gastos · {mesLabel(MES_ACTUAL)}</div>
            {deltaGastosPct !== null && (
              <div
                className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                style={{ background: deltaGastosPct <= 0 ? 'rgba(22,163,74,0.18)' : 'rgba(220,38,38,0.18)', color: deltaGastosPct <= 0 ? '#4ADE80' : '#F87171' }}
                title="Vs mes anterior"
              >
                {deltaGastosPct <= 0 ? <Icon.down size={12} /> : <Icon.up size={12} />}
                {Math.abs(deltaGastosPct).toFixed(1)}%
              </div>
            )}
          </div>
          <div className="mt-1 text-[30px] font-bold tabular-nums tracking-[-1px] text-white sm:text-[34px] lg:text-[38px]">${fmtMonto(gastos)}</div>
          <div className="mt-1 text-[12px] tabular-nums text-white/45">≈ {fmtUSD(gastos, usdRate)} · ${fmtMonto(usdRate)}/US$</div>
          <div className="mt-[18px] flex gap-4 border-t border-white/[0.07] pt-4">
            <MiniStat label="Fijos" value={cur.fijos} color="#FB923C" sign="−" />
            <div className="w-px bg-white/[0.07]" />
            <MiniStat label="Varios" value={cur.eventuales} color="#F87171" sign="−" />
            <div className="w-px bg-white/[0.07]" />
            <MiniStat label={ingresos > 0 ? 'Ingresos' : 'Ahorro'} value={ingresos > 0 ? ingresos : ahorro} color={ingresos > 0 ? '#22C55E' : '#FBBF24'} sign={ingresos > 0 ? '+' : ''} />
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
              <button
                key={a.cat}
                onClick={() => setShowBell(true)}
                className="flex items-center gap-3 rounded-[14px] p-3 text-left"
                style={{ background: `linear-gradient(135deg, ${alpha(color, 0.13)} 0%, ${alpha(color, 0.03)} 100%)`, border: `1px solid ${alpha(color, 0.27)}` }}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: alpha(color, 0.13), color }}>
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
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-x-6 gap-y-1 lg:grid-cols-3">
        {/* Vencimientos */}
        <section className="mb-4 min-w-0">
          <SectionHeader title="Próximos a vencerse" subtitle={`${vencimientos.length} pagos · $${fmtMonto(totalAVencer)}`} action="Ver todos" onAction={() => navigate('/vencimientos')} />
          {vencimientos.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface px-4 py-6 text-center text-[13px] text-muted">Nada por vencer 🎉</div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-1">
              {vencimientos.slice(0, 4).map((v) => {
                const c = catMap[v.cat] ?? { color: '#64748B', icono: '•', nombre: 'Otros' };
                const urg = v.dr <= 3 ? '#F87171' : v.dr <= 10 ? '#F59E0B' : 'var(--text-muted)';
                const label = v.dr < 0 ? `Vencido ${-v.dr}d` : v.dr === 0 ? 'Vence hoy' : v.dr === 1 ? 'Vence mañana' : `Vence ${fechaCorta(v.vence)}`;
                return (
                  <div
                    key={v.id}
                    onClick={() => setPayingFor(v)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setPayingFor(v)}
                    title={`Pagar ${v.nombre}`}
                    className="relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:border-line-strong hover:bg-surface-2"
                  >
                    <div className="pointer-events-none absolute -right-5 -top-7 h-24 w-24" style={{ background: `radial-gradient(circle, ${alpha(c.color, 0.13)} 0%, transparent 70%)` }} />
                    <div className="relative flex flex-1 flex-col">
                      <div className="mb-3 flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-[11px]" style={{ background: alpha(c.color, 0.12), color: c.color, border: `1px solid ${alpha(c.color, 0.2)}` }}>
                        <CatIcon item={c} size={22} />
                      </div>
                      <div className="truncate text-[17px] font-bold tabular-nums tracking-[-0.4px] text-text">${fmtMonto(v.monto)}</div>
                      <div className="mt-0.5 truncate text-xs text-muted">{v.nombre}</div>
                      <div className="mt-auto flex items-center gap-1.5 border-t border-line pt-2.5">
                        {v.dr <= 3 && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: urg, boxShadow: `0 0 6px ${urg}` }} />}
                        <span className="truncate text-[11.5px] font-semibold" style={{ color: urg }}>{label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Movimientos del día */}
        <section className="mb-4 min-w-0">
          <SectionHeader title="Movimientos de hoy" subtitle={delDia.length ? `${delDia.length}` : undefined} action="Ver todos" onAction={() => navigate('/movimientos')} />
          {delDia.length === 0 ? (
            <div className="rounded-[20px] border border-line bg-surface px-4 py-6 text-center text-[13px] text-muted">Sin movimientos hoy.<br />Tocá “Ver todos” para el historial.</div>
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
              {delDia.map((m, i) => (
                <MovRow key={m.id} mov={m} isLast={i === delDia.length - 1} />
              ))}
            </div>
          )}
        </section>

        {/* Ahorro (objetivos) */}
        <section className="mb-4 min-w-0">
          <SectionHeader title="Ahorro" subtitle="objetivos" action="Ver todos" onAction={() => navigate('/ahorros')} />
          {objetivos.length === 0 ? (
            <button onClick={() => navigate('/ahorros')} className="w-full rounded-[18px] border border-dashed border-line-strong bg-surface px-4 py-6 text-center text-[13px] text-muted">
              Todavía no hay objetivos.<br />Tocá para crear el primero.
            </button>
          ) : (
            <div className="hide-scroll flex gap-3 overflow-x-auto lg:flex-col lg:overflow-visible">
              {objetivos.map((o) => {
                const pct = o.actual / o.meta;
                return (
                  <div key={o.id} className="relative w-[220px] shrink-0 overflow-hidden rounded-[18px] border border-line bg-surface p-4 lg:w-full lg:shrink">
                    <div className="pointer-events-none absolute -right-5 -top-8 h-24 w-24" style={{ background: `radial-gradient(circle, ${alpha(o.color, 0.2)} 0%, transparent 70%)` }} />
                    <div className="relative">
                      <div className="mb-2.5 flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg" style={{ background: alpha(o.color, 0.13), color: o.color }}>
                          <CatIcon item={o} size={20} />
                        </div>
                        <span className="flex-1 truncate text-[13px] font-semibold text-text">{o.nombre}</span>
                      </div>
                      <div className="text-[19px] font-bold tabular-nums tracking-[-0.4px] text-text">${fmtMonto(o.actual)}</div>
                      <div className="mt-0.5 text-[11px] tabular-nums text-muted">de ${fmtMonto(o.meta)} · {(pct * 100).toFixed(0)}%</div>
                      <div className="mt-3 h-[5px] overflow-hidden rounded-[3px] bg-surface-2">
                        <div className="h-full" style={{ width: `${Math.min(pct, 1) * 100}%`, background: `linear-gradient(90deg, ${o.color} 0%, ${shade(o.color, 0.1)} 100%)`, boxShadow: `0 0 8px ${alpha(o.color, 0.47)}` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {payingFor && <PagarSheet venc={payingFor} onClose={() => setPayingFor(null)} />}

      {/* Notificaciones (campanita) */}
      {showBell && (
        <AdaptiveDialog open onClose={() => setShowBell(false)}>
          <div className="p-[18px]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="m-0 text-lg font-bold tracking-[-0.3px] text-text">Notificaciones</h2>
              <button onClick={() => setShowBell(false)} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-xl text-text hover:bg-surface-2"><Icon.close size={18} /></button>
            </div>
            {alerts.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface px-4 py-8 text-center">
                <div className="mb-1.5 text-3xl opacity-60">🔔</div>
                <div className="text-sm font-semibold text-text">Sin alertas</div>
                <div className="mt-1 text-xs text-muted">Cuando superes una meta mensual, aparece acá.</div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {alerts.map((a) => {
                  const c = catById(a.cat);
                  const color = a.type === 'red' ? '#DC2626' : '#F59E0B';
                  return (
                    <div key={a.cat} className="flex items-start gap-3 rounded-[14px] p-3" style={{ background: `linear-gradient(135deg, ${alpha(color, 0.13)} 0%, ${alpha(color, 0.03)} 100%)`, border: `1px solid ${alpha(color, 0.27)}` }}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: alpha(color, 0.13), color }}><Icon.warn size={16} /></div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-semibold text-text">
                          {a.type === 'red' ? `Superaste el límite de ${c?.nombre ?? a.cat}` : `Ya usaste el ${Math.round(a.pct * 100)}% en ${c?.nombre ?? a.cat}`}
                        </div>
                        <div className="mt-0.5 text-[11.5px] tabular-nums text-muted">${fmtMonto(a.used)} / ${fmtMonto(a.lim)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={() => { setShowBell(false); navigate('/mas/alertas'); }} className="mt-3 w-full rounded-[12px] border border-line bg-surface-2 py-3 text-[13.5px] font-semibold text-text">
              Ver alertas y metas
            </button>
          </div>
        </AdaptiveDialog>
      )}

      {/* Perfil */}
      {showProfile && (
        <AdaptiveDialog open onClose={() => setShowProfile(false)}>
          <div className="p-[18px]">
            <div className="mb-4 flex items-center gap-3">
              <Avatar userId={currentUser} size={52} />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-bold tracking-[-0.3px] text-text">{u?.nombre}</div>
                <div className="text-xs capitalize text-muted">{u?.rol}</div>
              </div>
              <button onClick={() => setShowProfile(false)} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-xl text-text hover:bg-surface-2"><Icon.close size={18} /></button>
            </div>

            {/* Foto */}
            <div className="mb-4 flex gap-2">
              <label className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-[12px] border border-line bg-surface-2 py-3 text-[13.5px] font-semibold text-text">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickPhoto(e.target.files?.[0] || undefined)} />
                📷 {u?.foto ? 'Cambiar foto' : 'Poner foto'}
              </label>
              {u?.foto && (
                <button onClick={() => updateUser(currentUser, { foto: undefined })} className="rounded-[12px] border border-line bg-surface-2 px-4 py-3 text-[13.5px] font-medium text-muted">Quitar</button>
              )}
            </div>

            {/* Cambiar de perfil */}
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Cambiar de perfil</div>
            <div className="mb-4 flex flex-col gap-1.5">
              {(Object.values(users) as { id: UserId; nombre: string; rol: string }[]).map((p) => {
                const active = p.id === currentUser;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setCurrentUser(p.id); setShowProfile(false); }}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left"
                    style={{ background: active ? 'var(--surface-2)' : 'var(--surface)', border: `1px solid ${active ? 'var(--border-strong)' : 'var(--border)'}` }}
                  >
                    <Avatar userId={p.id} size={30} />
                    <span className="flex-1 text-sm font-medium text-text">{p.nombre}</span>
                    {active ? <span className="text-[11px] font-semibold text-accent">Activo</span> : <Icon.chev size={16} className="text-muted" />}
                  </button>
                );
              })}
            </div>

            <button onClick={() => logout()} className="flex w-full items-center justify-center gap-2 rounded-[12px] border py-3 text-[13.5px] font-semibold" style={{ borderColor: alpha('#F87171', 0.3), color: '#F87171' }}>
              <Icon.logout size={16} /> Cerrar sesión
            </button>
          </div>
        </AdaptiveDialog>
      )}
    </div>
  );
}

function MiniStat({ label, value, color, sign }: { label: string; value: number; color: string; sign: string }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="mb-1 truncate text-[10.5px] uppercase tracking-[0.8px] text-white/55">{label}</div>
      <div className="whitespace-nowrap text-[15px] font-semibold tabular-nums tracking-[-0.3px]" style={{ color }}>
        {sign}
        {fmtARSCompact(value)}
      </div>
    </div>
  );
}
