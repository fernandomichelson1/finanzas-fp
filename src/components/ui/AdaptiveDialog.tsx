import { useEffect, type ReactNode } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

/**
 * Bottom sheet (mobile/tablet) o modal centrado (desktop) según breakpoint.
 * Mismo contenido, distinto contenedor — como pide la guía responsive.
 */
export function AdaptiveDialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const bp = useBreakpoint();
  const isDesktop = bp === 'desktop';

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    // Bloquea el scroll del fondo mientras la hoja está abierta.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      className="animate-fade-in fixed inset-0 z-[90] flex justify-center"
      style={{
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        alignItems: isDesktop ? 'center' : 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={
          isDesktop
            ? 'animate-pop-in m-6 flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-line bg-elevated shadow-[0_24px_60px_rgba(0,0,0,0.45)]'
            : 'animate-slide-up flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-[28px] border border-line bg-elevated shadow-[0_-20px_60px_rgba(0,0,0,0.4)]'
        }
      >
        {children}
      </div>
    </div>
  );
}
