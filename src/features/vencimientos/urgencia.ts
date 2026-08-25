/**
 * Color del "Estado" de un vencimiento según los días que faltan para vencer:
 *   vencido u hoy … 7 días → rojo
 *   8 … 14 días            → amarillo
 *   15 días o más          → verde
 * Un gasto ya pagado va en verde. `rojo` habilita el puntito pulsante de urgencia.
 */
export function urgenciaVenc(diasRestantes: number, pagado: boolean): { color: string; rojo: boolean } {
  if (pagado) return { color: '#4ADE80', rojo: false };
  if (diasRestantes <= 7) return { color: '#F87171', rojo: true };
  if (diasRestantes <= 14) return { color: '#F59E0B', rojo: false };
  return { color: '#4ADE80', rojo: false };
}
