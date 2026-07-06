import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

function current(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w >= 1024) return 'desktop';
  if (w >= 768) return 'tablet';
  return 'mobile';
}

/** Breakpoint actual según el ancho de ventana (<768 / 768–1023 / ≥1024). */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(current);
  useEffect(() => {
    const onResize = () => setBp(current());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return bp;
}
