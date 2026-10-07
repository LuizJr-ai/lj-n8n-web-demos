-- Demo 2 · Qualificação de lead de doces — schema Neon (Postgres)
-- Purpose: DDL da tabela `leads_doces` que o nó "Save Lead to Neon" grava. Rode uma vez no seu
-- Postgres antes de usar os workflows. Sem dados de teste aqui.
--
-- Nota de tipos: data_evento é TEXT (não DATE) de propósito — o chat pode mandar
-- "semana que vem", "dia 18/10", "sábado". O motor não deve quebrar por parse de data.
-- score é nullable: o fallback de blindagem (tier 'review') grava score NULL.

CREATE TABLE IF NOT EXISTS leads_doces (
  id           BIGSERIAL PRIMARY KEY,
  -- Marca da conversa que originou o pedido. Uma conversa = um pedido: se o cliente voltar ao
  -- chat, o fluxo atualiza esta linha em vez de criar outra, e o aviso ao dono nao repete.
  -- Fica NULL quando o pedido vem do formulario do site (ali cada envio e um pedido novo).
  sessao       TEXT,
  -- Lista de-para do que mudou na ultima alteracao deste pedido, em linguagem de gente.
  -- A dona pode ja ter o pedido na linha de producao: trocar sabor, quantidade, data ou local
  -- muda o trabalho dela. Volta a NULL quando a gravacao seguinte nao encontra mudanca.
  alteracoes   TEXT,
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
-- Uma conversa so pode ter um pedido. NULL nao conflita, logo o formulario do site segue livre.
CREATE UNIQUE INDEX IF NOT EXISTS leads_doces_sessao_key ON leads_doces (sessao);

CREATE INDEX IF NOT EXISTS idx_leads_doces_score ON leads_doces (score DESC NULLS LAST, criado_em DESC);
