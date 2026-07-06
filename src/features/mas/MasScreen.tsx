import { useNavigate } from 'react-router-dom';
import { MAS_MENU } from '@/navigation/routes';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { useUserById } from '@/store/lookups';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/icons';
import { logout } from '@/services/session';

export function MasScreen() {
  const navigate = useNavigate();
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const u = useUserById(currentUser);
  const modules = MAS_MENU;

  return (
    <div className="px-[18px] pt-2 lg:px-0">
      <h1 className="m-0 text-2xl font-bold tracking-[-0.6px] text-text lg:text-[26px]">Más</h1>
      <div className="mt-1 text-[13px] text-muted">Configuración y módulos</div>

      {/* Perfil */}
      <div className="my-4 flex items-center gap-3 rounded-[18px] border border-line bg-surface px-4 py-3.5">
        <Avatar userId={currentUser} size={48} />
        <div className="flex-1">
          <div className="text-base font-semibold text-text">{u?.nombre}</div>
          <div className="text-xs capitalize text-muted">{u?.rol}</div>
        </div>
        <button onClick={() => logout()} className="rounded-[10px] border border-line bg-surface-2 px-3 py-1.5 text-[12.5px] text-muted">Salir</button>
      </div>

      {/* Módulos */}
      <div className="overflow-hidden rounded-[18px] border border-line bg-surface lg:grid lg:grid-cols-2 lg:gap-px lg:bg-line">
        {modules.map((m, i) => (
          <button
            key={m.id}
            onClick={() => navigate(m.path)}
            className="flex w-full items-center gap-3.5 bg-surface px-4 py-3.5 text-left"
            style={{ borderBottom: i === modules.length - 1 ? 'none' : '1px solid var(--border)' }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface-2 text-lg">{m.emoji}</div>
            <div className="min-w-0 flex-1">
              <div className="text-[14.5px] font-medium text-text">{m.label}</div>
              <div className="mt-0.5 text-xs text-muted">{m.sub}</div>
            </div>
            <Icon.chev size={16} className="text-muted" />
          </button>
        ))}
      </div>
    </div>
  );
}
