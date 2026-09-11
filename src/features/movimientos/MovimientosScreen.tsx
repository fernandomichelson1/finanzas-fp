import { useMemo, useState } from 'react';
import type { MovimientoTipo } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { fmtMonto } from '@/lib/format';
import { niceDate } from '@/lib/date';
import { idTime } from '@/lib/id';
import { Chip } from '@/components/ui/Chip';
import { Icon } from '@/components/ui/icons';
import { MovRow } from '@/components/movimientos/MovRow';

type UserFilter = 'all' | string;
type TipoFilter = 'all' | MovimientoTipo;

export function MovimientosScreen() {
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const categories = useFinanzasStore((s) => s.categories);
  const users = useFinanzasStore((s) => s.users);

  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<UserFilter>('all');
  const [tipoFilter, setTipoFilter] = useState<TipoFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    movimientos.forEach((m) => (m.tags || []).forEach((t) => s.add(t)));
    return [...s];
  }, [movimientos]);

  const filtered = useMemo(
    () =>
      movimientos
        .filter((m) => userFilter === 'all' || m.user === userFilter)
        .filter((m) => tipoFilter === 'all' || m.tipo === tipoFilter)
        .filter((m) => !catFilter || m.cat === catFilter)
        .filter((m) => !tagFilter || (m.tags || []).includes(tagFilter))
        .filter((m) => !search || m.desc.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => b.fecha.localeCompare(a.fecha) || idTime(b.id) - idTime(a.id)),
    [movimientos, userFilter, tipoFilter, catFilter, tagFilter, search],
  );

  const groups = useMemo(() => {
    const g: Record<string, typeof filtered> = {};
    filtered.forEach((m) => (g[m.fecha] = g[m.fecha] || []).push(m));
    return Object.keys(g)
      .sort()
      .reverse()
      .map((date) => ({ date, items: g[date] }));
  }, [filtered]);

  const sumIngresos = filtered.filter((m) => m.tipo === 'ingreso').reduce((s, m) => s + m.monto, 0);
  const sumGastos = filtered.filter((m) => m.tipo === 'gasto').reduce((s, m) => s + m.monto, 0);
  const activeCount = (userFilter !== 'all' ? 1 : 0) + (tipoFilter !== 'all' ? 1 : 0) + (catFilter ? 1 : 0) + (tagFilter ? 1 : 0);

  return (
    <div className="px-[18px] pt-2 lg:px-0">
      <div className="flex items-center justify-between">
        <h1 className="m-0 text-2xl font-bold tracking-[-0.6px] text-text">Movimientos</h1>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className="relative flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ background: showFilters || activeCount > 0 ? '#2563EB' : 'var(--surface)', color: showFilters || activeCount > 0 ? '#fff' : 'var(--text)', border: '1px solid var(--border)' }}
        >
          <Icon.filter size={18} />
          {activeCount > 0 && (
            <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-black" style={{ background: '#F59E0B' }}>
              {activeCount}
            </span>
          )}
        </button>
      </div>

      <div className="mt-2 flex gap-3.5 text-[12.5px] tabular-nums text-muted">
        <span className="text-income">+${fmtMonto(sumIngresos)}</span>
        <span className="opacity-40">·</span>
        <span className="text-expense">−${fmtMonto(sumGastos)}</span>
        <span className="opacity-40">·</span>
        <span>{filtered.length} {filtered.length === 1 ? 'movimiento' : 'movimientos'}</span>
      </div>

      {/* Search */}
      <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-line bg-surface px-3.5 py-2.5">
        <Icon.search size={18} className="text-muted" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar descripción..." className="flex-1 bg-transparent text-[14.5px] text-text outline-none" />
        {search && (
          <button onClick={() => setSearch('')} className="text-muted">
            <Icon.close size={16} />
          </button>
        )}
      </div>

      {/* Chips */}
      <div className="hide-scroll mt-3 flex gap-1.5 overflow-x-auto">
        <Chip active={userFilter === 'all'} onClick={() => setUserFilter('all')}>Ambos</Chip>
        {Object.values(users).map((u) => (
          <Chip key={u.id} active={userFilter === u.id} onClick={() => setUserFilter(u.id)} dotColor={u.color}>
            {u.nombre}
          </Chip>
        ))}
        <span className="mx-1 w-px shrink-0 bg-line" />
        <Chip active={tipoFilter === 'all'} onClick={() => setTipoFilter('all')}>Todo</Chip>
        <Chip active={tipoFilter === 'ingreso'} onClick={() => setTipoFilter('ingreso')} dotColor="var(--income)">Ingreso</Chip>
        <Chip active={tipoFilter === 'gasto'} onClick={() => setTipoFilter('gasto')} dotColor="var(--expense)">Gasto</Chip>
        <Chip active={tipoFilter === 'ahorro'} onClick={() => setTipoFilter('ahorro')} dotColor="var(--savings)">Ahorro</Chip>
      </div>

      {/* Extended filters */}
      {showFilters && (
        <div className="mt-3 rounded-2xl border border-line bg-surface p-3.5">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-muted">Categoría</div>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Chip active={!catFilter} onClick={() => setCatFilter(null)}>Todas</Chip>
            {categories
              .filter((c) => tipoFilter === 'all' || c.tipo === tipoFilter)
              .map((c) => (
                <Chip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(catFilter === c.id ? null : c.id)} dotColor={c.color}>
                  {c.nombre}
                </Chip>
              ))}
          </div>
          {allTags.length > 0 && (
            <>
              <div className="mb-2 text-[11px] uppercase tracking-wider text-muted">Etiquetas</div>
              <div className="flex flex-wrap gap-1.5">
                {allTags.map((t) => (
                  <Chip key={t} active={tagFilter === t} onClick={() => setTagFilter(tagFilter === t ? null : t)}>
                    {t}
                  </Chip>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* List */}
      {filtered.length === 0 ? (
        <div className="px-8 py-16 text-center text-muted">
          <div className="mb-3 text-4xl opacity-50">🔍</div>
          <div className="text-[15px] text-text">Sin resultados</div>
          <div className="text-[13px]">Ajustá los filtros o la búsqueda</div>
        </div>
      ) : (
        <div className="mt-4">
          {groups.map((grp) => (
            <div key={grp.date} className="mb-4">
              <div className="px-1 pb-2 pt-1.5 text-xs uppercase tracking-wider text-muted">{niceDate(grp.date)}</div>
              <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
                {grp.items.map((m, i) => (
                  <MovRow key={m.id} mov={m} isLast={i === grp.items.length - 1} showTags />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
