import * as d3 from 'd3';
import { impactos, kz, pct, pt, type ContratoRow, type ResumoRow } from '../lib/data';
import { Card, useWidth } from '../lib/hooks';
import { Ic } from './Icons';

function Gauge({ value, color, label }: { value: number; color: string; label: string }) {
  const [ref, w] = useWidth<HTMLDivElement>();
  const W = Math.max(140, Math.min(w || 220, 240));
  const r = W / 2 - 6;
  const H = r + 14;
  const a = d3.arc<{ startAngle: number; endAngle: number }>().innerRadius(r * 0.74).outerRadius(r).cornerRadius(r);
  const end = -Math.PI / 2 + Math.PI * Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
  return (
    <div className="gauge" ref={ref}>
      <svg width="100%" height={H + 6} viewBox={`${-W / 2} ${-r - 8} ${W} ${H + 6}`}>
        <path d={a({ startAngle: -Math.PI / 2, endAngle: Math.PI / 2 }) ?? ''} fill="var(--track)" />
        <path d={a({ startAngle: -Math.PI / 2, endAngle: end }) ?? ''} fill={color} />
      </svg>
      <div className="lab"><b>{pct(value)}</b><span>{label}</span></div>
    </div>
  );
}

export function Impact({ scope, contratos }: { scope: ResumoRow[]; contratos: ContratoRow[] }) {
  const m = impactos(scope);
  const inc = contratos.filter((c) => c.n_atrasada + c.n_cobranca > 0).length;
  return (
    <Card id="impactos" title="Impactos" icon={<Ic.alert />} note={'Associação e ano do filtro, todos os estados. "Não paga" = por vencer; "Atrasada" + "Cobrança" = incumprimento.'}>
      <div className="gauges">
        <Gauge value={m.taxaIncumprimento} color="var(--c-atrasada)" label="Taxa de incumprimento" />
        <Gauge value={m.taxaCobranca} color="var(--c-paga)" label="Taxa de cobrança" />
      </div>
      <div className="facts">
        <div className="fact"><b style={{ color: 'var(--bad)' }}>{kz(m.risco)}</b><span>Kz em risco</span></div>
        <div className="fact"><b>{kz(m.porVencer)}</b><span>Kz por vencer</span></div>
        <div className="fact"><b>{kz(m.aberto)}</b><span>Kz em aberto</span></div>
        <div className="fact"><b style={{ color: 'var(--warn)' }}>{pt(inc)}</b><span>contratos em incumprimento ({pct(inc / (contratos.length || 1))})</span></div>
      </div>
    </Card>
  );
}
