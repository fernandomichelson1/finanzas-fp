import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { gastoPorCategoria } from '@/lib/selectors';
import { fmtMonto } from '@/lib/format';
import { alpha, shade } from '@/lib/color';
import { CatIcon } from '@/components/ui/CatIcon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Icon } from '@/components/ui/icons';

interface Alerta {
  severity: 'red' | 'amber';
  title: string;
  body: string;
}

export function AlertasScreen() {
  const navigate = useNavigate();
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const categories = useFinanzasStore((s) => s.categories);
  const metas = useFinanzasStore((s) => s.metas);
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const setMeta = useFinanzasStore((s) => s.setMeta);
  const isAdmin = useFinanzasStore((s) => s.users[currentUser]?.rol === 'admin');

  const [editing, setEditing] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const uso = useMemo(() => gastoPorCategoria(movimientos), [movimientos]);
  const catsGasto = categories.filter((c) => c.tipo === 'gasto');
  const catById = (id: string) => categories.find((c) => c.id === id);

  const alertas = useMemo<Alerta[]>(() => {
    const out: Alerta[] = [
      { severity: 'amber', title: 'Gasto inusualmente alto en Alimentación', body: 'Hoy ($42.850) supera 2× tu promedio diario de la categoría' },
    ];
    Object.entries(metas).forEach(([cat, lim]) => {
      const used = uso[cat] ?? 0;
      const pct = used / lim;
      const nombre = catById(cat)?.nombre ?? cat;
      if (pct >= 1) out.push({ severity: 'red', title: `Superaste el límite de ${nombre}`, body: `$${fmtMonto(used - lim)} sobre el límite mensual` });
      else if (pct >= 0.8) out.push({ severity: 'amber', title: `Ya usaste el ${Math.round(pct * 100)}% en ${nombre}`, body: `Quedan $${fmtMonto(lim - used)} hasta fin de mes` });
    });
    out.push({ severity: 'amber', title: 'Semana con gasto elevado', body: 'Esta semana gastaron 35% más que el promedio reciente' });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metas, uso]);

  const submitMeta = (cat: string) => {
    const v = parseInt(input || '0', 10);
    if (v > 0) {
      setMeta(cat, v);
      setEditing(null);
      setInput('');
    }
  };

  return (
    <div className="pt-2">
      <ScreenHeader title="Alertas y metas" onBack={() => navigate('/mas')} />
      <div className="px-[18px] lg:px-0">
        {/* Alertas activas */}
        <section className="mb-4">
          <SectionHeader title="Activas" subtitle={`${alertas.length} sin resolver`} />
          <div className="space-y-2">
            {alertas.map((a, i) => {
              const color = a.severity === 'red' ? '#DC2626' : '#F59E0B';
              return (
                <div key={i} className="flex items-start gap-3 rounded-[14px] p-3" style={{ background: `linear-gradient(135deg, ${alpha(color, 0.13)} 0%, ${alpha(color, 0.03)} 100%)`, border: `1px solid ${alpha(color, 0.27)}` }}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]" style={{ background: alpha(color, 0.13), color }}>
                    <Icon.warn size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13.5px] font-semibold text-text">{a.title}</div>
                    <div className="mt-0.5 text-xs tabular-nums text-muted">{a.body}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Metas */}
        <section className="mb-4">
          <SectionHeader title="Metas mensuales" subtitle={isAdmin ? 'tocá para editar' : 'solo lectura'} />
          <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
            {catsGasto.map((c, i) => {
              const lim = metas[c.id];
              const used = uso[c.id] ?? 0;
              const pct = lim ? used / lim : 0;
              const barColor = pct >= 1 ? '#DC2626' : pct >= 0.8 ? '#F59E0B' : '#22C55E';
              const isEd = editing === c.id;
              return (
                <div key={c.id} className="px-3.5 py-3" style={{ borderBottom: i === catsGasto.length - 1 ? 'none' : '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2.5" style={{ marginBottom: lim ? 8 : 0 }}>
                    <div className="flex h-[30px] w-[30px] items-center justify-center overflow-hidden rounded-lg" style={{ background: alpha(c.color, 0.12), color: c.color, border: `1px solid ${alpha(c.color, 0.2)}` }}>
                      <CatIcon item={c} size={20} />
                    </div>
                    <div className="flex-1 text-sm font-medium text-text">{c.nombre}</div>
                    {isEd ? (
                      <div className="flex gap-1">
                        <input type="number" value={input} onChange={(e) => setInput(e.target.value)} placeholder="$" autoFocus className="w-[90px] rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-xs tabular-nums text-text outline-none" />
                        <button onClick={() => submitMeta(c.id)} className="rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-[11px] text-white">OK</button>
                        <button onClick={() => { setEditing(null); setInput(''); }} className="rounded-lg border border-line bg-surface-2 px-2 py-1.5 text-[11px] text-muted">×</button>
                      </div>
                    ) : isAdmin ? (
                      <button onClick={() => { setEditing(c.id); setInput(lim?.toString() ?? ''); }} className="rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold tabular-nums" style={{ background: lim ? alpha(barColor, 0.13) : 'var(--surface-2)', color: lim ? barColor : 'var(--text-muted)', border: lim ? `1px solid ${alpha(barColor, 0.33)}` : '1px solid var(--border)' }}>
                        {lim ? `$${fmtMonto(lim)}` : '+ Meta'}
                      </button>
                    ) : (
                      <span className="text-[11.5px] tabular-nums text-muted">{lim ? `$${fmtMonto(lim)}` : 'Sin meta'}</span>
                    )}
                  </div>
                  {lim && (
                    <>
                      <div className="h-1.5 overflow-hidden rounded-sm bg-surface-2">
                        <div className="h-full" style={{ width: `${Math.min(pct * 100, 100)}%`, background: `linear-gradient(90deg, ${barColor} 0%, ${shade(barColor, -0.1)} 100%)`, boxShadow: `0 0 6px ${alpha(barColor, 0.33)}` }} />
                      </div>
                      <div className="mt-1 flex justify-between text-[10.5px] tabular-nums text-muted">
                        <span>${fmtMonto(used)} usado</span>
                        <span>{(pct * 100).toFixed(0)}%</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
          <div className="px-1 py-3.5 text-[11.5px] leading-relaxed text-muted">
            {isAdmin ? 'Las metas que definís disparan alertas automáticas al 80% y al superarlas.' : 'Solo Fer puede definir o editar las metas. Vos ves el progreso y recibís alertas.'}
          </div>
        </section>
      </div>
    </div>
  );
}
