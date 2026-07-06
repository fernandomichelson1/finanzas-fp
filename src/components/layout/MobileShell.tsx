import type { ReactNode } from 'react';
import { TabBar } from './TabBar';
import { Fab } from './Fab';

/** Chrome mobile/tablet: contenido a pantalla completa + tab bar + FAB. */
export function MobileShell({ children, onNewMov }: { children: ReactNode; onNewMov: () => void }) {
  return (
    <div className="min-h-dvh bg-bg text-text">
      <main className="mx-auto w-full max-w-[760px] pb-44">{children}</main>
      <Fab onClick={onNewMov} />
      <TabBar />
    </div>
  );
}
