import { useMemo, useState } from 'react';
import type { ObjetivoOwner } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { MES_ACTUAL, addMonths, mesLabelCorto } from '@/lib/date';
import { fmtARSCompact, fmtMonto } from '@/lib/format';
import { alpha, shade } from '@/lib/color';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { ProgressRing, Sparkline } from '@/components/charts';
import { AdaptiveDialog } from '@/components/ui/AdaptiveDialog';
import { Icon } from '@/components/ui/icons';

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

const blankForm = { name: '', meta: '', fecha: '', color: '#06B6D4', icono: '🎯', owner: 'compartido' as ObjetivoOwner };

export function AhorrosScreen() {
  const objetivos = useFinanzasStore((s) => s.objetivos);
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const users = useFinanzasStore((s) => s.users);
  const logAporte = useFinanzasStore((s) => s.logAporte);
  const createObjetivo = useFinanzasStore((s) => s.createObjetivo);
  const updateObjetivo = useFinanzasStore((s) => s.updateObjetivo);
  const deleteObjetivo = useFinanzasStore((s) => s.deleteObjetivo);

  const [tab, setTab] = useState<'objetivos' | 'mensual'>('objetivos');
  const [aporteFor, setAporteFor] = useState<string | null>(null);
  const [aporteMonto, setAporteMonto] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [f, setF] = useState(blankForm);

  // Registro mensual REAL: aportes (movimientos tipo 'ahorro') de los últimos 6 meses.
  const mensualRows = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const mes = addMonths(MES_ACTUAL, -(5 - i));
        const aportes = movimientos.filter((m) => m.tipo === 'ahorro' && m.fecha.startsWith(mes));
        const fer = aportes.filter((m) => m.user === 'fer').reduce((s, m) => s + m.monto, 0);
        const pao = aportes.filter((m) => m.user === 'pao').reduce((s, m) => s + m.monto, 0);
        return { mes, label: mesLabelCorto(mes), fer, pao, total: fer + pao };
      }),
    [movimientos],
  );

  const totalAhorrado = mensualRows.reduce((s, r) => s + r.total, 0);
  const promedio = Math.round(totalAhorrado / mensualRows.length);
  const mejor = mensualRows.reduce((b, r) => (r.total > b.total ? r : b), mensualRows[0]);
  const enObjetivos = objetivos.reduce((s, o) => s + o.actual, 0);
  const hayAhorro = totalAhorrado > 0;

  const submitAporte = () => {
    const m = parseInt(aporteMonto || '0', 10);
    if (m > 0 && aporteFor) {
      logAporte(aporteFor, m);
      setAporteFor(null);
      setAporteMonto('');
    }
  };

  const openCreate = () => { setEditId(null); setF(blankForm); setFormOpen(true); };
  const openEdit = (id: string) => {
    const o = objetivos.find((x) => x.id === id);
    if (!o) return;
    setEditId(id);
    setF({ name: o.nombre, meta: String(o.meta), fecha: o.fecha_limite ?? '', color: o.color, icono: o.icono, owner: o.owner ?? 'compartido' });
    setFormOpen(true);
  };
  const canSubmit = f.name.trim() !== '' && !!parseInt(f.meta, 10);
  const submitForm = () => {
    if (!canSubmit) return;
    const payload = { nombre: f.name.trim(), meta: parseInt(f.meta, 10), color: f.color, icono: f.icono, fecha_limite: f.fecha || null, owner: f.owner };
    if (editId) updateObjetivo(editId, payload);
    else createObjetivo({ ...payload, actual: 0, creado_por: currentUser, estado: 'activo' });
    setFormOpen(false);
    setEditId(null);
    setF(blankForm);
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
        <KPI label="Mejor mes" value={mejor.total > 0 ? `${mejor.label} · ${fmtARSCompact(mejor.total)}` : '—'} color="#22C55E" />
        <KPI label="En objetivos" value={fmtARSCompact(enObjetivos)} color="#22C55E" />
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
          {objetivos.length === 0 && (
            <div className="mb-3 rounded-[18px] border border-dashed border-line-strong bg-surface-2 px-6 py-8 text-center lg:col-span-2">
              <div className="mb-2 text-4xl opacity-60">🎯</div>
              <div className="text-sm font-semibold text-text">Todavía no hay objetivos</div>
              <div className="mt-1 text-xs text-muted">Creá el primero (viaje, auto, fondo de emergencia…) y registrá aportes.</div>
            </div>
          )}
          {objetivos.map((o) => {
            const pct = Math.min(1, o.actual / o.meta);
            const remaining = Math.max(0, o.meta - o.actual);
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
                    <button onClick={() => openEdit(o.id)} aria-label="Editar objetivo" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-text">
                      <Icon.edit size={16} />
                    </button>
                    <button onClick={() => setDelId(o.id)} aria-label="Eliminar objetivo" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-[#F87171]">
                      <Icon.trash size={16} />
                    </button>
                    <ProgressRing pct={pct} size={48} thickness={5} color={o.color} label={`${Math.round(pct * 100)}%`} />
                  </div>
                  <div className="mb-1.5">
                    <span className="text-[22px] font-bold tabular-nums tracking-[-0.5px] text-text">${fmtMonto(o.actual)}</span>
                    <span className="ml-1.5 text-xs text-muted">/ ${fmtMonto(o.meta)}</span>
                  </div>
                  <div className="mb-3.5 h-2 overflow-hidden rounded-sm bg-surface-2">
                    <div className="h-full" style={{ width: `${pct * 100}%`, background: `linear-gradient(90deg, ${o.color} 0%, ${shade(o.color, 0.15)} 100%)`, boxShadow: `0 0 10px ${alpha(o.color, 0.6)}` }} />
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

          <div className="lg:col-span-2">
            <button onClick={openCreate} className="mb-3 w-full rounded-2xl border border-dashed border-line-strong py-4 text-sm font-medium text-muted">
              + Crear nuevo objetivo de ahorro
            </button>
          </div>
        </div>
      )}

      {tab === 'mensual' && (
        <div>
          <div className="mb-3.5 rounded-[20px] border border-line bg-surface p-[18px]">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-muted">Ahorro de este mes</div>
            <div className="mb-2 text-[26px] font-bold tabular-nums tracking-[-0.5px] text-savings">
              ${fmtMonto(mensualRows[mensualRows.length - 1].total)}
              <span className="ml-1.5 text-[13px] font-medium text-muted">en {mensualRows[mensualRows.length - 1].label}</span>
            </div>
            <Sparkline values={mensualRows.map((r) => r.total)} color="#D97706" height={70} />
            <div className="mt-1 flex justify-between text-[10.5px] text-muted">
              {mensualRows.map((r) => <span key={r.mes}>{r.label}</span>)}
            </div>
          </div>
          {!hayAhorro ? (
            <div className="rounded-[18px] border border-line bg-surface px-6 py-8 text-center">
              <div className="mb-2 text-3xl opacity-60">🐷</div>
              <div className="text-sm font-semibold text-text">Sin aportes registrados</div>
              <div className="mt-1 text-xs text-muted">Registrá un aporte en un objetivo y aparecerá acá el ahorro mensual de cada uno.</div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[20px] border border-line bg-surface">
              <div className="grid grid-cols-[60px_1fr_1fr_1fr] border-b border-line px-3.5 py-3 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
                <div>Mes</div>
                <div className="text-right">{users.fer?.nombre ?? 'Fer'}</div>
                <div className="text-right">{users.pao?.nombre ?? 'Pao'}</div>
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
          )}
        </div>
      )}

      {/* Alta / edición de objetivo */}
      {formOpen && (
        <AdaptiveDialog open onClose={() => { setFormOpen(false); setEditId(null); }}>
          <div className="overflow-y-auto p-[18px]">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[14px] text-xl text-white" style={{ background: `linear-gradient(135deg, ${f.color} 0%, ${shade(f.color, -0.18)} 100%)` }}>{f.icono}</div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-text">{f.name || (editId ? 'Editar objetivo' : 'Nuevo objetivo')}</div>
                <div className="text-[11.5px] text-muted">{f.meta ? `Meta: $${fmtMonto(parseInt(f.meta, 10))}` : 'Sin meta definida'}</div>
              </div>
              <button onClick={() => { setFormOpen(false); setEditId(null); }} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-xl text-text hover:bg-surface-2"><Icon.close size={18} /></button>
            </div>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nombre (ej. Viaje, Auto...)" autoFocus className="mb-2.5 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <input type="number" value={f.meta} onChange={(e) => setF({ ...f, meta: e.target.value })} placeholder="$ meta" className="mb-2.5 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm tabular-nums text-text outline-none" />
            <input type="date" value={f.fecha} onChange={(e) => setF({ ...f, fecha: e.target.value })} className="mb-2.5 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <div className="mb-2.5 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button key={c} onClick={() => setF({ ...f, color: c })} className="h-7 w-7 rounded-full" style={{ background: `linear-gradient(135deg, ${c}, ${shade(c, -0.18)})`, border: f.color === c ? '2.5px solid var(--text)' : '2px solid transparent', boxShadow: f.color === c ? `0 0 12px ${alpha(c, 0.6)}` : 'none' }} />
              ))}
            </div>
            <div className="mb-3.5 flex flex-wrap gap-1.5">
              {ICONS.map((i) => (
                <button key={i} onClick={() => setF({ ...f, icono: i })} className="h-9 w-9 rounded-[10px] text-lg" style={{ background: f.icono === i ? alpha(f.color, 0.15) : 'var(--surface)', border: f.icono === i ? `2px solid ${f.color}` : '1px solid var(--border)' }}>{i}</button>
              ))}
            </div>
            <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[1px] text-muted">¿De quién es?</div>
            <div className="mb-3.5 flex gap-1.5">
              {(['compartido', 'fer', 'pao'] as ObjetivoOwner[]).map((id) => {
                const active = f.owner === id;
                const col = id === 'compartido' ? '#3B82F6' : (users[id]?.color ?? '#3B82F6');
                const label = id === 'compartido' ? 'Compartido' : (users[id]?.nombre ?? id);
                return (
                  <button key={id} onClick={() => setF({ ...f, owner: id })} className="flex-1 rounded-[10px] py-2 text-[12.5px] font-semibold" style={{ background: active ? alpha(col, 0.15) : 'var(--surface)', color: active ? col : 'var(--text-muted)', border: `1px solid ${active ? col : 'var(--border)'}` }}>{label}</button>
                );
              })}
            </div>
            <button onClick={submitForm} disabled={!canSubmit} className="w-full rounded-xl py-3 text-sm font-semibold" style={{ background: canSubmit ? `linear-gradient(180deg, ${f.color}, ${shade(f.color, -0.15)})` : 'var(--surface)', color: canSubmit ? '#fff' : 'var(--text-muted)' }}>
              {editId ? 'Guardar cambios' : 'Crear objetivo'}
            </button>
          </div>
        </AdaptiveDialog>
      )}

      {/* Confirmar borrado */}
      {delId && (
        <AdaptiveDialog open onClose={() => setDelId(null)}>
          <div className="p-[22px]">
            <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: alpha('#F87171', 0.15), color: '#F87171' }}>
              <Icon.trash size={28} />
            </div>
            <h3 className="m-0 text-center text-[17px] font-bold tracking-[-0.3px] text-text">¿Eliminar objetivo?</h3>
            <p className="mx-auto mb-4 mt-2 max-w-[320px] text-center text-[13px] leading-relaxed text-muted">
              <strong className="font-semibold text-text">{objetivos.find((o) => o.id === delId)?.nombre}</strong> se elimina de tus ahorros. Los aportes ya registrados como movimientos no se borran.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDelId(null)} className="flex-1 rounded-xl border border-line bg-surface-2 py-3 text-sm font-medium text-text">Cancelar</button>
              <button onClick={() => { deleteObjetivo(delId); setDelId(null); }} className="flex-1 rounded-xl py-3 text-sm font-semibold text-white" style={{ background: '#DC2626', boxShadow: '0 4px 12px rgba(220,38,38,0.32)' }}>Eliminar</button>
            </div>
          </div>
        </AdaptiveDialog>
      )}
    </div>
  );
}
