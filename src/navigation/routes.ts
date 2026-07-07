import type { IconName } from '@/components/ui/icons';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: IconName;
  emoji?: string;
  sub?: string;
}

/** Bottom tab bar (mobile): 6 destinos. */
export const TABS: NavItem[] = [
  { id: 'dashboard', label: 'Inicio', path: '/', icon: 'home' },
  { id: 'gastos', label: 'Gastos', path: '/vencimientos', icon: 'receipt' },
  { id: 'movimientos', label: 'Movim.', path: '/movimientos', icon: 'list' },
  { id: 'ahorros', label: 'Ahorros', path: '/ahorros', icon: 'piggy' },
  { id: 'cajas', label: 'Cuentas', path: '/mas/cajas', icon: 'wallet' },
  { id: 'mas', label: 'Más', path: '/mas', icon: 'more' },
];

/** Sidebar desktop — sección principal (mismo set que el bottom bar mobile). */
export const SIDEBAR_PRIMARY: NavItem[] = [
  { id: 'dashboard', label: 'Inicio', path: '/', icon: 'home' },
  { id: 'gastos', label: 'Gastos fijos', path: '/vencimientos', icon: 'receipt' },
  { id: 'movimientos', label: 'Movimientos', path: '/movimientos', icon: 'list' },
  { id: 'ahorros', label: 'Ahorros', path: '/ahorros', icon: 'piggy' },
  { id: 'cajas', label: 'Cuentas', path: '/mas/cajas', icon: 'wallet' },
];

/** Sidebar desktop — módulos secundarios (mismo set que "Más" en mobile). */
export const SIDEBAR_MODULES: NavItem[] = [
  { id: 'analisis', label: 'Análisis', path: '/analisis', icon: 'chart' },
  { id: 'eventos', label: 'Eventos', path: '/mas/eventos', emoji: '🎉' },
  { id: 'config', label: 'Configuración', path: '/mas/configuracion', icon: 'cog' },
];

/** Pantalla "Más" (mobile): lo que no está en el bottom bar. Igual que SIDEBAR_MODULES. */
export const MAS_MENU: NavItem[] = [
  { id: 'analisis', label: 'Análisis', path: '/analisis', emoji: '📈', sub: 'Estadísticas y fin de mes' },
  { id: 'eventos', label: 'Eventos', path: '/mas/eventos', emoji: '🎉', sub: 'Gastos compartidos (ocasional)' },
  { id: 'config', label: 'Configuración', path: '/mas/configuracion', emoji: '⚙️', sub: 'Cuentas, alertas, metas, usuarios y dólar' },
];

export const VENCIMIENTOS_PATH = '/vencimientos';
