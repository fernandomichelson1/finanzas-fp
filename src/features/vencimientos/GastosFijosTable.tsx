import { useEffect, useState } from 'react';
import type { VencimientoRow } from '@/types/domain';
import { daysUntil, fechaCorta } from '@/lib/date';
import { urgenciaVenc } from './urgencia';
import { formatMiles, moneyToInput, parseMoney } from '@/lib/format';
import { alpha } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { Icon } from '@/components/ui/icons';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { useCatById } from '@/store/lookups';

const FALLBACK = { color: '#64748B', icono: '•', nombre: 'Otros' };

interface TableProps {
  rows: VencimientoRow[];
  /**
   * Confirma cambios del monto y/o del día. `changed` indica cuál se tocó:
   * el monto confirma (verde) creando/actualizando la instancia; el día solo
   * mueve el día del gasto (no confirma). Así, tocar solo el día NO pinta verde.
   */
  onCommit: (
    gfId: string,
    mes: string,
    monto: number,
    dia: number,
    changed: { montoChanged: boolean; diaChanged: boolean },
  ) => void;
  /** Botón circular (un clic): alterna confirmado (verde) ↔ sin confirmar (gris). */
  onToggleConfirm: (v: VencimientoRow) => void;
  onPagar: (v: VencimientoRow) => void;
  onUnpagar: (v: VencimientoRow) => void;
  onMenu: (v: VencimientoRow) => void;
}

/** Vista tipo planilla (desktop): ver todos los gastos fijos y rellenar rápido. */
export function GastosFijosTable({ rows, onCommit, onToggleConfirm, onPagar, onUnpagar, onMenu }: TableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {/* Header de columnas */}
      <div className="grid grid-cols-[1fr_186px_84px_150px_130px_40px] items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
        <div>Gasto</div>
        <div className="text-right">Monto</div>
        <div className="text-center">Día</div>
        <div>Estado</div>
        <div className="text-center">Pago</div>
        <div />
      </div>
      {rows.map((v, i) => (
        <Row key={v.id} v={v} isLast={i === rows.length - 1} onCommit={onCommit} onToggleConfirm={onToggleConfirm} onPagar={onPagar} onUnpagar={onUnpagar} onMenu={onMenu} />
      ))}
    </div>
  );
}

function Row({
  v,
  isLast,
  onCommit,
  onToggleConfirm,
  onPagar,
  onUnpagar,
  onMenu,
}: {
  v: VencimientoRow;
  isLast: boolean;
  onCommit: TableProps['onCommit'];
  onToggleConfirm: TableProps['onToggleConfirm'];
  onPagar: TableProps['onPagar'];
  onUnpagar: TableProps['onUnpagar'];
  onMenu: TableProps['onMenu'];
}) {
  const cat = useCatById(v.cat) ?? FALLBACK;
  const [monto, setMonto] = useState(moneyToInput(v.monto));
  const [dia, setDia] = useState(String(v.diaVenc));
  // Flags separados: tipear el MONTO confirma (verde); tocar solo el DÍA no. Sólo
  // se marca al tipear (no por entrar/salir del campo).
  const [montoDirty, setMontoDirty] = useState(false);
  const [diaDirty, setDiaDirty] = useState(false);

  // Resincroniza si cambia desde afuera (otro pago, sync de Pao, etc.), pero NO
  // mientras el usuario está editando (para no pisar lo que escribió sin blurear).
  useEffect(() => {
    if (montoDirty || diaDirty) return;
    setMonto(moneyToInput(v.monto));
    setDia(String(v.diaVenc));
  }, [v.monto, v.diaVenc, montoDirty, diaDirty]);

  const clampDia = () => Math.max(1, Math.min(31, Number(dia) || v.diaVenc));

  const commit = () => {
    // Entrar/salir sin tipear NO confirma. El monto confirma (verde); el día solo
    // mueve el día del gasto (sin pintar verde).
    if (!montoDirty && !diaDirty) return;
    onCommit(v.gfId, v.mes, parseMoney(monto), clampDia(), { montoChanged: montoDirty, diaChanged: diaDirty });
    setMontoDirty(false);
    setDiaDirty(false);
  };

  // Círculo de confirmación (un clic). Gris → confirma con el valor MOSTRADO (lo
  // tipeado o el arrastrado). Verde → des-confirma. El onMouseDown con preventDefault
  // evita que el botón robe el foco del input y dispare un commit en paralelo.
  const confirmCircle = () => {
    if (v.pagado) return;
    if (v.prefilled) {
      onCommit(v.gfId, v.mes, parseMoney(monto), clampDia(), { montoChanged: true, diaChanged: diaDirty });
      setMontoDirty(false);
      setDiaDirty(false);
    } else {
      onToggleConfirm(v);
    }
  };

  const dr = daysUntil(v.vence);
  const { color: urg, rojo: urgentRed } = urgenciaVenc(dr, v.pagado, !v.prefilled);
  const estado = v.pagado
    ? v.pagadoFecha
      ? `Pagado ${fechaCorta(v.pagadoFecha)}`
      : 'Pagado'
    : dr < 0
      ? `Vencido hace ${-dr}d`
      : dr === 0
        ? 'Vence hoy'
        : dr === 1
          ? 'Vence mañana'
          : `En ${dr} días`;

  return (
    <div
      className="grid grid-cols-[1fr_186px_84px_150px_130px_40px] items-center gap-2 px-4 py-2 transition-colors hover:bg-surface-2/40"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)', opacity: v.pagado ? 0.7 : 1 }}
    >
      {/* Gasto (clic → pagar si está pendiente) */}
      <div
        className="flex min-w-0 items-center gap-2.5"
        onClick={!v.pagado ? () => onPagar(v) : undefined}
        role={!v.pagado ? 'button' : undefined}
        title={!v.pagado ? 'Pagar' : undefined}
        style={{ cursor: v.pagado ? 'default' : 'pointer' }}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg"
          style={{ background: alpha(cat.color, 0.12), color: cat.color, border: `1px solid ${alpha(cat.color, 0.2)}` }}
        >
          <CatIcon item={cat} size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13.5px] font-medium text-text">{v.nombre}</span>
            <OwnerBadge owner={v.owner} />
          </div>
          <div className="truncate text-[11px] text-muted">{cat.nombre}</div>
        </div>
      </div>

      {/* Monto + círculo de confirmación (un clic: gris ↔ verde) */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={confirmCircle}
          disabled={v.pagado}
          aria-label={v.prefilled ? 'Confirmar monto' : 'Quitar confirmación'}
          title={
            v.pagado
              ? 'Pagado'
              : v.prefilled
                ? 'Confirmar este monto (queda en verde)'
                : 'Confirmado — clic para volver a gris'
          }
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors"
          style={{
            borderColor: v.pagado || !v.prefilled ? '#22C55E' : 'var(--border-strong)',
            background: v.pagado || !v.prefilled ? alpha('#22C55E', 0.16) : 'transparent',
            color: '#22C55E',
            cursor: v.pagado ? 'default' : 'pointer',
          }}
        >
          {(v.pagado || !v.prefilled) && <Icon.check size={13} strokeWidth={3} />}
        </button>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
          <input
            value={monto}
            inputMode="decimal"
            disabled={v.pagado}
            title={
              v.pagado
                ? undefined
                : v.prefilled
                  ? 'Monto del mes anterior. Escribilo (aunque sea igual) o tocá el círculo para confirmar.'
                  : 'Confirmado. Tocá el círculo verde para volver a gris.'
            }
            onChange={(e) => { setMonto(formatMiles(e.target.value)); setMontoDirty(true); }}
            onBlur={commit}
            onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
            className="w-full rounded-lg border bg-surface-2 py-1.5 pl-6 pr-2 text-right text-[13.5px] font-semibold tabular-nums outline-none focus:border-accent disabled:opacity-60"
            style={{
              color: v.pagado ? 'var(--text)' : v.prefilled ? 'var(--text-muted)' : '#22C55E',
              borderColor: v.prefilled && !v.pagado ? 'var(--border-strong)' : 'var(--border)',
              borderStyle: v.prefilled && !v.pagado ? 'dashed' : 'solid',
            }}
          />
        </div>
      </div>

      {/* Día inline */}
      <input
        type="number"
        min={1}
        max={31}
        value={dia}
        disabled={v.pagado}
        onChange={(e) => { setDia(e.target.value); setDiaDirty(true); }}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="w-full rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-center text-[13.5px] font-semibold tabular-nums text-text outline-none focus:border-accent disabled:opacity-60"
      />

      {/* Estado */}
      <div className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: urg }}>
        {urgentRed && <span className="h-1.5 w-1.5 rounded-full" style={{ background: urg, boxShadow: `0 0 6px ${urg}` }} />}
        {estado}
      </div>

      {/* Pago */}
      <div className="flex justify-center">
        {v.pagado ? (
          <button
            onClick={() => onUnpagar(v)}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-medium text-muted"
            title="Desmarcar pago"
          >
            <Icon.check size={13} strokeWidth={3} style={{ color: '#4ADE80' }} /> Pagado
          </button>
        ) : (
          <button
            onClick={() => onPagar(v)}
            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' }}
          >
            <Icon.check size={13} strokeWidth={3} /> Pagar
          </button>
        )}
      </div>

      {/* Kebab */}
      <button onClick={() => onMenu(v)} aria-label="Opciones" className="flex h-7 w-7 items-center justify-center justify-self-center rounded-lg text-muted hover:bg-surface-2">
        <Icon.dotsV size={16} />
      </button>
    </div>
  );
}
