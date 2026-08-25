import { useState } from 'react';
import type { GastoFijo, VencimientoRow as VRow } from '@/types/domain';
import { fmtMonto, formatMiles, moneyToInput, parseMoney } from '@/lib/format';
import { fechaCorta, daysUntil, niceDate } from '@/lib/date';
import { urgenciaVenc } from './urgencia';
import { alpha } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { Icon } from '@/components/ui/icons';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { useCatById } from '@/store/lookups';

const FALLBACK = { color: '#64748B', icono: '•', nombre: 'Otros' };

export function VencimientoRow({
  v,
  editing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onPagar,
  onUnpagar,
  onMenu,
}: {
  v: VRow;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (payload: { monto: number; dia: number; soloEsteMes: boolean }) => void;
  onPagar: () => void;
  onUnpagar: () => void;
  onMenu: () => void;
}) {
  const cat = useCatById(v.cat);
  const c = cat ?? FALLBACK;
  const dr = daysUntil(v.vence);
  const { color: urg, rojo: urgentRed } = urgenciaVenc(dr, v.pagado);
  const venceLabel = v.pagado
    ? v.pagadoFecha
      ? `Pagado ${niceDate(v.pagadoFecha).toLowerCase()}`
      : 'Pagado'
    : dr < 0
      ? `Vencido hace ${-dr}d`
      : dr === 0
        ? 'Vence hoy'
        : dr === 1
          ? 'Vence mañana'
          : `En ${dr} días`;

  if (editing) return <EditRow v={v} color={c.color} onCancel={onCancelEdit} onSave={onSaveEdit} />;

  return (
    <div
      className="min-w-0 rounded-2xl border border-line bg-surface p-3.5 transition-opacity"
      style={{ opacity: v.pagado ? 0.78 : 1 }}
    >
      <div
        className="flex items-center gap-3 transition-transform"
        onClick={!v.pagado ? onPagar : undefined}
        role={!v.pagado ? 'button' : undefined}
        style={{ cursor: v.pagado ? 'default' : 'pointer' }}
      >
        <div
          className="relative flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-xl"
          style={{ background: alpha(c.color, 0.12), color: c.color, border: `1px solid ${alpha(c.color, 0.2)}` }}
        >
          <CatIcon item={c} size={26} />
          {v.pagado && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(74,222,128,0.85)', color: '#052e16' }}
            >
              <Icon.check size={22} strokeWidth={3.2} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span
              className="truncate text-[14.5px] font-semibold text-text"
              style={{ textDecoration: v.pagado ? 'line-through' : 'none' }}
            >
              {v.nombre}
            </span>
            <OwnerBadge owner={v.owner} />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className="text-[11px] text-muted">{c.nombre}</span>
            <span className="text-muted opacity-40">·</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: urg }}>
              {urgentRed && (
                <span className="h-[5px] w-[5px] rounded-full" style={{ background: urg, boxShadow: `0 0 6px ${urg}` }} />
              )}
              {venceLabel}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-1 text-right">
          <div>
            <div
              className="whitespace-nowrap text-[14.5px] font-bold tabular-nums tracking-[-0.3px]"
              style={{ color: v.pagado ? 'var(--text)' : v.prefilled ? 'var(--text-muted)' : '#22C55E' }}
            >
              ${fmtMonto(v.monto)}
            </div>
            <div
              className="mt-0.5 text-right text-[10.5px] font-semibold tracking-wide"
              style={{ color: v.prefilled && !v.pagado ? 'var(--text-muted)' : urg }}
            >
              {v.pagado
                ? fechaCorta(v.pagadoFecha ?? v.vence)
                : v.prefilled
                  ? 'mes pasado'
                  : fechaCorta(v.vence)}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenu();
            }}
            aria-label="Opciones"
            className="-mt-0.5 flex h-7 w-7 items-center justify-center rounded-lg text-muted"
          >
            <Icon.dotsV size={16} />
          </button>
        </div>
      </div>

      <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
        {!v.pagado ? (
          <>
            <button
              onClick={onPagar}
              className="flex flex-[2] items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-[13px] font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)', boxShadow: '0 4px 12px rgba(22,163,74,0.25)' }}
            >
              <Icon.check size={14} strokeWidth={3} /> Marcar pagado
            </button>
            <button
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface-2 py-2.5 text-[12.5px] font-medium text-text"
            >
              <Icon.edit size={13} /> Editar
            </button>
          </>
        ) : (
          <button
            onClick={onUnpagar}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-line bg-surface-2 py-2.5 text-[12.5px] font-medium text-muted"
          >
            <Icon.refresh size={13} /> Desmarcar pago
          </button>
        )}
      </div>
    </div>
  );
}

function EditRow({
  v,
  color,
  onCancel,
  onSave,
}: {
  v: VRow;
  color: string;
  onCancel: () => void;
  onSave: (payload: { monto: number; dia: number; soloEsteMes: boolean }) => void;
}) {
  const [monto, setMonto] = useState(moneyToInput(v.monto));
  // Día efectivo de ESTE mes (puede ser el fijo del gasto o un override del mes).
  const [dia, setDia] = useState(String(Number(v.vence.split('-')[2])));
  const [soloEsteMes, setSoloEsteMes] = useState(false);

  const submit = () => {
    const d = Math.max(1, Math.min(31, Number(dia) || v.diaVenc));
    onSave({ monto: parseMoney(monto), dia: d, soloEsteMes });
  };

  return (
    <div
      className="rounded-2xl bg-surface p-3.5"
      style={{ border: `1px solid ${alpha(color, 0.33)}`, boxShadow: `0 0 0 3px ${alpha(color, 0.09)}` }}
    >
      <div className="mb-3 text-[13.5px] font-semibold text-text">
        {v.nombre} <span className="text-[11px] font-normal text-muted">· monto de este mes · día fijo</span>
      </div>
      <div className="mb-2.5 grid grid-cols-[2fr_1fr] gap-2.5">
        <label className="block">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Monto</div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
            <input
              inputMode="decimal"
              value={monto}
              onChange={(e) => setMonto(formatMiles(e.target.value))}
              className="w-full rounded-[10px] border border-line bg-surface-2 py-2.5 pl-[22px] pr-3 text-[14.5px] font-semibold tabular-nums text-text outline-none"
            />
          </div>
        </label>
        <label className="block">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">Día venc.</div>
          <input
            type="number"
            min={1}
            max={31}
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            className="w-full rounded-[10px] border border-line bg-surface-2 px-3 py-2.5 text-center text-[14.5px] font-semibold text-text outline-none"
          />
        </label>
      </div>
      {/* Alcance del día de vencimiento */}
      <div className="mb-2.5">
        <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-wide text-muted">El día vence</div>
        <div className="flex gap-1.5">
          {[
            { solo: false, label: 'Todos los meses' },
            { solo: true, label: 'Solo este mes' },
          ].map((o) => {
            const active = soloEsteMes === o.solo;
            return (
              <button
                key={o.label}
                type="button"
                onClick={() => setSoloEsteMes(o.solo)}
                className="flex-1 rounded-[10px] py-2 text-[12px] font-semibold"
                style={{
                  background: active ? alpha(color, 0.15) : 'var(--surface-2)',
                  color: active ? color : 'var(--text-muted)',
                  border: `1px solid ${active ? color : 'var(--border)'}`,
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 rounded-[10px] border border-line bg-surface-2 py-2.5 text-[13px] font-medium text-muted">
          Cancelar
        </button>
        <button onClick={submit} className="flex-[2] rounded-[10px] py-2.5 text-[13px] font-semibold" style={{ background: 'var(--text)', color: 'var(--bg)' }}>
          Guardar
        </button>
      </div>
    </div>
  );
}

export function InactivoRow({ gf, onReactivar, onEliminar }: { gf: GastoFijo; onReactivar: () => void; onEliminar: () => void }) {
  const cat = useCatById(gf.cat);
  const c = cat ?? FALLBACK;
  return (
    <div className="min-w-0 rounded-2xl border border-dashed border-line-strong bg-surface p-3.5 opacity-85">
      <div className="flex items-center gap-3">
        <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 text-muted grayscale">
          <CatIcon item={c} size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[14.5px] font-semibold text-muted">{gf.nombre}</span>
            <OwnerBadge owner={gf.owner} />
          </div>
          <div className="mt-0.5 text-[11px] text-muted">{c.nombre} · Pausado</div>
        </div>
        <div className="text-right">
          <div className="text-[13px] font-semibold tabular-nums text-muted">día {gf.diaVenc}</div>
          <div className="mt-0.5 text-[10.5px] text-muted">${fmtMonto(gf.montoSugerido || 0)}</div>
        </div>
      </div>
      <div className="mt-3 flex gap-2 border-t border-line pt-2.5">
        <button onClick={onReactivar} className="flex flex-[2] items-center justify-center gap-1.5 rounded-[10px] border border-line-strong bg-surface-2 py-2.5 text-[13px] font-semibold text-text">
          <Icon.refresh size={13} /> Reactivar
        </button>
        <button onClick={onEliminar} className="flex-1 rounded-[10px] border py-2.5 text-[12.5px] font-medium" style={{ background: 'transparent', color: '#F87171', borderColor: alpha('#F87171', 0.3) }}>
          Eliminar
        </button>
      </div>
    </div>
  );
}
