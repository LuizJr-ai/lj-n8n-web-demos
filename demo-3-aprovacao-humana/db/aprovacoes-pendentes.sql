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
