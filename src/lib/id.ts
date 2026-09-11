/** Genera un id único con prefijo. En backend lo asignará la DB. */
export function uid(prefix: string): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 1e8).toString(36);
  return `${prefix}-${Date.now().toString(36)}-${rnd}`;
}

/**
 * Momento de creación embebido en un id `uid` (prefijo-tiempoBase36-random), en ms.
 * Sirve para ordenar por orden REAL de carga (no por el string del id, que empieza
 * por el prefijo y desordena). Devuelve 0 si el id no tiene el formato esperado.
 */
export function idTime(id: string): number {
  const parts = id.split('-');
  if (parts.length < 3) return 0;
  const t = parseInt(parts[parts.length - 2], 36);
  return Number.isFinite(t) ? t : 0;
}
