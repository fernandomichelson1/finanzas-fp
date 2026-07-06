import { type RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase/client';
import { useFinanzasStore, type FinanzasStore } from '@/store/useFinanzasStore';
import { buildInitialData, type FinanzasData } from '@/data';
import { normalizeHousehold } from '@/lib/migrate';

/** Lo que se guarda/sincroniza del hogar (colecciones + cotización USD). */
export type SyncedState = FinanzasData & { usdRate: number };

const TABLE = 'household_state';
const ROW_ID = 'main';

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

export async function saveRemote(state: SyncedState): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from(TABLE)
    .upsert({ id: ROW_ID, data: state, updated_at: new Date().toISOString() });
  if (error) console.error('[cloud] save:', error.message);
}

/** Devuelve el estado del hogar; si aún no existe, sube los seeds. */
export async function ensureRemoteState(): Promise<SyncedState> {
  const remote = await fetchRemote();
  if (remote) return normalizeHousehold(remote);
  const seed: SyncedState = normalizeHousehold({
    ...buildInitialData(),
    usdRate: useFinanzasStore.getState().usdRate,
  });
  await saveRemote(seed);
  return seed;
}

let started = false;
let applyingRemote = false;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
let unsubStore: (() => void) | null = null;
let channel: RealtimeChannel | null = null;

function applyRemote(state: SyncedState) {
  applyingRemote = true;
  useFinanzasStore.setState(normalizeHousehold(state));
  applyingRemote = false;
}

/** Arranca la sync en vivo (idempotente). Llamar después de hidratar el store. */
export function startCloudSync() {
  if (!supabase || started) return;
  started = true;

  // Guarda en la nube ante cambios locales (con debounce).
  unsubStore = useFinanzasStore.subscribe((s) => {
    if (applyingRemote) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveRemote(extractSynced(s)), 700);
  });

  // Aplica cambios remotos: lo que carga Pao aparece en lo de Fer y viceversa.
  channel = supabase
    .channel('household-state')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, (payload) => {
      const next = (payload.new as { data?: SyncedState } | null)?.data;
      if (next) applyRemote(next);
    })
    .subscribe();
}

export function stopCloudSync() {
  if (saveTimer) clearTimeout(saveTimer);
  unsubStore?.();
  if (channel && supabase) supabase.removeChannel(channel);
  unsubStore = null;
  channel = null;
  started = false;
}
