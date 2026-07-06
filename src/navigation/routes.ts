import type { IconName } from '@/components/ui/icons';

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon?: IconName;
  emoji?: string;
  sub?: string;
}

/** Bottom tab bar (mobile): 5 destinos. */
export const TABS: NavItem[] = [
  { id: 'dashboard', label: 'Inicio', path: '/', icon: 'home' },
  { id: 'gastos', label: 'Gastos fijos', path: '/vencimientos', icon: 'receipt' },
  { id: 'movimientos', label: 'Movimientos', path: '/movimientos', icon: 'list' },
  { id: 'ahorros', label: 'Ahorros', path: '/ahorros', icon: 'piggy' },
  { id: 'mas', label: 'Más', path: '/mas', icon: 'more' },
];

/** Sidebar desktop — sección principal (lo de uso diario). */
export const SIDEBAR_PRIMARY: NavItem[] = [
  { id: 'dashboard', label: 'Inicio', path: '/', icon: 'home' },
  { id: 'gastos', label: 'Gastos fijos', path: '/vencimientos', icon: 'receipt' },
  { id: 'movimientos', label: 'Movimientos', path: '/movimientos', icon: 'list' },
  { id: 'cajas', label: 'Cuentas', path: '/mas/cajas', icon: 'wallet' },
  { id: 'ahorros', label: 'Ahorros', path: '/ahorros', icon: 'piggy' },
];

/** Sidebar desktop — módulos secundarios (abajo). */
export const SIDEBAR_MODULES: NavItem[] = [
  { id: 'estadisticas', label: 'Estadísticas', path: '/estadisticas', emoji: '📊' },
  { id: 'analisis', label: 'Análisis', path: '/analisis', icon: 'chart' },
  { id: 'alertas', label: 'Alertas y metas', path: '/mas/alertas', icon: 'bell' },
  { id: 'config', label: 'Configuración', path: '/mas/configuracion', icon: 'cog' },
  { id: 'eventos', label: 'Eventos', path: '/mas/eventos', emoji: '🎉' },
];

/** Pantalla "Más" (mobile): lo que no está en el bottom bar. */
export const MAS_MENU: NavItem[] = [
  { id: 'estadisticas', label: 'Estadísticas', path: '/estadisticas', emoji: '📊', sub: 'Quién paga, ingresa y ahorra' },
  { id: 'cajas', label: 'Cuentas', path: '/mas/cajas', emoji: '💼', sub: 'Cuentas y billeteras' },
  { id: 'analisis', label: 'Análisis', path: '/analisis', emoji: '📈', sub: 'Tendencias, semana y fin de mes' },
  { id: 'alertas', label: 'Alertas y metas', path: '/mas/alertas', emoji: '🔔', sub: 'Límites de gasto por categoría' },
  { id: 'config', label: 'Configuración', path: '/mas/configuracion', emoji: '⚙️', sub: 'Usuarios, tema y dólar' },
  { id: 'eventos', label: 'Eventos', path: '/mas/eventos', emoji: '🎉', sub: 'Gastos compartidos (ocasional)' },
];

export const VENCIMIENTOS_PATH = '/vencimientos';
