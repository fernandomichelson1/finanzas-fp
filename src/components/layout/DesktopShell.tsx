import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

/** Chrome desktop: sidebar fija + área de contenido centrada con ancho máximo. */
export function DesktopShell({ children, onNewMov }: { children: ReactNode; onNewMov: () => void }) {
  return (
    <div className="flex min-h-dvh bg-bg text-text">
      <Sidebar onNewMov={onNewMov} />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1180px] px-6 py-7 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
