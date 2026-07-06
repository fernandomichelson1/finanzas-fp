// Utilidades de color compartidas (replican el comportamiento del prototipo).

/** Aclara (amt > 0) u oscurece (amt < 0) un color hex. Devuelve rgb(). */
export function shade(hex: string, amt: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  const adj = (x: number) => Math.max(0, Math.min(255, Math.round(x + 255 * amt)));
  return `rgb(${adj(r)}, ${adj(g)}, ${adj(b)})`;
}

/** Devuelve el hex con canal alpha (0..1). Ej: alpha('#3B82F6', 0.12) → '#3B82F61f'. */
export function alpha(hex: string, a: number): string {
  let c = hex.replace('#', '');
  if (c.length === 3)
    c = c
      .split('')
      .map((x) => x + x)
      .join('');
  const aa = Math.max(0, Math.min(255, Math.round(a * 255)))
    .toString(16)
    .padStart(2, '0');
  return `#${c}${aa}`;
}

/** Gradiente lineal 135° del color a una versión más oscura (cards de caja, avatares). */
export function gradient(hex: string, dark = -0.18): string {
  return `linear-gradient(135deg, ${hex} 0%, ${shade(hex, dark)} 100%)`;
}
