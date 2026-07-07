import { useMemo, useState } from 'react';
import type { Caja, CajaTipo, Movimiento, UserId } from '@/types/domain';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { CAJA_TIPOS } from '@/data';
import { saldosDeCajas } from '@/lib/selectors';
import { fmtMonto, formatMiles, moneyToInput, parseMoney } from '@/lib/format';
import { alpha, shade } from '@/lib/color';
import { Avatar } from '@/components/ui/Avatar';
import { CatIcon } from '@/components/ui/CatIcon';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MovRow } from '@/components/movimientos/MovRow';

const tipoLabel = (t: CajaTipo) => CAJA_TIPOS.find((x) => x.id === t)?.label ?? t;

export function CajasScreen() {
  const cajas = useFinanzasStore((s) => s.cajas);
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const currentUser = useFinanzasStore((s) => s.currentUser);
  const users = useFinanzasStore((s) => s.users);
  const createCaja = useFinanzasStore((s) => s.createCaja);
  const updateCaja = useFinanzasStore((s) => s.updateCaja);
  const archiveCaja = useFinanzasStore((s) => s.archiveCaja);

  const [view, setView] = useState<'overview' | 'detail' | 'create' | 'edit'>('overview');
  const [activeId, setActiveId] = useState<string | null>(null);

  const saldos = useMemo(() => saldosDeCajas(cajas, movimientos), [cajas, movimientos]);
  const otherUser = currentUser === 'fer' ? 'pao' : 'fer';
  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    cajas.forEach((c) => (t[c.owner] = (t[c.owner] ?? 0) + (saldos[c.id] ?? 0)));
    return t;
  }, [cajas, saldos]);
  const patrimonio = Object.values(totals).reduce((s, v) => s + v, 0);
  const activa = cajas.find((c) => c.id === activeId);

  if (view === 'create') {
    return <CajaForm owner={currentUser} onBack={() => setView('overview')} onSubmit={(p) => { createCaja(p); setView('overview'); }} />;
  }
  if (view === 'edit' && activa) {
    return (
      <CajaForm
        initial={activa}
        owner={activa.owner}
        onBack={() => setView('detail')}
        onSubmit={(p) => { updateCaja(activa.id, p); setView('detail'); }}
      />
    );
  }
  if (view === 'detail' && activa) {
    return (
      <CajaDetalle
        caja={activa}
        saldo={saldos[activa.id] ?? 0}
        ownerName={users[activa.owner]?.nombre ?? ''}
        movimientos={movimientos.filter((m) => m.caja === activa.id || m.caja_origen === activa.id)}
        onBack={() => setView('overview')}
        onEdit={() => setView('edit')}
        onArchive={() => { archiveCaja(activa.id); setView('overview'); }}
      />
    );
  }

  return (
    <div className="pt-2">
      <ScreenHeader
        title="Cuentas"
        subtitle="Cada uno administra las suyas · saldo editable"
        action={
          <button onClick={() => setView('create')} className="rounded-[10px] bg-[#2563EB] px-3 py-1.5 text-[13px] font-medium text-white">+ Cuenta</button>
        }
      />
      <div className="px-[18px] lg:px-0">
        {/* Patrimonio */}
        <div className="relative mb-3.5 overflow-hidden rounded-[20px] p-5" style={{ background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="pointer-events-none absolute -right-10 -top-12 h-56 w-56" style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.32) 0%, transparent 65%)' }} />
          <div className="relative">
            <div className="text-[11px] uppercase tracking-[1.2px] text-white/55">Patrimonio total</div>
            <div className="mt-1 text-[34px] font-bold tabular-nums tracking-[-1px] text-white">${fmtMonto(patrimonio)}</div>
            <div className="mt-3.5 flex gap-4 border-t border-white/[0.08] pt-3">
              {[currentUser, otherUser].map((uid) => (
                <div key={uid} className="flex-1">
                  <div className="mb-1 flex items-center gap-1.5">
                    <Avatar userId={uid} size={18} />
                    <span className="text-[11px] text-white/60">{users[uid]?.nombre}</span>
                  </div>
                  <div className="text-base font-semibold tabular-nums text-white">${fmtMonto(totals[uid] ?? 0)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SectionCajas title="Mis cuentas" subtitle={users[currentUser]?.nombre} cajas={cajas.filter((c) => c.owner === currentUser)} saldos={saldos} onTap={(c) => { setActiveId(c.id); setView('detail'); }} />
        <SectionCajas title={`Cuentas de ${users[otherUser]?.nombre}`} cajas={cajas.filter((c) => c.owner !== currentUser)} saldos={saldos} onTap={(c) => { setActiveId(c.id); setView('detail'); }} />

        <div className="px-2 py-4 text-center text-[11.5px] leading-relaxed text-muted">
          Tocá una cuenta para ver el detalle, editarla o eliminarla.<br />El saldo se calcula como saldo inicial + movimientos. Las cuentas no están conectadas a tus bancos reales.
        </div>
      </div>
    </div>
  );
}

function SectionCajas({ title, subtitle, cajas, saldos, onTap }: { title: string; subtitle?: string; cajas: Caja[]; saldos: Record<string, number>; onTap: (c: Caja) => void }) {
  if (cajas.length === 0) return null;
  return (
    <div className="mb-4">
      <SectionHeader title={title} subtitle={subtitle} />
      <div className="grid gap-2.5 sm:grid-cols-2">
        {cajas.map((c) => (
          <CajaCard key={c.id} caja={c} saldo={saldos[c.id] ?? 0} onClick={() => onTap(c)} />
        ))}
      </div>
    </div>
  );
}

export function CajaCard({ caja, saldo, onClick }: { caja: Caja; saldo: number; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-[18px] p-4 text-left text-white"
      style={{ background: `linear-gradient(135deg, ${caja.color} 0%, ${shade(caja.color, -0.18)} 100%)`, boxShadow: `0 8px 22px ${alpha(caja.color, 0.24)}, inset 0 1px 0 rgba(255,255,255,0.18)` }}
    >
      <div className="pointer-events-none absolute -right-8 top-0 h-full w-36" style={{ background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.13) 50%, transparent 70%)' }} />
      <div className="relative flex items-center gap-3">
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-white/30 bg-white/20">
          <CatIcon item={caja} size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[14.5px] font-semibold">{caja.nombre}</div>
          <div className="mt-0.5 truncate text-[10.5px] uppercase tracking-wide text-white/70">{tipoLabel(caja.tipo)}</div>
        </div>
        <div className="text-right">
          <div className="whitespace-nowrap text-[17px] font-bold tabular-nums tracking-[-0.3px]">${fmtMonto(saldo)}</div>
          <div className="mt-0.5 text-[10px] text-white/60">Saldo</div>
        </div>
      </div>
    </button>
  );
}

function CajaDetalle({ caja, saldo, ownerName, movimientos, onBack, onEdit, onArchive }: { caja: Caja; saldo: number; ownerName: string; movimientos: Movimiento[]; onBack: () => void; onEdit: () => void; onArchive: () => void }) {
  const movs = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
  const entro = movs.filter((m) => m.caja === caja.id && (m.tipo === 'ingreso' || m.tipo === 'transferencia' || m.tipo === 'ahorro')).reduce((s, m) => s + m.monto, 0);
  const salio = movs.filter((m) => (m.caja === caja.id && (m.tipo === 'gasto' || m.tipo === 'retencion')) || m.caja_origen === caja.id).reduce((s, m) => s + m.monto, 0);

  return (
    <div className="pt-2">
      <ScreenHeader
        title={caja.nombre}
        size="md"
        onBack={onBack}
        action={
          <div className="flex items-center gap-1.5">
            <button onClick={onEdit} className="rounded-[10px] border border-line bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text">Editar</button>
            <button onClick={onArchive} className="rounded-[10px] border px-2.5 py-1.5 text-xs" style={{ borderColor: alpha('#F87171', 0.3), color: '#F87171' }}>Eliminar</button>
          </div>
        }
      />
      <div className="px-[18px] lg:px-0">
        <div className="relative mb-3.5 overflow-hidden rounded-[22px] p-5" style={{ background: `linear-gradient(160deg, ${caja.color} 0%, ${shade(caja.color, -0.25)} 100%)`, boxShadow: `0 14px 32px ${alpha(caja.color, 0.27)}` }}>
          <div className="pointer-events-none absolute -right-10 -top-14 h-56 w-56" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)' }} />
          <div className="relative text-white">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-[13px] border border-white/25 bg-white/20"><CatIcon item={caja} size={28} /></div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-white/65">{tipoLabel(caja.tipo)}</div>
                <div className="text-sm font-medium">{ownerName}</div>
              </div>
            </div>
            <div className="text-[11px] uppercase tracking-[1.2px] text-white/65">Saldo actual</div>
            <div className="mt-1 text-[32px] font-bold tabular-nums tracking-[-0.8px]">${fmtMonto(saldo)}</div>
            <div className="mt-1 text-[11px] tabular-nums text-white/60">Saldo inicial: ${fmtMonto(caja.saldo_inicial)}</div>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2">
          <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
            <div className="text-[10.5px] uppercase tracking-wide text-muted">Entró</div>
            <div className="mt-1 text-[17px] font-bold tabular-nums text-income">+${fmtMonto(entro)}</div>
          </div>
          <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
            <div className="text-[10.5px] uppercase tracking-wide text-muted">Salió</div>
            <div className="mt-1 text-[17px] font-bold tabular-nums text-expense">−${fmtMonto(salio)}</div>
          </div>
        </div>

        <SectionHeader title="Movimientos" subtitle={`${movs.length} en esta caja`} />
        {movs.length === 0 ? (
          <div className="rounded-2xl border border-line bg-surface p-6 text-center text-[13px] text-muted">Sin movimientos en esta caja todavía.</div>
        ) : (
          <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
            {movs.map((m, i) => <MovRow key={m.id} mov={m} isLast={i === movs.length - 1} />)}
          </div>
        )}
      </div>
    </div>
  );
}

const PALETTE = ['#16A34A', '#8B5CF6', '#0EA5E9', '#1D4ED8', '#DC2626', '#65A30D', '#F59E0B', '#EC4899', '#0F766E', '#475569', '#7C3AED', '#F97316'];
const ICONOS = ['💵', '💳', '🏦', '📈', '💰', '🟣', '🟦', '🟢', '🟡', '🔵', '🔴', '📱'];

// Cuentas comunes para agregar rápido (algunas con logo incluido).
const PRESETS: { nombre: string; tipo: CajaTipo; color: string; logo?: string; icono?: string }[] = [
  { nombre: 'Santander', tipo: 'banco', color: '#DC2626', logo: '/logos/santander.png' },
  { nombre: 'Mercado Pago', tipo: 'billetera', color: '#0EA5E9', logo: '/logos/mercado-pago.png' },
  { nombre: 'Brubank', tipo: 'billetera', color: '#8B5CF6', logo: '/logos/brubank.png' },
  { nombre: 'Rebanking', tipo: 'billetera', color: '#65A30D', logo: '/logos/rebanking.png' },
  { nombre: 'Banco de Corrientes', tipo: 'banco', color: '#1D4ED8', logo: '/logos/banco-corrientes.png' },
  { nombre: 'Personal Pay', tipo: 'billetera', color: '#7C3AED', icono: '💜' },
  { nombre: 'Ualá', tipo: 'billetera', color: '#F97316', icono: '🟠' },
  { nombre: 'Naranja X', tipo: 'billetera', color: '#F59E0B', icono: '🍊' },
  { nombre: 'AstroPay', tipo: 'billetera', color: '#0F766E', icono: '🚀' },
  { nombre: 'Efectivo', tipo: 'efectivo', color: '#16A34A', icono: '💵' },
  { nombre: 'Plazo Fijo', tipo: 'plazo_fijo', color: '#0F766E', icono: '📈' },
];
const BUNDLED_LOGOS = ['/logos/santander.png', '/logos/mercado-pago.png', '/logos/brubank.png', '/logos/rebanking.png', '/logos/banco-corrientes.png'];

/** Lee una imagen, la achica a 96px (contain) y devuelve un data URI PNG chico. */
function fileToLogo(file: File, cb: (dataUri: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const S = 96;
      const canvas = document.createElement('canvas');
      canvas.width = S;
      canvas.height = S;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const scale = Math.min(S / img.width, S / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h);
      cb(canvas.toDataURL('image/png'));
    };
    img.src = reader.result as string;
  };
  reader.readAsDataURL(file);
}

/** Alta y edición de una cuenta. Con `initial` prellena y actualiza; si no, crea. */
function CajaForm({ initial, owner, onBack, onSubmit }: { initial?: Caja; owner: UserId; onBack: () => void; onSubmit: (p: Omit<Caja, 'id'>) => void }) {
  const users = useFinanzasStore((s) => s.users);
  const editing = !!initial;
  const [tipo, setTipo] = useState<CajaTipo>(initial?.tipo ?? 'billetera');
  const [nombre, setNombre] = useState(initial?.nombre ?? '');
  const [color, setColor] = useState(initial?.color ?? '#0EA5E9');
  const [icono, setIcono] = useState(initial?.icono ?? '💳');
  const [logo, setLogo] = useState<string | undefined>(initial?.logo);
  const [saldo, setSaldo] = useState(initial ? moneyToInput(initial.saldo_inicial) : '');
  const [dueno, setDueno] = useState<UserId>(initial?.owner ?? owner);
  const valid = nombre.trim().length > 0;

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    setNombre(p.nombre);
    setTipo(p.tipo);
    setColor(p.color);
    setLogo(p.logo);
    if (p.icono) setIcono(p.icono);
  };

  const ownerIds = Object.keys(users).filter((id) => id === 'fer' || id === 'pao') as UserId[];

  return (
    <div className="pt-2">
      <ScreenHeader title={editing ? 'Editar cuenta' : 'Nueva cuenta'} size="md" onBack={onBack} />
      <div className="px-[18px] lg:px-0">
        <div className="mb-4">
          <CajaCard caja={{ id: 'preview', nombre: nombre || 'Nombre de la cuenta', color, icono, logo, tipo, owner: dueno, saldo_inicial: 0 }} saldo={parseMoney(saldo)} />
        </div>

        <Field label="Saldo actual">
          <input inputMode="decimal" value={saldo} onChange={(e) => setSaldo(formatMiles(e.target.value))} placeholder="0" className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[17px] font-semibold tabular-nums text-text outline-none" />
          <div className="mt-1.5 text-[11px] text-muted">La plata que tenés hoy en esta cuenta. Se usa como saldo inicial (después suma/resta tus movimientos).</div>
        </Field>

        {!editing && (
          <Field label="Elegí una conocida (o creala abajo)">
            <div className="hide-scroll flex gap-2 overflow-x-auto pb-1">
              {PRESETS.map((p) => (
                <button key={p.nombre} onClick={() => applyPreset(p)} className="flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2" style={{ background: nombre === p.nombre ? alpha(p.color, 0.13) : 'var(--surface)', borderColor: nombre === p.nombre ? p.color : 'var(--border)' }}>
                  <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-md">
                    <CatIcon item={p} size={20} />
                  </div>
                  <span className="whitespace-nowrap text-[13px] font-medium text-text">{p.nombre}</span>
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="¿De quién es?">
          <div className="flex gap-1.5">
            {ownerIds.map((id) => {
              const active = dueno === id;
              const col = users[id]?.color ?? '#2563EB';
              return (
                <button key={id} onClick={() => setDueno(id)} className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2.5 text-[13px] font-semibold" style={{ background: active ? alpha(col, 0.15) : 'var(--surface)', color: active ? col : 'var(--text-muted)', border: `1px solid ${active ? col : 'var(--border)'}` }}>
                  <Avatar userId={id} size={18} /> {users[id]?.nombre ?? id}
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Nombre">
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej. Brubank, Santander..." className="w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-[15px] text-text outline-none" />
        </Field>

        <Field label="Logo (opcional)">
          <div className="flex flex-wrap items-center gap-2">
            {BUNDLED_LOGOS.map((l) => (
              <button key={l} onClick={() => setLogo(l)} className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border bg-surface" style={{ borderColor: logo === l ? color : 'var(--border)' }}>
                <img src={l} width={26} height={26} style={{ objectFit: 'contain' }} alt="" />
              </button>
            ))}
            <label className="flex h-11 cursor-pointer items-center gap-1.5 rounded-xl border border-dashed border-line-strong px-3.5 text-[12.5px] font-medium text-muted">
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) fileToLogo(f, setLogo); }} />
              ⬆ Subir
            </label>
            {logo && (
              <button onClick={() => setLogo(undefined)} className="flex h-11 items-center rounded-xl border border-line bg-surface px-3.5 text-[12.5px] text-muted">Sin logo</button>
            )}
          </div>
          {logo?.startsWith('data:') && <div className="mt-1.5 text-[11px] text-savings">Logo subido ✓</div>}
        </Field>

        <Field label="Tipo">
          <div className="grid grid-cols-2 gap-2">
            {CAJA_TIPOS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTipo(t.id)}
                className="rounded-xl p-3 text-left"
                style={{ background: tipo === t.id ? alpha(color, 0.12) : 'var(--surface)', border: `1px solid ${tipo === t.id ? color : 'var(--border)'}` }}
              >
                <div className="mb-1 text-lg">{t.icon}</div>
                <div className="text-[13px] font-semibold text-text">{t.label}</div>
                <div className="mt-0.5 text-[10.5px] text-muted">{t.sub}</div>
              </button>
            ))}
          </div>
        </Field>

        <Field label="Color">
          <div className="grid grid-cols-6 gap-2">
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)} className="aspect-square rounded-xl" style={{ background: `linear-gradient(135deg, ${c} 0%, ${shade(c, -0.2)} 100%)`, border: color === c ? '2.5px solid var(--text)' : '2px solid transparent', boxShadow: color === c ? `0 0 16px ${alpha(c, 0.6)}` : 'none' }} />
            ))}
          </div>
        </Field>

        {!logo && (
          <Field label="Ícono (si no ponés logo)">
            <div className="flex flex-wrap gap-2">
              {ICONOS.map((i) => (
                <button key={i} onClick={() => setIcono(i)} className="h-9 w-9 rounded-[10px] text-lg" style={{ background: icono === i ? alpha(color, 0.15) : 'var(--surface)', border: icono === i ? `2px solid ${color}` : '1px solid var(--border)' }}>{i}</button>
              ))}
            </div>
          </Field>
        )}

        <div className="py-4">
          <button
            onClick={() => onSubmit({ nombre: nombre.trim(), tipo, color, icono, logo, saldo_inicial: parseMoney(saldo), owner: dueno })}
            disabled={!valid}
            className="w-full rounded-[14px] py-3.5 text-[15px] font-semibold"
            style={{ background: valid ? `linear-gradient(180deg, ${color} 0%, ${shade(color, -0.15)} 100%)` : 'var(--surface)', color: valid ? '#fff' : 'var(--text-muted)', boxShadow: valid ? `0 8px 20px ${alpha(color, 0.33)}` : 'none' }}
          >
            {editing ? 'Guardar cambios' : 'Crear cuenta'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      {children}
    </div>
  );
}
