import { useMemo, useState } from 'react';
import { useFinanzasStore } from '@/store/useFinanzasStore';
import { ownerForMonth } from '@/lib/selectors';
import { MES_ACTUAL, mesLabel } from '@/lib/date';
import { fmtMonto } from '@/lib/format';
import { alpha } from '@/lib/color';
import { Avatar } from '@/components/ui/Avatar';

type Periodo = 'mes' | 'anio' | 'todo';

const FER = '#2563EB';
const PAO = '#E11D48';

export function EstadisticasScreen() {
  const gastosFijos = useFinanzasStore((s) => s.gastosFijos);
  const instancias = useFinanzasStore((s) => s.instancias);
  const movimientos = useFinanzasStore((s) => s.movimientos);
  const users = useFinanzasStore((s) => s.users);
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const year = MES_ACTUAL.slice(0, 4);
  const stats = useMemo(() => {
    const inPeriod = (mes: string) =>
      periodo === 'todo' ? true : periodo === 'anio' ? mes.startsWith(year) : mes === MES_ACTUAL;
    const gfById = new Map(gastosFijos.map((g) => [g.id, g]));
    const paga = { fer: 0, pao: 0, compartido: 0 };
    const ingresa = { fer: 0, pao: 0 };
    const ahorra = { fer: 0, pao: 0 };

    // Gastos fijos pagados → según el responsable de ese mes.
    for (const inst of instancias) {
      if (!inst.pagado || !inPeriod(inst.mes)) continue;
      const gf = gfById.get(inst.gfId);
      if (!gf) continue;
      const monto = inst.monto ?? gf.montoSugerido ?? 0;
      const owner = ownerForMonth(gf, inst.mes);
      paga[owner === 'fer' ? 'fer' : owner === 'pao' ? 'pao' : 'compartido'] += monto;
    }
    // Movimientos: gastos eventuales (no los pagos de gasto fijo), ingresos y ahorros.
    for (const m of movimientos) {
      if (!inPeriod(m.fecha.slice(0, 7))) continue;
      const u: 'fer' | 'pao' = m.user === 'pao' ? 'pao' : 'fer';
      if (m.tipo === 'gasto' && !(m.tags ?? []).includes('gasto-fijo')) paga[u] += m.monto;
      else if (m.tipo === 'ingreso') ingresa[u] += m.monto;
      else if (m.tipo === 'ahorro') ahorra[u] += m.monto;
    }
    return { paga, ingresa, ahorra };
  }, [gastosFijos, instancias, movimientos, periodo, year]);

  const periodoLabel = periodo === 'mes' ? mesLabel(MES_ACTUAL) : periodo === 'anio' ? year : 'Todo el historial';

  return (
    <div className="px-[18px] pt-2 lg:px-0">
      <div className="mb-3.5 flex items-center justify-between">
        <div>
          <h1 className="m-0 text-2xl font-bold tracking-[-0.6px] text-text lg:text-[26px]">Estadísticas</h1>
          <div className="mt-1 text-[13px] text-muted">Quién paga, ingresa y ahorra · {periodoLabel}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl text-white" style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)', boxShadow: '0 6px 16px rgba(37,99,235,0.4)' }}>📊</div>
      </div>

      {/* Período */}
      <div className="mb-4 flex gap-1.5">
        {(['mes', 'anio', 'todo'] as Periodo[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className="flex-1 rounded-[10px] border py-2.5 text-[13px] font-semibold transition-colors"
            style={{
              background: periodo === p ? 'var(--text)' : 'var(--surface)',
              color: periodo === p ? 'var(--bg)' : 'var(--text-muted)',
              borderColor: periodo === p ? 'var(--text)' : 'var(--border)',
            }}
          >
            {p === 'mes' ? 'Este mes' : p === 'anio' ? 'Este año' : 'Todo'}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <MetricCard
          title="Paga cada uno"
          hint="Gastos fijos (según responsable) + gastos eventuales"
          fer={stats.paga.fer}
          pao={stats.paga.pao}
          compartido={stats.paga.compartido}
          ferName={users.fer?.nombre ?? 'Fer'}
          paoName={users.pao?.nombre ?? 'Pao'}
        />
        <MetricCard
          title="Ingresa cada uno"
          hint="Ingresos cargados a la cuenta"
          fer={stats.ingresa.fer}
          pao={stats.ingresa.pao}
          ferName={users.fer?.nombre ?? 'Fer'}
          paoName={users.pao?.nombre ?? 'Pao'}
        />
        <MetricCard
          title="Ahorra cada uno"
          hint="Aportes a objetivos y ahorros"
          fer={stats.ahorra.fer}
          pao={stats.ahorra.pao}
          ferName={users.fer?.nombre ?? 'Fer'}
          paoName={users.pao?.nombre ?? 'Pao'}
        />
      </div>

      <div className="mt-3 rounded-xl border border-line bg-surface-2 px-3.5 py-3 text-[12px] text-muted">
        Los ingresos y ahorros se cargan desde la app (el “+”). Los gastos fijos importados
        del Excel están todos a nombre de Fer; cambiá el responsable por mes en “Gastos fijos”.
      </div>
    </div>
  );
}

function MetricCard({
  title,
  hint,
  fer,
  pao,
  compartido = 0,
  ferName,
  paoName,
}: {
  title: string;
  hint: string;
  fer: number;
  pao: number;
  compartido?: number;
  ferName: string;
  paoName: string;
}) {
  const total = fer + pao + compartido;
  const max = Math.max(fer, pao, compartido, 1);
  const rows: { name: string; val: number; color: string; userId?: 'fer' | 'pao' }[] = [
    { name: ferName, val: fer, color: FER, userId: 'fer' },
    { name: paoName, val: pao, color: PAO, userId: 'pao' },
  ];
  if (compartido > 0) rows.push({ name: 'Compartido', val: compartido, color: '#8B5CF6' });

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="text-[14.5px] font-semibold text-text">{title}</div>
      <div className="mb-3 text-[11px] text-muted">{hint}</div>
      <div className="mb-3 text-[22px] font-bold tabular-nums tracking-[-0.5px] text-text">${fmtMonto(total)}</div>
      <div className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-text">
                {r.userId ? <Avatar userId={r.userId} size={18} /> : <span className="h-[18px] w-[18px] rounded-full" style={{ background: alpha(r.color, 0.3) }} />}
                {r.name}
              </span>
              <span className="text-[13px] font-semibold tabular-nums" style={{ color: r.color }}>${fmtMonto(r.val)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full" style={{ width: `${(r.val / max) * 100}%`, background: r.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
