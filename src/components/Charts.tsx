import * as d3 from 'd3';
import { useMemo } from 'react';
import { ESTADOS, ESTADO_COR, assocCurto, kz, pct, type ContratoRow, type Estado, type Filtros, type ResumoRow } from '../lib/data';
import { Card, Tooltip, useTooltip, useWidth } from '../lib/hooks';
import { Ic } from './Icons';

function Legend({ estados }: { estados: Estado[] }) {
  return (
    <div className="legend">
      {estados.map((e) => (
        <span key={e}><i style={{ background: ESTADO_COR[e] }} />{e}</span>
      ))}
    </div>
  );
}

function YAxis({ y, x0, x1, fmt }: { y: d3.ScaleLinear<number, number>; x0: number; x1: number; fmt: (v: number) => string }) {
  return (
    <g>
      {y.ticks(4).map((t) => (
        <g key={t} transform={`translate(0,${y(t)})`}>
          <line x1={x0} x2={x1} stroke="var(--grid)" />
          <text x={x0 - 6} dy="0.32em" textAnchor="end" className="tick">{fmt(t)}</text>
        </g>
      ))}
    </g>
  );
}

/* ---------- Treemap: associação × estado ---------- */
export function Treemap({ rows, f, assocs, onSolo }: { rows: ResumoRow[]; f: Filtros; assocs: string[]; onSolo: (e: Estado) => void }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const { tip, show, hide } = useTooltip(ref);
  const H = 300;
  const root = useMemo(() => {
    const rr = rows.filter((r) => (!f.ano || r.ANO_CONTRATO === f.ano) && (!f.assoc || r.ASSOCIACAO === f.assoc) && f.estados.includes(r.ST_PARCELA));
    const children = assocs
      .map((a) => ({
        name: a,
        children: f.estados
          .map((e) => ({ name: e, a, value: d3.sum(rr.filter((r) => r.ASSOCIACAO === a && r.ST_PARCELA === e), (r) => r.valor_kz) }))
          .filter((d) => d.value > 0),
      }))
      .filter((d) => d.children.length);
    type Node = { name?: string; a?: string; value?: number; children?: Node[] };
    const h = d3.hierarchy<Node>({ children }).sum((d) => d.value ?? 0).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    if (W > 0) d3.treemap<Node>().size([W, H]).paddingOuter(3).paddingTop(22).paddingInner(3).round(true)(h);
    return h as d3.HierarchyRectangularNode<Node>;
  }, [rows, f, assocs, W]);
  const total = root.value || 1;
  return (
    <Card id="treemap" title="Onde está o dinheiro" icon={<Ic.tree />} note="Cada bloco é uma associação, dividido por estado. Área proporcional ao valor.">
      <div className="chart" ref={ref} style={{ minHeight: H }}>
        {W > 0 && (
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            {(root.children ?? []).map((d) => {
              const w = d.x1 - d.x0;
              const nm = assocCurto(d.data.name!);
              return (
                <g key={d.data.name}>
                  <rect x={d.x0} y={d.y0} width={w} height={d.y1 - d.y0} rx={10} fill="var(--track)" />
                  <text x={d.x0 + 8} y={d.y0 + 15} className="lbl-strong">{w > 150 ? `${nm} · ${kz(d.value ?? 0)}` : w > 60 ? nm : ''}</text>
                </g>
              );
            })}
            {root.leaves().map((d) => {
              const w = d.x1 - d.x0;
              const h = d.y1 - d.y0;
              const e = d.data.name as Estado;
              return (
                <g key={`${d.data.a}-${e}`}>
                  <rect
                    x={d.x0} y={d.y0} width={Math.max(0, w)} height={Math.max(0, h)} rx={6} fill={ESTADO_COR[e]} fillOpacity={0.85}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onSolo(e)}
                    onMouseMove={(ev) => show(ev, assocCurto(d.data.a!), [{ color: ESTADO_COR[e], label: e, value: `${kz(d.value ?? 0)} Kz` }, { label: 'Peso no total', value: pct((d.value ?? 0) / total) }])}
                    onMouseLeave={hide}
                  />
                  {w > 70 && h > 22 && <text x={d.x0 + 7} y={d.y0 + 16} className="on-fill strong">{e}</text>}
                  {w > 70 && h > 40 && <text x={d.x0 + 7} y={d.y0 + 32} className="on-fill">{kz(d.value ?? 0)}</text>}
                </g>
              );
            })}
          </svg>
        )}
        <Tooltip tip={tip} boxWidth={W} />
      </div>
    </Card>
  );
}

/* ---------- Mapa de calor: ano × nº parcela ---------- */
export function Heatmap({ rows, f, anos }: { rows: ResumoRow[]; f: Filtros; anos: string[] }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const { tip, show, hide } = useTooltip(ref);
  const ys = anos.filter((a) => a !== 'Sem ano' && (!f.ano || a === f.ano));
  const xs = d3.range(1, 25);
  const { cell, mx } = useMemo(() => {
    const cell = new Map<string, { pago: number; inc: number; np: number }>();
    rows.filter((r) => !f.assoc || r.ASSOCIACAO === f.assoc).forEach((r) => {
      const k = `${r.ANO_CONTRATO}|${r.NU_PARCELA}`;
      if (!cell.has(k)) cell.set(k, { pago: 0, inc: 0, np: 0 });
      const c = cell.get(k)!;
      if (r.ST_PARCELA === 'Paga') c.pago += r.valor_kz;
      else if (r.ST_PARCELA === 'Não paga') c.np += r.valor_kz;
      else c.inc += r.valor_kz;
    });
    let mx = 0;
    cell.forEach((c) => { const v = c.pago + c.inc; if (v) mx = Math.max(mx, c.inc / v); });
    return { cell, mx };
  }, [rows, f.assoc]);
  const m = { t: 4, r: 4, b: 22, l: 40 };
  const cw = Math.max(1, (W - m.l - m.r) / xs.length);
  const ch = Math.max(18, Math.min(32, cw));
  const H = m.t + m.b + ys.length * ch;
  return (
    <Card id="mapa" title="Mapa de incumprimento" icon={<Ic.grid />} note="Linhas: ano do contrato. Colunas: nº da parcela. Cor mais forte = maior % do valor vencido em atraso ou cobrança.">
      <div className="scale"><span>0%</span><span className="ramp" /><span>{pct(mx)}</span></div>
      <div className="chart" ref={ref} style={{ minHeight: 200 }}>
        {W > 0 && (
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            {ys.map((y, j) => (
              <g key={y}>
                <text x={m.l - 6} y={m.t + j * ch + ch / 2 + 4} textAnchor="end" className="tick">{y}</text>
                {xs.map((x, i) => {
                  const c = cell.get(`${y}|${x}`);
                  const venc = c ? c.pago + c.inc : 0;
                  const rate = venc ? c!.inc / venc : null;
                  return (
                    <rect
                      key={x}
                      x={m.l + i * cw + 1} y={m.t + j * ch + 1} width={Math.max(0, cw - 2)} height={ch - 2} rx={3}
                      fill={rate === null ? 'transparent' : 'var(--c-atrasada)'}
                      fillOpacity={rate === null ? 0 : 0.06 + 0.94 * (mx ? rate / mx : 0)}
                      stroke={rate === null ? 'var(--border)' : 'none'}
                      strokeDasharray={rate === null && c ? '2 2' : undefined}
                      onMouseMove={(ev) =>
                        show(ev, `Contratos ${y} · parcela ${x}`, c
                          ? [
                              { color: 'var(--c-atrasada)', label: 'Incumprimento', value: rate === null ? 'ainda não vencida' : pct(rate) },
                              { label: 'Em risco', value: `${kz(c.inc)} Kz` },
                              { label: 'Pago', value: `${kz(c.pago)} Kz` },
                              { label: 'Por vencer', value: `${kz(c.np)} Kz` },
                            ]
                          : [{ label: 'Sem parcelas' }])
                      }
                      onMouseLeave={hide}
                    />
                  );
                })}
              </g>
            ))}
            {xs.map((x, i) => (cw > 16 || x % 3 === 1) && (
              <text key={x} x={m.l + i * cw + cw / 2} y={H - 6} textAnchor="middle" className="tick">{x}</text>
            ))}
          </svg>
        )}
        <Tooltip tip={tip} boxWidth={W} />
      </div>
    </Card>
  );
}

/* ---------- Top 10 contratos em risco ---------- */
export function TopRisk({ contratos }: { contratos: ContratoRow[] }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const { tip, show, hide } = useTooltip(ref);
  const rows = contratos.filter((c) => c.em_risco_kz > 0).sort((a, b) => b.em_risco_kz - a.em_risco_kz).slice(0, 10);
  const rh = 28;
  const H = rows.length * rh + 4;
  const lw = Math.min(190, W * 0.45);
  const x = d3.scaleLinear([0, rows[0]?.em_risco_kz ?? 1], [0, Math.max(20, W - lw - 64)]);
  const cut = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1) + '…' : s);
  const maxChars = Math.floor(lw / 7);
  return (
    <Card id="top" title="Contratos com mais valor em risco" icon={<Ic.bars />} note="Top 10 por Atrasada + Cobrança, na associação e ano do filtro.">
      <div className="chart" ref={ref} style={{ minHeight: 280 }}>
        {!rows.length && <p className="note">Sem valor em risco neste filtro.</p>}
        {W > 0 && rows.length > 0 && (
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            {rows.map((d, i) => (
              <g key={d.NU_CONTRATO} transform={`translate(0,${i * rh})`}>
                <text x={0} y={rh / 2 + 4} className="lbl">{cut(d.NO_PESSOA, maxChars)}</text>
                <rect
                  x={lw} y={6} height={rh - 12} rx={4} width={Math.max(3, x(d.em_risco_kz))} fill="var(--c-atrasada)"
                  onMouseMove={(ev) => show(ev, `${d.NO_PESSOA} · ${d.NU_CONTRATO}`, [
                    { label: assocCurto(d.ASSOCIACAO) },
                    { color: 'var(--c-atrasada)', label: 'Atrasada', value: `${kz(d.v_atrasada)} Kz` },
                    { color: 'var(--c-cobranca)', label: 'Cobrança', value: `${kz(d.v_cobranca)} Kz` },
                  ])}
                  onMouseLeave={hide}
                />
                <text x={lw + Math.max(3, x(d.em_risco_kz)) + 6} y={rh / 2 + 4} className="tick">{kz(d.em_risco_kz)}</text>
              </g>
            ))}
          </svg>
        )}
        <Tooltip tip={tip} boxWidth={W} />
      </div>
    </Card>
  );
}

/* ---------- Barras empilhadas por ano do contrato ---------- */
export function ByYear({ rows, f, anos }: { rows: ResumoRow[]; f: Filtros; anos: string[] }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const { tip, show, hide } = useTooltip(ref);
  const est = f.estados;
  const H = 250;
  const m = { t: 10, r: 8, b: 26, l: 72 };
  const tab = anos.map((c) => {
    const o: Record<string, number | string> = { c };
    est.forEach((e) => (o[e] = 0));
    return o;
  });
  rows.filter((r) => !f.assoc || r.ASSOCIACAO === f.assoc).forEach((r) => {
    const i = anos.indexOf(r.ANO_CONTRATO);
    if (i >= 0 && est.includes(r.ST_PARCELA)) (tab[i][r.ST_PARCELA] as number) += r.valor_kz;
  });
  const st = d3.stack<Record<string, number | string>>().keys(est)(tab);
  const x = d3.scaleBand(anos, [m.l, W - m.r]).padding(0.3);
  const y = d3.scaleLinear([0, (st.length ? d3.max(st[st.length - 1], (p) => p[1]) : 0) || 1], [H - m.b, m.t]).nice();
  const bw = Math.min(36, x.bandwidth());
  return (
    <Card id="por-ano" title="Valor por ano do contrato" icon={<Ic.cal />} note="Estados seleccionados, associação do filtro.">
      <Legend estados={est} />
      <div className="chart" ref={ref}>
        {W > 0 && (
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            <YAxis y={y} x0={m.l} x1={W - m.r} fmt={kz} />
            {anos.map((a) => (
              <text key={a} x={(x(a) ?? 0) + x.bandwidth() / 2} y={H - 8} textAnchor="middle" className="tick">{a}</text>
            ))}
            {st.map((s, si) => (
              <g key={s.key} fill={ESTADO_COR[s.key as Estado]}>
                {s.map((p) => (
                  <rect
                    key={String(p.data.c)}
                    x={(x(String(p.data.c)) ?? 0) + (x.bandwidth() - bw) / 2} width={bw}
                    y={y(p[1])} height={Math.max(0, y(p[0]) - y(p[1]) - 1)} rx={si === st.length - 1 ? 5 : 1}
                    onMouseMove={(ev) => {
                      const tot = d3.sum(est, (k) => p.data[k] as number);
                      show(ev, `${p.data.c} · ${kz(tot)} Kz`, est.filter((k) => p.data[k]).map((k) => ({ color: ESTADO_COR[k], label: k, value: `${kz(p.data[k] as number)} Kz (${pct((p.data[k] as number) / tot)})` })));
                    }}
                    onMouseLeave={hide}
                  />
                ))}
              </g>
            ))}
          </svg>
        )}
        <Tooltip tip={tip} boxWidth={W} />
      </div>
    </Card>
  );
}

/* ---------- Área empilhada por nº da parcela ---------- */
export function Lifecycle({ scope, f }: { scope: ResumoRow[]; f: Filtros }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const { tip, show, hide } = useTooltip(ref);
  const est = f.estados;
  const H = 250;
  const m = { t: 10, r: 10, b: 26, l: 72 };
  const xs = d3.range(1, 25);
  const tab = xs.map((c) => {
    const o: Record<string, number> = { c };
    est.forEach((e) => (o[e] = 0));
    return o;
  });
  scope.forEach((r) => {
    const o = tab[r.NU_PARCELA - 1];
    if (o && est.includes(r.ST_PARCELA)) o[r.ST_PARCELA] += r.valor_kz;
  });
  const st = d3.stack<Record<string, number>>().keys(est)(tab);
  const x = d3.scaleLinear([1, 24], [m.l, W - m.r]);
  const y = d3.scaleLinear([0, (st.length ? d3.max(st[st.length - 1], (p) => p[1]) : 0) || 1], [H - m.b, m.t]).nice();
  const area = d3.area<d3.SeriesPoint<Record<string, number>>>().x((_, i) => x(i + 1)).y0((p) => y(p[0])).y1((p) => y(p[1]));
  const hover = tip ? Math.max(1, Math.min(24, Math.round(x.invert(tip.x)))) : null;
  return (
    <Card id="ciclo" title="Ciclo de vida do contrato" icon={<Ic.trend />} note="Valor por nº da parcela (1 a 24), empilhado por estado.">
      <Legend estados={est} />
      <div className="chart" ref={ref}>
        {W > 0 && (
          <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
            <YAxis y={y} x0={m.l} x1={W - m.r} fmt={kz} />
            {x.ticks(W < 420 ? 6 : 12).map((t) => (
              <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className="tick">{t}</text>
            ))}
            {st.map((s) => (
              <path key={s.key} d={area(s) ?? ''} fill={ESTADO_COR[s.key as Estado]} fillOpacity={0.82} stroke="var(--panel)" />
            ))}
            {hover && <line x1={x(hover)} x2={x(hover)} y1={m.t} y2={H - m.b} stroke="var(--ref)" strokeDasharray="3 3" />}
            <rect
              x={m.l} y={m.t} width={Math.max(0, W - m.l - m.r)} height={H - m.t - m.b} fill="transparent"
              onMouseMove={(ev) => {
                const box = ref.current!.getBoundingClientRect();
                const i = Math.max(1, Math.min(24, Math.round(x.invert(ev.clientX - box.left))));
                const o = tab[i - 1];
                const tot = d3.sum(est, (k) => o[k]);
                show(ev, `Parcela ${i} · ${kz(tot)} Kz`, [...est].reverse().filter((k) => o[k]).map((k) => ({ color: ESTADO_COR[k], label: k, value: `${kz(o[k])} Kz` })));
              }}
              onMouseLeave={hide}
            />
          </svg>
        )}
        <Tooltip tip={tip} boxWidth={W} />
      </div>
    </Card>
  );
}

export { ESTADOS };
