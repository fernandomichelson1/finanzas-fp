import { useEffect, type ReactNode } from 'react';
import { useBreakpoint } from '@/hooks/useBreakpoint';

// Bloqueo de scroll del fondo a prueba de iOS (position:fixed en el body). Con
// CONTADOR de referencias para que los diálogos anidados no lo suelten antes de
// tiempo: recién se restaura cuando se cierra el último.
let lockCount = 0;
let savedScrollY = 0;
let savedStyle: Record<string, string> = {};

function lockBody() {
  if (typeof document === 'undefined') return;
  const body = document.body;
  if (lockCount === 0) {
    savedScrollY = window.scrollY;
    savedStyle = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = 'fixed';
    body.style.top = `-${savedScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
  }
  lockCount += 1;
}

function unlockBody() {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    Object.assign(document.body.style, savedStyle);
    window.scrollTo(0, savedScrollY);
  }
}

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

  // Bloqueo de scroll del fondo (con contador para diálogos anidados).
  useEffect(() => {
    if (!open) return;
    lockBody();
    return unlockBody;
  }, [open]);

  // Cerrar con Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
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
