import type { ReactNode } from 'react';

interface ChipProps {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
  dotColor?: string;
  count?: number;
}

/** Pill de filtro reutilizable (Movimientos, Vencimientos, períodos). */
export function Chip({ children, active, onClick, dotColor, count }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-line px-3 py-1.5 text-[13px] font-medium transition-all"
      style={{
        background: active ? 'var(--text)' : 'var(--surface)',
        color: active ? 'var(--bg)' : 'var(--text-muted)',
      }}
    >
      {dotColor && (
        <span
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: dotColor, boxShadow: active ? `0 0 6px ${dotColor}` : 'none' }}
        />
      )}
      {children}
      {count !== undefined && (
        <span
          className="min-w-4 rounded-md px-1.5 text-center text-[10px] font-semibold"
          style={{
            background: active ? 'rgba(0,0,0,0.15)' : 'var(--surface-2)',
            color: active ? 'var(--bg)' : 'var(--text-muted)',
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
