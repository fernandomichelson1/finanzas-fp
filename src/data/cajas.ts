import type { Caja, CajaTipoDef } from '@/types/domain';

// Cajas / wallets por usuario. No vinculadas a bancos reales.
// Saldos en 0: cada uno ajusta el saldo real (o crea/borra cuentas) desde Configuración → Cuentas.
export const CAJAS_SEED: Caja[] = [
  // FER
  { id: 'c-fer-ef', nombre: 'Efectivo', tipo: 'efectivo', color: '#16A34A', icono: '💵', owner: 'fer', saldo_inicial: 0 },
  { id: 'c-fer-mp', nombre: 'Mercado Pago', tipo: 'billetera', color: '#0EA5E9', icono: '🟦', logo: '/logos/mercado-pago.png', owner: 'fer', saldo_inicial: 0 },
  { id: 'c-fer-bru', nombre: 'Brubank', tipo: 'billetera', color: '#8B5CF6', icono: '🟣', logo: '/logos/brubank.png', owner: 'fer', saldo_inicial: 0 },
  { id: 'c-fer-cor', nombre: 'Banco de Corrientes', tipo: 'banco', color: '#1D4ED8', icono: '🏦', logo: '/logos/banco-corrientes.png', owner: 'fer', saldo_inicial: 0 },
  { id: 'c-fer-pf', nombre: 'Plazo Fijo Corrientes', tipo: 'plazo_fijo', color: '#0F766E', icono: '📈', logo: '/logos/inversiones.png', owner: 'fer', saldo_inicial: 0 },
  // PAO
  { id: 'c-pao-ef', nombre: 'Efectivo', tipo: 'efectivo', color: '#16A34A', icono: '💵', owner: 'pao', saldo_inicial: 0 },
  { id: 'c-pao-mp', nombre: 'Mercado Pago', tipo: 'billetera', color: '#0EA5E9', icono: '🟦', logo: '/logos/mercado-pago.png', owner: 'pao', saldo_inicial: 0 },
  { id: 'c-pao-reb', nombre: 'Rebanking', tipo: 'billetera', color: '#65A30D', icono: '🟢', logo: '/logos/rebanking.png', owner: 'pao', saldo_inicial: 0 },
];

export const CAJA_TIPOS: CajaTipoDef[] = [
  { id: 'efectivo', label: 'Efectivo', icon: '💵', sub: 'Plata en mano' },
  { id: 'billetera', label: 'Billetera virtual', icon: '📱', sub: 'MP, Ualá, Brubank...' },
  { id: 'banco', label: 'Cuenta bancaria', icon: '🏦', sub: 'Caja de ahorro / cte.' },
  { id: 'plazo_fijo', label: 'Plazo fijo', icon: '📈', sub: 'Inversión / inmovilizado' },
];
