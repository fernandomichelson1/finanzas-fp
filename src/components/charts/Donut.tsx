export interface DonutDatum {
  id: string;
  value: number;
  color: string;
  label?: string;
}

interface DonutProps {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
  onSelect?: (d: DonutDatum) => void;
  selectedId?: string | null;
}

/** Donut SVG con label central. Tap a un segmento lo resalta. */
export function Donut({
  data,
  size = 180,
  thickness = 22,
  centerLabel,
  centerSub,
  onSelect,
  selectedId,
}: DonutProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2 - thickness / 2;
  const cx = size / 2;
  const cy = size / 2;
  let angle = -Math.PI / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        {data.map((d, i) => {
          const portion = d.value / Math.max(total, 1);
          const a0 = angle;
          const a1 = angle + portion * Math.PI * 2;
          angle = a1;
          const x0 = cx + r * Math.cos(a0);
          const y0 = cy + r * Math.sin(a0);
          const x1 = cx + r * Math.cos(a1);
          const y1 = cy + r * Math.sin(a1);
          const large = portion > 0.5 ? 1 : 0;
          const path = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
          const isSel = selectedId === d.id;
          return (
            <path
              key={d.id || i}
              d={path}
              fill="none"
              stroke={d.color}
              strokeWidth={isSel ? thickness + 6 : thickness}
              opacity={selectedId && !isSel ? 0.35 : 1}
              style={{ cursor: onSelect ? 'pointer' : 'default', transition: 'all 200ms' }}
              onClick={() => onSelect?.(d)}
            />
          );
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        {centerLabel && (
          <div className="text-[21px] font-bold tabular-nums tracking-[-0.5px] text-text">
            {centerLabel}
          </div>
        )}
        {centerSub && (
          <div className="mt-0.5 text-[11px] uppercase tracking-wider text-muted">{centerSub}</div>
        )}
      </div>
    </div>
  );
}
