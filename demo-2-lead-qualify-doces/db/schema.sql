-- Demo 2 · Qualificação de lead de doces — schema Neon (Postgres)
-- Purpose: DDL da tabela `leads_doces` que o nó "Save Lead to Neon" grava; fonte de verdade do
-- schema do Demo 2, versionada para o setup do workflow. NÃO aplicado ainda (alterar banco = gated).
--
-- Neon PostgreSQL · branch production
-- Aplicar quando o Luiz autorizar (via Neon CLI/MCP), 1x. Sem dados de teste aqui.
--
-- Nota de tipos: data_evento é TEXT (não DATE) de propósito — o chat pode mandar
-- "semana que vem", "dia 18/10", "sábado". O motor não deve quebrar por parse de data.
-- score é nullable: o fallback de blindagem (tier 'review') grava score NULL.

CREATE TABLE IF NOT EXISTS leads_doces (
  id           BIGSERIAL PRIMARY KEY,
  nome         TEXT,
  contato      TEXT,
  tipo         TEXT,
  quantidade   TEXT,
  data_evento  TEXT,
  tema         TEXT,
  retirada     TEXT,
  mensagem     TEXT,
  score        INTEGER,
  tier         TEXT,          -- hot | warm | cold | review
  reasoning    TEXT,
  resumo       TEXT,
  tem_imagem   BOOLEAN NOT NULL DEFAULT FALSE,
  notified_at  TIMESTAMPTZ,
  criado_em    TIMESTAMPTZ DEFAULT now()
);

-- Painel da dona: leads ordenados por score desc, quentes no topo.
CREATE INDEX IF NOT EXISTS idx_leads_doces_score ON leads_doces (score DESC NULLS LAST, criado_em DESC);
