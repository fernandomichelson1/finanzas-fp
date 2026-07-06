import type { Caja, Categoria, UserId, Usuario } from '@/types/domain';
import { useFinanzasStore } from './useFinanzasStore';

/** Lookups reactivos sobre el store. Devuelven `undefined` si no existe. */
export const useUserById = (id?: UserId): Usuario | undefined =>
  useFinanzasStore((s) => (id ? s.users[id] : undefined));

export const useCatById = (id?: string | null): Categoria | undefined =>
  useFinanzasStore((s) => (id ? s.categories.find((c) => c.id === id) : undefined));

export const useCajaById = (id?: string | null): Caja | undefined =>
  useFinanzasStore((s) => (id ? s.cajas.find((c) => c.id === id) : undefined));
