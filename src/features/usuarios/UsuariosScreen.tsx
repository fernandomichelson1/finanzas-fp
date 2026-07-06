import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Rol } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { shade } from '@/lib/color';
import { Avatar } from '@/components/ui/Avatar';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

const PALETTE = ['#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#84CC16', '#EF4444'];

export function UsuariosScreen({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const users = useFinanzasStore((s) => s.users);
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const createUser = useFinanzasStore((s) => s.createUser);
  const isAdmin = users[currentUser]?.rol === 'admin';

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState<Rol>('co-usuario');
  const [color, setColor] = useState('#10B981');

  const submit = () => {
    if (!name.trim()) return;
    createUser({ nombre: name.trim(), iniciales: name.trim().slice(0, 2).toUpperCase(), color, rol: role });
    setCreating(false);
    setName('');
    setRole('co-usuario');
    setColor('#10B981');
  };

  return (
    <div className={embedded ? '' : 'pt-2'}>
      {!embedded && (
        <ScreenHeader
          title="Usuarios"
          onBack={() => navigate('/mas')}
          action={isAdmin && !creating ? <button onClick={() => setCreating(true)} className="rounded-[10px] bg-[#2563EB] px-3 py-1.5 text-[13px] font-medium text-white">+ Usuario</button> : undefined}
        />
      )}
      <div className="px-[18px] lg:px-0">
        {embedded && isAdmin && !creating && (
          <div className="mb-2 flex justify-end">
            <button onClick={() => setCreating(true)} className="rounded-[10px] bg-[#2563EB] px-3 py-1.5 text-[13px] font-medium text-white">+ Usuario</button>
          </div>
        )}
        {creating && (
          <div className="mb-3.5 rounded-2xl border border-dashed border-line-strong bg-surface-2 p-4">
            <div className="mb-3.5 flex items-center gap-3.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full text-[22px] font-bold text-white" style={{ background: `linear-gradient(135deg, ${color} 0%, ${shade(color, -0.15)} 100%)` }}>
                {(name.trim().slice(0, 2) || '??').toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-text">Nuevo usuario</div>
                <div className="text-xs text-muted">El avatar se genera con las iniciales</div>
              </div>
            </div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">Nombre</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="ej. Cande, Marcos..." autoFocus className="mb-3 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">Rol</div>
            <div className="mb-3 flex gap-1.5">
              {([['admin', 'Administrador', 'CRUD + categorías + metas'], ['co-usuario', 'Co-usuario', 'Solo sus movimientos']] as const).map(([id, label, sub]) => (
                <button key={id} onClick={() => setRole(id)} className="flex-1 rounded-[10px] p-3 text-left" style={{ background: role === id ? 'color-mix(in srgb, #3B82F6 13%, transparent)' : 'var(--surface)', border: `1px solid ${role === id ? '#3B82F6' : 'var(--border)'}` }}>
                  <div className="text-[13px] font-semibold" style={{ color: role === id ? '#3B82F6' : 'var(--text)' }}>{label}</div>
                  <div className="mt-0.5 text-[10.5px] text-muted">{sub}</div>
                </button>
              ))}
            </div>
            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">Color de avatar</div>
            <div className="mb-3.5 flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button key={c} onClick={() => setColor(c)} className="h-8 w-8 rounded-full" style={{ background: `linear-gradient(135deg, ${c} 0%, ${shade(c, -0.15)} 100%)`, border: color === c ? '2px solid var(--text)' : '2px solid transparent' }} />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={submit} disabled={!name.trim()} className="flex-1 rounded-[10px] py-2.5 text-sm font-semibold" style={{ background: name.trim() ? '#2563EB' : 'var(--surface)', color: name.trim() ? '#fff' : 'var(--text-muted)' }}>Agregar usuario</button>
              <button onClick={() => setCreating(false)} className="rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[13px] text-muted">Cancelar</button>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
          {Object.values(users).map((u, i, arr) => {
            const count = movimientos.filter((m) => m.user === u.id).length;
            return (
              <div key={u.id} className="flex items-center gap-3.5 px-4 py-3.5" style={{ borderBottom: i === arr.length - 1 ? 'none' : '1px solid var(--border)' }}>
                <Avatar userId={u.id} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[15px] font-semibold text-text">
                    {u.nombre}
                    {u.id === currentUser && <span className="rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wide" style={{ background: 'color-mix(in srgb, #3B82F6 13%, transparent)', color: '#60A5FA' }}>VOS</span>}
                  </div>
                  <div className="mt-0.5 text-xs capitalize text-muted">{u.rol} · {count} movimientos</div>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide" style={{ background: u.rol === 'admin' ? 'color-mix(in srgb, #F59E0B 13%, transparent)' : 'var(--surface-2)', color: u.rol === 'admin' ? '#FBBF24' : 'var(--text-muted)' }}>
                  {u.rol === 'admin' ? 'Admin' : 'Co-usuario'}
                </span>
              </div>
            );
          })}
        </div>
        {!isAdmin && <div className="px-2 py-3.5 text-center text-xs text-muted">Solo Fer (admin) puede agregar nuevos usuarios.</div>}
      </div>
    </div>
  );
}
