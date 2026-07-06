import { Icon } from '@/components/ui/icons';

/** Botón flotante para "nuevo movimiento" (mobile/tablet). */
export function Fab({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label="Nuevo movimiento"
      className="fixed bottom-[100px] right-[22px] z-[80] flex h-[60px] w-[60px] items-center justify-center rounded-full text-white transition-transform active:scale-95"
      style={{
        background: 'linear-gradient(180deg, #3B82F6 0%, #1E40AF 100%)',
        boxShadow:
          '0 14px 30px rgba(37,99,235,0.55), 0 4px 10px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.2)',
      }}
    >
      <Icon.plus size={26} />
    </button>
  );
}
