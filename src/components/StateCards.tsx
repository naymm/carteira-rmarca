import * as d3 from 'd3';
import { ESTADOS, ESTADO_COR, kz, pct, pt, type Estado, type Filtros, type ResumoRow } from '../lib/data';
import { EstadoIcon } from './Icons';

export function StateCards({ scope, f, onToggle }: { scope: ResumoRow[]; f: Filtros; onToggle: (e: Estado) => void }) {
  const tot = d3.sum(scope, (r) => r.valor_kz) || 1;
  return (
    <section className="states" id="estados">
      {ESTADOS.map((e, i) => {
        const rows = scope.filter((r) => r.ST_PARCELA === e);
        const v = d3.sum(rows, (r) => r.valor_kz);
        const n = d3.sum(rows, (r) => r.parcelas);
        const on = f.estados.includes(e);
        return (
          <button
            key={e}
            type="button"
            className={`card state anim${on ? '' : ' off'}`}
            style={{ animationDelay: `${i * 60}ms` }}
            aria-pressed={on}
            aria-label={`Filtrar ${e}`}
            onClick={() => onToggle(e)}
          >
            <div className="row">
              <span className="name">{e}</span>
              <span className="ico" style={{ color: ESTADO_COR[e], background: `color-mix(in srgb, ${ESTADO_COR[e]} 14%, transparent)` }}>
                <EstadoIcon e={e} />
              </span>
            </div>
            <div className="v">{kz(v)} Kz</div>
            <div className="s">{pt(n)} parcelas · {pct(v / tot)}</div>
            <div className="bar"><span style={{ width: `${(100 * v) / tot}%`, background: ESTADO_COR[e] }} /></div>
          </button>
        );
      })}
    </section>
  );
}
