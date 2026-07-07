import { NavLink } from 'react-router-dom';
import { TABS } from '@/navigation/routes';
import { Icon } from '@/components/ui/icons';

const ACCENT = '#3B82F6';

/** Bottom tab bar (mobile/tablet). */
export function TabBar() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[70] flex justify-around border-t border-line bg-tabbar pb-7 pt-2"
      style={{ backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)' }}
    >
      {TABS.map((t) => {
        const I = Icon[t.icon ?? 'more'];
        return (
          <NavLink
            key={t.id}
            to={t.path}
            end={t.path === '/'}
            className="flex min-w-0 flex-1 flex-col items-center gap-[3px] px-1 py-1.5 text-[10px] font-medium no-underline"
          >
            {({ isActive }) => {
              const color = isActive ? ACCENT : 'var(--text-muted)';
              return (
                <>
                  <div
                    style={{ color, transform: isActive ? 'scale(1.05)' : 'scale(1)', transition: 'all 160ms' }}
                  >
                    <I size={22} />
                  </div>
                  <span className="max-w-full truncate whitespace-nowrap" style={{ color }}>{t.label}</span>
                  <span
                    className="h-1 w-1 rounded-full"
                    style={{ background: isActive ? ACCENT : 'transparent', boxShadow: isActive ? `0 0 6px ${ACCENT}` : 'none' }}
                  />
                </>
              );
            }}
          </NavLink>
        );
      })}
    </nav>
  );
}
