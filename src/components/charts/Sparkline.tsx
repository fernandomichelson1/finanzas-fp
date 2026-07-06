interface SparklineProps {
  values: number[];
  color?: string;
  height?: number;
  fill?: boolean;
  dot?: boolean;
}

/** Mini line chart con relleno opcional. */
export function Sparkline({ values, color = '#3B82F6', height = 60, fill = true, dot = true }: SparklineProps) {
  if (!values || values.length === 0) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 100 - ((v - min) / range) * 80 - 10;
    return [x, y] as const;
  });
  const path = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x} ${y}`).join(' ');
  const area = `${path} L 100 100 L 0 100 Z`;
  const gid = `spark-${color.replace('#', '')}`;
  return (
    <svg width="100%" height={height} viewBox="0 0 100 100" preserveAspectRatio="none" className="block">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {dot && (
        <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.5" fill={color} stroke="var(--surface)" strokeWidth="0.6" />
      )}
    </svg>
  );
}
