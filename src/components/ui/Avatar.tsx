import type { UserId } from '@/types/domain';
import { gradient } from '@/lib/color';
import { useUserById } from '@/store/lookups';

/** Avatar circular con iniciales y gradiente 135° del color del usuario. */
export function Avatar({
  userId,
  size = 32,
  ring = false,
}: {
  userId: UserId;
  size?: number;
  ring?: boolean;
}) {
  const u = useUserById(userId);
  if (!u) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradient(u.color, -0.15),
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size * 0.38,
        fontWeight: 700,
        letterSpacing: 0.2,
        flexShrink: 0,
        boxShadow: ring
          ? `0 0 0 2px var(--surface), 0 0 0 3.5px ${u.color}`
          : '0 1px 2px rgba(0,0,0,0.18)',
      }}
    >
      {u.iniciales}
    </div>
  );
}
