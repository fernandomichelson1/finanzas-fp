import { useEffect, useState } from 'react';
import type { Caja, MovimientoTipo } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { formatMiles, parseMoney, tipoSign } from '@/lib/format';
import { TODAY } from '@/lib/date';
import { alpha, shade } from '@/lib/color';
import { uid } from '@/lib/id';
import { CatIcon } from '@/components/ui/CatIcon';
import { Icon } from '@/components/ui/icons';

type Tipo = MovimientoTipo;

const META: Record<Tipo, { color: string; label: string; sub: string }> = {
  ingreso: { color: '#16A34A', label: 'Ingreso', sub: 'Sueldos, honorarios, ventas' },
  gasto: { color: '#DC2626', label: 'Gasto', sub: 'Compras, servicios, salidas' },
  ahorro: { color: '#D97706', label: 'Ahorro', sub: 'Aportes a tus objetivos' },
  transferencia: { color: '#3B82F6', label: 'Transferencia', sub: 'Mover plata entre tus cajas' },
  retencion: { color: '#64748B', label: 'Retención / Impuesto', sub: 'IIBB, ganancias, etc.' },
};

export function NuevoMovimiento({ onClose }: { onClose: () => void }) {
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const categories = useFinanzasStore((s) => s.categories);
  const conceptos = useFinanzasStore((s) => s.conceptos);
  const allCajas = useFinanzasStore((s) => s.cajas);
  const createConcepto = useFinanzasStore((s) => s.createConcepto);
  const addMovimiento = useFinanzasStore((s) => s.addMovimiento);

  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState<Tipo | null>(null);
  const [monto, setMonto] = useState('');
  const [desc, setDesc] = useState('');
  const [catId, setCatId] = useState<string | null>(null);
  const [conceptoId, setConceptoId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [createInCat, setCreateInCat] = useState<string | null>(null);
  const [cajaId, setCajaId] = useState<string | null>(null);
  const [cajaOrigenId, setCajaOrigenId] = useState<string | null>(null);
  const [showExtra, setShowExtra] = useState(false);
  const [tagsRaw, setTagsRaw] = useState('');
  const [notas, setNotas] = useState('');

  useEffect(() => {
    setStep(1);
  }, []);

  const userCajas = allCajas.filter((c) => c.owner === currentUser);
  const montoNum = parseMoney(monto);
  const needsOrigen = tipo === 'transferencia' || tipo === 'ahorro';
  const needsConcepto = tipo === 'ingreso' || tipo === 'gasto' || tipo === 'ahorro';

  const cats = categories.filter((c) => {
    if (tipo === 'retencion') return c.tipo === 'gasto';
    if (c.tipo !== tipo) return false;
    // El "+" es para gastos eventuales: escondemos las categorías de gasto fijo.
    if (tipo === 'gasto') return c.uso !== 'fijo';
    return true;
  });
  const q = search.trim().toLowerCase();
  const catIds = new Set(cats.map((c) => c.id));
  const conceptosTipo = conceptos.filter((co) => catIds.has(co.cat));
  const filtered = q ? conceptosTipo.filter((co) => co.nombre.toLowerCase().includes(q)) : conceptosTipo;
  const grouped = cats
    .map((c) => ({ cat: c, items: filtered.filter((co) => co.cat === c.id) }))
    .filter((g) => g.items.length > 0);

  const pickConcepto = (coId: string, coCat: string, coNombre: string) => {
    setConceptoId(coId);
    setCatId(coCat);
    if (!desc) setDesc(coNombre);
  };
  const doCreateConcepto = () => {
    if (!search.trim() || !createInCat) return;
    const co = createConcepto({ nombre: search.trim(), cat: createInCat });
    pickConcepto(co.id, co.cat, co.nombre);
    setSearch('');
    setCreateInCat(null);
  };

  const submit = () => {
    if (!tipo) return;
    addMovimiento({
      id: uid('new'),
      fecha: TODAY,
      desc: desc || conceptos.find((c) => c.id === conceptoId)?.nombre || catById(catId)?.nombre || META[tipo].label,
      monto: montoNum,
      tipo,
      cat: catId,
      concepto: conceptoId,
      caja: cajaId,
      caja_origen: needsOrigen ? cajaOrigenId : undefined,
      user: currentUser,
      tags: tagsRaw.split(/\s+/).filter((t) => t.startsWith('#')),
      notas: notas || undefined,
    });
    onClose();
  };
  const catById = (id: string | null) => categories.find((c) => c.id === id);

  const canSave =
    !!cajaId &&
    (!needsOrigen || (!!cajaOrigenId && cajaOrigenId !== cajaId)) &&
    (!needsConcepto || !!catId);

  const accent = tipo ? META[tipo].color : '#2563EB';

  return (
    <div className="flex min-h-0 flex-col">
      {/* Grabber (mobile feel) */}
      <div className="flex justify-center pt-2.5 lg:hidden">
        <div className="h-[5px] w-9 rounded-full bg-line-strong" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-[22px] pb-1 pt-3.5">
        <div>
          <div className="text-[11.5px] uppercase tracking-[1.2px] text-muted">Paso {step} de 3</div>
          <div className="mt-0.5 text-xl font-semibold tracking-[-0.4px] text-text">
            {step === 1 ? 'Tipo de movimiento' : step === 2 ? 'Ingresá el monto' : 'Detalle'}
          </div>
        </div>
        <button onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center rounded-xl text-text hover:bg-surface-2">
          <Icon.close size={20} />
        </button>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 px-[22px] pt-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="h-[3px] flex-1 rounded-sm transition-all"
            style={{ background: step >= n ? accent : 'var(--border)', boxShadow: step >= n && tipo ? `0 0 6px ${alpha(accent, 0.47)}` : 'none' }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto p-[22px]">
        {step === 1 && (
          <div>
            <div className="grid gap-3">
              {(['ingreso', 'gasto', 'ahorro'] as Tipo[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTipo(t);
                    setStep(2);
                  }}
                  className="relative flex items-center gap-4 overflow-hidden rounded-[18px] p-[18px] text-left text-white transition-transform active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${META[t].color} 0%, ${shade(META[t].color, -0.15)} 100%)`, boxShadow: `0 10px 24px ${alpha(META[t].color, 0.27)}` }}
                >
                  <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-white/20">
                    {t === 'ingreso' ? <Icon.up size={28} /> : t === 'gasto' ? <Icon.down size={28} /> : <Icon.piggy size={28} />}
                  </div>
                  <div className="flex-1">
                    <div className="text-[19px] font-semibold tracking-[-0.3px]">{META[t].label}</div>
                    <div className="mt-0.5 text-[13px] opacity-80">{META[t].sub}</div>
                  </div>
                  <Icon.chev size={16} className="opacity-70" />
                </button>
              ))}
            </div>
            <div className="mt-3.5 border-t border-dashed border-line pt-3.5">
              <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-muted">Otros</div>
              <div className="grid grid-cols-2 gap-2">
                {(['transferencia', 'retencion'] as Tipo[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setTipo(t);
                      setStep(2);
                    }}
                    className="flex items-center gap-2.5 rounded-[14px] border border-line bg-surface-2 p-3 text-left text-text"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: alpha(META[t].color, 0.13), color: META[t].color }}>
                      {t === 'transferencia' ? <span className="text-lg">⇄</span> : <Icon.warn size={18} />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold">{META[t].label}</div>
                      <div className="truncate text-[10.5px] text-muted">{META[t].sub}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && tipo && (
          <div>
            <div className="mb-2 text-center">
              <div className="mb-1.5 text-[13px] uppercase tracking-wider text-muted">Monto</div>
              <div className="text-[46px] font-bold tabular-nums tracking-[-1.4px]" style={{ color: META[tipo].color, textShadow: `0 0 24px ${alpha(META[tipo].color, 0.2)}` }}>
                {tipoSign(tipo)}${formatMiles(monto) || '0'}
              </div>
              <div className="mx-auto mt-1.5 h-0.5 w-14 rounded-sm" style={{ background: alpha(META[tipo].color, 0.33) }} />
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '⌫'].map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    if (k === '⌫') setMonto((m) => m.slice(0, -1));
                    else if (k === ',') setMonto((m) => (m.includes(',') ? m : (m || '0') + ','));
                    else
                      setMonto((m) => {
                        const ci = m.indexOf(',');
                        if (ci !== -1 && m.length - ci - 1 >= 2) return m; // ya tiene 2 decimales
                        return (m + k).replace(/^0+(?=\d)/, '').slice(0, 14);
                      });
                  }}
                  className="rounded-[14px] border border-line bg-surface-2 py-[18px] text-[22px] font-medium tabular-nums text-text active:bg-surface"
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && tipo && (
          <div>
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3">
              <div className="rounded-md px-2 py-1 text-[11.5px] font-semibold uppercase tracking-wide" style={{ background: alpha(META[tipo].color, 0.13), color: META[tipo].color }}>
                {META[tipo].label}
              </div>
              <div className="flex-1 text-right text-lg font-semibold tabular-nums" style={{ color: META[tipo].color }}>
                {tipoSign(tipo)}${formatMiles(monto) || '0'}
              </div>
            </div>

            {needsConcepto && (
              <>
                <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">Concepto</div>
                <div className="mb-2.5 flex items-center gap-2.5 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5">
                  <Icon.search size={18} className="text-muted" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Buscar concepto de ${META[tipo].label.toLowerCase()}...`} className="flex-1 bg-transparent text-[14.5px] text-text outline-none" />
                  {search && (
                    <button onClick={() => setSearch('')} className="text-muted">
                      <Icon.close size={16} />
                    </button>
                  )}
                </div>
                <div className="dash-scroll mb-3 max-h-[220px] overflow-auto rounded-[14px] border border-line bg-surface-2 px-3 py-2.5">
                  {grouped.map((g) => (
                    <div key={g.cat.id} className="mb-2.5">
                      <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] uppercase tracking-wide text-muted">
                        <span style={{ color: g.cat.color }}>
                          <CatIcon item={g.cat} size={13} />
                        </span>
                        <span className="font-semibold tracking-wider">{g.cat.nombre}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {g.items.map((co) => {
                          const active = conceptoId === co.id;
                          return (
                            <button
                              key={co.id}
                              onClick={() => pickConcepto(co.id, co.cat, co.nombre)}
                              className="whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium"
                              style={{ background: active ? alpha(g.cat.color, 0.15) : 'var(--surface)', color: active ? g.cat.color : 'var(--text)', border: `1px solid ${active ? g.cat.color : 'var(--border)'}` }}
                            >
                              {co.nombre}
                            </button>
                          );
                        })}
                        <button onClick={() => setCreateInCat(g.cat.id)} className="rounded-lg border border-dashed border-line-strong px-2.5 py-1.5 text-[12.5px] font-medium text-muted">
                          + Nuevo
                        </button>
                      </div>
                    </div>
                  ))}
                  {grouped.length === 0 && (
                    <div className="px-2 py-3.5 text-center text-[13px] text-muted">
                      {q ? <>Sin coincidencias para "{search}". Elegí una categoría para crearlo.</> : <>Sin conceptos cargados.</>}
                    </div>
                  )}
                </div>
                {(createInCat || (q && grouped.length === 0)) && (
                  <div className="mb-3 rounded-[14px] border border-dashed border-line-strong bg-surface-2 p-3.5">
                    <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-muted">Crear concepto nuevo</div>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nombre del concepto..." className="mb-2 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-text outline-none" />
                    <div className="mb-1.5 text-[11px] text-muted">Categoría destino</div>
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      {cats.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setCreateInCat(c.id)}
                          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] font-medium"
                          style={{ background: createInCat === c.id ? alpha(c.color, 0.15) : 'var(--surface)', color: createInCat === c.id ? c.color : 'var(--text-muted)', border: `1px solid ${createInCat === c.id ? c.color : 'var(--border)'}` }}
                        >
                          <CatIcon item={c} size={14} /> {c.nombre}
                        </button>
                      ))}
                    </div>
                    <button onClick={doCreateConcepto} disabled={!search.trim() || !createInCat} className="w-full rounded-[10px] py-2.5 text-[13px] font-semibold" style={{ background: search.trim() && createInCat ? '#2563EB' : 'var(--surface)', color: search.trim() && createInCat ? '#fff' : 'var(--text-muted)' }}>
                      Crear y seleccionar
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">
              Descripción <span className="normal-case opacity-70">(opcional)</span>
            </div>
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={conceptoId ? 'Detalles extra (ej. "cuota 3/6")...' : 'ej. Supermercado del centro...'} className="mb-4 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[15px] text-text outline-none" />

            {/* Cajas */}
            {(needsOrigen || tipo === 'gasto' || tipo === 'retencion') && (
              <div className="mb-3.5">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {needsOrigen ? 'Desde · caja de origen' : 'Caja'}
                </div>
                <CajaChipRow
                  cajas={userCajas}
                  selectedId={needsOrigen ? cajaOrigenId : cajaId}
                  excludeId={needsOrigen ? cajaId : null}
                  onSelect={(id) => (needsOrigen ? setCajaOrigenId(id) : setCajaId(id))}
                />
              </div>
            )}
            {(needsOrigen || tipo === 'ingreso') && (
              <div className="mb-3.5">
                <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                  {needsOrigen ? 'Hacia · caja de destino' : 'Caja'}
                </div>
                <CajaChipRow cajas={userCajas} selectedId={cajaId} excludeId={needsOrigen ? cajaOrigenId : null} onSelect={setCajaId} />
              </div>
            )}

            {!showExtra ? (
              <button onClick={() => setShowExtra(true)} className="text-[13.5px] font-medium text-accent">
                + Agregar más campos
              </button>
            ) : (
              <>
                <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">Etiquetas</div>
                <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="#supermercado #cuotas..." className="mb-3 w-full rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-sm text-text outline-none" />
                <div className="mb-1.5 text-[11px] uppercase tracking-wider text-muted">Notas</div>
                <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Detalles adicionales..." className="w-full resize-none rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-sm text-text outline-none" />
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex gap-2.5 border-t border-line bg-elevated px-[22px] py-4">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="rounded-[14px] border border-line bg-surface-2 px-5 py-3.5 text-[15px] font-medium text-text">
            Atrás
          </button>
        )}
        {step === 2 && (
          <button
            onClick={() => setStep(3)}
            disabled={montoNum <= 0}
            className="flex-1 rounded-[14px] py-3.5 text-[15px] font-semibold"
            style={{ background: montoNum > 0 ? `linear-gradient(180deg, ${accent} 0%, ${shade(accent, -0.15)} 100%)` : 'var(--surface-2)', color: montoNum > 0 ? '#fff' : 'var(--text-muted)' }}
          >
            Siguiente
          </button>
        )}
        {step === 3 && (
          <button
            onClick={submit}
            disabled={!canSave}
            className="flex-1 rounded-[14px] py-3.5 text-[15px] font-semibold"
            style={{ background: canSave ? `linear-gradient(180deg, ${accent} 0%, ${shade(accent, -0.15)} 100%)` : 'var(--surface-2)', color: canSave ? '#fff' : 'var(--text-muted)', boxShadow: canSave ? `0 8px 20px ${alpha(accent, 0.33)}` : 'none' }}
          >
            Guardar movimiento
          </button>
        )}
      </div>
    </div>
  );
}

function CajaChipRow({ cajas, selectedId, onSelect, excludeId }: { cajas: Caja[]; selectedId: string | null; onSelect: (id: string) => void; excludeId: string | null }) {
  const items = cajas.filter((c) => !excludeId || c.id !== excludeId);
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-2 p-3.5 text-center text-[12.5px] text-muted">
        No tenés cajas disponibles. Creá una desde Más → Cajas.
      </div>
    );
  }
  return (
    <div className="hide-scroll flex gap-2 overflow-x-auto pb-1">
      {items.map((c) => {
        const sel = selectedId === c.id;
        return (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className="flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5"
            style={{ background: sel ? `linear-gradient(135deg, ${c.color} 0%, ${shade(c.color, -0.18)} 100%)` : 'var(--surface-2)', border: `1px solid ${sel ? c.color : 'var(--border)'}`, color: sel ? '#fff' : 'var(--text)', boxShadow: sel ? `0 6px 16px ${alpha(c.color, 0.33)}` : 'none' }}
          >
            <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-[7px]" style={{ background: sel ? 'rgba(255,255,255,0.22)' : alpha(c.color, 0.15) }}>
              <CatIcon item={c} size={16} />
            </div>
            <span className="whitespace-nowrap text-[13px] font-semibold">{c.nombre}</span>
          </button>
        );
      })}
    </div>
  );
}
