import { useState } from 'react';
import type { Caja, Movimiento } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { cajasConSubcuentas, cajasUsables } from '@/lib/selectors';
import { TIPO_LABEL, formatMiles, moneyToInput, parseMoney, tipoColor } from '@/lib/format';
import { alpha, shade } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { Icon } from '@/components/ui/icons';
import { AdaptiveDialog } from '@/components/ui/AdaptiveDialog';

/** Editar (o borrar) un movimiento existente desde cualquier lista. */
export function MovEditSheet({ mov, onClose }: { mov: Movimiento; onClose: () => void }) {
  const updateMovimiento = useFinanzasStore((s) => s.updateMovimiento);
  const deleteMovimiento = useFinanzasStore((s) => s.deleteMovimiento);
  const allCajas = useFinanzasStore((s) => s.cajas);
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const users = useFinanzasStore((s) => s.users);

  const [monto, setMonto] = useState(moneyToInput(mov.monto));
  const [desc, setDesc] = useState(mov.desc);
  const [fecha, setFecha] = useState(mov.fecha);
  const [cajaId, setCajaId] = useState<string | null>(mov.caja ?? null);
  const [cajaOrigenId, setCajaOrigenId] = useState<string | null>(mov.caja_origen ?? null);
  const [confirmDel, setConfirmDel] = useState(false);

  const esAporte = mov.tipo === 'ahorro' && mov.caja == null && mov.caja_origen == null;
  const needsOrigen = (mov.tipo === 'transferencia' || mov.tipo === 'ahorro') && !esAporte;
  const hasCaja = !esAporte && (needsOrigen || mov.tipo === 'gasto' || mov.tipo === 'ingreso' || mov.tipo === 'retencion');
  const color = tipoColor(mov.tipo);

  // Opciones de caja: en transferencia todas; si no, propias + efectivo. Incluye
  // siempre las cajas que ya tiene el movimiento (por si no están en el set).
  const base = mov.tipo === 'transferencia' ? cajasConSubcuentas(allCajas, () => true, currentUser) : cajasUsables(allCajas, currentUser);
  const ensure = (list: Caja[], id: string | null): Caja[] => {
    if (!id || list.some((c) => c.id === id)) return list;
    const c = allCajas.find((x) => x.id === id);
    return c ? [c, ...list] : list;
  };
  const cajaOpts = ensure(ensure(base, cajaId), cajaOrigenId);

  const montoNum = parseMoney(monto);
  const canSave = montoNum > 0 && (!needsOrigen || (!!cajaOrigenId && !!cajaId && cajaOrigenId !== cajaId));

  const save = () => {
    if (!canSave) return;
    const patch: Partial<Movimiento> = { monto: montoNum, desc: desc.trim() || mov.desc, fecha };
    if (needsOrigen) {
      patch.caja = cajaId;
      patch.caja_origen = cajaOrigenId;
    } else if (hasCaja) {
      patch.caja = cajaId;
    }
    updateMovimiento(mov.id, patch);
    onClose();
  };

  return (
    <AdaptiveDialog open onClose={onClose}>
      <div className="overflow-y-auto overscroll-contain p-[18px]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="rounded-md px-2 py-1 text-[11.5px] font-semibold uppercase tracking-wide" style={{ background: alpha(color, 0.13), color }}>
              {TIPO_LABEL[mov.tipo]}
            </div>
            <h2 className="m-0 text-lg font-bold tracking-[-0.3px] text-text">Editar movimiento</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-xl text-text hover:bg-surface-2"><Icon.close size={18} /></button>
        </div>

        {/* Monto */}
        <label className="mb-3.5 block">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Monto</div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-muted">$</span>
            <input inputMode="decimal" value={monto} onChange={(e) => setMonto(formatMiles(e.target.value))} className="w-full rounded-xl border border-line bg-surface py-3 pl-7 pr-3 text-[18px] font-semibold tabular-nums text-text outline-none focus:border-accent" />
          </div>
        </label>

        {/* Descripción */}
        <label className="mb-3.5 block">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Descripción</div>
          <input value={desc} onChange={(e) => setDesc(e.target.value)} className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-text outline-none focus:border-accent" />
        </label>

        {/* Fecha */}
        <label className="mb-3.5 block">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Fecha</div>
          <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] tabular-nums text-text outline-none focus:border-accent" />
        </label>

        {/* Caja(s) */}
        {hasCaja && (
          <div className="mb-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">{needsOrigen ? 'Desde · caja de origen' : 'Caja'}</div>
            <CajaPicker cajas={cajaOpts} selectedId={needsOrigen ? cajaOrigenId : cajaId} excludeId={needsOrigen ? cajaId : null} onSelect={(id) => (needsOrigen ? setCajaOrigenId(id) : setCajaId(id))} allCajas={allCajas} usersMap={users} currentUser={currentUser} />
            {needsOrigen && (
              <>
                <div className="mb-1.5 mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Hacia · caja de destino</div>
                <CajaPicker cajas={cajaOpts} selectedId={cajaId} excludeId={cajaOrigenId} onSelect={setCajaId} allCajas={allCajas} usersMap={users} currentUser={currentUser} />
              </>
            )}
          </div>
        )}

        {/* Acciones */}
        {confirmDel ? (
          <div className="rounded-[14px] border p-3.5" style={{ borderColor: alpha('#DC2626', 0.35), background: alpha('#DC2626', 0.07) }}>
            <div className="mb-2.5 text-[13px] font-semibold text-text">¿Eliminar este movimiento?</div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDel(false)} className="flex-1 rounded-[10px] border border-line bg-surface py-2.5 text-[13px] font-medium text-muted">Cancelar</button>
              <button onClick={() => { deleteMovimiento(mov.id); onClose(); }} className="flex-1 rounded-[10px] py-2.5 text-[13px] font-semibold text-white" style={{ background: '#DC2626' }}>Eliminar</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setConfirmDel(true)} aria-label="Eliminar" className="flex items-center justify-center gap-1.5 rounded-[14px] border px-4 py-3.5 text-[14px] font-semibold" style={{ borderColor: alpha('#F87171', 0.3), color: '#F87171' }}>
              <Icon.trash size={16} />
            </button>
            <button onClick={save} disabled={!canSave} className="flex-1 rounded-[14px] py-3.5 text-[15px] font-semibold" style={{ background: canSave ? `linear-gradient(135deg, ${color} 0%, ${shade(color, -0.18)} 100%)` : 'var(--surface-2)', color: canSave ? '#fff' : 'var(--text-muted)', boxShadow: canSave ? `0 8px 20px ${alpha(color, 0.3)}` : 'none' }}>
              Guardar cambios
            </button>
          </div>
        )}
      </div>
    </AdaptiveDialog>
  );
}

function CajaPicker({ cajas, selectedId, onSelect, excludeId, allCajas, usersMap, currentUser }: { cajas: Caja[]; selectedId: string | null; onSelect: (id: string) => void; excludeId: string | null; allCajas: Caja[]; usersMap: Record<string, { nombre: string }>; currentUser: string }) {
  const items = cajas.filter((c) => !excludeId || c.id !== excludeId);
  return (
    <div className="hide-scroll flex gap-2 overflow-x-auto pb-1">
      {items.map((c) => {
        const sel = selectedId === c.id;
        const parent = c.parent ? allCajas.find((p) => p.id === c.parent) : null;
        const otro = c.owner !== currentUser ? usersMap[c.owner]?.nombre ?? '' : null;
        const hint = parent ? (otro ? `${parent.nombre} · ${otro}` : parent.nombre) : otro ? `de ${otro}` : null;
        return (
          <button key={c.id} onClick={() => onSelect(c.id)} className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: sel ? `linear-gradient(135deg, ${c.color} 0%, ${shade(c.color, -0.18)} 100%)` : 'var(--surface-2)', border: `1px solid ${sel ? c.color : 'var(--border)'}`, color: sel ? '#fff' : 'var(--text)' }}>
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-[7px]" style={{ background: sel ? 'rgba(255,255,255,0.22)' : alpha(c.color, 0.15) }}>
              <CatIcon item={c} size={16} />
            </div>
            <span className="flex flex-col items-start leading-tight">
              <span className="whitespace-nowrap text-[13px] font-semibold">{parent && <span className="opacity-70">↳ </span>}{c.nombre}</span>
              {hint && <span className="whitespace-nowrap text-[9.5px] font-medium opacity-70">{hint}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}
