import type { Objetivo } from '@/types/domain';

export const OBJETIVOS_SEED: Objetivo[] = [
  { id: 'o1', nombre: 'Viaje Bs. As. 2026', meta: 1200000, actual: 0, color: '#06B6D4', icono: '✈', logo: '/logos/viajes.png', owner: 'compartido' },
  { id: 'o2', nombre: 'Cuota inicial auto', meta: 4500000, actual: 0, color: '#16A34A', icono: '🚗', owner: 'compartido' },
  { id: 'o3', nombre: 'Fondo emergencia', meta: 2000000, actual: 0, color: '#D97706', icono: '🛟', logo: '/logos/inversiones.png', owner: 'compartido' },
];
