import { useState } from 'react';
import { EstadisticasScreen } from '@/features/estadisticas/EstadisticasScreen';
import { FinDeMesScreen } from '@/features/resumenes/FinDeMesScreen';

type Tab = 'estad' | 'finmes';
const TABS: [Tab, string][] = [
  ['estad', 'Estadísticas'],
  ['finmes', 'Fin de mes'],
];

/** Hub de análisis: estadísticas (quién paga, categorías, tendencia) + cierre del mes. */
export function AnalisisScreen() {
  const [tab, setTab] = useState<Tab>('estad');
  return (
    <div className="pt-2">
      <div className="px-[18px] lg:px-0">
        <h1 className="m-0 text-2xl font-bold tracking-[-0.6px] text-text lg:text-[26px]">Análisis</h1>
        <div className="mt-1 text-[13px] text-muted">Estadísticas del hogar y cierre del mes</div>
        <div className="hide-scroll mt-3 flex gap-1.5 overflow-x-auto">
          {TABS.map(([id, label]) => {
            const active = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="whitespace-nowrap rounded-full border border-line px-3.5 py-1.5 text-[13px] font-medium transition-all"
                style={{ background: active ? 'var(--text)' : 'var(--surface)', color: active ? 'var(--bg)' : 'var(--text-muted)' }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-3">
        {tab === 'estad' && <EstadisticasScreen embedded />}
        {tab === 'finmes' && <FinDeMesScreen embedded />}
      </div>
    </div>
  );
}
