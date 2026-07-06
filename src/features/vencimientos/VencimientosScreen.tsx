import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Owner, UserId, VencimientoRow as VRow } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { computeVencimientos, usdPagadoDelMes } from '@/lib/selectors';
import { MES_ACTUAL, addMonths, mesLabel } from '@/lib/date';
import { fmtMonto, fmtUSD } from '@/lib/format';
import { alpha } from '@/lib/color';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/icons';
import { VencimientoRow, InactivoRow } from './rows';
import { GastosFijosTable } from './GastosFijosTable';
import { PagarSheet, GastoFijoForm, RowMenuSheet, ConfirmDeleteSheet } from './sheets';

type Filter = 'pendientes' | 'pagados' | 'todos' | 'inactivos';

export function VencimientosScreen() {
  const navigate = useNavigate();
  const gastosFijos = useFinanzasStore((s) => s.gastosFijos);
  const instancias = useFinanzasStore((s) => s.instancias);
  const usdRate = useFinanzasStore((s) => s.usdRate);
  const unpagarVencimiento = useFinanzasStore((s) => s.unpagarVencimiento);
  const updateInstancia = useFinanzasStore((s) => s.updateInstancia);
  const createGastoFijo = useFinanzasStore((s) => s.createGastoFijo);
  const pauseGastoFijo = useFinanzasStore((s) => s.pauseGastoFijo);
  const deleteGastoFijo = useFinanzasStore((s) => s.deleteGastoFijo);
  const setGastoFijoOwnerFrom = useFinanzasStore((s) => s.setGastoFijoOwnerFrom);
  const users = useFinanzasStore((s) => s.users);

  const [filter, setFilter] = useState<Filter>('todos');
  const [respFilter, setRespFilter] = useState<Owner | 'todos'>('todos');
  const [activeMonth, setActiveMonth] = useState<string>(MES_ACTUAL);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [payingFor, setPayingFor] = useState<VRow | null>(null);
  const [menuFor, setMenuFor] = useState<VRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nombre: string } | null>(null);
  const isDesktop = useBreakpoint() === 'desktop';

  const allVencs = useMemo(
    () =>
      computeVencimientos(gastosFijos, instancias, activeMonth).sort((a, b) => {
        if (a.pagado !== b.pagado) return a.pagado ? 1 : -1;
        return a.vence.localeCompare(b.vence);
      }),
    [gastosFijos, instancias, activeMonth],
  );
  const inactivos = useMemo(() => gastosFijos.filter((gf) => gf.activo === false), [gastosFijos]);

  // Filtro por responsable (Fer / Pao / compartido), aplicado a activos e inactivos.
  const matchResp = (o: Owner) => respFilter === 'todos' || o === respFilter;
  const scoped = allVencs.filter((v) => matchResp(v.owner));
  const scopedInactivos = inactivos.filter((gf) => matchResp(gf.owner));

  const pendientes = scoped.filter((v) => !v.pagado);
  const pagados = scoped.filter((v) => v.pagado);
  const totalPendiente = pendientes.reduce((s, v) => s + v.monto, 0);
  const totalPagado = pagados.reduce((s, v) => s + v.monto, 0);
  const usdGastado = usdPagadoDelMes(instancias, gastosFijos, activeMonth, usdRate);

  const visibles =
    filter === 'pendientes' ? pendientes : filter === 'pagados' ? pagados : filter === 'todos' ? scoped : [];

  const filters: { id: Filter; label: string; count: number }[] = [
    { id: 'pendientes', label: 'Pendientes', count: pendientes.length },
    { id: 'pagados', label: 'Pagados', count: pagados.length },
    { id: 'todos', label: 'Todos', count: scoped.length },
    { id: 'inactivos', label: 'Inactivos', count: scopedInactivos.length },
  ];

  // Opciones + conteos del filtro por responsable (sobre gastos activos).
  const respCounts: Record<string, number> = { todos: allVencs.length };
  allVencs.forEach((v) => (respCounts[v.owner] = (respCounts[v.owner] ?? 0) + 1));
  const respOptions: { id: Owner | 'todos'; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'fer', label: users.fer?.nombre ?? 'Fer' },
    { id: 'pao', label: users.pao?.nombre ?? 'Pao' },
    { id: 'compartido', label: 'Compartido' },
  ];
  const respColor = (id: Owner | 'todos') =>
    id === 'fer' ? users.fer?.color ?? '#2563EB' : id === 'pao' ? users.pao?.color ?? '#E11D48' : '#8B5CF6';

  return (
    <div className="pt-2">
      <ScreenHeader
        title="Gastos fijos"
        subtitle="Recurrentes · se cargan mes a mes"
        onBack={() => navigate(-1)}
        action={
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/mas/categorias')} aria-label="Categorías y conceptos" title="Categorías y conceptos" className="flex h-9 w-9 items-center justify-center rounded-xl text-muted transition-colors hover:bg-surface-2 hover:text-text">
              <Icon.cog size={18} />
            </button>
            <button onClick={() => setCreating(true)} aria-label="Nuevo gasto fijo" className="flex h-9 w-9 items-center justify-center rounded-xl text-text transition-colors hover:bg-surface-2">
              <Icon.plus size={18} />
            </button>
          </div>
        }
      />

      <div className="px-[18px] lg:px-0">
        {/* Navegador de mes */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveMonth(addMonths(activeMonth, -1))}
              aria-label="Mes anterior"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <Icon.chev size={16} className="rotate-180" />
            </button>
            <div className="min-w-[132px] text-center text-[15px] font-bold tracking-[-0.2px] text-text">
              {mesLabel(activeMonth)}
            </div>
            <button
              onClick={() => setActiveMonth(addMonths(activeMonth, 1))}
              aria-label="Mes siguiente"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-surface text-muted transition-colors hover:bg-surface-2 hover:text-text"
            >
              <Icon.chev size={16} />
            </button>
          </div>
          {activeMonth !== MES_ACTUAL && (
            <button
              onClick={() => setActiveMonth(MES_ACTUAL)}
              className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] font-semibold text-accent"
            >
              Hoy
            </button>
          )}
        </div>

        {/* Resumen */}
        <div className="relative mb-3.5 overflow-hidden rounded-[18px] p-4" style={{ background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40" style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.22) 0%, transparent 65%)' }} />
          <div className="relative">
            <div className="text-[11px] uppercase tracking-[1.2px] text-white/55">Total pendiente</div>
            <div className="mt-1 text-[30px] font-bold tabular-nums tracking-[-1px] text-white">${fmtMonto(totalPendiente)}</div>
            <div className="mt-0.5 text-[12px] tabular-nums text-white/45">≈ {fmtUSD(totalPendiente, usdRate)} pendiente</div>
            {usdGastado > 0 && (
              <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/12 px-2 py-0.5 text-[11.5px] font-semibold tabular-nums text-[#4ADE80]">
                US$ {fmtMonto(usdGastado)} gastado este mes · al dólar del día
              </div>
            )}
            <div className="mt-2.5 flex items-center gap-2.5 border-t border-white/[0.08] pt-2.5">
              <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#4ADE80]">
                <Icon.check size={12} strokeWidth={3} /> ${fmtMonto(totalPagado)} pagado
              </span>
              <span className="h-3 w-px bg-white/10" />
              <span className="text-[11.5px] text-white/60">
                {scoped.length} gastos fijos activos
                {respFilter !== 'todos' && ` · ${respOptions.find((o) => o.id === respFilter)?.label}`}
              </span>
            </div>
          </div>
        </div>

        {/* Filtro por responsable */}
        <div className="hide-scroll mb-2 flex gap-1.5 overflow-x-auto">
          {respOptions.map((opt) => {
            const active = respFilter === opt.id;
            const isTodos = opt.id === 'todos';
            const isPerson = opt.id === 'fer' || opt.id === 'pao';
            const col = respColor(opt.id);
            return (
              <button
                key={opt.id}
                onClick={() => setRespFilter(opt.id)}
                className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[12.5px] font-semibold transition-colors"
                style={{
                  background: active ? (isTodos ? 'var(--text)' : alpha(col, 0.14)) : 'var(--surface)',
                  borderColor: active ? (isTodos ? 'var(--text)' : col) : 'var(--border)',
                  color: active ? (isTodos ? 'var(--bg)' : col) : 'var(--text-muted)',
                }}
              >
                {isPerson ? (
                  <Avatar userId={opt.id as UserId} size={16} />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: isTodos ? 'currentColor' : col }} />
                )}
                {opt.label}
                <span className="tabular-nums opacity-60">{respCounts[opt.id] ?? 0}</span>
              </button>
            );
          })}
        </div>

        {/* Filtros por estado */}
        <div className="hide-scroll mb-3.5 flex gap-1.5 overflow-x-auto">
          {filters.map((f) => (
            <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)} count={f.count}>
              {f.label}
            </Chip>
          ))}
        </div>

        {filter !== 'inactivos' && visibles.some((v) => v.prefilled && !v.pagado) && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface-2 px-3 py-2 text-[11.5px] text-muted">
            <Icon.warn size={14} className="shrink-0" />
            Los montos en gris vienen del mes pasado. Ajustalos con la factura y marcá pagado.
          </div>
        )}

        {/* Lista */}
        {filter !== 'inactivos' ? (
          visibles.length === 0 ? (
            <EmptyState filter={filter} />
          ) : isDesktop ? (
            <GastosFijosTable
              rows={visibles}
              onCommit={(gfId, mes, monto, dia) =>
                updateInstancia(gfId, mes, { monto, fecha: `${mes}-${String(dia).padStart(2, '0')}` })
              }
              onPagar={(v) => setPayingFor(v)}
              onUnpagar={(v) => unpagarVencimiento(v.gfId, v.mes)}
              onMenu={(v) => setMenuFor(v)}
            />
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {visibles.map((v) => (
                <VencimientoRow
                  key={v.id}
                  v={v}
                  editing={editingId === v.id}
                  onEdit={() => setEditingId(v.id)}
                  onCancelEdit={() => setEditingId(null)}
                  onSaveEdit={(payload) => {
                    updateInstancia(v.gfId, v.mes, payload);
                    setEditingId(null);
                  }}
                  onPagar={() => setPayingFor(v)}
                  onUnpagar={() => unpagarVencimiento(v.gfId, v.mes)}
                  onMenu={() => setMenuFor(v)}
                />
              ))}
            </div>
          )
        ) : scopedInactivos.length === 0 ? (
          <EmptyState filter="inactivos" />
        ) : (
          <div className="grid gap-2 lg:grid-cols-2">
            {scopedInactivos.map((gf) => (
              <InactivoRow
                key={gf.id}
                gf={gf}
                onReactivar={() => pauseGastoFijo(gf.id, true)}
                onEliminar={() => setConfirmDelete({ id: gf.id, nombre: gf.nombre })}
              />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="py-4">
          <button
            onClick={() => setCreating(true)}
            className="flex w-full items-center justify-center gap-2 rounded-[14px] py-3.5 text-[14.5px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)', boxShadow: '0 8px 20px rgba(37,99,235,0.32)' }}
          >
            <Icon.plus size={16} /> Agregar gasto fijo
          </button>
          <div className="mt-2 text-center text-[11px] text-muted">Se carga una vez · aparece todos los meses</div>
        </div>
      </div>

      {/* Sheets */}
      {creating && (
        <GastoFijoForm
          onClose={() => setCreating(false)}
          onSubmit={(p) => {
            createGastoFijo(p);
            setCreating(false);
          }}
        />
      )}
      {payingFor && <PagarSheet venc={payingFor} onClose={() => setPayingFor(null)} />}
      {menuFor && (
        <RowMenuSheet
          venc={menuFor}
          mesLabel={mesLabel(activeMonth)}
          onClose={() => setMenuFor(null)}
          onSetOwner={(owner) => setGastoFijoOwnerFrom(menuFor.gfId, activeMonth, owner)}
          onEdit={() => {
            setEditingId(menuFor.id);
            setMenuFor(null);
          }}
          onPause={() => {
            pauseGastoFijo(menuFor.gfId, false);
            setMenuFor(null);
          }}
          onDelete={() => {
            setConfirmDelete({ id: menuFor.gfId, nombre: menuFor.nombre });
            setMenuFor(null);
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmDeleteSheet
          nombre={confirmDelete.nombre}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            deleteGastoFijo(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}
    </div>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const map = {
    pendientes: { emoji: '✓', title: 'Todo al día este mes', sub: 'No hay vencimientos pendientes.' },
    pagados: { emoji: '💸', title: 'Aún no marcaste pagos', sub: 'Cuando marques un pago aparecerá acá.' },
    todos: { emoji: '✓', title: 'Sin gastos fijos cargados', sub: 'Tocá el + para crear el primero.' },
    inactivos: { emoji: '📁', title: 'Sin gastos pausados', sub: 'Cuando pauses uno aparecerá acá.' },
  }[filter];
  return (
    <div className="rounded-[18px] border border-line bg-surface px-6 py-9 text-center">
      <div className="mb-2.5 text-4xl opacity-50">{map.emoji}</div>
      <div className="text-sm font-semibold text-text">{map.title}</div>
      <div className="mt-1 text-xs text-muted">{map.sub}</div>
    </div>
  );
}
