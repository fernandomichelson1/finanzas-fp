interface BarDatum {
  mes: string;
  label: string;
  gastos: number;
  ingresos?: number;
  ahorro?: number;
  score?: number;
}
type BarKey = 'gastos' | 'ingresos' | 'ahorro' | 'score';

interface MonthlyBarsProps {
  data: readonly BarDatum[];
  valueKey?: BarKey;
  valueKey2?: BarKey | null;
  projectionNext?: readonly BarDatum[] | null;
  color?: string;
  color2?: string;
}

/** Barras mensuales con overlay opcional y proyección punteada. */
export function MonthlyBars({
  data,
  valueKey = 'gastos',
  valueKey2 = null,
  projectionNext = null,
  color = '#F87171',
  color2 = '#22C55E',
}: MonthlyBarsProps) {
  const max = Math.max(
    ...data.map((d) => Math.max(Number(d[valueKey]), valueKey2 ? Number(d[valueKey2]) : 0)),
    1,
  );
  const totalCols = data.length + (projectionNext ? projectionNext.length : 0);
  return (
    <div className="relative" style={{ height: 160 }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${totalCols * 10} 100`} preserveAspectRatio="none">
        {data.map((d, i) => {
          const h = (Number(d[valueKey]) / max) * 80;
          return (
            <g key={d.mes}>
              <rect
                x={i * 10 + 2}
                y={90 - h}
                width={6}
                height={h}
                fill={color}
                opacity={i === data.length - 1 ? 1 : 0.65}
                rx={1.2}
              />
              {valueKey2 && (
                <rect
                  x={i * 10 + 2}
                  y={90 - (Number(d[valueKey2]) / max) * 80}
                  width={2}
                  height={(Number(d[valueKey2]) / max) * 80}
                  fill={color2}
                  opacity={0.95}
                  rx={0.8}
                />
              )}
            </g>
          );
        })}
        {projectionNext?.map((d, i) => {
          const h = (Number(d[valueKey]) / max) * 80;
          const x = (data.length + i) * 10;
          return (
            <rect
              key={'p' + i}
              x={x + 2}
              y={90 - h}
              width={6}
              height={h}
              fill={color}
              opacity={0.25}
              stroke={color}
              strokeWidth={0.4}
              strokeDasharray="1 1"
              rx={1.2}
            />
          );
        })}
      </svg>
      <div className="mt-1.5 flex">
        {data.map((d, i) => (
          <div
            key={d.mes}
            className="flex-1 text-center text-[10.5px] text-muted"
            style={{ fontWeight: i === data.length - 1 ? 600 : 400 }}
          >
            {d.label}
          </div>
        ))}
        {projectionNext?.map((d, i) => (
          <div key={'pl' + i} className="flex-1 text-center text-[10.5px] italic text-muted opacity-70">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
