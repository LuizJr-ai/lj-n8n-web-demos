# DEMO1-FLUXO — Demo 1: captura de áudio ao vivo → resumo acionável

Purpose: memória durável do fluxo do Demo 1, aprovado na sessão 04. Fonte de verdade do desenho
(entrada/saída, nodes, decisões e ressalvas) antes do build. Diagrama visual: `demo1-fluxo.svg`.

## Conceito
O app tem **dois modos de entrada**: (A) gravar a reunião **ao vivo** (presencial, microfone) e
(B) **anexar um arquivo** de áudio (clicar ou arrastar). Ambos passam pela transcrição (Whisper);
um **Switch por `mode`** divide depois: reunião → resumo+decisões+ações+insight (grava no Neon); arquivo → transcrição
na íntegra (sem LLM, sem gravar). Um só webhook para os dois.

## Decisões travadas (sessão 04)
1. **Modo A (reunião):** captura presencial via **microfone** (MediaRecorder → webm/opus). Reunião online = evolução.
2. **Modo B (arquivo):** upload por clique ou **drag & drop**; retorna a **transcrição na íntegra** num campo de texto.
3. **Divisão do fluxo:** o app envia `mode` (`reuniao`|`arquivo`); um **Switch após o Whisper** roteia. Resultados distintos.
4. **Saída reunião:** status/resumo + decisões + ações + insight (+ `id`). **Saída arquivo:** texto completo.
5. **Transcrição completa (só reunião):** botão "Baixar transcrição completa" → 2º webhook busca por `id` no Neon.
6. **Persistência:** modo **reunião** grava transcrição+resumo no Neon (só texto); modo **arquivo** não grava (retorna direto).
7. **Áudio:** o app guarda **cópia local**; o Neon nunca guarda binário de áudio.

## Fluxo A — começo compartilhado + 2 corredores
| # | Node | Função | Entra | Sai |
|---|------|--------|-------|-----|
| — | APP (front) | modo A grava ao vivo / modo B anexa arquivo | voz ou arquivo | POST áudio + `mode` |
| 1 | Webhook | porta de entrada | HTTP + áudio + `mode` | binário + mode |
| 2 | Validação (IF) | tem áudio? ≤25MB? formato ok? | binário | segue ou erro (R5) |
| 3 | Groq Whisper (HTTP) | áudio → texto (comum aos 2 modos) | áudio | texto |
| — | **Switch (`mode`)** | roteia reuniao / arquivo | texto + mode | ramo A ou B |
| 4 | Basic LLM Chain (+ OpenAI Chat Model + Code parser) *(reuniao)* | texto → ata executiva | objeto raiz ou JSON em `text/output/response` | `output:{resumo,decisoes,acoes,insight}` |
| 4b | IF de QA *(somente trigger manual)* | encerra fixture antes do banco | ata parseada | resultado QA sem persistência |
| 5 | Postgres (Neon) *(reuniao)* | grava transcrição + resumo | resumo | `id` do registro |
| 6 | Respond *(reuniao)* | devolve as 4 seções + `id` | JSON | resposta à tela |
| 6b | Respond *(arquivo)* | devolve transcrição na íntegra (sem LLM, sem gravar) | texto | resposta à tela |

## Fluxo B — baixar transcrição completa (sob demanda)
| # | Node | Função | Entra | Sai |
|---|------|--------|-------|-----|
| — | APP (botão) | "Baixar transcrição completa" | `id` guardado | **GET** `?id=N` |
| 7 | Webhook (download) | recebe o pedido; mantém compatibilidade com clientes anteriores | `query.id` (GET) ou `body.id` (POST) | — |
| 8 | Postgres SELECT + Respond | busca o texto por `id` e devolve | `id` | `{"transcricao":"…"}` → download |

> **Provado ao vivo:** `POST` + body foi validado na sessão 06. Em 10/09/2026, o contrato real do Lovable foi capturado no Network como `GET /webhook/demo1-download?id=7`; o webhook passou a aceitar GET e POST. Teste MCP reproduzindo o GET e o `Origin` do Lovable retornou HTTP 200, `{"transcricao":"…"}` e CORS `OPTIONS, GET, POST`.

## Conformidade verificada (sem surpresa)
- **Groq aceita webm** direto (doc oficial, console.groq.com/docs/speech-to-text) — sem conversão.
- **Modelos:** whisper-large-v3 (US$0,111/h) ou -turbo (US$0,04/h, sem tradução).
- **Limite free = 25 MB** ≈ ~100 min de fala comprimida. Mitigação: bitrate de voz + teto de tempo no front.

## Ressalvas / evolução registrada
- **Timeout:** transcrição de reunião longa pode estourar a resposta síncrona do webhook.
  MVP presencial (curto/médio) é ok; reunião longa → padrão assíncrono (responde "processando" + consulta).
- **Reunião online** (voz dos outros no Zoom/Meet) exige captura de aba (getDisplayMedia) — evolução.

## Schema Neon (criado 2026-09-08, projeto local)
Tabela `transcricoes`: `id` BIGSERIAL PK · `mode` TEXT · `transcricao` TEXT · `resumo` JSONB · `criado_em` TIMESTAMPTZ. Só reuniões persistem. Criada via Neon CLI + driver pg (script em scratchpad).

## Fonte
- Groq Speech-to-Text (oficial): https://console.groq.com/docs/speech-to-text (lido 2026-09-08).
- Base do demo: `docs/pesquisa-demos-v2.md` §4 (Demo 1 = C, transcrição→resumo).
