import type { FinanzasData } from '@/data';

/** Lo que se guarda/sincroniza del hogar (colecciones + cotización USD). */
export type SyncedState = FinanzasData & { usdRate: number; usdFecha?: string; usdManual?: boolean };

export interface RemoteRow {
  data: SyncedState;
  updated_at: string;
}

export interface SyncBackend {
  /** Fila actual de la nube; null si todavía no existe. Tira error si falla la red. */
  fetchRow(): Promise<RemoteRow | null>;
  /** Solo el sello de la última escritura (liviano, para el chequeo periódico). */
  fetchUpdatedAt(): Promise<string | null>;
  /** Escribe SOLO si la fila sigue en `expectedAt` (null = crearla). 'conflict' si otro escribió antes. */
  write(state: SyncedState, expectedAt: string | null, newAt: string): Promise<'ok' | 'conflict'>;
}

export interface SyncLocal {
  get(): SyncedState;
  apply(state: SyncedState): void;
}

/** Respaldo local del último estado de la nube (para rescatar cambios que no llegaron a subir). */
export interface SyncBaseStore {
  load(): { at: string; data: SyncedState } | null;
  save(at: string, data: SyncedState): void;
}

const json = (x: unknown) => JSON.stringify(x);
const same = (a: unknown, b: unknown) => a === b || json(a) === json(b);
/** Sello en microsegundos (la nube guarda timestamptz con μs); null si no se puede leer. */
function micros(s: string): number | null {
  const m = /^(\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d)(?:\.(\d+))?(Z|[+-]\d\d:\d\d)$/.exec(s);
  if (!m) return null;
  const sec = Date.parse(m[1] + m[3]);
  return Number.isFinite(sec) ? sec * 1000 + Number((m[2] ?? '').padEnd(6, '0').slice(0, 6)) : null;
}
const sameAt = (a: string | null, b: string | null) => {
  if (!a || !b) return false;
  const x = micros(a);
  const y = micros(b);
  return x !== null && y !== null ? x === y : Date.parse(a) === Date.parse(b);
};

/** Merge de listas por clave: lo que cambió este dispositivo (vs base) gana; el resto viene de la nube. */
function mergeList<T>(base: T[] = [], local: T[] = [], remote: T[] = [], key: (x: T) => string): T[] {
  const b = new Map(base.map((x) => [key(x), x]));
  const l = new Map(local.map((x) => [key(x), x]));
  const r = new Map(remote.map((x) => [key(x), x]));
  const out: T[] = [];
  const seen = new Set<string>();
  for (const src of [remote, local]) {
    for (const x of src) {
      const k = key(x);
      if (seen.has(k)) continue;
      seen.add(k);
      const v = same(b.get(k), l.get(k)) ? r.get(k) : l.get(k);
      if (v !== undefined) out.push(v);
    }
  }
  return out;
}

function mergeRecord<V>(base: Record<string, V> = {}, local: Record<string, V> = {}, remote: Record<string, V> = {}) {
  const out: Record<string, V> = {};
  for (const k of new Set([...Object.keys(remote), ...Object.keys(local)])) {
    const v = same(base[k], local[k]) ? remote[k] : local[k];
    if (v !== undefined) out[k] = v;
  }
  return out;
}

const pick = <T>(b: T, l: T, r: T): T => (same(b, l) ? r : l);

/**
 * Merge de 3 vías: aplica sobre `remote` (lo último de la nube) solo lo que este
 * dispositivo cambió respecto de `base` (lo último que vio de la nube). Así un
 * dispositivo atrasado nunca borra lo que cargó otro: altas, ediciones y bajas
 * se combinan ítem por ítem. Si los dos tocaron lo mismo, gana el cambio local.
 */
export function merge3(base: SyncedState, local: SyncedState, remote: SyncedState): SyncedState {
  const id = (x: { id: string }) => x.id;
  return {
    ...remote,
    users: mergeRecord(base.users, local.users, remote.users) as SyncedState['users'],
    categories: mergeList(base.categories, local.categories, remote.categories, id),
    conceptos: mergeList(base.conceptos, local.conceptos, remote.conceptos, id),
    movimientos: mergeList(base.movimientos, local.movimientos, remote.movimientos, id),
    objetivos: mergeList(base.objetivos, local.objetivos, remote.objetivos, id),
    metas: mergeRecord(base.metas, local.metas, remote.metas),
    gastosFijos: mergeList(base.gastosFijos, local.gastosFijos, remote.gastosFijos, id),
    instancias: mergeList(base.instancias, local.instancias, remote.instancias, (i) => `${i.gfId}|${i.mes}`),
    cajas: mergeList(base.cajas, local.cajas, remote.cajas, id),
    eventos: mergeList(base.eventos, local.eventos, remote.eventos, id),
    usdRate: pick(base.usdRate, local.usdRate, remote.usdRate),
    usdFecha: pick(base.usdFecha, local.usdFecha, remote.usdFecha),
    usdManual: pick(base.usdManual, local.usdManual, remote.usdManual),
    dataVersion: Math.max(local.dataVersion ?? 0, remote.dataVersion ?? 0),
  };
}

interface EngineOptions {
  backend: SyncBackend;
  local: SyncLocal;
  baseStore?: SyncBaseStore;
  normalize: (s: SyncedState) => SyncedState;
  now?: () => string;
  debounceMs?: number;
  retryMs?: number;
  onError?: (e: unknown) => void;
}

/**
 * Sincroniza el estado local con la fila única de la nube sin pisar cambios ajenos:
 * cada guardado trae lo último, combina (merge3) y escribe condicionado al sello
 * que leyó; si otro escribió entre medio, reintenta. Todo pasa por una cola, así
 * guardados y refrescos nunca se pisan entre sí.
 */
export class SyncEngine {
  private base: SyncedState | null = null;
  private baseAt: string | null = null;
  private queue: Promise<void> = Promise.resolve();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private applying = false;
  private dirty = false;

  constructor(private o: EngineOptions) {}

  /** True mientras aplicamos un estado de la nube (no es un cambio del usuario). */
  get isApplying() {
    return this.applying;
  }

  /**
   * Trae la nube y la aplica, rescatando cambios locales que no llegaron a subir
   * (respaldo de la sesión anterior) o que se hicieron mientras cargaba.
   */
  init(): Promise<SyncedState> {
    const p = this.queue.then(() => this.doInit());
    this.queue = p.then(
      () => undefined,
      () => undefined,
    );
    return p;
  }

  /** Llamar después de init(): sube lo rescatado, si hubo algo. */
  start() {
    if (this.dirty) {
      this.dirty = false;
      this.scheduleSave();
    }
  }

  /** El usuario cambió datos en este dispositivo. */
  notifyLocalChange() {
    if (!this.applying) this.scheduleSave();
  }

  /** Trae lo último de la nube y lo combina con lo local. */
  refresh() {
    return this.enqueue(() => this.doRefresh());
  }

  /** Chequeo liviano: si la nube cambió desde lo último que vimos, refresca. */
  async check() {
    try {
      const at = await this.o.backend.fetchUpdatedAt();
      if (at && !sameAt(at, this.baseAt)) await this.refresh();
    } catch (e) {
      this.o.onError?.(e);
    }
  }

  /** Sube ya el guardado pendiente (p. ej. al ocultar la app, antes de que el sistema la congele). */
  flush() {
    if (!this.timer) return this.queue;
    clearTimeout(this.timer);
    this.timer = null;
    return this.enqueue(() => this.doSave());
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private async doInit(): Promise<SyncedState> {
    const { backend, local, baseStore, normalize } = this.o;
    const startLocal = local.get();
    const row = await backend.fetchRow();
    if (!row) {
      const first = normalize(local.get());
      const at = this.stamp();
      if ((await backend.write(first, null, at)) === 'conflict') return this.doInit();
      this.applyLocal(first);
      this.setBase(first, at);
      return first;
    }
    const remote = normalize(row.data);
    const mine = local.get();
    const saved = baseStore?.load();
    const ref = saved ? normalize(saved.data) : startLocal;
    const result = same(mine, ref) ? remote : merge3(ref, mine, remote);
    // Primero la pantalla, después el respaldo: si la app se cierra en el medio,
    // en el próximo arranque lo "rescatado" coincide con la nube y no revierte nada.
    this.applyLocal(result);
    this.setBase(remote, row.updated_at);
    this.dirty = !same(result, remote);
    return result;
  }

  private async doSave() {
    const { backend, local, normalize } = this.o;
    if (!this.base) return;
    try {
      let tried: { at: string; state: SyncedState; mine: SyncedState } | null = null;
      for (let i = 0; i < 5; i++) {
        const mine = local.get();
        const row = await backend.fetchRow();
        // La escritura anterior figuró como conflicto pero en realidad entró (sello propio y único).
        if (tried && row && sameAt(row.updated_at, tried.at)) return this.afterSave(tried.state, tried.at, tried.mine);
        const remoteChanged = !row || !sameAt(row.updated_at, this.baseAt);
        if (!remoteChanged && same(mine, this.base)) return; // nada para subir
        const toSave = remoteChanged ? merge3(this.base, mine, row ? normalize(row.data) : this.base) : mine;
        const at = this.stamp();
        if ((await backend.write(toSave, row ? row.updated_at : null, at)) === 'conflict') {
          tried = { at, state: toSave, mine };
          continue;
        }
        return this.afterSave(toSave, at, mine);
      }
      this.scheduleSave(); // muchos conflictos seguidos: reintenta en un rato
    } catch (e) {
      this.o.onError?.(e);
      this.retry(); // sin red: los cambios quedan locales y se reintenta
    }
  }

  /** Tras guardar: reflejamos lo que trajo el merge sin perder lo que se tocó mientras guardábamos. */
  private afterSave(saved: SyncedState, at: string, mine: SyncedState) {
    const cur = this.o.local.get();
    const next = same(cur, mine) ? saved : merge3(mine, cur, saved);
    if (!same(next, cur)) this.applyLocal(next);
    this.setBase(saved, at);
    if (!same(next, saved)) this.scheduleSave();
  }

  private async doRefresh() {
    const { backend, local, normalize } = this.o;
    let row: RemoteRow | null;
    try {
      row = await backend.fetchRow();
    } catch (e) {
      this.o.onError?.(e);
      return;
    }
    if (!row || sameAt(row.updated_at, this.baseAt)) return;
    const remote = normalize(row.data);
    const mine = local.get();
    const merged = this.base ? merge3(this.base, mine, remote) : remote;
    if (!same(merged, mine)) this.applyLocal(merged);
    this.setBase(remote, row.updated_at);
    if (!same(merged, remote)) this.scheduleSave(); // había cambios locales sin subir
  }

  private scheduleSave() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.enqueue(() => this.doSave());
    }, this.o.debounceMs ?? 700);
  }

  private retry() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.enqueue(() => this.doSave());
    }, this.o.retryMs ?? 5000);
  }

  private enqueue(fn: () => Promise<void>) {
    this.queue = this.queue.then(fn).catch((e) => this.o.onError?.(e));
    return this.queue;
  }

  private applyLocal(s: SyncedState) {
    this.applying = true;
    try {
      this.o.local.apply(s);
    } finally {
      this.applying = false;
    }
  }

  private setBase(s: SyncedState, at: string) {
    this.base = s;
    this.baseAt = at;
    this.o.baseStore?.save(at, s);
  }

  /** Sello único de esta escritura: hora actual + microsegundos al azar (evita choques entre dispositivos). */
  private stamp() {
    const iso = this.o.now ? this.o.now() : new Date().toISOString();
    const us = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return iso.replace(/\.(\d{3})Z$/, `.$1${us}Z`);
  }
}
