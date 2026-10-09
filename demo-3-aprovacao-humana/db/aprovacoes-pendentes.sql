-- Purpose: queue of replies waiting for a human decision, and the decision log, for Demo 3
-- (human approval in the loop). Run once on your Postgres database before the first message.

CREATE TABLE IF NOT EXISTS aprovacoes_pendentes (
  id                BIGSERIAL PRIMARY KEY,

  -- entrada — espelha o corpo do webhook.
  -- `remetente` chega como OBJETO {nome, email}, não como texto: por isso duas colunas.
  origem            TEXT        NOT NULL,          -- body.origem
  remetente_nome    TEXT        NOT NULL,          -- body.remetente.nome
  remetente_email   TEXT        NOT NULL,          -- body.remetente.email
  mensagem_cliente  TEXT        NOT NULL,          -- body.mensagem
  recebido_em       TIMESTAMPTZ,                   -- body.recebido_em (hora do cliente, não do n8n)

  -- identificador do ENVIO, criado pela tela e repetido em cada tentativa do mesmo envio.
  -- É ele que impede que um clique duplo, ou um reenvio após resposta perdida, vire dois
  -- casos na fila do atendente. Fica nulo nas linhas anteriores a esta coluna.
  request_id        TEXT,                          -- body.request_id

  -- o que a IA produziu
  assunto           TEXT,
  urgencia          SMALLINT    CHECK (urgencia BETWEEN 1 AND 3),   -- 1 baixa · 2 média · 3 alta
  resumo            TEXT,        -- summary validado do classificador
  rascunho_ia       TEXT,

  -- a espera — o endereço de retomada é credencial: nunca sai do servidor
  resume_url        TEXT,
  prazo_aviso       TIMESTAMPTZ,                   -- a partir de quando o vigia reclama

  -- a decisão humana
  status            TEXT        NOT NULL DEFAULT 'pendente'
                    CHECK (status IN ('pendente','aprovado','ajustado','recusado','expirado')),
  texto_final       TEXT,                          -- o que de fato foi enviado
  motivo_recusa     TEXT,
  decidido_por      TEXT,
  decidido_em       TIMESTAMPTZ,
  houve_correcao    BOOLEAN,                       -- a pessoa mexeu no texto da IA?

  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- a consulta da Página 1 e a do vigia: pendentes, mais urgente e mais antigo primeiro
CREATE INDEX IF NOT EXISTS idx_aprovacoes_fila
  ON aprovacoes_pendentes (status, urgencia DESC, criado_em)
  WHERE status = 'pendente';

-- um envio = um caso. O índice é PARCIAL de propósito: linhas antigas, sem request_id,
-- continuam válidas (em Postgres vários NULL não colidem num índice único, mas o WHERE
-- deixa a intenção explícita para quem ler o esquema depois).
CREATE UNIQUE INDEX IF NOT EXISTS aprovacoes_pendentes_request_id_key
  ON aprovacoes_pendentes (request_id)
  WHERE request_id IS NOT NULL;

-- coerência: item fechado tem quem decidiu e quando; item pendente não tem
ALTER TABLE aprovacoes_pendentes
  DROP CONSTRAINT IF EXISTS chk_decisao_completa;
ALTER TABLE aprovacoes_pendentes
  ADD CONSTRAINT chk_decisao_completa CHECK (
    (status = 'pendente'  AND decidido_em IS NULL AND decidido_por IS NULL)
    OR
    (status <> 'pendente' AND decidido_em IS NOT NULL AND decidido_por IS NOT NULL)
  );

-- recusa sem motivo não fecha
ALTER TABLE aprovacoes_pendentes
  DROP CONSTRAINT IF EXISTS chk_recusa_tem_motivo;
ALTER TABLE aprovacoes_pendentes
  ADD CONSTRAINT chk_recusa_tem_motivo CHECK (
    status <> 'recusado' OR (motivo_recusa IS NOT NULL AND length(trim(motivo_recusa)) > 0)
  );
