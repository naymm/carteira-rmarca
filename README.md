# Dashboard — Carteira de Crédito RMARCA

Dashboard em React + TypeScript + d3, gerado a partir de `CARTEIRA DE CRÉDITO.xls`
(40.938 parcelas, 1.953 contratos).

## Como correr

```bash
npm install
npm run dev        # abre em http://localhost:5173
npm run build      # gera a versão final em dist/
npm run preview    # serve a pasta dist/ localmente
```

Requer Node.js 18 ou superior.

## O que tem

- **Filtros**: estado da parcela (Paga, Não paga, Atrasada, Cobrança), associação e ano do contrato. Os cartões por estado, o anel e o treemap também filtram ao clicar.
- **Tema**: Sistema / Claro / Escuro (fica guardado no browser).
- **Destaque**: valor seleccionado, nº de parcelas, contratos, valor médio e anel por estado.
- **Impactos**: taxa de incumprimento, taxa de cobrança, valor em risco, por vencer, em aberto e contratos em incumprimento.
- **Gráficos**: treemap associação × estado, mapa de calor ano × nº da parcela, top 10 contratos em risco, valor por ano do contrato e ciclo de vida (valor por nº da parcela).
- **Tabela de contratos** com pesquisa e ordenação.

## Dados

Os dados estão em `public/data/`:

| Ficheiro | Conteúdo |
|---|---|
| `resumo_parcelas.csv` | Parcelas agregadas por associação, ano do contrato, nº da parcela e estado (nº de parcelas, valor, contratos). |
| `contratos.csv` | Um registo por contrato, com nº e valor de parcelas por estado. |

Para actualizar, substitua estes dois ficheiros mantendo as mesmas colunas.
A leitura está em `src/lib/data.ts` (`loadData`). Para ligar a uma API ou ao
Supabase/Fineract, basta trocar essa função para devolver os mesmos tipos
(`ResumoRow[]` e `ContratoRow[]`).

## Pressupostos

- "Não paga" = parcela ainda por vencer; "Atrasada" + "Cobrança" = incumprimento.
- Taxa de incumprimento = (Atrasada + Cobrança) ÷ (Paga + Atrasada + Cobrança), em valor.
- Ano do contrato = últimos 4 dígitos do nº do contrato; contratos antigos com nº curto aparecem como "Sem ano".

## Estrutura

```
src/
  App.tsx                 composição da página e filtros
  styles.css              tokens de cor (claro/escuro) e estilos
  lib/data.ts             tipos, carregamento CSV, formatação, cálculos de impacto
  lib/hooks.tsx           useWidth, tooltip, tema, Card
  components/
    Header.tsx            selector de tema e barra de filtros
    Hero.tsx              destaque + anel por estado
    StateCards.tsx        cartões por estado
    Impact.tsx            medidores e indicadores de impacto
    Charts.tsx            treemap, mapa de calor, top 10, barras por ano, ciclo de vida
    ContractsTable.tsx    tabela de contratos
```

> Atenção: `public/data/contratos.csv` contém nomes de clientes. Não publique o
> projecto num repositório ou servidor público sem proteger o acesso.
