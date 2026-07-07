import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { fetchBlueVenta } from '@/services/dolar';
import { fmtMonto, formatMiles, moneyToInput, parseMoney } from '@/lib/format';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Icon } from '@/components/ui/icons';
import { UsuariosScreen } from '@/features/usuarios/UsuariosScreen';

const ACCENT = '#3B82F6';

const GESTION = [
  { path: '/mas/cajas', emoji: '💼', label: 'Cuentas', sub: 'Cuentas y billeteras de cada uno' },
  { path: '/mas/alertas', emoji: '🔔', label: 'Alertas y metas', sub: 'Límites de gasto por categoría' },
];

function fmtFecha(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? ''
    : d.toLocaleString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export function ConfiguracionScreen() {
  const navigate = useNavigate();
  const usdRate = useFinanzasStore((s) => s.usdRate);
  const usdFecha = useFinanzasStore((s) => s.usdFecha);
  const usdManual = useFinanzasStore((s) => s.usdManual);
  const setUsdRate = useFinanzasStore((s) => s.setUsdRate);
  const setUsdBlue = useFinanzasStore((s) => s.setUsdBlue);
  const { mode, setMode } = useTheme();
  const [rate, setRate] = useState(moneyToInput(usdRate));
  const [busy, setBusy] = useState(false);

  useEffect(() => setRate(moneyToInput(usdRate)), [usdRate]);

  const commitRate = () => {
    const n = parseMoney(rate);
    if (n > 0) setUsdRate(n);
    else setRate(moneyToInput(usdRate));
  };
  const actualizarBlue = async () => {
    setBusy(true);
    const b = await fetchBlueVenta();
    if (b) setUsdBlue(b.venta, b.fecha);
    setBusy(false);
  };

  return (
    <div className="pt-2">
      <ScreenHeader title="Configuración" onBack={() => navigate('/mas')} />
      <div className="px-[18px] lg:px-0">
        {/* Gestión: cuentas, alertas y metas */}
        <section className="mb-6">
          <SectionHeader title="Gestión" subtitle="cuentas, alertas y metas" />
          <div className="overflow-hidden rounded-[18px] border border-line bg-surface">
            {GESTION.map((g, i) => (
              <button
                key={g.path}
                onClick={() => navigate(g.path)}
                className="flex w-full items-center gap-3.5 bg-surface px-4 py-3.5 text-left transition-colors hover:bg-surface-2"
                style={{ borderBottom: i === GESTION.length - 1 ? 'none' : '1px solid var(--border)' }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface-2 text-lg">{g.emoji}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14.5px] font-medium text-text">{g.label}</div>
                  <div className="mt-0.5 text-xs text-muted">{g.sub}</div>
                </div>
                <Icon.chev size={16} className="text-muted" />
              </button>
            ))}
          </div>
        </section>

        {/* Apariencia */}
        <section className="mb-6">
          <SectionHeader title="Apariencia" subtitle="tema de la app" />
          <div className="flex max-w-[320px] gap-2">
            {(['dark', 'light'] as const).map((m) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className="flex-1 rounded-xl border py-3 text-sm font-semibold transition-all"
                  style={{
                    background: active ? `color-mix(in srgb, ${ACCENT} 14%, transparent)` : 'var(--surface)',
                    borderColor: active ? ACCENT : 'var(--border)',
                    color: active ? ACCENT : 'var(--text-muted)',
                  }}
                >
                  {m === 'dark' ? 'Oscuro' : 'Claro'}
                </button>
              );
            })}
          </div>
        </section>

        {/* Dólar */}
        <section className="mb-6">
          <SectionHeader title="Cotización del dólar" subtitle="ARS por USD · dólar blue (venta)" />
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[26px] font-bold tabular-nums tracking-[-0.5px] text-text">${fmtMonto(usdRate)}</div>
                <div className="mt-0.5 text-[11.5px] text-muted">
                  {usdManual
                    ? '✍️ Fijado a mano'
                    : `🔵 Dólar blue (venta)${usdFecha ? ' · ' + fmtFecha(usdFecha) : ''}`}
                </div>
              </div>
              <button
                onClick={actualizarBlue}
                disabled={busy}
                className="rounded-[10px] border px-3 py-2 text-[12.5px] font-semibold"
                style={{ background: busy ? 'var(--surface-2)' : `color-mix(in srgb, ${ACCENT} 12%, transparent)`, borderColor: ACCENT, color: ACCENT }}
              >
                {busy ? 'Actualizando…' : 'Actualizar del blue'}
              </button>
            </div>
            <div className="mt-3 border-t border-line pt-3">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Fijar a mano (opcional)</div>
              <div className="relative max-w-[220px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
                <input
                  value={rate}
                  inputMode="decimal"
                  onChange={(e) => setRate(formatMiles(e.target.value))}
                  onBlur={commitRate}
                  onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                  className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-7 pr-3 text-[15px] font-semibold tabular-nums text-text outline-none focus:border-accent"
                />
              </div>
              <div className="mt-1.5 text-[11px] text-muted">
                Si lo cambiás a mano, deja de actualizarse solo hasta que toques “Actualizar del blue”.
              </div>
            </div>
          </div>
        </section>

        {/* Usuarios */}
        <section className="mb-4">
          <SectionHeader title="Usuarios y permisos" subtitle="ambos administradores" />
          <UsuariosScreen embedded />
        </section>
      </div>
    </div>
  );
}
