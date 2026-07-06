import type { Owner } from '@/types/domain';
import { alpha } from '@/lib/color';
import { useUserById } from '@/store/lookups';

/** Pill de responsable/dueño: "Compartido" o el nombre del usuario en su color. */
export function OwnerBadge({ owner, size = 'sm' }: { owner?: Owner; size?: 'sm' | 'md' }) {
  const u = useUserById(owner && owner !== 'compartido' ? owner : undefined);
  const pad = size === 'md' ? 'px-2 py-0.5 text-[10px]' : 'px-1.5 py-0.5 text-[9px]';
  if (!owner || owner === 'compartido') {
    return (
      <span className={`shrink-0 rounded-full bg-surface-2 ${pad} font-bold uppercase tracking-wide text-muted`}>
        Compartido
      </span>
    );
  }
  return (
    <span
      className={`shrink-0 rounded-full ${pad} font-bold uppercase tracking-wide`}
      style={{ background: alpha(u?.color ?? '#888', 0.15), color: u?.color }}
    >
      {u?.nombre ?? owner}
    </span>
  );
}
