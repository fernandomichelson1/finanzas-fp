import { alpha } from '@/lib/color';

interface HeatGridProps {
  data: number[][];
  baseColor?: string;
  onSelect?: (cell: { row: number; col: number; value: number }) => void;
  selectedKey?: string | null;
}

/** Mapa de calor N filas × 7 días. Intensidad por valor. */
export function HeatGrid({ data, baseColor = '#DC2626', onSelect, selectedKey }: HeatGridProps) {
  const max = Math.max(...data.flat(), 1);
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const tile = 30;
  const gap = 4;
  return (
    <div className="flex flex-col" style={{ gap }}>
      <div className="grid" style={{ gridTemplateColumns: `repeat(7, ${tile}px)`, gap }}>
        {days.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold tracking-wide text-muted">
            {d}
          </div>
        ))}
      </div>
      {data.map((row, r) => (
        <div key={r} className="grid" style={{ gridTemplateColumns: `repeat(7, ${tile}px)`, gap }}>
          {row.map((v, c) => {
            const intensity = v / max;
            const key = `${r}-${c}`;
            const isSel = selectedKey === key;
            return (
              <div
                key={c}
                onClick={() => onSelect?.({ row: r, col: c, value: v })}
                style={{
                  width: tile,
                  height: tile,
                  borderRadius: 6,
                  background: v === 0 ? 'var(--surface-2)' : alpha(baseColor, 0.08 + intensity * 0.92),
                  border: isSel ? `1.5px solid ${baseColor}` : '1px solid var(--border)',
                  cursor: onSelect ? 'pointer' : 'default',
                  boxShadow: isSel ? `0 0 12px ${alpha(baseColor, 0.6)}` : 'none',
                  transition: 'all 160ms',
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
