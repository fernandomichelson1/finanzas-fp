import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { LoginScreen } from '@/features/login/LoginScreen';
import { AppShell } from '@/components/layout/AppShell';
import { isSupabaseEnabled } from '@/services/supabase/client';
import { connectCloud } from '@/services/cloud';
import { fetchBlueVenta } from '@/services/dolar';

export default function App() {
  const loggedIn = useFinanzasStore((s) => s.loggedIn);

  // Cotización del dólar blue (venta), automática — salvo override manual.
  useEffect(() => {
    if (useFinanzasStore.getState().usdManual) return;
    fetchBlueVenta().then((b) => {
      if (b && !useFinanzasStore.getState().usdManual) {
        useFinanzasStore.getState().setUsdBlue(b.venta, b.fecha);
      }
    });
  }, []);

  // Local-first: la UI se muestra al instante con lo persistido. Si el perfil ya
  // estaba elegido, traemos la nube en segundo plano y recién ahí arranca la sync
  // (combinando: nunca se suben datos viejos de este dispositivo).
  useEffect(() => {
    if (!isSupabaseEnabled) return;
    if (!useFinanzasStore.getState().loggedIn) return;
    void connectCloud();
  }, []);

  if (!loggedIn) return <LoginScreen />;

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppShell />
    </BrowserRouter>
  );
}
