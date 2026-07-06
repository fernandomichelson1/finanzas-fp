import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { useTheme } from '@/theme/ThemeProvider';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { UsuariosScreen } from '@/features/usuarios/UsuariosScreen';

const ACCENT = '#3B82F6';

export function ConfiguracionScreen() {
  const navigate = useNavigate();
  const usdRate = useFinanzasStore((s) => s.usdRate);
  const setUsdRate = useFinanzasStore((s) => s.setUsdRate);
  const { mode, setMode } = useTheme();
  const [rate, setRate] = useState(String(usdRate));

  const commitRate = () => {
    const n = Number(String(rate).replace(/[^\d.]/g, ''));
    if (n > 0) setUsdRate(n);
    else setRate(String(usdRate));
  };

  return (
    <div className="pt-2">
      <ScreenHeader title="Configuración" onBack={() => navigate('/mas')} />
      <div className="px-[18px] lg:px-0">
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
          <SectionHeader title="Cotización del dólar" subtitle="ARS por USD" />
          <div className="rounded-2xl border border-line bg-surface p-4">
            <div className="relative max-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">$</span>
              <input
                value={rate}
                inputMode="numeric"
                onChange={(e) => setRate(e.target.value.replace(/[^\d.]/g, ''))}
                onBlur={commitRate}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                className="w-full rounded-xl border border-line bg-surface-2 py-2.5 pl-7 pr-3 text-[15px] font-semibold tabular-nums text-text outline-none focus:border-accent"
              />
            </div>
            <div className="mt-2 text-[12px] text-muted">
              Se usa para mostrar los montos en dólares (balance, gastos fijos, etc.).
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
