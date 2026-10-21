import * as d3 from 'd3';
import { ESTADOS, ESTADO_COR, kz, pct, pt, type Estado, type Filtros, type ResumoRow } from '../lib/data';
import { Tooltip, useTooltip, useWidth } from '../lib/hooks';

interface Props {
  scope: ResumoRow[];
  f: Filtros;
  onSolo: (e: Estado) => void;
  scopeName: string;
  nContratos: number;
  resumo: string;
}

export function Hero({ scope, f, onSolo, scopeName, nContratos, resumo }: Props) {
  const data = ESTADOS.map((e) => ({ e, v: d3.sum(scope.filter((r) => r.ST_PARCELA === e), (r) => r.valor_kz) }));
  const tot = d3.sum(data, (d) => d.v);
  const sel = scope.filter((r) => f.estados.includes(r.ST_PARCELA));
  const selV = d3.sum(sel, (r) => r.valor_kz);
  const selN = d3.sum(sel, (r) => r.parcelas);

  const [boxRef, w] = useWidth<HTMLDivElement>();
  const { tip, show, hide } = useTooltip(boxRef);
  const S = Math.max(160, Math.min(w || 260, 280));
  const r = S / 2;
  const arc = d3.arc<d3.PieArcDatum<(typeof data)[number]>>().innerRadius(r * 0.66).cornerRadius(6).padAngle(0.02);
  const pie = d3.pie<(typeof data)[number]>().value((d) => d.v).sort(null)(data);

  return (
    <section className="card hero" id="destaque">
      <div>
        <div className="eyebrow">{scopeName}{f.estados.length < 4 ? ` · ${f.estados.join(', ')}` : ''}</div>
        <div>
          <span className="big">{kz(selV)}</span>
          <span className="unit">Kz</span>
        </div>
        <p className="take">{resumo}</p>
        <div className="mini">
          <div><b>{pt(selN)}</b><span>parcelas</span></div>
          <div><b>{pt(nContratos)}</b><span>contratos</span></div>
          <div><b>{selN ? kz(selV / selN) : '—'}</b><span>Kz por parcela</span></div>
        </div>
      </div>
      <div className="donut" ref={boxRef}>
        <svg width={S} height={S} viewBox={`${-r} ${-r} ${S} ${S}`}>
          {pie.map((d) => {
            const on = f.estados.includes(d.data.e);
            return (
              <path
                key={d.data.e}
                d={arc.outerRadius(on ? r : r - 6)(d) ?? ''}
                fill={ESTADO_COR[d.data.e]}
                opacity={on ? 1 : 0.28}
                style={{ cursor: 'pointer' }}
                onClick={() => onSolo(d.data.e)}
                onMouseMove={(ev) => show(ev, d.data.e, [{ color: ESTADO_COR[d.data.e], label: 'Valor', value: `${kz(d.data.v)} Kz` }, { label: 'Peso', value: pct(d.data.v / tot) }])}
                onMouseLeave={hide}
              />
            );
          })}
        </svg>
        <div className="center">
          <b>{pct(selV / tot)}</b>
          <span>{f.estados.length === 4 ? 'toda a carteira' : f.estados.join(' + ')}</span>
        </div>
        <Tooltip tip={tip} boxWidth={w} />
      </div>
    </section>
  );
}
