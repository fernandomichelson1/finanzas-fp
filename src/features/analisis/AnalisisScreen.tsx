import { useState } from 'react';
import { StatsScreen } from '@/features/stats/StatsScreen';
import { ResumenSemanalScreen } from '@/features/resumenes/ResumenSemanalScreen';
import { FinDeMesScreen } from '@/features/resumenes/FinDeMesScreen';

type Tab = 'stats' | 'semanal' | 'finmes';
const TABS: [Tab, string][] = [
  ['stats', 'Estadísticas'],
  ['semanal', 'Resumen semanal'],
  ['finmes', 'Fin de mes'],
];

/** Agrupa Estadísticas + Resumen semanal + Fin de mes en un solo lugar con pestañas. */
export function AnalisisScreen() {
  const [tab, setTab] = useState<Tab>('stats');
  return (
    <div className="pt-2">
      <div className="px-[18px] lg:px-0">
        <h1 className="m-0 text-2xl font-bold tracking-[-0.6px] text-text lg:text-[26px]">Análisis</h1>
        <div className="mt-1 text-[13px] text-muted">Estadísticas, resumen de la semana y cierre del mes</div>
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
        {tab === 'stats' && <StatsScreen embedded />}
        {tab === 'semanal' && <ResumenSemanalScreen embedded />}
        {tab === 'finmes' && <FinDeMesScreen embedded />}
      </div>
    </div>
  );
}
