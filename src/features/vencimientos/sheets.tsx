import { useState } from 'react';
import type { Owner, VencimientoRow } from '@/types/domain';
import { formatMiles, moneyToInput, parseMoney } from '@/lib/format';
import { alpha } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { Icon } from '@/components/ui/icons';
import { AdaptiveDialog } from '@/components/ui/AdaptiveDialog';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { useCatById } from '@/store/lookups';

const FALLBACK = { color: '#64748B', icono: '•', nombre: 'Otros' };

/** Selector de responsable (compartido / Fer / Pao). Reutilizado en alta + menú. */
function OwnerPicker({ value, onChange }: { value: Owner; onChange: (o: Owner) => void }) {
  const users = useFinanzasStore((s) => s.users);
  return (
    <div className="flex gap-1.5">
      {(['compartido', 'fer', 'pao'] as Owner[]).map((id) => {
        const active = value === id;
        const col = id === 'compartido' ? '#8B5CF6' : users[id]?.color ?? '#3B82F6';
        const label = id === 'compartido' ? 'Compartido' : users[id]?.nombre ?? id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className="flex-1 rounded-[10px] py-2.5 text-[12.5px] font-semibold"
            style={{
              background: active ? alpha(col, 0.15) : 'var(--surface)',
              color: active ? col : 'var(--text-muted)',
              border: `1px solid ${active ? col : 'var(--border)'}`,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

/** Pagar un vencimiento: editar monto/fecha/responsable + elegir caja y pagar. */
export function PagarSheet({ venc, onClose }: { venc: VencimientoRow; onClose: () => void }) {
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const cajas = useFinanzasStore((s) => s.cajas).filter((c) => c.owner === currentUser);
  const pagarVencimiento = useFinanzasStore((s) => s.pagarVencimiento);
  const updateInstancia = useFinanzasStore((s) => s.updateInstancia);
  const setGastoFijoOwnerFrom = useFinanzasStore((s) => s.setGastoFijoOwnerFrom);
  const [sel, setSel] = useState<string | null>(cajas[0]?.id ?? null);
  const [monto, setMonto] = useState(moneyToInput(venc.monto));
  const [dia, setDia] = useState(String(Number(venc.vence.split('-')[2])));
  const [owner, setOwner] = useState<Owner>(venc.owner);
  const c = useCatById(venc.cat) ?? FALLBACK;

  const parseMonto = () => parseMoney(monto);
  const fechaISO = () => `${venc.mes}-${String(Math.max(1, Math.min(31, Number(dia) || 1))).padStart(2, '0')}`;
  const applyOwner = (o: Owner) => {
    setOwner(o);
    if (o !== venc.owner) setGastoFijoOwnerFrom(venc.gfId, venc.mes, o);
  };
  const guardar = () => {
    updateInstancia(venc.gfId, venc.mes, { monto: parseMonto(), fecha: fechaISO() });
    onClose();
  };
  const pagar = () => {
    if (!sel) return;
    pagarVencimiento({ ...venc, monto: parseMonto(), vence: fechaISO() }, sel);
    onClose();
  };

  return (
    <AdaptiveDialog open onClose={onClose}>
      <div className="overflow-y-auto p-[18px]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-xl" style={{ background: alpha(c.color, 0.12), color: c.color, border: `1px solid ${alpha(c.color, 0.2)}` }}>
            <CatIcon item={c} size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm text-muted">Pagar</div>
            <div className="truncate text-lg font-bold tracking-[-0.3px] text-text">{venc.nombre}</div>
          </div>
        </div>

        {/* Monto + día editables */}
        <div className="mb-3.5 grid grid-cols-[2fr_1fr] gap-2.5">
          <label className="block">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Monto</div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[15px] text-muted">$</span>
              <input inputMode="decimal" value={monto} onChange={(e) => setMonto(formatMiles(e.target.value))} className="w-full rounded-xl border border-line bg-surface py-3 pl-7 pr-3 text-[17px] font-semibold tabular-nums text-text outline-none focus:border-accent" />
            </div>
          </label>
          <label className="block">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Día</div>
            <input type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} className="w-full rounded-xl border border-line bg-surface px-2.5 py-3 text-center text-[17px] font-semibold tabular-nums text-text outline-none focus:border-accent" />
          </label>
        </div>

        {/* Responsable (se aplica al tocar) */}
        <div className="mb-3.5">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">¿De quién es?</div>
          <OwnerPicker value={owner} onChange={applyOwner} />
        </div>

        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Desde qué caja</div>
        <div className="mb-4 flex flex-col gap-1.5">
          {cajas.map((ca) => {
            const active = sel === ca.id;
            return (
              <button
                key={ca.id}
                onClick={() => setSel(ca.id)}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left"
                style={{ background: active ? alpha(ca.color, 0.13) : 'var(--surface)', border: `1px solid ${active ? ca.color : 'var(--border)'}` }}
              >
                <div className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-[9px]" style={{ background: alpha(ca.color, 0.2) }}>
                  <CatIcon item={ca} size={18} />
                </div>
                <span className="flex-1 text-sm font-medium text-text">{ca.nombre}</span>
                {active && <Icon.check size={16} strokeWidth={3} style={{ color: ca.color }} />}
              </button>
            );
          })}
          {cajas.length === 0 && (
            <div className="rounded-xl border border-dashed border-line bg-surface-2 p-3.5 text-center text-[12.5px] text-muted">
              No tenés cuentas. Creá una desde Configuración → Cuentas.
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={guardar} className="rounded-[14px] border border-line bg-surface-2 px-4 py-3.5 text-[14px] font-semibold text-text">
            Guardar
          </button>
          <button
            onClick={pagar}
            disabled={!sel}
            className="flex flex-1 items-center justify-center gap-2 rounded-[14px] py-3.5 text-[15px] font-semibold"
            style={{ background: sel ? 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' : 'var(--surface-2)', color: sel ? '#fff' : 'var(--text-muted)', boxShadow: sel ? '0 8px 20px rgba(22,163,74,0.28)' : 'none' }}
          >
            <Icon.check size={16} strokeWidth={3} /> Confirmar pago
          </button>
        </div>
        <div className="mt-2 text-center text-[11px] text-muted">“Guardar” ajusta monto/fecha sin marcarlo pagado.</div>
      </div>
    </AdaptiveDialog>
  );
}

/** Crear gasto fijo nuevo. */
export function GastoFijoForm({ onClose, onSubmit }: { onClose: () => void; onSubmit: (p: { nombre: string; cat: string; diaVenc: number; montoSugerido: number; owner: Owner }) => void }) {
  const cats = useFinanzasStore((s) => s.categories).filter((c) => c.tipo === 'gasto' && c.uso !== 'eventual');
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const [nombre, setNombre] = useState('');
  const [cat, setCat] = useState('serv');
  const [dia, setDia] = useState('10');
  const [montoSug, setMontoSug] = useState('');
  const [owner, setOwner] = useState<Owner>(currentUser === 'pao' ? 'pao' : 'fer');

  const canSubmit = nombre.trim().length > 1 && Number(dia) >= 1 && Number(dia) <= 31;
  const submit = () => {
    if (!canSubmit) return;
    onSubmit({ nombre: nombre.trim(), cat, diaVenc: Math.max(1, Math.min(31, Number(dia))), montoSugerido: parseMoney(montoSug), owner });
  };

  return (
    <AdaptiveDialog open onClose={onClose}>
      <div className="overflow-y-auto p-[18px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="m-0 text-lg font-bold tracking-[-0.3px] text-text">Nuevo gasto fijo</h2>
            <div className="mt-0.5 text-[11.5px] text-muted">Se repite todos los meses</div>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-xl text-text hover:bg-surface-2">
            <Icon.close size={18} />
          </button>
        </div>

        <label className="mb-3.5 block">
          <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Nombre del gasto</div>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Colegio Salesiano" autoFocus className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-text outline-none" />
        </label>

        <div className="mb-3.5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">Categoría</div>
          <div className="grid grid-cols-4 gap-1.5">
            {cats.map((c) => {
              const sel = cat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  className="flex flex-col items-center gap-1 rounded-xl px-1.5 pb-2 pt-2.5 text-text"
                  style={{ background: sel ? alpha(c.color, 0.13) : 'var(--surface)', border: `1px solid ${sel ? c.color : 'var(--border)'}` }}
                >
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg" style={{ background: alpha(c.color, 0.12), color: c.color }}>
                    <CatIcon item={c} size={18} />
                  </div>
                  <span className="max-w-full truncate text-[9.5px] font-medium" style={{ color: sel ? 'var(--text)' : 'var(--text-muted)' }}>
                    {c.nombre.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3.5 grid grid-cols-[1fr_2fr] gap-2.5">
          <label className="block">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Día venc.</div>
            <input type="number" min={1} max={31} value={dia} onChange={(e) => setDia(e.target.value)} className="w-full rounded-xl border border-line bg-surface px-2.5 py-3 text-center text-[17px] font-semibold tabular-nums text-text outline-none" />
          </label>
          <label className="block">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Monto sugerido (opcional)</div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted">$</span>
              <input inputMode="decimal" placeholder="0" value={montoSug} onChange={(e) => setMontoSug(formatMiles(e.target.value))} className="w-full rounded-xl border border-line bg-surface py-3 pl-7 pr-3.5 text-[17px] font-semibold tabular-nums text-text outline-none" />
            </div>
          </label>
        </div>

        <div className="mb-5">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">¿De quién es?</div>
          <OwnerPicker value={owner} onChange={setOwner} />
        </div>

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full rounded-[14px] py-3.5 text-[15px] font-semibold"
          style={{ background: canSubmit ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' : 'var(--surface-2)', color: canSubmit ? '#fff' : 'var(--text-muted)', boxShadow: canSubmit ? '0 8px 20px rgba(37,99,235,0.32)' : 'none' }}
        >
          Crear gasto fijo
        </button>
      </div>
    </AdaptiveDialog>
  );
}

/** Menú kebab de una fila. */
export function RowMenuSheet({ venc, mesLabel, onClose, onEdit, onPause, onDelete, onSetOwner }: { venc: VencimientoRow; mesLabel: string; onClose: () => void; onEdit: () => void; onPause: () => void; onDelete: () => void; onSetOwner: (owner: Owner) => void }) {
  const c = useCatById(venc.cat) ?? FALLBACK;
  const [owner, setOwner] = useState<Owner>(venc.owner);
  const items = [
    { id: 'edit', label: 'Editar monto y fecha', sub: 'Solo este mes', icon: <Icon.edit size={16} />, onClick: onEdit, danger: false },
    { id: 'pause', label: 'Pausar gasto fijo', sub: 'Dejará de aparecer hasta reactivarlo', icon: <Icon.pause size={16} />, onClick: onPause, danger: false },
    { id: 'del', label: 'Eliminar gasto fijo', sub: 'Desaparece para siempre', icon: <Icon.trash size={16} />, onClick: onDelete, danger: true },
  ];
  return (
    <AdaptiveDialog open onClose={onClose}>
      <div className="p-[18px]">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-[11px]" style={{ background: alpha(c.color, 0.12), color: c.color, border: `1px solid ${alpha(c.color, 0.2)}` }}>
            <CatIcon item={c} size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[15px] font-bold tracking-[-0.2px] text-text">{venc.nombre}</div>
            <div className="text-[11.5px] text-muted">{c.nombre} · día {venc.diaVenc} de cada mes</div>
          </div>
        </div>

        <div className="mb-3">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Responsable</span>
            <span className="text-[10.5px] text-muted">desde {mesLabel} en adelante</span>
          </div>
          <OwnerPicker
            value={owner}
            onChange={(o) => {
              setOwner(o);
              onSetOwner(o);
            }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={it.onClick}
              className="flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left"
              style={{ background: it.danger ? alpha('#F87171', 0.08) : 'var(--surface)', borderColor: it.danger ? alpha('#F87171', 0.22) : 'var(--border)', color: it.danger ? '#F87171' : 'var(--text)' }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]" style={{ background: it.danger ? alpha('#F87171', 0.12) : 'var(--surface-2)', color: it.danger ? '#F87171' : 'var(--text)' }}>
                {it.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold">{it.label}</div>
                <div className="mt-0.5 text-[11.5px]" style={{ color: it.danger ? alpha('#F87171', 0.7) : 'var(--text-muted)' }}>{it.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AdaptiveDialog>
  );
}

/** Confirmación de borrado. */
export function ConfirmDeleteSheet({ nombre, onClose, onConfirm }: { nombre: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <AdaptiveDialog open onClose={onClose}>
      <div className="p-[22px]">
        <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: alpha('#F87171', 0.15), color: '#F87171' }}>
          <Icon.trash size={28} />
        </div>
        <h3 className="m-0 text-center text-[17px] font-bold tracking-[-0.3px] text-text">¿Eliminar gasto fijo?</h3>
        <p className="mx-auto mb-4 mt-2 max-w-[320px] text-center text-[13px] leading-relaxed text-muted">
          <strong className="font-semibold text-text">{nombre}</strong> dejará de aparecer en todos los meses. Los pagos ya marcados no se borran.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-line bg-surface-2 py-3 text-sm font-medium text-text">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 rounded-xl py-3 text-sm font-semibold text-white" style={{ background: '#DC2626', boxShadow: '0 4px 12px rgba(220,38,38,0.32)' }}>Eliminar</button>
        </div>
      </div>
    </AdaptiveDialog>
  );
}
