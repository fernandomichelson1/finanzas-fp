import { useState } from 'react';
import type { UserId } from '@/types/domain';
import { Avatar } from '@/components/ui/Avatar';
import { Icon } from '@/components/ui/icons';
import { alpha } from '@/lib/color';
import { useTheme } from '@/theme/ThemeProvider';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { isSupabaseEnabled } from '@/services/supabase/client';
import { ensureRemoteState, startCloudSync } from '@/services/cloud';

const PROFILES: UserId[] = ['fer', 'pao'];

export function LoginScreen() {
  const users = useFinanzasStore((s) => s.users);
  const login = useFinanzasStore((s) => s.login);
  const { mode, toggle } = useTheme();

  const [selected, setSelected] = useState<UserId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = !!selected && !busy;
  const submit = async () => {
    if (!selected || busy) return;
    const uid = selected;
    if (!isSupabaseEnabled) {
      login(uid);
      return;
    }
    setBusy(true);
    setError(null);
    // Esperamos la nube con techo de 3s: si tarda, entramos igual y sincroniza
    // en segundo plano (nunca dejamos al usuario clavado en "Entrando…").
    const remotePromise = ensureRemoteState();
    const remote = await Promise.race([
      remotePromise.catch(() => null),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
    ]);
    if (remote) useFinanzasStore.setState(remote);
    login(uid);
    startCloudSync();
    if (!remote) remotePromise.then((r) => useFinanzasStore.setState(r)).catch(() => {});
  };

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-bg px-6 py-12">
      {/* glows */}
      <div
        className="pointer-events-none absolute -left-16 -top-28 h-[340px] w-[340px]"
        style={{ background: 'radial-gradient(circle, #2563EB22 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -right-20 top-10 h-[280px] w-[280px]"
        style={{ background: 'radial-gradient(circle, #E11D4818 0%, transparent 70%)' }}
      />

      {/* theme toggle */}
      <button
        onClick={toggle}
        aria-label="Cambiar tema"
        className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-text"
      >
        {mode === 'dark' ? <Icon.sun size={18} /> : <Icon.moon size={18} />}
      </button>

      <div className="relative w-full max-w-[440px]">
        {/* Brand */}
        <div className="mb-10">
          <div
            className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)',
              boxShadow: '0 8px 24px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.18)',
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M4 20V4M4 20h16M8 16V9M13 16V6M18 16v-4"
                stroke="#fff"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="text-[32px] font-bold leading-none tracking-[-0.8px] text-text">Finanzas</div>
          <div className="mt-0.5 text-[32px] font-bold leading-tight tracking-[-0.8px] text-muted">
            Fer &amp; Pao
          </div>
          <div className="mt-2.5 text-sm text-muted">Elegí tu perfil para continuar</div>
        </div>

        {/* User cards */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          {PROFILES.map((uid) => {
            const u = users[uid];
            if (!u) return null;
            const sel = selected === uid;
            return (
              <button
                key={uid}
                data-testid={`login-${uid}`}
                onClick={() => setSelected(uid)}
                className="relative flex flex-col items-center gap-3 rounded-[20px] px-4 pb-[18px] pt-[22px] transition-all"
                style={{
                  background: sel
                    ? `linear-gradient(160deg, ${alpha(u.color, 0.13)} 0%, ${alpha(u.color, 0.03)} 100%)`
                    : 'var(--surface)',
                  border: sel ? `1.5px solid ${u.color}` : '1px solid var(--border)',
                  boxShadow: sel ? `0 8px 24px ${alpha(u.color, 0.2)}` : 'none',
                }}
              >
                <Avatar userId={uid} size={64} />
                <div className="text-center">
                  <div className="text-[17px] font-semibold text-text">{u.nombre}</div>
                  <div className="mt-0.5 text-xs capitalize text-muted">{u.rol}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Entrar */}
        <button
          onClick={submit}
          disabled={!canSubmit}
          data-testid="login-submit"
          className="w-full rounded-[14px] py-[15px] text-base font-semibold transition-all"
          style={{
            background: canSubmit
              ? 'linear-gradient(180deg, #2563EB 0%, #1E40AF 100%)'
              : 'var(--surface-2)',
            color: canSubmit ? '#fff' : 'var(--text-muted)',
            cursor: canSubmit ? 'pointer' : 'default',
            boxShadow: canSubmit ? '0 8px 20px rgba(37,99,235,0.35)' : 'none',
          }}
        >
          {busy ? 'Entrando…' : selected ? `Entrar como ${users[selected]?.nombre ?? ''}` : 'Elegí tu perfil'}
        </button>

        {error && (
          <div className="mt-3 rounded-xl border px-3 py-2.5 text-center text-[13px]" style={{ background: alpha('#DC2626', 0.1), borderColor: alpha('#DC2626', 0.3), color: '#F87171' }}>
            {error}
          </div>
        )}

        <div className="mt-4 text-center text-[13px] text-muted">
          Sin contraseña · elegí tu perfil y entrá
        </div>
      </div>
    </div>
  );
}
