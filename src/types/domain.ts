// ─────────────────────────────────────────────────────────────
// Modelo de dominio — Finanzas F&P
// Toda la moneda es ARS. Fechas en ISO ('YYYY-MM-DD').
// ─────────────────────────────────────────────────────────────

export type UserId = string; // 'fer' | 'pao' | custom
export type Rol = 'admin' | 'co-usuario';
export type CategoriaTipo = 'gasto' | 'ingreso' | 'ahorro';
export type MovimientoTipo = 'gasto' | 'ingreso' | 'ahorro' | 'retencion' | 'transferencia';
export type CajaTipo = 'efectivo' | 'billetera' | 'banco' | 'plazo_fijo';
export type EventoEstado = 'activo' | 'cerrado';
export type ThemeMode = 'dark' | 'light';

/** Fecha ISO sin hora, p.ej. '2026-05-19'. */
export type ISODate = string;
/** Mes calendario, p.ej. '2026-05'. */
export type Mes = string;

// ── Usuario ──
export interface Usuario {
  id: UserId;
  nombre: string;
  iniciales: string;
  color: string; // hex; avatar con gradiente 135°
  rol: Rol;
  custom?: boolean;
}

// ── Categoría ──
/** Uso de una categoría de gasto: recurrente (gasto fijo), del día a día, o ambos. */
export type CategoriaUso = 'fijo' | 'eventual' | 'ambos';

export interface Categoria {
  id: string;
  nombre: string;
  tipo: CategoriaTipo;
  color: string; // hex
  icono: string; // emoji fallback
  logo?: string; // ruta a PNG en /logos (prevalece sobre icono)
  uso?: CategoriaUso; // solo aplica a tipo 'gasto'; define dónde aparece
  custom?: boolean;
}

// ── Concepto (segundo nivel bajo una categoría) ──
export interface Concepto {
  id: string;
  nombre: string;
  cat: string; // → Categoria.id
  archivado?: boolean;
}

// ── Movimiento (entidad central) ──
export interface Movimiento {
  id: string;
  fecha: ISODate;
  desc: string;
  monto: number; // positivo, ARS
  tipo: MovimientoTipo;
  cat: string | null; // null en transferencia
  concepto: string | null;
  caja: string | null; // caja destino / afectada
  caja_origen?: string | null; // solo ahorro / transferencia
  user: UserId;
  tags: string[];
  parent?: string; // p.ej. una retención cuelga de su ingreso
  notas?: string;
  /** Cotización del dólar (ARS/USD) al momento de cargarlo, para acumular en USD. */
  usdRate?: number;
}

// ── Dueño / responsable ──
/** Compartido entre ambos o personal de un usuario. */
export type Owner = 'compartido' | UserId;

// ── Objetivo de ahorro ──
/** Dueño de un objetivo/chanchito: compartido entre ambos o personal. */
export type ObjetivoOwner = Owner;

export interface Objetivo {
  id: string;
  nombre: string;
  meta: number;
  actual: number;
  color: string;
  icono: string;
  logo?: string;
  fecha_limite?: string | null;
  creado_por?: UserId;
  owner?: ObjetivoOwner; // compartido (default) | 'fer' | 'pao'
  estado?: 'activo' | 'cumplido';
}

// ── Meta mensual por categoría ──
export type Metas = Record<string, number>; // catId → monto mensual

// ── Gasto fijo (template) + instancia mensual ──
export interface GastoFijo {
  id: string;
  nombre: string;
  cat: string;
  diaVenc: number; // 1..31
  montoSugerido: number;
  activo: boolean;
  owner: Owner; // responsable base (meses previos a cualquier cambio)
  /** Cambios de responsable, cada uno vale desde su mes en adelante (no hacia atrás). */
  ownerHistory?: { desde: Mes; owner: Owner }[];
}

export interface VencimientoInstancia {
  gfId: string;
  mes: Mes;
  monto?: number;
  fecha?: ISODate;
  pagado?: boolean;
  pagadoFecha?: ISODate;
  pagadoMovId?: string;
}

/** Fila derivada por `computeVencimientos`: template + instancia del mes. */
export interface VencimientoRow {
  id: string; // `${gfId}__${mes}`
  gfId: string;
  mes: Mes;
  nombre: string;
  cat: string;
  monto: number;
  vence: ISODate;
  pagado: boolean;
  pagadoFecha?: ISODate;
  pagadoMovId?: string;
  diaVenc: number;
  montoSugerido: number;
  owner: Owner;
  /** El monto viene arrastrado del mes anterior (aún sin instancia propia este mes). */
  prefilled: boolean;
}

// ── Caja / wallet ──
export interface Caja {
  id: string;
  nombre: string;
  tipo: CajaTipo;
  color: string;
  icono: string;
  logo?: string;
  owner: UserId;
  saldo_inicial: number;
  archivada?: boolean;
}

export interface CajaTipoDef {
  id: CajaTipo;
  label: string;
  icon: string;
  sub: string;
}

// ── Evento (gasto compartido) ──
export interface EventoParticipante {
  id: string; // 'p1', 'p2', …
  nombre: string;
  user_id: UserId | null; // null = externo (no es usuario de la app)
}

export interface EventoGasto {
  id: string;
  desc: string;
  monto: number;
  pagado_por: string; // → EventoParticipante.id
  cat: string;
}

export interface Evento {
  id: string;
  nombre: string;
  descripcion: string;
  fecha_inicio: ISODate;
  fecha_cierre: ISODate;
  creado_por: UserId;
  estado: EventoEstado;
  moneda: 'ARS';
  participantes: EventoParticipante[];
  gastos: EventoGasto[];
  deudasSaldadas?: Record<string, boolean>; // `${fromId}-${toId}` → bool
}

// ── Derivados de liquidación (computeLiquidation) ──
export interface Balance extends EventoParticipante {
  paid: number;
  balance: number; // pagado − parte justa
}
export interface Deuda {
  from: EventoParticipante;
  to: EventoParticipante;
  amount: number;
}
export interface Liquidation {
  total: number;
  share: number;
  balances: Balance[];
  deudas: Deuda[];
}

// ── Series para Stats ──
export interface HistoriaMes {
  mes: Mes;
  label: string;
  ingresos: number;
  gastos: number;
  ahorro: number;
  score: number;
}

/** Matriz 6 semanas × 7 días, gasto diario en miles de ARS. */
export type HeatMatrix = number[][];
