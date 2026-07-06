import { useFinanzasStore } from '@/store/useFinanzasStore';
import { stopCloudSync } from './cloud';

/** Cierra sesión: corta la sync y vuelve a la pantalla de perfiles. */
export function logout(): void {
  stopCloudSync();
  useFinanzasStore.getState().logout();
}
