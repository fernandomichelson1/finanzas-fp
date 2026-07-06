/** Genera un id único con prefijo. En backend lo asignará la DB. */
export function uid(prefix: string): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.floor(Math.random() * 1e8).toString(36);
  return `${prefix}-${Date.now().toString(36)}-${rnd}`;
}
