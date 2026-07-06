import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { LoginScreen } from '@/features/login/LoginScreen';
import { AppShell } from '@/components/layout/AppShell';
import { isSupabaseEnabled } from '@/services/supabase/client';
import { ensureRemoteState, startCloudSync } from '@/services/cloud';

export default function App() {
  const loggedIn = useFinanzasStore((s) => s.loggedIn);

  // Local-first: la UI se muestra al instante con lo persistido. Si el perfil ya
  // estaba elegido, refrescamos de la nube en segundo plano (sin bloquear la UI).
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    if (!useFinanzasStore.getState().loggedIn) return;
    let cancel = false;
    ensureRemoteState()
      .then((remote) => {
        if (cancel) return;
        useFinanzasStore.setState(remote);
        startCloudSync();
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  if (!loggedIn) return <LoginScreen />;

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell />
    </BrowserRouter>
  );
}
