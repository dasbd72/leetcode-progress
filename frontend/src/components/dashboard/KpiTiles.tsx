import { Panel } from '@/components/ui/panel';
import { type Kpis } from '@/lib/progress';

function Tile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <Panel className="p-3.5">
      <div className="text-muted text-[11px] font-medium tracking-[0.07em] uppercase">{label}</div>
      <div className="tabular mt-1 text-[28px] leading-none font-semibold">{value}</div>
      <div className="text-muted mt-1 text-xs">{sub}</div>
    </Panel>
  );
}

export function KpiTiles({ kpis, solverCount }: { kpis: Kpis; solverCount: number }) {
  return (
    <section
      aria-label="Summary"
      className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-[14px]"
    >
      <Tile
        label="Total solved"
        value={kpis.totalSolved.toLocaleString()}
        sub={`${solverCount} solver${solverCount === 1 ? '' : 's'}`}
      />
      <Tile label="Solved in range" value={`+${kpis.solvedInRange}`} sub="all difficulties" />
      <Tile label="Hard in range" value={`+${kpis.hardInRange}`} sub="across all solvers" />
      <Tile
        label="Top climber"
        value={kpis.topClimber ? kpis.topClimber.username : '—'}
        sub={kpis.topClimber ? `+${kpis.topClimber.gain} problems` : 'no activity'}
      />
    </section>
  );
}
