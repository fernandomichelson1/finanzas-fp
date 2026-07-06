import type { Evento } from '@/types/domain';

// Eventos — gastos compartidos con liquidación de deudas.
export const EVENTOS_SEED: Evento[] = [
  {
    id: 'ev1',
    nombre: 'Viaje Bs. As. Junio',
    descripcion: 'Fin de semana largo con amigos',
    fecha_inicio: '2026-06-12',
    fecha_cierre: '2026-06-15',
    creado_por: 'fer',
    estado: 'activo',
    moneda: 'ARS',
    participantes: [
      { id: 'p1', nombre: 'Fer', user_id: 'fer' },
      { id: 'p2', nombre: 'Pao', user_id: 'pao' },
      { id: 'p3', nombre: 'Marcos', user_id: null },
      { id: 'p4', nombre: 'Lucía', user_id: null },
    ],
    gastos: [
      { id: 'g1', desc: 'Hotel 3 noches', monto: 380000, pagado_por: 'p1', cat: 'viv' },
      { id: 'g2', desc: 'Cena Las Cañitas', monto: 84000, pagado_por: 'p2', cat: 'ent' },
      { id: 'g3', desc: 'Combustible ida', monto: 62000, pagado_por: 'p3', cat: 'tra' },
      { id: 'g4', desc: 'Desayunos varios', monto: 36000, pagado_por: 'p4', cat: 'ali' },
      { id: 'g5', desc: 'Entradas show', monto: 120000, pagado_por: 'p1', cat: 'ent' },
      { id: 'g6', desc: 'Cena de cierre', monto: 96000, pagado_por: 'p2', cat: 'ent' },
    ],
  },
  {
    id: 'ev2',
    nombre: 'Cena cumple Marcos',
    descripcion: 'Cumpleaños en Costanera',
    fecha_inicio: '2026-04-26',
    fecha_cierre: '2026-04-26',
    creado_por: 'pao',
    estado: 'cerrado',
    moneda: 'ARS',
    participantes: [
      { id: 'p1', nombre: 'Fer', user_id: 'fer' },
      { id: 'p2', nombre: 'Pao', user_id: 'pao' },
      { id: 'p3', nombre: 'Marcos', user_id: null },
      { id: 'p4', nombre: 'Sofi', user_id: null },
    ],
    gastos: [
      { id: 'g1', desc: 'Reserva mesa', monto: 38000, pagado_por: 'p2', cat: 'ent' },
      { id: 'g2', desc: 'Regalo Marcos', monto: 25000, pagado_por: 'p1', cat: 'ent' },
      { id: 'g3', desc: 'Cena', monto: 142000, pagado_por: 'p1', cat: 'ent' },
      { id: 'g4', desc: 'Trago de cierre', monto: 18000, pagado_por: 'p4', cat: 'ent' },
    ],
    deudasSaldadas: { 'p4-p1': true },
  },
];
