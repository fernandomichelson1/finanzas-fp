import { useMemo, useState } from 'react';
import type { ObjetivoOwner } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { HISTORIA } from '@/data';
import { fmtARSCompact, fmtMonto } from '@/lib/format';
import { alpha, shade } from '@/lib/color';
import { Avatar } from '@/components/ui/Avatar';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { ProgressRing, Sparkline } from '@/components/charts';

const COLORS = ['#06B6D4', '#16A34A', '#D97706', '#8B5CF6', '#E11D48', '#F97316', '#EAB308', '#3B82F6', '#EC4899', '#0F766E'];
const ICONS = ['🎯', '✈', '🚗', '🏠', '💍', '🎓', '🛟', '🏆', '💻', '📱', '🐕', '👶'];

function KPI({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="min-w-[138px] shrink-0 rounded-[14px] border border-line bg-surface px-3.5 py-3">
      <div className="text-[10.5px] uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-[17px] font-bold tabular-nums tracking-[-0.3px]" style={{ color }}>{value}</div>
    </div>
  );
}

export function AhorrosScreen() {
  const objetivos = useFinanzasStore((s) => s.objetivos);
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const users = useFinanzasStore((s) => s.users);
  const logAporte = useFinanzasStore((s) => s.logAporte);
  const createObjetivo = useFinanzasStore((s) => s.createObjetivo);

  const [tab, setTab] = useState<'objetivos' | 'mensual'>('objetivos');
  const [aporteFor, setAporteFor] = useState<string | null>(null);
  const [aporteMonto, setAporteMonto] = useState('');
  const [creating, setCreating] = useState(false);
  const [nName, setNName] = useState('');
  const [nMeta, setNMeta] = useState('');
  const [nFecha, setNFecha] = useState('');
  const [nColor, setNColor] = useState('#06B6D4');
  const [nIcono, setNIcono] = useState('🎯');
  const [nOwner, setNOwner] = useState<ObjetivoOwner>('compartido');

  const mensualRows = useMemo(() => {
    const byMes: Record<string, { mes: string; label: string; fer: number; pao: number; total: number }> = {};
    HISTORIA.forEach((h) => (byMes[h.mes] = { mes: h.mes, label: h.label, fer: 0, pao: 0, total: h.ahorro }));
    const may = byMes['2026-05'];
    if (may) {
      const a = movimientos.filter((m) => m.tipo === 'ahorro' && m.fecha.startsWith('2026-05'));
      may.fer = a.filter((m) => m.user === 'fer').reduce((s, m) => s + m.monto, 0);
      may.pao = a.filter((m) => m.user === 'pao').reduce((s, m) => s + m.monto, 0);
      may.total = may.fer + may.pao;
    }
    Object.values(byMes).forEach((e) => {
      if (e.mes !== '2026-05') {
        e.fer = Math.round(e.total * 0.65);
        e.pao = e.total - e.fer;
      }
    });
    return HISTORIA.map((h) => byMes[h.mes]);
  }, [movimientos]);

  const totalAhorrado = mensualRows.reduce((s, r) => s + r.total, 0);
  const promedio = Math.round(totalAhorrado / mensualRows.length);
  const mejor = mensualRows.reduce((b, r) => (r.total > b.total ? r : b), mensualRows[0]);
  const tasaProm = (totalAhorrado / HISTORIA.reduce((s, h) => s + h.ingresos, 0)) * 100;

  const submitAporte = () => {
    const m = parseInt(aporteMonto || '0', 10);
    if (m > 0 && aporteFor) {
      logAporte(aporteFor, m);
      setAporteFor(null);
      setAporteMonto('');
    }
  };
  const submitObjetivo = () => {
    if (!nName.trim() || !parseInt(nMeta, 10)) return;
    createObjetivo({ nombre: nName.trim(), meta: parseInt(nMeta, 10), actual: 0, color: nColor, icono: nIcono, fecha_limite: nFecha || null, creado_por: currentUser, owner: nOwner, estado: 'activo' });
    setCreating(false);
    setNName(''); setNMeta(''); setNFecha(''); setNColor('#06B6D4'); setNIcono('🎯'); setNOwner('compartido');
  };

  return (
    <div className="px-[18px] pt-2 lg:px-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-[-0.6px] text-text lg:text-[26px]">Ahorros</h1>
          <div className="mt-1 text-[13px] text-muted">Objetivos y evolución mensual</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-white" style={{ background: 'linear-gradient(135deg, #D97706 0%, #B45309 100%)', boxShadow: '0 6px 16px rgba(217,119,6,0.4)' }}>🐷</div>
      </div>

      <div className="hide-scroll my-3.5 flex gap-2 overflow-x-auto">
        <KPI label="Acum. 6 meses" value={fmtARSCompact(totalAhorrado)} color="#D97706" />
        <KPI label="Promedio mes" value={fmtARSCompact(promedio)} color="#D97706" />
        <KPI label="Mejor mes" value={`${mejor.label} · ${fmtARSCompact(mejor.total)}`} color="#22C55E" />
        <KPI label="Tasa promedio" value={`${tasaProm.toFixed(1)}%`} color="#22C55E" />
      </div>

      <div className="mb-3.5 flex gap-1.5">
        {(['objetivos', 'mensual'] as const).map((id) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 rounded-[10px] border border-line py-2.5 text-[13px] font-semibold"
            style={{ background: tab === id ? 'var(--text)' : 'var(--surface)', color: tab === id ? 'var(--bg)' : 'var(--text-muted)' }}
          >
            {id === 'objetivos' ? 'Objetivos' : 'Registro mensual'}
          </button>
        ))}
      </div>

      {tab === 'objetivos' && (
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-4">
          {objetivos.map((o) => {
            const pct = Math.min(1, o.actual / o.meta);
            const remaining = o.meta - o.actual;
            const open = aporteFor === o.id;
            return (
              <div key={o.id} className="relative mb-3 overflow-hidden rounded-[20px] border border-line bg-surface p-[18px]">
                <div className="pointer-events-none absolute -right-10 -top-14 h-48 w-48" style={{ background: `radial-gradient(circle, ${alpha(o.color, 0.12)} 0%, transparent 65%)` }} />
                <div className="relative">
                  <div className="mb-3.5 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: alpha(o.color, 0.13), color: o.color, border: `1px solid ${alpha(o.color, 0.27)}` }}>{o.icono}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <div className="truncate text-base font-semibold text-text">{o.nombre}</div>
                        <OwnerBadge owner={o.owner} />
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-muted">Faltan <span className="tabular-nums text-text">${fmtMonto(remaining)}</span></div>
                    </div>
                    <ProgressRing pct={pct} size={48} thickness={5} color={o.color} label={`${Math.round(pct * 100)}%`} />
                  </div>
                  <div className="mb-1.5">
                    <span className="text-[22px] font-bold tabular-nums tracking-[-0.5px] text-text">${fmtMonto(o.actual)}</span>
                    <span className="ml-1.5 text-xs text-muted">/ ${fmtMonto(o.meta)}</span>
                  </div>
                  <div className="mb-3.5 h-2 overflow-hidden rounded-sm bg-surface-2">
                    <div className="h-full" style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, ${o.color} 0%, ${shade(o.color, 0.15)} 100%)`, boxShadow: `0 0 10px ${alpha(o.color, 0.6)}` }} />
                  </div>
                  <div className="mb-3 flex items-center gap-2">
                    <Avatar userId="fer" size={22} ring />
                    <div className="-ml-2.5"><Avatar userId="pao" size={22} ring /></div>
                    <div className="text-[11.5px] text-muted">Aportan Fer y Pao</div>
                  </div>
                  {open ? (
                    <div className="flex gap-1.5">
                      <input type="number" value={aporteMonto} onChange={(e) => setAporteMonto(e.target.value)} placeholder="$ monto" autoFocus className="flex-1 rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 text-sm tabular-nums text-text outline-none" />
                      <button onClick={submitAporte} className="rounded-[10px] px-3.5 py-2.5 text-[13px] font-semibold text-white" style={{ background: o.color }}>Aportar</button>
                      <button onClick={() => { setAporteFor(null); setAporteMonto(''); }} className="rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 text-muted">×</button>
                    </div>
                  ) : (
                    <button onClick={() => setAporteFor(o.id)} className="w-full rounded-[10px] py-2.5 text-[13px] font-semibold" style={{ background: 'var(--surface-2)', color: o.color, border: `1px dashed ${alpha(o.color, 0.4)}` }}>
                      + Registrar aporte
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Crear objetivo */}
          <div className="lg:col-span-2">
            {creating ? (
              <div className="rounded-[18px] border border-dashed border-line-strong bg-surface-2 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] text-xl text-white" style={{ background: `linear-gradient(135deg, ${nColor} 0%, ${shade(nColor, -0.18)} 100%)` }}>{nIcono}</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-text">{nName || 'Nuevo objetivo'}</div>
                    <div className="text-[11.5px] text-muted">{nMeta ? `Meta: $${fmtMonto(parseInt(nMeta, 10))}` : 'Sin meta definida'}</div>
                  </div>
                </div>
                <input value={nName} onChange={(e) => setNName(e.target.value)} placeholder="Nombre (ej. Viaje, Auto...)" className="mb-2.5 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-text outline-none" />
                <input type="number" value={nMeta} onChange={(e) => setNMeta(e.target.value)} placeholder="$ meta" className="mb-2.5 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm tabular-nums text-text outline-none" />
                <input type="date" value={nFecha} onChange={(e) => setNFecha(e.target.value)} className="mb-2.5 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-text outline-none" />
                <div className="mb-2.5 flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setNColor(c)} className="h-7 w-7 rounded-full" style={{ background: `linear-gradient(135deg, ${c}, ${shade(c, -0.18)})`, border: nColor === c ? '2.5px solid var(--text)' : '2px solid transparent', boxShadow: nColor === c ? `0 0 12px ${alpha(c, 0.6)}` : 'none' }} />
                  ))}
                </div>
                <div className="mb-3.5 flex flex-wrap gap-1.5">
                  {ICONS.map((i) => (
                    <button key={i} onClick={() => setNIcono(i)} className="h-9 w-9 rounded-[10px] text-lg" style={{ background: nIcono === i ? alpha(nColor, 0.15) : 'var(--surface)', border: nIcono === i ? `2px solid ${nColor}` : '1px solid var(--border)' }}>{i}</button>
                  ))}
                </div>
                <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[1px] text-muted">¿De quién es?</div>
                <div className="mb-3.5 flex gap-1.5">
                  {(['compartido', 'fer', 'pao'] as ObjetivoOwner[]).map((id) => {
                    const active = nOwner === id;
                    const col = id === 'compartido' ? '#3B82F6' : (users[id]?.color ?? '#3B82F6');
                    const label = id === 'compartido' ? 'Compartido' : (users[id]?.nombre ?? id);
                    return (
                      <button key={id} onClick={() => setNOwner(id)} className="flex-1 rounded-[10px] py-2 text-[12.5px] font-semibold" style={{ background: active ? alpha(col, 0.15) : 'var(--surface)', color: active ? col : 'var(--text-muted)', border: `1px solid ${active ? col : 'var(--border)'}` }}>{label}</button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button onClick={submitObjetivo} disabled={!nName.trim() || !parseInt(nMeta, 10)} className="flex-1 rounded-xl py-3 text-sm font-semibold" style={{ background: nName.trim() && parseInt(nMeta, 10) ? `linear-gradient(180deg, ${nColor}, ${shade(nColor, -0.15)})` : 'var(--surface)', color: nName.trim() && parseInt(nMeta, 10) ? '#fff' : 'var(--text-muted)' }}>Crear objetivo</button>
                  <button onClick={() => setCreating(false)} className="rounded-xl border border-line bg-surface px-3.5 py-3 text-[13px] text-muted">Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setCreating(true)} className="mb-3 w-full rounded-2xl border border-dashed border-line-strong py-4 text-sm font-medium text-muted">
                + Crear nuevo objetivo de ahorro
              </button>
            )}
          </div>
        </div>
      )}

      {tab === 'mensual' && (
        <div>
          <div className="mb-3.5 rounded-[20px] border border-line bg-surface p-[18px]">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">Ahorro mensual</div>
            <div className="mb-2 text-[26px] font-bold tabular-nums tracking-[-0.5px] text-savings">
              ${fmtMonto(mensualRows[mensualRows.length - 1].total)}
              <span className="ml-1.5 text-[13px] font-medium text-muted">en mayo</span>
            </div>
            <Sparkline values={mensualRows.map((r) => r.total)} color="#D97706" height={70} />
            <div className="mt-1 flex justify-between text-[10.5px] text-muted">
              {mensualRows.map((r) => <span key={r.mes}>{r.label}</span>)}
            </div>
          </div>
          <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
            <div className="grid grid-cols-[60px_1fr_1fr_1fr] border-b border-line px-3.5 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
              <div>Mes</div>
              <div className="text-right">Fer</div>
              <div className="text-right">Pao</div>
              <div className="text-right">Total</div>
            </div>
            {[...mensualRows].reverse().map((r, i, arr) => (
              <div key={r.mes} className="grid grid-cols-[60px_1fr_1fr_1fr] items-center px-3.5 py-3 text-[13px] tabular-nums text-text" style={{ borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border)' }}>
                <div className="font-medium">{r.label}</div>
                <div className="text-right" style={{ color: '#2563EB' }}>${fmtMonto(r.fer)}</div>
                <div className="text-right" style={{ color: '#E11D48' }}>${fmtMonto(r.pao)}</div>
                <div className="text-right font-semibold">${fmtMonto(r.total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
