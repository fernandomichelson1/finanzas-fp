import { useEffect } from 'react';
import { fmtMonto, tipoColor, tipoSign } from '@/lib/format';
import { Icon } from '@/components/ui/icons';
import { useCatById } from '@/store/lookups';
import { useFinanzasStore } from '@/store/useFinanzasStore';

/** Banner de confirmación tras registrar un movimiento. Se autodescarta. */
export function ToastHost() {
  const toast = useFinanzasStore((s) => s.toast);
  const clearToast = useFinanzasStore((s) => s.clearToast);
  const cat = useCatById(toast?.cat ?? null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 2400);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;
  const color = tipoColor(toast.tipo);
  const label = cat?.nombre ?? 'Movimiento';

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex justify-center px-4">
      <div className="animate-slide-down pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-[14px] border border-line bg-elevated px-3.5 py-3 shadow-[0_14px_32px_rgba(0,0,0,0.4)]">
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full"
          style={{ background: `color-mix(in srgb, ${color} 14%, transparent)`, color }}
        >
          <Icon.check size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-text">Movimiento registrado</div>
          <div className="mt-0.5 truncate text-[11.5px] text-muted">
            {label} · {tipoSign(toast.tipo)}${fmtMonto(toast.monto)}
          </div>
        </div>
      </div>
    </div>
  );
}
