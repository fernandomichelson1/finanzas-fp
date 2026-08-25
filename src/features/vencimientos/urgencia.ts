/**
 * Color del "Estado" de un vencimiento según los días que faltan para vencer:
 *   vencido u hoy … 7 días → rojo
 *   8 … 14 días            → amarillo
 *   15 días o más          → verde
 * Un gasto ya pagado va en verde. `rojo` habilita el puntito pulsante de urgencia.
 *
 * Ojo: el Estado recién toma color cuando el gasto está CONFIRMADO (verde). Mientras
 * está sin confirmar (gris), el monto y el día son provisorios (arrastrados del mes
 * pasado), así que mostramos el Estado en gris — no tiene sentido alarmar por una
 * fecha que todavía no se validó.
 */
export function urgenciaVenc(
  diasRestantes: number,
  pagado: boolean,
  confirmado: boolean,
): { color: string; rojo: boolean } {
  if (pagado) return { color: '#4ADE80', rojo: false };
  if (!confirmado) return { color: 'var(--text-muted)', rojo: false };
  if (diasRestantes <= 7) return { color: '#F87171', rojo: true };
  if (diasRestantes <= 14) return { color: '#F59E0B', rojo: false };
  return { color: '#4ADE80', rojo: false };
}
