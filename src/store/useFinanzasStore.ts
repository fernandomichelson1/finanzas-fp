import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { buildInitialData, type FinanzasData } from '@/data';
import { TODAY } from '@/lib/date';
import { uid } from '@/lib/id';
import { normalizeHousehold } from '@/lib/migrate';
import type {
  Caja,
  Categoria,
  CategoriaTipo,
  CategoriaUso,
  Concepto,
  Movimiento,
  Objetivo,
  Owner,
  Rol,
  UserId,
  Usuario,
  VencimientoInstancia,
  VencimientoRow,
} from '@/types/domain';

// ── Forma del estado ──
interface SessionState {
  loggedIn: boolean;
  currentUser: UserId;
}

interface UiState {
  toast: Movimiento | null;
  /** Cotización del dólar (ARS por USD) para la vista en dólares. */
  usdRate: number;
  /** Fecha de la última cotización del blue (ISO). */
  usdFecha?: string;
  /** True si el usuario fijó el valor a mano (no se pisa con el blue automático). */
  usdManual?: boolean;
}

interface Actions {
  // sesión
  login: (uid: UserId) => void;
  logout: () => void;
  setCurrentUser: (uid: UserId) => void;

  // movimientos
  addMovimiento: (mov: Movimiento) => void;

  // conceptos / categorías / usuarios
  createConcepto: (input: { nombre: string; cat: string }) => Concepto;
  deleteConcepto: (id: string) => void;
  createCategory: (input: {
    nombre: string;
    tipo: CategoriaTipo;
    color: string;
    icono: string;
    uso?: CategoriaUso;
  }) => Categoria;
  setCategoryUso: (id: string, uso: CategoriaUso) => void;
  createUser: (input: { nombre: string; iniciales: string; color: string; rol: Rol }) => Usuario;
  updateUser: (id: UserId, payload: Partial<Usuario>) => void;

  // ahorros
  logAporte: (objetivoId: string, monto: number) => void;
  createObjetivo: (payload: Omit<Objetivo, 'id'>) => Objetivo;
  updateObjetivo: (id: string, payload: Partial<Objetivo>) => void;
  deleteObjetivo: (id: string) => void;

  // metas
  setMeta: (catId: string, value: number) => void;
  deleteMeta: (catId: string) => void;

  // eventos
  closeEvent: (eventoId: string) => void;
  togglePaidDeuda: (eventoId: string, key: string) => void;

  // cajas
  createCaja: (payload: Omit<Caja, 'id'>) => Caja;
  updateCaja: (id: string, payload: Partial<Caja>) => void;
  archiveCaja: (id: string) => void;

  // gastos fijos / vencimientos
  createGastoFijo: (input: {
    nombre: string;
    cat: string;
    diaVenc: number;
    montoSugerido: number;
    owner: Owner;
  }) => void;
  setGastoFijoOwnerFrom: (id: string, desde: string, owner: Owner) => void;
  updateInstancia: (gfId: string, mes: string, payload: Partial<VencimientoInstancia>) => void;
  pagarVencimiento: (venc: VencimientoRow, cajaId: string) => void;
  unpagarVencimiento: (gfId: string, mes: string) => void;
  pauseGastoFijo: (id: string, activate: boolean) => void;
  deleteGastoFijo: (id: string) => void;

  // ui
  showToast: (mov: Movimiento) => void;
  clearToast: () => void;
  setUsdRate: (rate: number) => void;
  setUsdBlue: (venta: number, fecha: string) => void;

  // dev / backend seam
  resetData: () => void;
}

export type FinanzasStore = FinanzasData & SessionState & UiState & Actions;

const STORAGE_KEY = 'finanzas-fp:store';

export const useFinanzasStore = create<FinanzasStore>()(
  persist(
    (set, get) => ({
      ...buildInitialData(),
      loggedIn: false,
      currentUser: 'fer',
      toast: null,
      usdRate: 1400,

      // ── sesión ──
      login: (id) => set({ loggedIn: true, currentUser: id }),
      logout: () => set({ loggedIn: false }),
      setCurrentUser: (id) => set({ currentUser: id }),

      // ── movimientos ──
      addMovimiento: (mov) =>
        set((s) => {
          const m = { ...mov, usdRate: mov.usdRate ?? s.usdRate };
          return { movimientos: [m, ...s.movimientos], toast: m };
        }),

      // ── conceptos / categorías / usuarios ──
      createConcepto: ({ nombre, cat }) => {
        const nuevo: Concepto = { id: uid('co'), nombre, cat };
        set((s) => ({ conceptos: [...s.conceptos, nuevo] }));
        return nuevo;
      },
      deleteConcepto: (id) =>
        set((s) => ({ conceptos: s.conceptos.filter((c) => c.id !== id) })),

      createCategory: ({ nombre, tipo, color, icono, uso }) => {
        const nueva: Categoria = {
          id: uid('cat'),
          nombre,
          tipo,
          color,
          icono,
          custom: true,
          uso: tipo === 'gasto' ? uso ?? 'eventual' : undefined,
        };
        set((s) => ({ categories: [...s.categories, nueva] }));
        return nueva;
      },
      setCategoryUso: (id, uso) =>
        set((s) => ({
          categories: s.categories.map((c) => (c.id === id ? { ...c, uso } : c)),
        })),

      createUser: ({ nombre, iniciales, color, rol }) => {
        const id = uid('u');
        const nuevo: Usuario = { id, nombre, iniciales, color, rol, custom: true };
        set((s) => ({ users: { ...s.users, [id]: nuevo } }));
        return nuevo;
      },
      updateUser: (id, payload) =>
        set((s) => (s.users[id] ? { users: { ...s.users, [id]: { ...s.users[id], ...payload } } } : s)),

      // ── ahorros ──
      logAporte: (objetivoId, monto) => {
        const obj = get().objetivos.find((o) => o.id === objetivoId);
        const mov: Movimiento = {
          id: uid('aporte'),
          fecha: TODAY,
          desc: `Aporte a ${obj?.nombre ?? 'objetivo'}`,
          monto,
          tipo: 'ahorro',
          cat: 'aho',
          concepto: null,
          caja: null,
          user: get().currentUser,
          tags: [],
          usdRate: get().usdRate,
        };
        set((s) => ({
          objetivos: s.objetivos.map((o) =>
            o.id === objetivoId ? { ...o, actual: o.actual + monto } : o,
          ),
          movimientos: [mov, ...s.movimientos],
          toast: mov,
        }));
      },

      createObjetivo: (payload) => {
        const nuevo: Objetivo = { id: uid('o'), ...payload };
        set((s) => ({ objetivos: [...s.objetivos, nuevo] }));
        return nuevo;
      },
      updateObjetivo: (id, payload) =>
        set((s) => ({ objetivos: s.objetivos.map((o) => (o.id === id ? { ...o, ...payload } : o)) })),
      deleteObjetivo: (id) => set((s) => ({ objetivos: s.objetivos.filter((o) => o.id !== id) })),

      // ── metas ──
      setMeta: (catId, value) => set((s) => ({ metas: { ...s.metas, [catId]: value } })),
      deleteMeta: (catId) =>
        set((s) => {
          const next = { ...s.metas };
          delete next[catId];
          return { metas: next };
        }),

      // ── eventos ──
      closeEvent: (eventoId) =>
        set((s) => ({
          eventos: s.eventos.map((e) =>
            e.id === eventoId ? { ...e, estado: 'cerrado' as const } : e,
          ),
        })),
      togglePaidDeuda: (eventoId, key) =>
        set((s) => ({
          eventos: s.eventos.map((e) => {
            if (e.id !== eventoId) return e;
            const ds = { ...(e.deudasSaldadas ?? {}) };
            ds[key] = !ds[key];
            return { ...e, deudasSaldadas: ds };
          }),
        })),

      // ── cajas ──
      createCaja: (payload) => {
        const nueva: Caja = { id: uid('c'), ...payload };
        set((s) => ({ cajas: [...s.cajas, nueva] }));
        return nueva;
      },
      updateCaja: (id, payload) =>
        set((s) => ({ cajas: s.cajas.map((c) => (c.id === id ? { ...c, ...payload } : c)) })),
      archiveCaja: (id) => set((s) => ({ cajas: s.cajas.filter((c) => c.id !== id) })),

      // ── gastos fijos / vencimientos ──
      createGastoFijo: ({ nombre, cat, diaVenc, montoSugerido, owner }) =>
        set((s) => ({
          gastosFijos: [
            ...s.gastosFijos,
            { id: uid('gf'), nombre, cat, diaVenc, montoSugerido, activo: true, owner },
          ],
        })),

      setGastoFijoOwnerFrom: (id, desde, owner) =>
        set((s) => ({
          gastosFijos: s.gastosFijos.map((gf) => {
            if (gf.id !== id) return gf;
            const hist = (gf.ownerHistory ?? []).filter((e) => e.desde !== desde);
            hist.push({ desde, owner });
            hist.sort((a, b) => a.desde.localeCompare(b.desde));
            return { ...gf, ownerHistory: hist };
          }),
        })),

      updateInstancia: (gfId, mes, payload) =>
        set((s) => {
          const i = s.instancias.findIndex((x) => x.gfId === gfId && x.mes === mes);
          if (i === -1) return { instancias: [...s.instancias, { gfId, mes, ...payload }] };
          const copy = [...s.instancias];
          copy[i] = { ...copy[i], ...payload };
          return { instancias: copy };
        }),

      pagarVencimiento: (venc, cajaId) => {
        const movId = uid('gf-pago');
        const mov: Movimiento = {
          id: movId,
          fecha: TODAY,
          desc: venc.nombre,
          monto: venc.monto,
          tipo: 'gasto',
          cat: venc.cat,
          concepto: null,
          caja: cajaId,
          user: get().currentUser,
          tags: ['gasto-fijo'],
          usdRate: get().usdRate,
        };
        set((s) => {
          const i = s.instancias.findIndex((x) => x.gfId === venc.gfId && x.mes === venc.mes);
          const updated: VencimientoInstancia = {
            gfId: venc.gfId,
            mes: venc.mes,
            monto: venc.monto,
            fecha: venc.vence,
            pagado: true,
            pagadoFecha: TODAY,
            pagadoMovId: movId,
            usdRate: get().usdRate,
          };
          const instancias =
            i === -1
              ? [...s.instancias, updated]
              : s.instancias.map((x, idx) => (idx === i ? { ...x, ...updated } : x));
          return { movimientos: [mov, ...s.movimientos], instancias, toast: mov };
        });
      },

      unpagarVencimiento: (gfId, mes) =>
        set((s) => {
          const inst = s.instancias.find((x) => x.gfId === gfId && x.mes === mes);
          const movId = inst?.pagadoMovId;
          const instancias = s.instancias.map((x) => {
            if (x.gfId !== gfId || x.mes !== mes) return x;
            const { pagado: _p, pagadoFecha: _f, pagadoMovId: _m, ...rest } = x;
            return { ...rest, pagado: false };
          });
          return {
            instancias,
            movimientos: movId ? s.movimientos.filter((m) => m.id !== movId) : s.movimientos,
          };
        }),

      pauseGastoFijo: (id, activate) =>
        set((s) => ({
          gastosFijos: s.gastosFijos.map((gf) => (gf.id === id ? { ...gf, activo: activate } : gf)),
        })),
      deleteGastoFijo: (id) =>
        set((s) => ({ gastosFijos: s.gastosFijos.filter((gf) => gf.id !== id) })),

      // ── ui ──
      showToast: (mov) => set({ toast: mov }),
      clearToast: () => set({ toast: null }),
      setUsdRate: (rate) => set({ usdRate: rate > 0 ? rate : 1, usdManual: true }),
      setUsdBlue: (venta, fecha) =>
        set({ usdRate: venta > 0 ? venta : 1, usdFecha: fecha, usdManual: false }),

      // ── reset (dev) ──
      resetData: () => set({ ...buildInitialData() }),
    }),
    {
      name: STORAGE_KEY,
      version: 2,
      // No persistimos el toast (transitorio).
      partialize: ({ toast: _toast, ...rest }) => rest,
      // Normaliza + migra (reimport v3) al rehidratar. Forzamos el dataVersion del
      // dato GUARDADO (no el de los seeds) para que la migración corra en datos viejos.
      merge: (persisted, current) => {
        if (!persisted) return current;
        const p = persisted as Partial<FinanzasStore> & { dataVersion?: number };
        return normalizeHousehold({ ...current, ...p, dataVersion: p.dataVersion ?? 0 });
      },
    },
  ),
);
