import { ESTADOS, ESTADO_COR, assocCurto, type Estado, type Filtros } from '../lib/data';
import type { Tema } from '../lib/hooks';
import { Ic } from './Icons';

export function ThemeToggle({ tema, onChange }: { tema: Tema; onChange: (t: Tema) => void }) {
  const opts: [Tema, string, () => JSX.Element][] = [
    ['system', 'Sistema', Ic.monitor],
    ['light', 'Claro', Ic.sun],
    ['dark', 'Escuro', Ic.moon],
  ];
  return (
    <div className="theme" role="group" aria-label="Tema">
      {opts.map(([t, label, Icon]) => (
        <button key={t} type="button" aria-pressed={tema === t} onClick={() => onChange(t)}>
          <Icon />
          {label}
        </button>
      ))}
    </div>
  );
}

export function FilterBar({ f, setF, assocs, anos }: { f: Filtros; setF: (f: Filtros) => void; assocs: string[]; anos: string[] }) {
  const toggle = (e: Estado) => {
    const s = new Set(f.estados);
    s.has(e) ? s.delete(e) : s.add(e);
    setF({ ...f, estados: ESTADOS.filter((x) => s.has(x)) });
  };
  return (
    <div className="filters" role="group" aria-label="Filtros">
      <div className="grp">
        <span className="lbl">Estado</span>
        {ESTADOS.map((e) => (
          <button key={e} type="button" className="chip" aria-pressed={f.estados.includes(e)} onClick={() => toggle(e)}>
            <i style={{ background: ESTADO_COR[e] }} />
            {e}
          </button>
        ))}
      </div>
      <div className="grp">
        <label className="lbl" htmlFor="f-assoc">Associação</label>
        <select id="f-assoc" value={f.assoc} onChange={(ev) => setF({ ...f, assoc: ev.target.value })}>
          <option value="">Todas</option>
          {assocs.map((a) => (
            <option key={a} value={a}>{assocCurto(a)}</option>
          ))}
        </select>
      </div>
      <div className="grp">
        <label className="lbl" htmlFor="f-ano">Ano</label>
        <select id="f-ano" value={f.ano} onChange={(ev) => setF({ ...f, ano: ev.target.value })}>
          <option value="">Todos</option>
          {anos.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <button type="button" className="reset" onClick={() => setF({ estados: [...ESTADOS], assoc: '', ano: '' })}>
        <Ic.reset />
        Limpar
      </button>
    </div>
  );
}
