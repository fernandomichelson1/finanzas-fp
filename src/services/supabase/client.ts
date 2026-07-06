import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True si hay credenciales → la app corre en modo nube (sync sin login). */
export const isSupabaseEnabled = !!(url && anonKey);

/** fetch con timeout: que ninguna request cuelgue la app si la nube tarda o no responde. */
function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Cliente Supabase (o null en modo local). Acceso sin login: la base acepta el
 * rol anónimo, así que la `anonKey` alcanza para leer/escribir el estado del hogar.
 * Desactivamos toda la maquinaria de Auth (no la usamos): sin sesión persistida
 * el cliente no intenta refrescar tokens viejos al arrancar → arranque rápido.
 */
export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(url!, anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: fetchWithTimeout },
    })
  : null;
