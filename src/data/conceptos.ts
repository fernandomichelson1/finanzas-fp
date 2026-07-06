import type { Concepto } from '@/types/domain';

// Segundo nivel debajo de cada categoría. Fer (admin) puede crear/archivar.
export const CONCEPTOS_SEED: Concepto[] = [
  // Tarjetas de crédito
  { id: 'tc-banco', nombre: 'BanCo Visa', cat: 'tc' },
  { id: 'tc-sant-visa', nombre: 'Santander Visa', cat: 'tc' },
  { id: 'tc-sant-amex', nombre: 'Santander Amex', cat: 'tc' },
  { id: 'tc-reb-amex', nombre: 'Rebanking Amex', cat: 'tc' },
  // Educación
  { id: 'edu-yaperu', nombre: 'Colegio Yaperú', cat: 'edu' },
  { id: 'edu-salesiano', nombre: 'Colegio Salesiano', cat: 'edu' },
  { id: 'edu-ingles', nombre: 'Inglés Cande', cat: 'edu' },
  { id: 'edu-atletismo', nombre: 'Atletismo Cande', cat: 'edu' },
  { id: 'edu-ana', nombre: 'Seño Ana', cat: 'edu' },
  // Vivienda
  { id: 'viv-sm708', nombre: 'Expensas San Martín 708', cat: 'viv' },
  { id: 'viv-manz', nombre: 'La Manzana', cat: 'viv' },
  { id: 'viv-alq', nombre: 'Alquiler', cat: 'viv' },
  // Servicios del hogar
  { id: 'serv-cable', nombre: 'Cablevisión', cat: 'serv' },
  { id: 'serv-dpec', nombre: 'DPEC', cat: 'serv' },
  { id: 'serv-aguas', nombre: 'Aguas', cat: 'serv' },
  { id: 'serv-guard', nombre: 'El Guardián', cat: 'serv' },
  // Seguros
  { id: 'seg-auto', nombre: 'La Segunda Auto', cat: 'seg' },
  { id: 'seg-moto', nombre: 'La Segunda Moto', cat: 'seg' },
  // Salud
  { id: 'sal-fer', nombre: 'Obra social Fer', cat: 'sal' },
  { id: 'sal-pao', nombre: 'Obra social Pao', cat: 'sal' },
  // Celulares
  { id: 'cel-fer', nombre: 'Celular Fer', cat: 'cel' },
  { id: 'cel-pao', nombre: 'Celular Pao', cat: 'cel' },
  { id: 'cel-cande', nombre: 'Celular Cande', cat: 'cel' },
  // Impuestos
  { id: 'imp-afip-fer', nombre: 'AFIP Fer', cat: 'imp' },
  { id: 'imp-afip-pao', nombre: 'AFIP Pao', cat: 'imp' },
  { id: 'imp-rentas-fer', nombre: 'Rentas Fer', cat: 'imp' },
  { id: 'imp-rentas-pao', nombre: 'Rentas Pao', cat: 'imp' },
  // Honorarios
  { id: 'hon-david', nombre: 'Contador David', cat: 'hon' },
  // Marketing
  { id: 'mkt-mami', nombre: 'Marketing Mami Fitness', cat: 'mkt' },
  // Alimentación
  { id: 'ali-super', nombre: 'Supermercado', cat: 'ali' },
  { id: 'ali-verdu', nombre: 'Verdulería', cat: 'ali' },
  { id: 'ali-carni', nombre: 'Carnicería', cat: 'ali' },
  // Transporte
  { id: 'tra-comb', nombre: 'Combustible', cat: 'tra' },
  { id: 'tra-peaje', nombre: 'Peajes', cat: 'tra' },
  { id: 'tra-remis', nombre: 'Remis', cat: 'tra' },
  // Entretenimiento
  { id: 'ent-sal', nombre: 'Salidas', cat: 'ent' },
  { id: 'ent-stream', nombre: 'Streaming', cat: 'ent' },
  { id: 'ent-viaje', nombre: 'Viajes', cat: 'ent' },
  // Otros gastos
  { id: 'otrog-varios', nombre: 'Gastos varios', cat: 'otrog' },
  // Ingresos
  { id: 'ingl-sueldo', nombre: 'Sueldo', cat: 'ingl' },
  { id: 'ingl-honorarios', nombre: 'Honorarios cobrados', cat: 'ingl' },
  { id: 'otroi-ventas', nombre: 'Ventas', cat: 'otroi' },
  { id: 'otroi-trans', nombre: 'Transferencias recibidas', cat: 'otroi' },
  // Ahorros
  { id: 'aho-cja', nombre: 'Caja de ahorro', cat: 'aho' },
  { id: 'aho-pf', nombre: 'Plazo fijo', cat: 'aho' },
];
