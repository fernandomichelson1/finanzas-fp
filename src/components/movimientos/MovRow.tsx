import type { Movimiento } from '@/types/domain';
import { fmtMonto, tipoColor, tipoSign } from '@/lib/format';
import { niceDate } from '@/lib/date';
import { alpha } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { useCajaById, useCatById, useUserById } from '@/store/lookups';

interface MovRowProps {
  mov: Movimiento;
  isLast?: boolean;
  onClick?: () => void;
  showTags?: boolean;
}

export function MovRow({ mov, isLast, onClick, showTags = false }: MovRowProps) {
  const catReal = useCatById(mov.cat);
  const u = useUserById(mov.user);
  const caja = useCajaById(mov.caja);
  const cajaOri = useCajaById(mov.caja_origen);

  const color = tipoColor(mov.tipo);
  const c = catReal ?? {
    color,
    icono: mov.tipo === 'transferencia' ? '↔' : '•',
    nombre: mov.tipo,
  };

  return (
    <div
      onClick={onClick}
      className="relative flex items-center gap-3 px-3.5 py-3 transition-colors"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      <div
        className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[11px]"
        style={{ background: alpha(c.color, 0.12), color: c.color, border: `1px solid ${alpha(c.color, 0.2)}` }}
      >
        <CatIcon item={c} size={22} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="truncate text-[14.5px] font-medium text-text">{mov.desc}</div>
        <div className="mt-0.5 flex items-center gap-1.5 truncate text-[11.5px] text-muted">
          <span>{niceDate(mov.fecha)}</span>
          {u && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white"
                  style={{ background: u.color }}
                >
                  {u.iniciales}
                </span>
                {u.nombre}
              </span>
            </>
          )}
          {caja && (
            <>
              <span className="opacity-40">·</span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: caja.color, boxShadow: `0 0 4px ${alpha(caja.color, 0.53)}` }}
                />
                {cajaOri ? `${cajaOri.nombre} → ${caja.nombre}` : caja.nombre}
              </span>
            </>
          )}
          {showTags && mov.tags?.[0] && (
            <>
              <span className="opacity-40">·</span>
              <span style={{ color: c.color }}>{mov.tags[0]}</span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0 text-right">
        <div
          className="whitespace-nowrap text-[14.5px] font-semibold tabular-nums tracking-[-0.2px]"
          style={{ color }}
        >
          {tipoSign(mov.tipo)}${fmtMonto(mov.monto)}
        </div>
      </div>
    </div>
  );
}
