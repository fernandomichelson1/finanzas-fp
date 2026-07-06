import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/icons';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  action?: ReactNode;
  size?: 'lg' | 'md';
}

/** Encabezado de pantalla/subpantalla con botón atrás opcional y slot de acción. */
export function ScreenHeader({ title, subtitle, onBack, action, size = 'lg' }: ScreenHeaderProps) {
  return (
    <div className="flex items-center gap-2.5 px-[18px] pb-3 pt-2 lg:px-0">
      {onBack && (
        <button
          onClick={onBack}
          aria-label="Volver"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-text transition-colors hover:bg-surface-2"
        >
          <Icon.back size={18} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1
          className={`m-0 truncate font-bold tracking-[-0.4px] text-text ${size === 'lg' ? 'text-[22px]' : 'text-lg'}`}
        >
          {title}
        </h1>
        {subtitle && <div className="mt-0.5 text-[11.5px] text-muted">{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}
