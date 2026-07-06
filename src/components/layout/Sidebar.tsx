import { NavLink } from 'react-router-dom';
import { SIDEBAR_MODULES, SIDEBAR_PRIMARY, type NavItem } from '@/navigation/routes';
import { Icon } from '@/components/ui/icons';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/theme/ThemeProvider';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { useUserById } from '@/store/lookups';
import { logout } from '@/services/session';

const ACCENT = '#3B82F6';

function NavRow({ item, end }: { item: NavItem; end?: boolean }) {
  const I = item.icon ? Icon[item.icon] : null;
  return (
    <NavLink
      to={item.path}
      end={end}
      className="mb-0.5 block rounded-xl no-underline"
      style={({ isActive }) => ({
        background: isActive ? 'color-mix(in srgb, var(--color-accent) 14%, transparent)' : 'transparent',
      })}
    >
      {({ isActive }) => (
        <div
          className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium"
          style={{ color: isActive ? ACCENT : 'var(--text)' }}
        >
          {I ? <I size={20} /> : <span className="w-5 text-center text-base leading-none">{item.emoji}</span>}
          {item.label}
        </div>
      )}
    </NavLink>
  );
}

/** Sidebar de navegación fija (desktop ≥1024px). */
export function Sidebar({ onNewMov }: { onNewMov: () => void }) {
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const u = useUserById(currentUser);
  const { mode, toggle } = useTheme();

  return (
    <aside className="sticky top-0 flex h-dvh w-[264px] shrink-0 flex-col border-r border-line bg-surface">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 pb-3 pt-5">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-xl"
          style={{ background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 20V4M4 20h16M8 16V9M13 16V6M18 16v-4"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="text-[15px] font-bold tracking-[-0.3px] text-text">Finanzas F&amp;P</div>
      </div>

      {/* User + theme toggle */}
      <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-2xl border border-line bg-surface-2 px-3 py-2.5">
        <Avatar userId={currentUser} size={36} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-text">{u?.nombre}</div>
          <div className="text-[11px] capitalize text-muted">{u?.rol}</div>
        </div>
        <button
          onClick={toggle}
          aria-label="Cambiar tema"
          title={mode === 'dark' ? 'Tema claro' : 'Tema oscuro'}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-text transition-colors hover:bg-surface"
        >
          {mode === 'dark' ? <Icon.sun size={17} /> : <Icon.moon size={17} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="hide-scroll flex-1 overflow-y-auto px-3 py-2">
        {SIDEBAR_PRIMARY.map((item) => (
          <NavRow key={item.id} item={item} end={item.path === '/'} />
        ))}

        <div className="mb-1 mt-4 px-3 text-[10.5px] font-semibold uppercase tracking-wider text-muted">
          Más
        </div>
        {SIDEBAR_MODULES.map((item) => (
          <NavRow key={item.id} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-line p-3">
        <button
          onClick={onNewMov}
          className="mb-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', boxShadow: '0 8px 20px rgba(37,99,235,0.32)' }}
        >
          <Icon.plus size={18} /> Nuevo movimiento
        </button>
        <button
          onClick={() => logout()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-line py-2.5 text-[13px] font-medium text-muted transition-colors hover:text-text"
        >
          <Icon.logout size={16} /> Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
