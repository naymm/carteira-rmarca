import * as d3 from 'd3';

export const ESTADOS = ['Paga', 'Não paga', 'Atrasada', 'Cobrança'] as const;
export type Estado = (typeof ESTADOS)[number];

export const ESTADO_KEY: Record<Estado, 'paga' | 'nao_paga' | 'atrasada' | 'cobranca'> = {
  Paga: 'paga',
  'Não paga': 'nao_paga',
  Atrasada: 'atrasada',
  Cobrança: 'cobranca',
};

export const ESTADO_COR: Record<Estado, string> = {
  Paga: 'var(--c-paga)',
  'Não paga': 'var(--c-naopaga)',
  Atrasada: 'var(--c-atrasada)',
  Cobrança: 'var(--c-cobranca)',
};

export const ASSOC_CURTO: Record<string, string> = {
  'Comando Geral Da Policia Nacional': 'Polícia Nacional',
  'Jupiter Desenvolvimento Informático Lda': 'Jupiter',
  'Clientes individuais': 'Individuais',
};
export const assocCurto = (a: string) => ASSOC_CURTO[a] ?? a;

/** Uma linha agregada: associação × ano do contrato × nº parcela × estado. */
export interface ResumoRow {
  ASSOCIACAO: string;
  ANO_CONTRATO: string;
  NU_PARCELA: number;
  ST_PARCELA: Estado;
  parcelas: number;
  valor_kz: number;
  contratos: number;
}

/** Um contrato com nº e valor de parcelas por estado. */
export interface ContratoRow {
  NU_CONTRATO: string;
  NO_PESSOA: string;
  ASSOCIACAO: string;
  ANO_CONTRATO: string;
  n_parcelas: number;
  valor_total: number;
  n_paga: number;
  v_paga: number;
  n_atrasada: number;
  v_atrasada: number;
  n_cobranca: number;
  v_cobranca: number;
  n_nao_paga: number;
  v_nao_paga: number;
  /** Atrasada + Cobrança */
  em_risco_kz: number;
  /** em risco + Não paga */
  em_aberto_kz: number;
}

const n = (x: unknown) => Number(x) || 0;

export async function loadData(base = '/data') {
  const [resumo, contratos] = await Promise.all([
    d3.csv(`${base}/resumo_parcelas.csv`, (r): ResumoRow => ({
      ASSOCIACAO: r.ASSOCIACAO!,
      ANO_CONTRATO: String(r.ANO_CONTRATO),
      NU_PARCELA: n(r.NU_PARCELA),
      ST_PARCELA: r.ST_PARCELA as Estado,
      parcelas: n(r.parcelas),
      valor_kz: n(r.valor_kz),
      contratos: n(r.contratos),
    })),
    d3.csv(`${base}/contratos.csv`, (r): ContratoRow => {
      const risco = n(r.v_atrasada) + n(r.v_cobranca);
      return {
        NU_CONTRATO: String(r.NU_CONTRATO),
        NO_PESSOA: r.NO_PESSOA!,
        ASSOCIACAO: r.ASSOCIACAO!,
        ANO_CONTRATO: String(r.ANO_CONTRATO),
        n_parcelas: n(r.n_parcelas),
        valor_total: n(r.valor_total),
        n_paga: n(r.n_paga),
        v_paga: n(r.v_paga),
        n_atrasada: n(r.n_atrasada),
        v_atrasada: n(r.v_atrasada),
        n_cobranca: n(r.n_cobranca),
        v_cobranca: n(r.v_cobranca),
        n_nao_paga: n(r.n_nao_paga),
        v_nao_paga: n(r.v_nao_paga),
        em_risco_kz: risco,
        em_aberto_kz: risco + n(r.v_nao_paga),
      };
    }),
  ]);
  return { resumo, contratos };
}

export interface Filtros {
  estados: Estado[];
  assoc: string; // '' = todas
  ano: string; // '' = todos
}

export const FILTROS_INICIAIS: Filtros = { estados: [...ESTADOS], assoc: '', ano: '' };

export const noAmbito = (f: Filtros) => (r: { ASSOCIACAO: string; ANO_CONTRATO: string }) =>
  (!f.assoc || r.ASSOCIACAO === f.assoc) && (!f.ano || r.ANO_CONTRATO === f.ano);

/* ---------- formatação (pt-AO) ---------- */
export const pt = (v: number, d = 0) =>
  Number(v).toLocaleString('pt-PT', { minimumFractionDigits: d, maximumFractionDigits: d });

export const kz = (v: number) => {
  const a = Math.abs(v);
  const s = v < 0 ? '−' : '';
  if (a >= 1e9) return `${s}${pt(a / 1e9, 2)} mil M`;
  if (a >= 1e6) return `${s}${pt(a / 1e6, 1)} M`;
  if (a >= 1e3) return `${s}${pt(a / 1e3, 0)} mil`;
  return s + pt(a, 0);
};

export const pct = (v: number) => (Number.isFinite(v) ? `${pt(v * 100, 1)}%` : '—');

/** Indicadores de impacto para um conjunto de linhas (todos os estados). */
export function impactos(rows: ResumoRow[]) {
  const v = (e: Estado) => d3.sum(rows.filter((r) => r.ST_PARCELA === e), (r) => r.valor_kz);
  const pago = v('Paga');
  const atrasada = v('Atrasada');
  const cobranca = v('Cobrança');
  const porVencer = v('Não paga');
  const vencido = pago + atrasada + cobranca;
  const risco = atrasada + cobranca;
  return {
    pago,
    atrasada,
    cobranca,
    porVencer,
    vencido,
    risco,
    aberto: risco + porVencer,
    total: vencido + porVencer,
    taxaIncumprimento: vencido ? risco / vencido : NaN,
    taxaCobranca: vencido ? pago / vencido : NaN,
  };
}
