import type { Categoria } from '@/types/domain';

export const CATEGORIES_SEED: Categoria[] = [
  // GASTOS FIJOS (recurrentes; entran por "Gastos fijos")
  { id: 'tc', nombre: 'Tarjetas de crédito', tipo: 'gasto', color: '#8B5CF6', icono: '💳', logo: '/logos/tarjetas.png', uso: 'fijo' },
  { id: 'edu', nombre: 'Educación', tipo: 'gasto', color: '#06B6D4', icono: '🎓', logo: '/logos/educacion.png', uso: 'fijo' },
  { id: 'viv', nombre: 'Vivienda', tipo: 'gasto', color: '#F97316', icono: '🏠', logo: '/logos/vivienda.png', uso: 'fijo' },
  { id: 'serv', nombre: 'Servicios del hogar', tipo: 'gasto', color: '#0EA5E9', icono: '⚡', logo: '/logos/servicios.png', uso: 'fijo' },
  { id: 'seg', nombre: 'Seguros', tipo: 'gasto', color: '#64748B', icono: '🛡', logo: '/logos/seguros.png', uso: 'fijo' },
  { id: 'cel', nombre: 'Celulares', tipo: 'gasto', color: '#A855F7', icono: '📱', logo: '/logos/celulares.png', uso: 'fijo' },
  { id: 'imp', nombre: 'Impuestos', tipo: 'gasto', color: '#475569', icono: '🧾', logo: '/logos/impuestos.png', uso: 'fijo' },
  { id: 'hon', nombre: 'Honorarios prof.', tipo: 'gasto', color: '#0891B2', icono: '👔', logo: '/logos/honorarios.png', uso: 'fijo' },
  { id: 'prestamo', nombre: 'Préstamos', tipo: 'gasto', color: '#0D9488', icono: '🏦', uso: 'fijo' },
  // EVENTUALES (día a día; entran por el "+")
  { id: 'ali', nombre: 'Alimentación', tipo: 'gasto', color: '#22C55E', icono: '🛒', logo: '/logos/alimentos.png', uso: 'eventual' },
  { id: 'tra', nombre: 'Transporte', tipo: 'gasto', color: '#EAB308', icono: '⛽', uso: 'eventual' },
  { id: 'ent', nombre: 'Entretenimiento', tipo: 'gasto', color: '#F43F5E', icono: '🎬', logo: '/logos/entretenimiento.png', uso: 'eventual' },
  // AMBOS (pueden ser fijo o eventual: obra social vs farmacia, etc.)
  { id: 'sal', nombre: 'Salud', tipo: 'gasto', color: '#EC4899', icono: '⚕', logo: '/logos/salud.png', uso: 'ambos' },
  { id: 'mkt', nombre: 'Marketing', tipo: 'gasto', color: '#E11D48', icono: '📣', logo: '/logos/marketing.png', uso: 'ambos' },
  { id: 'otrog', nombre: 'Otros gastos', tipo: 'gasto', color: '#9CA3AF', icono: '•', logo: '/logos/otros-gastos.png', uso: 'ambos' },
  // INGRESOS
  { id: 'ingl', nombre: 'Ingresos laborales', tipo: 'ingreso', color: '#16A34A', icono: '💼' },
  { id: 'otroi', nombre: 'Otros ingresos', tipo: 'ingreso', color: '#10B981', icono: '↗' },
  // AHORROS
  { id: 'aho', nombre: 'Ahorros', tipo: 'ahorro', color: '#D97706', icono: '🐷' },
];
