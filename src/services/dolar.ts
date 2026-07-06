/**
 * Cotización del dólar blue desde dolarapi.com (venta). Se usa para convertir
 * los montos a USD. Devuelve `{ venta, fecha }` o null si falla / no responde.
 */
export async function fetchBlueVenta(): Promise<{ venta: number; fecha: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch('https://dolarapi.com/v1/dolares/blue', { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const venta = Number(data?.venta);
    if (!venta || venta <= 0) return null;
    return { venta, fecha: String(data?.fechaActualizacion ?? '') };
  } catch {
    return null;
  }
}
