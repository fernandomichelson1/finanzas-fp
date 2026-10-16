import { type RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase/client';
import { useFinanzasStore, type FinanzasStore } from '@/store/useFinanzasStore';
import { normalizeHousehold } from '@/lib/migrate';
import { SyncEngine, type RemoteRow, type SyncBackend, type SyncBaseStore, type SyncedState } from './syncEngine';

export type { SyncedState } from './syncEngine';

const TABLE = 'household_state';
const ROW_ID = 'main';
/** Respaldo local del último estado visto en la nube (para rescatar cambios sin subir). */
const BASE_KEY = 'finanzas-fp:sync-base';

/** Partes del store que se sincronizan; cualquier otro cambio (toast, perfil…) es solo de UI. */
const SYNC_KEYS = [
  'users',
  'categories',
  'conceptos',
  'movimientos',
  'objetivos',
  'metas',
  'gastosFijos',
  'instancias',
  'cajas',
  'eventos',
  'usdRate',
  'usdFecha',
  'usdManual',
  'dataVersion',
] as const satisfies readonly (keyof FinanzasStore)[];

export function extractSynced(s: FinanzasStore): SyncedState {
  return {
    users: s.users,
    categories: s.categories,
    conceptos: s.conceptos,
    movimientos: s.movimientos,
    objetivos: s.objetivos,
    metas: s.metas,
    gastosFijos: s.gastosFijos,
    instancias: s.instancias,
    cajas: s.cajas,
    eventos: s.eventos,
    usdRate: s.usdRate,
    usdFecha: s.usdFecha,
    usdManual: s.usdManual,
    dataVersion: s.dataVersion,
  };
}

export async function fetchRemote(): Promise<SyncedState | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from(TABLE).select('data').eq('id', ROW_ID).maybeSingle();
  if (error) {
    console.error('[cloud] fetch:', error.message);
    return null;
  }
  return (data?.data as SyncedState | undefined) ?? null;
}

const backend: SyncBackend = {
  async fetchRow() {
    const { data, error } = await supabase!.from(TABLE).select('data, updated_at').eq('id', ROW_ID).maybeSingle();
    if (error) throw new Error(error.message);
    return (data as RemoteRow | null) ?? null;
  },
  async fetchUpdatedAt() {
    const { data, error } = await supabase!.from(TABLE).select('updated_at').eq('id', ROW_ID).maybeSingle();
    if (error) throw new Error(error.message);
    return (data?.updated_at as string | undefined) ?? null;
  },
  // Escritura condicional: solo pisa la fila si nadie la cambió desde que la leímos.
  async write(state, expectedAt, newAt) {
    if (expectedAt === null) {
      const { error } = await supabase!.from(TABLE).insert({ id: ROW_ID, data: state, updated_at: newAt });
      if (!error) return 'ok';
      if (error.code === '23505') return 'conflict';
      throw new Error(error.message);
    }
    const { data, error } = await supabase!
      .from(TABLE)
      .update({ data: state, updated_at: newAt })
      .eq('id', ROW_ID)
      .eq('updated_at', expectedAt)
      .select('id');
    if (error) throw new Error(error.message);
    return data && data.length > 0 ? 'ok' : 'conflict';
  },
};

const baseStore: SyncBaseStore = {
  load() {
    try {
      const raw = localStorage.getItem(BASE_KEY);
      return raw ? (JSON.parse(raw) as { at: string; data: SyncedState }) : null;
    } catch {
      return null;
    }
  },
  save(at, data) {
    try {
      localStorage.setItem(BASE_KEY, JSON.stringify({ at, data }));
    } catch {
      // Sin espacio: mejor sin respaldo que con uno viejo (podría revertir cambios ajenos).
      try {
        localStorage.removeItem(BASE_KEY);
      } catch {
        /* storage bloqueado */
      }
    }
  },
};

const engine = supabase
  ? new SyncEngine({
      backend,
      baseStore,
      normalize: normalizeHousehold,
      local: {
        get: () => extractSynced(useFinanzasStore.getState()),
        apply: (s) => useFinanzasStore.setState(s),
      },
      onError: (e) => console.error('[cloud]', e),
    })
  : null;

/**
 * Trae el estado del hogar de la nube y lo aplica (creándolo si no existe),
 * rescatando cambios locales que no llegaron a subirse. No arranca la sync.
 */
export function ensureRemoteState(): Promise<SyncedState> {
  if (!engine) return Promise.resolve(extractSynced(useFinanzasStore.getState()));
  return engine.init();
}

let started = false;
let unsubStore: (() => void) | null = null;
let channel: RealtimeChannel | null = null;
let poll: ReturnType<typeof setInterval> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/** Trae lo último de la nube y lo combina con lo local (nunca pisa cambios sin subir). */
export function refreshFromRemote(): Promise<void> {
  return engine ? engine.refresh() : Promise.resolve();
}

function onVisible() {
  if (!engine || typeof document === 'undefined') return;
  if (document.visibilityState === 'visible') void engine.refresh();
  else void engine.flush(); // el celu puede congelar la app: subimos lo pendiente ya
}

function onPageHide() {
  void engine?.flush();
}

/**
 * Arranca la sync en vivo (idempotente). Llamar SOLO después de aplicar la nube
 * (ensureRemoteState), así nunca se suben datos viejos del dispositivo.
 */
export function startCloudSync() {
  if (!supabase || !engine) return;
  if (!started) {
    started = true;

    // Guarda en la nube solo ante cambios de DATOS hechos en este dispositivo.
    unsubStore = useFinanzasStore.subscribe((s, prev) => {
      if (engine.isApplying) return;
      if (SYNC_KEYS.every((k) => s[k] === prev[k])) return;
      engine.notifyLocalChange();
    });

    // Lo que carga Pao aparece en lo de Fer y viceversa (siempre combinando).
    channel = supabase
      .channel('household-state')
      .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, () => void engine.refresh())
      .subscribe();

    // Refuerzo si el tiempo real se corta (celu bloqueado, compu en reposo).
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onVisible);
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onVisible);
      window.addEventListener('pagehide', onPageHide);
    }
    poll = setInterval(() => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') void engine.check();
    }, 15000);
  }
  engine.start();
}

/**
 * Conecta con la nube: aplica lo último y recién ahí arranca la sync. Si no hay
 * red, reintenta solo cada 10 s (los cambios quedan guardados en el dispositivo).
 */
export async function connectCloud(): Promise<void> {
  if (!engine) return;
  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  try {
    await engine.init();
    startCloudSync();
  } catch (e) {
    console.error('[cloud] init:', e);
    retryTimer = setTimeout(() => {
      retryTimer = null;
      if (useFinanzasStore.getState().loggedIn) void connectCloud();
    }, 10000);
  }
}

export function stopCloudSync() {
  void engine?.flush();
  engine?.stop();
  if (retryTimer) clearTimeout(retryTimer);
  if (poll) clearInterval(poll);
  unsubStore?.();
  if (channel && supabase) supabase.removeChannel(channel);
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible);
  if (typeof window !== 'undefined') {
    window.removeEventListener('focus', onVisible);
    window.removeEventListener('pagehide', onPageHide);
  }
  retryTimer = null;
  poll = null;
  unsubStore = null;
  channel = null;
  started = false;
}
