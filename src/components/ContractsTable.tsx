import { useMemo, useState } from 'react';
import { ESTADOS, ESTADO_COR, ESTADO_KEY, assocCurto, pt, type ContratoRow } from '../lib/data';
import { Card } from '../lib/hooks';
import { Ic } from './Icons';

type SortKey = 'NU_CONTRATO' | 'NO_PESSOA' | 'ASSOCIACAO' | 'n_parcelas' | 'n_atrasada' | 'n_cobranca' | 'em_risco_kz' | 'em_aberto_kz';
const TEXT_KEYS: SortKey[] = ['NO_PESSOA', 'ASSOCIACAO'];
const LIMITE = 500;

const iniciais = (nome: string) => {
  const p = nome.split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
};

export function ContractsTable({ rows }: { rows: ContratoRow[] }) {
  const [q, setQ] = useState('');
  const [sortK, setSortK] = useState<SortKey>('em_risco_kz');
  const [dir, setDir] = useState(-1);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = rows.filter((r) => !s || `${r.NO_PESSOA} ${r.NU_CONTRATO}`.toLowerCase().includes(s));
    return out.sort((a, b) => {
      if (TEXT_KEYS.includes(sortK)) return String(a[sortK]).localeCompare(String(b[sortK]), 'pt') * dir;
      return (Number(a[sortK]) - Number(b[sortK])) * dir;
    });
  }, [rows, q, sortK, dir]);

  const th = (k: SortKey, label: string, cls = '') => (
    <th className={cls} aria-sort={sortK === k ? (dir < 0 ? 'descending' : 'ascending') : 'none'}>
      <button
        type="button"
        onClick={() => {
          if (sortK === k) setDir(-dir);
          else {
            setSortK(k);
            setDir(TEXT_KEYS.includes(k) || k === 'NU_CONTRATO' ? 1 : -1);
          }
        }}
      >
        {label}
      </button>
    </th>
  );

  return (
    <Card id="contratos" title="Contratos" icon={<Ic.doc />} note="Contratos com pelo menos uma parcela nos estados seleccionados.">
      <div className="tools">
        <input type="search" placeholder="Procurar cliente ou contrato" aria-label="Procurar cliente ou contrato" value={q} onChange={(e) => setQ(e.target.value)} />
        <span>{pt(list.length)} contratos</span>
      </div>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              {th('NU_CONTRATO', 'Contrato')}
              {th('NO_PESSOA', 'Cliente')}
              {th('ASSOCIACAO', 'Associação', 'hide-sm')}
              {th('n_parcelas', 'Parcelas', 'n')}
              {th('n_atrasada', 'Atras.', 'n')}
              {th('n_cobranca', 'Cobr.', 'n')}
              {th('em_risco_kz', 'Em risco (Kz)', 'n')}
              {th('em_aberto_kz', 'Em aberto (Kz)', 'n hide-sm')}
              <th className="hide-sm">Composição</th>
            </tr>
          </thead>
          <tbody>
            {list.slice(0, LIMITE).map((r) => (
              <tr key={r.NU_CONTRATO}>
                <td>{r.NU_CONTRATO}</td>
                <td><span className="who"><span className="av">{iniciais(r.NO_PESSOA)}</span>{r.NO_PESSOA}</span></td>
                <td className="hide-sm">{assocCurto(r.ASSOCIACAO)}</td>
                <td className="n">{pt(r.n_parcelas)}</td>
                <td className="n">{r.n_atrasada ? pt(r.n_atrasada) : '—'}</td>
                <td className="n">{r.n_cobranca ? pt(r.n_cobranca) : '—'}</td>
                <td className="n" style={r.em_risco_kz ? { color: 'var(--bad)' } : undefined}>{r.em_risco_kz ? pt(r.em_risco_kz, 2) : '—'}</td>
                <td className="n hide-sm">{pt(r.em_aberto_kz, 2)}</td>
                <td className="hide-sm">
                  <span className="stackbar">
                    {ESTADOS.map((e) => {
                      const n = r[`n_${ESTADO_KEY[e]}` as const];
                      return n ? <span key={e} style={{ width: `${(100 * n) / (r.n_parcelas || 1)}%`, background: ESTADO_COR[e] }} /> : null;
                    })}
                  </span>
                </td>
              </tr>
            ))}
            {list.length > LIMITE && (
              <tr><td colSpan={9} className="muted">A mostrar {LIMITE} de {pt(list.length)}. Use a pesquisa ou os filtros para ver os restantes.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
