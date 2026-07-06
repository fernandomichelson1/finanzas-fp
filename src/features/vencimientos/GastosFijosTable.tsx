import { useEffect, useState } from 'react';
import type { VencimientoRow } from '@/types/domain';
import { daysUntil } from '@/lib/date';
import { alpha } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { Icon } from '@/components/ui/icons';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { useCatById } from '@/store/lookups';

const FALLBACK = { color: '#64748B', icono: '•', nombre: 'Otros' };

interface TableProps {
  rows: VencimientoRow[];
  onCommit: (gfId: string, mes: string, monto: number, dia: number) => void;
  onPagar: (v: VencimientoRow) => void;
  onUnpagar: (v: VencimientoRow) => void;
  onMenu: (v: VencimientoRow) => void;
}

/** Vista tipo planilla (desktop): ver todos los gastos fijos y rellenar rápido. */
export function GastosFijosTable({ rows, onCommit, onPagar, onUnpagar, onMenu }: TableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      {/* Header de columnas */}
      <div className="grid grid-cols-[1fr_150px_84px_150px_130px_40px] items-center gap-2 border-b border-line bg-surface-2 px-4 py-2.5 text-[10.5px] font-semibold uppercase tracking-wide text-muted">
        <div>Gasto</div>
        <div className="text-right">Monto</div>
        <div className="text-center">Día</div>
        <div>Estado</div>
        <div className="text-center">Pago</div>
        <div />
      </div>
      {rows.map((v, i) => (
        <Row key={v.id} v={v} isLast={i === rows.length - 1} onCommit={onCommit} onPagar={onPagar} onUnpagar={onUnpagar} onMenu={onMenu} />
      ))}
    </div>
  );
}

function Row({
  v,
  isLast,
  onCommit,
  onPagar,
  onUnpagar,
  onMenu,
}: {
  v: VencimientoRow;
  isLast: boolean;
  onCommit: TableProps['onCommit'];
  onPagar: TableProps['onPagar'];
  onUnpagar: TableProps['onUnpagar'];
  onMenu: TableProps['onMenu'];
}) {
  const cat = useCatById(v.cat) ?? FALLBACK;
  const [monto, setMonto] = useState(String(v.monto));
  const [dia, setDia] = useState(String(Number(v.vence.split('-')[2])));

  // Resincroniza si cambia desde afuera (otro pago, sync de Pao, etc.)
  useEffect(() => {
    setMonto(String(v.monto));
    setDia(String(Number(v.vence.split('-')[2])));
  }, [v.monto, v.vence]);

  const commit = () => {
    const n = Number(String(monto).replace(/[^\d.]/g, ''));
    const d = Math.max(1, Math.min(31, Number(dia) || 1));
    onCommit(v.gfId, v.mes, isNaN(n) ? 0 : n, d);
  };

  const dr = daysUntil(v.vence);
  const urgentRed = !v.pagado && dr <= 3;
  const urgentAmber = !v.pagado && !urgentRed && dr <= 10;
  const urg = v.pagado ? '#4ADE80' : urgentRed ? '#F87171' : urgentAmber ? '#F59E0B' : 'var(--text-muted)';
  const estado = v.pagado
    ? 'Pagado'
    : dr < 0
      ? `Vencido hace ${-dr}d`
      : dr === 0
        ? 'Vence hoy'
        : dr === 1
          ? 'Vence mañana'
          : `En ${dr} días`;

  return (
    <div
      className="grid grid-cols-[1fr_150px_84px_150px_130px_40px] items-center gap-2 px-4 py-2 transition-colors hover:bg-surface-2/40"
      style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)', opacity: v.pagado ? 0.7 : 1 }}
    >
      {/* Gasto */}
      <div className="flex min-w-0 items-center gap-2.5">
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

      {/* Monto inline */}
      <div className="relative">
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted">$</span>
        <input
          value={monto}
          inputMode="numeric"
          disabled={v.pagado}
          title={v.prefilled && !v.pagado ? 'Monto del mes anterior — ajustalo con la factura' : undefined}
          onChange={(e) => setMonto(e.target.value.replace(/[^\d.]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          className="w-full rounded-lg border bg-surface-2 py-1.5 pl-6 pr-2 text-right text-[13.5px] font-semibold tabular-nums outline-none focus:border-accent disabled:opacity-60"
          style={{
            color: v.prefilled && !v.pagado ? 'var(--text-muted)' : 'var(--text)',
            borderColor: v.prefilled && !v.pagado ? 'var(--border-strong)' : 'var(--border)',
            borderStyle: v.prefilled && !v.pagado ? 'dashed' : 'solid',
          }}
        />
      </div>

      {/* Día inline */}
      <input
        type="number"
        min={1}
        max={31}
        value={dia}
        disabled={v.pagado}
        onChange={(e) => setDia(e.target.value)}
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
