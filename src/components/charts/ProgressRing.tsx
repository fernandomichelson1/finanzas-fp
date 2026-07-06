interface ProgressRingProps {
  pct: number;
  size?: number;
  thickness?: number;
  color?: string;
  label?: string | number;
  sub?: string;
}

/** Anillo de progreso (objetivos / score). */
export function ProgressRing({
  pct,
  size = 64,
  thickness = 6,
  color = '#3B82F6',
  label,
  sub,
}: ProgressRingProps) {
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.min(Math.max(pct, 0), 1);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center tabular-nums">
        {label !== undefined && (
          <div className="font-bold text-text" style={{ fontSize: size * 0.22 }}>
            {label}
          </div>
        )}
        {sub && <div className="text-[9px] uppercase tracking-wide text-muted">{sub}</div>}
      </div>
    </div>
  );
}
