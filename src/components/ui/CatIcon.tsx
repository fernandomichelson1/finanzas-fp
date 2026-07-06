import type { CSSProperties } from 'react';

interface IconableItem {
  logo?: string;
  icono?: string;
}

/** Renderiza el logo (PNG) si existe, si no el emoji. Compartido por todo el árbol. */
export function CatIcon({
  item,
  size = 20,
  style,
}: {
  item?: IconableItem | null;
  size?: number;
  style?: CSSProperties;
}) {
  if (!item) return null;
  if (item.logo) {
    return (
      <img
        src={item.logo}
        alt=""
        width={size}
        height={size}
        style={{ objectFit: 'contain', display: 'block', pointerEvents: 'none', ...style }}
      />
    );
  }
  return (
    <span style={{ fontSize: size * 0.92, lineHeight: 1, ...style }}>{item.icono || '•'}</span>
  );
}
