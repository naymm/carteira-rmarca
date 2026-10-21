import { useEffect, useMemo, useState } from 'react';
import { ESTADOS, FILTROS_INICIAIS, ESTADO_KEY, assocCurto, impactos, kz, loadData, noAmbito, pct, type ContratoRow, type Estado, type Filtros, type ResumoRow } from './lib/data';
import { useTema } from './lib/hooks';
import { FilterBar, ThemeToggle } from './components/Header';
import { Hero } from './components/Hero';
import { StateCards } from './components/StateCards';
import { Impact } from './components/Impact';
import { ByYear, Heatmap, Lifecycle, TopRisk, Treemap } from './components/Charts';
import { ContractsTable } from './components/ContractsTable';

export default function App() {
  const [tema, setTema] = useTema();
  const [data, setData] = useState<{ resumo: ResumoRow[]; contratos: ContratoRow[] } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [f, setF] = useState<Filtros>(FILTROS_INICIAIS);

  useEffect(() => {
    loadData().then(setData).catch((e) => setErro(String(e)));
  }, []);

  const derived = useMemo(() => {
    if (!data) return null;
    const assocs = [...new Set(data.resumo.map((r) => r.ASSOCIACAO))].sort();
    const anos = [...new Set(data.resumo.map((r) => r.ANO_CONTRATO))].sort();
    const scope = data.resumo.filter(noAmbito(f));
    const ctAll = data.contratos.filter(noAmbito(f));
    const ctSel = ctAll.filter((c) => f.estados.some((e) => c[`n_${ESTADO_KEY[e]}` as const] > 0));
    return { assocs, anos, scope, ctAll, ctSel };
  }, [data, f]);

  const toggle = (e: Estado) => {
    const s = new Set(f.estados);
    s.has(e) ? s.delete(e) : s.add(e);
    setF({ ...f, estados: ESTADOS.filter((x) => s.has(x)) });
  };
  const solo = (e: Estado) => setF({ ...f, estados: f.estados.length === 1 && f.estados[0] === e ? [...ESTADOS] : [e] });

  return (
    <main className="app">
      <header className="top">
        <div>
          <div className="eyebrow">RMARCA · Carteira de crédito</div>
          <h1>Saúde da carteira</h1>
        </div>
        <ThemeToggle tema={tema} onChange={setTema} />
      </header>

      {erro && <p className="error">Não foi possível carregar os dados: {erro}</p>}
      {!data && !erro && <p className="muted">A carregar…</p>}

      {data && derived && (
        <>
          <FilterBar f={f} setF={setF} assocs={derived.assocs} anos={derived.anos} />
          {(() => {
            const m = impactos(derived.scope);
            const scopeName = [f.assoc ? assocCurto(f.assoc) : 'Toda a carteira', f.ano ? `contratos de ${f.ano}` : ''].filter(Boolean).join(' · ');
            const resumo = `${pct(m.taxaCobranca)} do valor já vencido foi pago. ${kz(m.risco)} Kz (${pct(m.taxaIncumprimento)}) estão em atraso ou cobrança e ${kz(m.porVencer)} Kz ainda estão por vencer.`;
            return <Hero scope={derived.scope} f={f} onSolo={solo} scopeName={scopeName} nContratos={derived.ctSel.length} resumo={resumo} />;
          })()}
          <StateCards scope={derived.scope} f={f} onToggle={toggle} />
          <div className="grid">
            <Impact scope={derived.scope} contratos={derived.ctAll} />
            <Treemap rows={data.resumo} f={f} assocs={derived.assocs} onSolo={solo} />
          </div>
          <div className="grid">
            <Heatmap rows={data.resumo} f={f} anos={derived.anos} />
            <TopRisk contratos={derived.ctAll} />
          </div>
          <div className="grid">
            <ByYear rows={data.resumo} f={f} anos={derived.anos} />
            <Lifecycle scope={derived.scope} f={f} />
          </div>
          <ContractsTable rows={derived.ctSel} />
          <footer className="muted foot">
            Fonte: CARTEIRA DE CRÉDITO.xls (40.938 parcelas, 1.953 contratos). "Não paga" é tratada como parcela por vencer; "Atrasada" + "Cobrança" como incumprimento. Ano do contrato = últimos 4 dígitos do nº do contrato.
          </footer>
        </>
      )}
    </main>
  );
}
