import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { VENCIMIENTOS_PATH } from '@/navigation/routes';
import { MobileShell } from './MobileShell';
import { DesktopShell } from './DesktopShell';
import { AdaptiveDialog } from '@/components/ui/AdaptiveDialog';
import { ToastHost } from '@/components/ui/Toast';
import { NuevoMovimiento } from '@/features/nuevo-movimiento/NuevoMovimiento';
import { DashboardScreen } from '@/features/dashboard/DashboardScreen';
import { MovimientosScreen } from '@/features/movimientos/MovimientosScreen';
import { AhorrosScreen } from '@/features/ahorros/AhorrosScreen';
import { AnalisisScreen } from '@/features/analisis/AnalisisScreen';
import { MasScreen } from '@/features/mas/MasScreen';
import { CategoriasScreen } from '@/features/categorias/CategoriasScreen';
import { CajasScreen } from '@/features/cajas/CajasScreen';
import { EventosScreen } from '@/features/eventos/EventosScreen';
import { AlertasScreen } from '@/features/alertas/AlertasScreen';
import { ConfiguracionScreen } from '@/features/configuracion/ConfiguracionScreen';
import { VencimientosScreen } from '@/features/vencimientos/VencimientosScreen';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DashboardScreen />} />
      <Route path="/movimientos" element={<MovimientosScreen />} />
      <Route path="/ahorros" element={<AhorrosScreen />} />
      <Route path="/analisis" element={<AnalisisScreen />} />
      <Route path="/estadisticas" element={<Navigate to="/analisis" replace />} />
      <Route path={VENCIMIENTOS_PATH} element={<VencimientosScreen />} />
      <Route path="/mas" element={<MasScreen />} />
      <Route path="/mas/cajas" element={<CajasScreen />} />
      <Route path="/mas/categorias" element={<CategoriasScreen />} />
      <Route path="/mas/eventos" element={<EventosScreen />} />
      <Route path="/mas/alertas" element={<AlertasScreen />} />
      <Route path="/mas/configuracion" element={<ConfiguracionScreen />} />
      {/* Redirecciones de rutas viejas */}
      <Route path="/stats" element={<Navigate to="/analisis" replace />} />
      <Route path="/mas/semanal" element={<Navigate to="/analisis" replace />} />
      <Route path="/mas/finmes" element={<Navigate to="/analisis" replace />} />
      <Route path="/mas/usuarios" element={<Navigate to="/mas/configuracion" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/** Selecciona el chrome según breakpoint y monta diálogo de alta + toasts. */
export function AppShell() {
  const bp = useBreakpoint();
  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);
  const content = <AppRoutes />;

  // Al hacer foco en un campo numérico, selecciona todo el número (escribís y reemplaza).
  useEffect(() => {
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target;
      if (
        el instanceof HTMLInputElement &&
        (el.type === 'number' || el.inputMode === 'numeric' || el.inputMode === 'decimal')
      ) {
        const sel = () => {
          try {
            el.select();
          } catch {
            /* type=number en algunos navegadores no soporta select; se ignora */
          }
        };
        sel(); // foco por teclado/programático
        setTimeout(sel, 0); // vuelve a seleccionar tras el clic/tap (mouseup mueve el cursor)
      }
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, []);

  return (
    <>
      {bp === 'desktop' ? (
        <DesktopShell onNewMov={openDialog}>{content}</DesktopShell>
      ) : (
        <MobileShell onNewMov={openDialog}>{content}</MobileShell>
      )}

      <AdaptiveDialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <NuevoMovimiento onClose={() => setDialogOpen(false)} />
      </AdaptiveDialog>

      <ToastHost />
    </>
  );
}
