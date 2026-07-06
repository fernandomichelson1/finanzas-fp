import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CategoriaTipo, CategoriaUso } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { alpha } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Icon } from '@/components/ui/icons';

const PALETTE = ['#06B6D4', '#8B5CF6', '#F97316', '#22C55E', '#E11D48', '#EAB308', '#3B82F6', '#EC4899'];
const ICONS = ['•', '📌', '🏷', '📋', '🛍', '💼', '🎯', '🏆', '🍰', '📚', '🚙', '🏥'];
const USOS: CategoriaUso[] = ['fijo', 'eventual', 'ambos'];
const USO_LABEL: Record<CategoriaUso, string> = { fijo: 'Fijos', eventual: 'Eventuales', ambos: 'Ambos' };

export function CategoriasScreen() {
  const navigate = useNavigate();
  const categories = useFinanzasStore((s) => s.categories);
  const conceptos = useFinanzasStore((s) => s.conceptos);
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const createConcepto = useFinanzasStore((s) => s.createConcepto);
  const deleteConcepto = useFinanzasStore((s) => s.deleteConcepto);
  const createCategory = useFinanzasStore((s) => s.createCategory);
  const setCategoryUso = useFinanzasStore((s) => s.setCategoryUso);
  const isAdmin = useFinanzasStore((s) => s.users[currentUser]?.rol === 'admin');

  const [tipo, setTipo] = useState<CategoriaTipo>('gasto');
  const [catUso, setCatUso] = useState<CategoriaUso>('eventual');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createIn, setCreateIn] = useState<string | null>(null);
  const [coName, setCoName] = useState('');
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState('#06B6D4');
  const [catIcono, setCatIcono] = useState('•');

  const cats = categories.filter((c) => c.tipo === tipo);

  return (
    <div className="pt-2">
      <ScreenHeader
        title="Categorías"
        onBack={() => navigate(-1)}
        action={isAdmin ? (
          <button onClick={() => setNewCatOpen((v) => !v)} className="rounded-[10px] px-3 py-1.5 text-[13px] font-medium" style={{ background: newCatOpen ? '#2563EB' : 'var(--surface)', color: newCatOpen ? '#fff' : 'var(--text)', border: newCatOpen ? 'none' : '1px solid var(--border)' }}>+ Categoría</button>
        ) : undefined}
      />
      <div className="px-[18px] lg:px-0">
        <div className="mb-3.5 flex gap-1.5">
          {([['gasto', 'Gastos', 'var(--expense)'], ['ingreso', 'Ingresos', 'var(--income)'], ['ahorro', 'Ahorros', 'var(--savings)']] as const).map(([id, label, color]) => (
            <button key={id} onClick={() => setTipo(id)} className="flex-1 rounded-[10px] py-2.5 text-[13px] font-semibold" style={{ background: tipo === id ? `color-mix(in srgb, ${color} 13%, transparent)` : 'var(--surface)', color: tipo === id ? color : 'var(--text-muted)', border: `1px solid ${tipo === id ? color : 'var(--border)'}` }}>
              {label}
            </button>
          ))}
        </div>

        {newCatOpen && isAdmin && (
          <div className="mb-3.5 rounded-2xl border border-dashed border-line-strong bg-surface-2 p-3.5">
            <div className="mb-2.5 text-xs font-semibold text-text">Nueva categoría de {tipo}</div>
            <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Nombre (ej. Mascotas...)" className="mb-2.5 w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-sm text-text outline-none" />
            <div className="mb-1.5 text-[11px] text-muted">Color</div>
            <div className="mb-2.5 flex flex-wrap gap-1.5">
              {PALETTE.map((c) => (
                <button key={c} onClick={() => setCatColor(c)} className="h-7 w-7 rounded-full" style={{ background: c, border: catColor === c ? '2px solid var(--text)' : '2px solid transparent' }} />
              ))}
            </div>
            <div className="mb-1.5 text-[11px] text-muted">Ícono</div>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {ICONS.map((i) => (
                <button key={i} onClick={() => setCatIcono(i)} className="h-8 w-8 rounded-lg text-base" style={{ background: catIcono === i ? alpha(catColor, 0.15) : 'var(--surface)', border: catIcono === i ? `1.5px solid ${catColor}` : '1px solid var(--border)' }}>{i}</button>
              ))}
            </div>
            {tipo === 'gasto' && (
              <>
                <div className="mb-1.5 text-[11px] text-muted">¿Dónde se usa?</div>
                <div className="mb-3 flex gap-1.5">
                  {USOS.map((u) => (
                    <button
                      key={u}
                      onClick={() => setCatUso(u)}
                      className="flex-1 rounded-[10px] py-2 text-[12px] font-semibold"
                      style={{ background: catUso === u ? alpha(catColor, 0.15) : 'var(--surface)', color: catUso === u ? catColor : 'var(--text-muted)', border: `1px solid ${catUso === u ? catColor : 'var(--border)'}` }}
                    >
                      {USO_LABEL[u]}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button onClick={() => { if (catName.trim()) { createCategory({ nombre: catName.trim(), tipo, color: catColor, icono: catIcono, uso: catUso }); setCatName(''); setNewCatOpen(false); } }} disabled={!catName.trim()} className="flex-1 rounded-[10px] py-2.5 text-[13px] font-semibold" style={{ background: catName.trim() ? '#2563EB' : 'var(--surface)', color: catName.trim() ? '#fff' : 'var(--text-muted)' }}>Crear categoría</button>
              <button onClick={() => setNewCatOpen(false)} className="rounded-[10px] border border-line bg-surface px-3.5 py-2.5 text-[13px] text-muted">Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-2.5">
          {cats.map((c) => {
            const cos = conceptos.filter((co) => co.cat === c.id);
            const isExp = expanded === c.id;
            const movCount = movimientos.filter((m) => m.cat === c.id).length;
            return (
              <div key={c.id} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <button onClick={() => setExpanded(isExp ? null : c.id)} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                  <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-[10px]" style={{ background: alpha(c.color, 0.12), color: c.color, border: `1px solid ${alpha(c.color, 0.2)}` }}>
                    <CatIcon item={c} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-medium text-text">{c.nombre}</div>
                    <div className="mt-0.5 text-[11.5px] text-muted">
                      {c.tipo === 'gasto' && (
                        <span className="font-semibold" style={{ color: c.color }}>{USO_LABEL[c.uso ?? 'ambos']} · </span>
                      )}
                      {cos.length} {cos.length === 1 ? 'concepto' : 'conceptos'} · {movCount} mov.
                    </div>
                  </div>
                  <span className="text-muted transition-transform" style={{ transform: isExp ? 'rotate(90deg)' : 'none' }}><Icon.chev size={16} /></span>
                </button>
                {isExp && (
                  <div className="border-t border-line bg-surface-2 px-4 pb-3.5 pt-3">
                    {c.tipo === 'gasto' && isAdmin && (
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-[11px] text-muted">Se usa en:</span>
                        <div className="flex gap-1">
                          {USOS.map((u) => {
                            const active = (c.uso ?? 'ambos') === u;
                            return (
                              <button
                                key={u}
                                onClick={() => setCategoryUso(c.id, u)}
                                className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{ background: active ? alpha(c.color, 0.15) : 'var(--surface)', color: active ? c.color : 'var(--text-muted)', border: `1px solid ${active ? c.color : 'var(--border)'}` }}
                              >
                                {USO_LABEL[u]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {cos.map((co) => (
                        <span key={co.id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-1.5 pl-3 pr-2 text-[12.5px] text-text">
                          {co.nombre}
                          {isAdmin && (
                            <button onClick={() => deleteConcepto(co.id)} className="text-muted" title="Eliminar"><Icon.close size={13} /></button>
                          )}
                        </span>
                      ))}
                      {cos.length === 0 && <span className="px-1 text-xs italic text-muted">Sin conceptos.</span>}
                    </div>
                    {isAdmin && (
                      createIn === c.id ? (
                        <div className="mt-3 flex gap-1.5">
                          <input value={coName} onChange={(e) => setCoName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && coName.trim()) { createConcepto({ nombre: coName.trim(), cat: c.id }); setCoName(''); setCreateIn(null); } }} placeholder="ej. Colegio Salesiano" autoFocus className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-2 text-[13px] text-text outline-none" />
                          <button onClick={() => { if (coName.trim()) { createConcepto({ nombre: coName.trim(), cat: c.id }); setCoName(''); setCreateIn(null); } }} className="rounded-lg px-3 py-2 text-[13px] font-semibold text-white" style={{ background: c.color }}>Crear</button>
                          <button onClick={() => { setCreateIn(null); setCoName(''); }} className="rounded-lg border border-line bg-surface px-2.5 py-2 text-muted">×</button>
                        </div>
                      ) : (
                        <button onClick={() => { setCreateIn(c.id); setCoName(''); }} className="mt-3 rounded-full border border-dashed px-3 py-1.5 text-[12.5px] font-medium" style={{ color: c.color, borderColor: alpha(c.color, 0.4) }}>
                          + Nuevo concepto en {c.nombre}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!isAdmin && (
          <div className="px-2 py-4 text-center text-xs text-muted">Las categorías y conceptos solo los gestiona Fer (admin). Vos podés usarlos al cargar un movimiento.</div>
        )}
      </div>
    </div>
  );
}
